"""
Background Data Collection Tasks

Schedules periodic fetches to:
1. Pre-warm the cache (avoid cold-start latency)
2. Accumulate time-series data for sparklines and history
3. Monitor market conditions

Intervals:
  15s  -> HL market snapshot (metaAndAssetCtxs)
  30s  -> CEX snapshots (Binance/Bybit/OKX)
  60s  -> DEX snapshots, predicted fundings
  5min -> Protocol health (HLP, AF, staking)
  5min -> CoinGlass comparison data
  10min -> DeFiLlama fees/TVL
"""

from __future__ import annotations

import asyncio
import logging
import time
from typing import Any

from services.cache import (
    TTL_CEX_SNAPSHOT,
    TTL_FEES,
    TTL_HYPE,
    TTL_MARKET,
    TTL_PROTOCOL,
    TTL_STAKING,
    TTL_TVL,
    cache,
    market_snapshot_history,
    oi_history,
    volume_history,
)
from sources.binance import binance_client
from sources.bybit import bybit_client
from sources.coingecko import coingecko_client
from sources.defillama import defillama_client
from sources.hyperliquid import hl_client
from sources.okx import okx_client

logger = logging.getLogger(__name__)

# Global flag to stop background tasks
_running = False
_tasks: list[asyncio.Task] = []


async def _refresh_market_snapshot() -> None:
    """
    Poll metaAndAssetCtxs every 15s.
    Accumulates time-series data for OI and volume history.
    Also warms the heatmap and funding rate caches.
    """
    logger.debug("[bg] Refreshing market snapshot")
    try:
        result = await hl_client.meta_and_asset_ctxs()
        if not result or len(result) != 2:
            return

        meta, asset_ctxs = result
        universe = meta.get("universe", [])

        total_oi = 0.0
        total_vol = 0.0
        per_asset: list[dict[str, Any]] = []

        for i, asset_info in enumerate(universe):
            if i >= len(asset_ctxs):
                break
            ctx = asset_ctxs[i]
            if not ctx:
                continue
            try:
                oi = float(ctx.get("openInterest", 0) or 0)
                mark_px = float(ctx.get("markPx", 0) or 0)
                vol = float(ctx.get("dayNtlVlm", 0) or 0)
                total_oi += oi * mark_px
                total_vol += vol
                per_asset.append({
                    "asset": asset_info.get("name", ""),
                    "oi_usd": oi * mark_px,
                    "volume_24h": vol,
                    "funding": float(ctx.get("funding", 0) or 0),
                    "mark_px": mark_px,
                })
            except (TypeError, ValueError):
                continue

        # Append to time series buffers
        snapshot = {
            "total_oi": total_oi,
            "total_volume": total_vol,
            "assets": per_asset,
            "timestamp": int(time.time() * 1000),
        }
        await market_snapshot_history.append(snapshot)
        await oi_history.append({"total_oi": total_oi, "timestamp": int(time.time() * 1000)})

        # Only record volume once per hour to avoid duplicate daily sums
        now = time.time()
        if int(now) % 3600 < 30:  # within first 30s of each hour
            await volume_history.append({"total_volume": total_vol, "timestamp": int(now * 1000)})

        # Warm heatmap cache
        from services.market_service import market_service
        await cache.delete("overview:heatmap", TTL_MARKET)
        await cache.delete("markets:funding_rates", TTL_MARKET)

        logger.debug(
            "[bg] Market snapshot: OI=$%.2fB, Vol=$%.2fB",
            total_oi / 1e9,
            total_vol / 1e9,
        )

    except Exception as exc:
        logger.error("[bg] Market snapshot failed: %s", exc)


async def _refresh_cex_snapshots() -> None:
    """Poll CEX snapshots every 30s."""
    logger.debug("[bg] Refreshing CEX snapshots")
    try:
        from services.comparison_service import comparison_service
        await asyncio.gather(
            comparison_service.get_binance_snapshot(),
            comparison_service.get_bybit_snapshot(),
            comparison_service.get_okx_snapshot(),
            return_exceptions=True,
        )
    except Exception as exc:
        logger.error("[bg] CEX snapshot refresh failed: %s", exc)


async def _refresh_hype_price() -> None:
    """Refresh HYPE price from CoinGecko every 30s."""
    logger.debug("[bg] Refreshing HYPE price")
    try:
        from services.protocol_service import protocol_service
        await protocol_service.get_hype_metrics()
    except Exception as exc:
        logger.error("[bg] HYPE price refresh failed: %s", exc)


async def _refresh_protocol_health() -> None:
    """Refresh HLP vault, AF state, staking every 5min."""
    logger.debug("[bg] Refreshing protocol health")
    try:
        from services.protocol_service import protocol_service
        await asyncio.gather(
            protocol_service.get_hlp_vault(),
            protocol_service.get_af_state(),
            protocol_service.get_staking(),
            return_exceptions=True,
        )
    except Exception as exc:
        logger.error("[bg] Protocol health refresh failed: %s", exc)


async def _refresh_defillama() -> None:
    """Refresh DeFiLlama fees and TVL every 10min."""
    logger.debug("[bg] Refreshing DeFiLlama data")
    try:
        from services.protocol_service import protocol_service
        await asyncio.gather(
            protocol_service.get_fees(),
            protocol_service.get_tvl(),
            return_exceptions=True,
        )
    except Exception as exc:
        logger.error("[bg] DeFiLlama refresh failed: %s", exc)


async def _refresh_kpis() -> None:
    """Refresh overview KPIs every 60s."""
    logger.debug("[bg] Refreshing KPIs")
    try:
        from services.market_service import market_service
        await market_service.get_kpis()
    except Exception as exc:
        logger.error("[bg] KPI refresh failed: %s", exc)


async def _refresh_dex_comparison() -> None:
    """Refresh DEX comparison snapshot every 60s."""
    logger.debug("[bg] Refreshing DEX comparison")
    try:
        from services.comparison_service import comparison_service
        await comparison_service.get_dex_snapshot()
    except Exception as exc:
        logger.error("[bg] DEX comparison refresh failed: %s", exc)


async def _run_periodic(coro_fn, interval_seconds: float, name: str) -> None:
    """Run a coroutine function repeatedly at the specified interval."""
    logger.info("[bg] Starting periodic task: %s (every %ss)", name, interval_seconds)
    while _running:
        try:
            await coro_fn()
        except asyncio.CancelledError:
            break
        except Exception as exc:
            logger.error("[bg] Periodic task %s error: %s", name, exc)

        try:
            await asyncio.sleep(interval_seconds)
        except asyncio.CancelledError:
            break

    logger.info("[bg] Periodic task stopped: %s", name)


async def warm_cache() -> None:
    """Pre-warm critical caches on startup."""
    logger.info("[bg] Warming caches...")
    try:
        await asyncio.gather(
            _refresh_market_snapshot(),
            _refresh_kpis(),
            _refresh_hype_price(),
            return_exceptions=True,
        )
        logger.info("[bg] Cache warmup complete")
    except Exception as exc:
        logger.error("[bg] Cache warmup failed: %s", exc)


def start_background_tasks() -> None:
    """Start all background periodic tasks."""
    global _running
    _running = True

    task_configs = [
        (_refresh_market_snapshot, 15, "market_snapshot"),
        (_refresh_cex_snapshots, 30, "cex_snapshots"),
        (_refresh_hype_price, 30, "hype_price"),
        (_refresh_kpis, 60, "kpis"),
        (_refresh_dex_comparison, 60, "dex_comparison"),
        (_refresh_protocol_health, 300, "protocol_health"),
        (_refresh_defillama, 600, "defillama"),
    ]

    for coro_fn, interval, name in task_configs:
        task = asyncio.create_task(
            _run_periodic(coro_fn, interval, name),
            name=f"bg_{name}",
        )
        _tasks.append(task)

    logger.info("[bg] Started %d background tasks", len(_tasks))


def stop_background_tasks() -> None:
    """Cancel all background tasks gracefully."""
    global _running
    _running = False

    for task in _tasks:
        if not task.done():
            task.cancel()

    _tasks.clear()
    logger.info("[bg] Stopped all background tasks")
