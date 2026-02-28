"""
Comparison Service
DEX vs DEX and DEX vs CEX comparison data aggregation.
"""

from __future__ import annotations

import asyncio
import logging
import time
from typing import Any

from services.cache import (
    TTL_CEX_HISTORY,
    TTL_CEX_SNAPSHOT,
    TTL_COINGLASS,
    TTL_COMPARE,
    cache,
)
from sources.aster import aster_client
from sources.binance import binance_client
from sources.bybit import bybit_client
from sources.coingecko_derivatives import coingecko_deriv_client
from sources.coinglass import coinglass_client
from sources.coinbase import coinbase_deriv_client  # noqa: F401 – reserved for future use
from sources.edgex import edgex_client
from sources.extended import extended_client
from sources.grvt import grvt_client
from sources.hyperliquid import hl_client
from sources.kraken import kraken_futures_client
from sources.kucoin import kucoin_futures_client
from sources.lighter import lighter_client
from sources.okx import okx_client
from sources.paradex import paradex_client
from sources.variational import variational_client

logger = logging.getLogger(__name__)


class ComparisonService:
    """Service for cross-exchange comparison analytics."""

    # ── CEX Snapshots ────────────────────────────────────────────────────────

    async def get_binance_snapshot(self) -> dict[str, Any]:
        """Binance Futures current snapshot: total OI, volume, funding."""
        cache_key = "cex:snapshot:binance"
        cached = await cache.get(cache_key, TTL_CEX_SNAPSHOT)
        if cached is not None:
            return cached

        data = await binance_client.get_snapshot()
        await cache.set(cache_key, data)
        return data

    async def get_bybit_snapshot(self) -> dict[str, Any]:
        """Bybit Derivatives current snapshot."""
        cache_key = "cex:snapshot:bybit"
        cached = await cache.get(cache_key, TTL_CEX_SNAPSHOT)
        if cached is not None:
            return cached

        data = await bybit_client.get_snapshot()
        await cache.set(cache_key, data)
        return data

    async def get_okx_snapshot(self) -> dict[str, Any]:
        """OKX Derivatives current snapshot."""
        cache_key = "cex:snapshot:okx"
        cached = await cache.get(cache_key, TTL_CEX_SNAPSHOT)
        if cached is not None:
            return cached

        data = await okx_client.get_snapshot()
        await cache.set(cache_key, data)
        return data

    async def get_kraken_snapshot(self) -> dict[str, Any]:
        """Kraken Futures current snapshot."""
        cache_key = "cex:snapshot:kraken"
        cached = await cache.get(cache_key, TTL_CEX_SNAPSHOT)
        if cached is not None:
            return cached

        data = await kraken_futures_client.get_snapshot()
        await cache.set(cache_key, data)
        return data

    async def get_kucoin_snapshot(self) -> dict[str, Any]:
        """KuCoin Futures current snapshot."""
        cache_key = "cex:snapshot:kucoin"
        cached = await cache.get(cache_key, TTL_CEX_SNAPSHOT)
        if cached is not None:
            return cached

        data = await kucoin_futures_client.get_snapshot()
        await cache.set(cache_key, data)
        return data

    # ── CEX History ─────────────────────────────────────────────────────────

    async def get_binance_history(self) -> list[dict]:
        """Binance 30-day OI + volume history."""
        cache_key = "cex:history:binance"
        cached = await cache.get(cache_key, TTL_CEX_HISTORY)
        if cached is not None:
            return cached

        data = await binance_client.get_history()
        await cache.set(cache_key, data)
        return data

    async def get_bybit_history(self) -> list[dict]:
        """Bybit 30-day OI + volume history."""
        cache_key = "cex:history:bybit"
        cached = await cache.get(cache_key, TTL_CEX_HISTORY)
        if cached is not None:
            return cached

        data = await bybit_client.get_history()
        await cache.set(cache_key, data)
        return data

    async def get_okx_history(self) -> list[dict]:
        """OKX 30-day OI + volume history."""
        cache_key = "cex:history:okx"
        cached = await cache.get(cache_key, TTL_CEX_HISTORY)
        if cached is not None:
            return cached

        data = await okx_client.get_history()
        await cache.set(cache_key, data)
        return data

    async def get_kraken_history(self) -> list[dict]:
        """Kraken Futures 30-day OI + volume history."""
        cache_key = "cex:history:kraken"
        cached = await cache.get(cache_key, TTL_CEX_HISTORY)
        if cached is not None:
            return cached

        data = await kraken_futures_client.get_history()
        await cache.set(cache_key, data)
        return data

    async def get_kucoin_history(self) -> list[dict]:
        """KuCoin Futures 30-day OI + volume history."""
        cache_key = "cex:history:kucoin"
        cached = await cache.get(cache_key, TTL_CEX_HISTORY)
        if cached is not None:
            return cached

        data = await kucoin_futures_client.get_history()
        await cache.set(cache_key, data)
        return data

    # ── CoinGecko Derivatives ─────────────────────────────────────────────

    async def get_coingecko_cex_list(self) -> list[dict]:
        """CoinGecko list of derivative exchanges with tier / OI / volume."""
        cache_key = "coingecko:cex:list"
        cached = await cache.get(cache_key, TTL_CEX_SNAPSHOT)
        if cached is not None:
            return cached

        data = await coingecko_deriv_client.get_exchanges()
        await cache.set(cache_key, data)
        return data

    async def get_coingecko_cex_detail(self, exchange_id: str) -> dict:
        """CoinGecko detail for a single derivative exchange."""
        cache_key = f"coingecko:cex:detail:{exchange_id}"
        cached = await cache.get(cache_key, TTL_CEX_SNAPSHOT)
        if cached is not None:
            return cached

        data = await coingecko_deriv_client.get_exchange_detail(exchange_id)
        await cache.set(cache_key, data)
        return data

    async def get_coingecko_tickers(self, exchange_id: str) -> list[dict]:
        """CoinGecko tickers for a single derivative exchange."""
        cache_key = f"coingecko:cex:tickers:{exchange_id}"
        cached = await cache.get(cache_key, TTL_CEX_SNAPSHOT)
        if cached is not None:
            return cached

        data = await coingecko_deriv_client.get_tickers(exchange_id)
        await cache.set(cache_key, data)
        return data

    # ── CoinGlass ─────────────────────────────────────────────────────────────

    async def get_coinglass_fear_greed(self) -> dict:
        """CoinGlass Fear & Greed index."""
        cache_key = "coinglass:feargreed"
        cached = await cache.get(cache_key, TTL_COINGLASS)
        if cached is not None:
            return cached

        data = await coinglass_client.get_fear_greed()
        await cache.set(cache_key, data)
        return data

    async def get_coinglass_global_oi(self) -> dict:
        """CoinGlass global open-interest aggregated across all exchanges."""
        cache_key = "coinglass:globaloi"
        cached = await cache.get(cache_key, TTL_COINGLASS)
        if cached is not None:
            return cached

        data = await coinglass_client.get_global_oi()
        await cache.set(cache_key, data)
        return data

    async def get_coinglass_liquidations(self) -> dict:
        """CoinGlass liquidation summary (last 24 h)."""
        cache_key = "coinglass:liquidations"
        cached = await cache.get(cache_key, TTL_COINGLASS)
        if cached is not None:
            return cached

        data = await coinglass_client.get_liquidations()
        await cache.set(cache_key, data)
        return data

    # ── DEX Snapshots ───────────────────────────────────────────────────────

    async def _safe_get(self, coro, label: str) -> Any:
        """Run a coroutine and return None on failure (with warning)."""
        try:
            return await coro
        except Exception as exc:
            logger.warning("[comparison] %s failed: %s", label, exc)
            return None

    async def get_dex_snapshot(self) -> dict[str, Any]:
        """Snapshot for all DEX sources in parallel."""
        cache_key = "compare:dex:snapshot"
        cached = await cache.get(cache_key, TTL_COMPARE)
        if cached is not None:
            return cached

        t0 = time.monotonic()
        results = await asyncio.gather(
            self._safe_get(hl_client.get_snapshot(), "hyperliquid"),
            self._safe_get(paradex_client.get_snapshot(), "paradex"),
            self._safe_get(aster_client.get_snapshot(), "aster"),
            self._safe_get(extended_client.get_snapshot(), "extended"),
            self._safe_get(grvt_client.get_snapshot(), "grvt"),
            self._safe_get(lighter_client.get_snapshot(), "lighter"),
            self._safe_get(edgex_client.get_snapshot(), "edgex"),
            self._safe_get(variational_client.get_snapshot(), "variational"),
        )
        labels = ["hyperliquid", "paradex", "aster", "extended", "grvt", "lighter", "edgex", "variational"]
        data = {
            label: result
            for label, result in zip(labels, results)
            if result is not None
        }
        logger.info("[comparison] DEX snapshot gathered in %.2fs", time.monotonic() - t0)
        await cache.set(cache_key, data)
        return data

    async def get_cex_snapshot(self) -> dict[str, Any]:
        """Snapshot for all CEX sources in parallel."""
        cache_key = "compare:cex:snapshot"
        cached = await cache.get(cache_key, TTL_COMPARE)
        if cached is not None:
            return cached

        t0 = time.monotonic()
        results = await asyncio.gather(
            self._safe_get(binance_client.get_snapshot(), "binance"),
            self._safe_get(bybit_client.get_snapshot(), "bybit"),
            self._safe_get(okx_client.get_snapshot(), "okx"),
            self._safe_get(kraken_futures_client.get_snapshot(), "kraken"),
            self._safe_get(kucoin_futures_client.get_snapshot(), "kucoin"),
        )
        labels = ["binance", "bybit", "okx", "kraken", "kucoin"]
        data = {
            label: result
            for label, result in zip(labels, results)
            if result is not None
        }
        logger.info("[comparison] CEX snapshot gathered in %.2fs", time.monotonic() - t0)
        await cache.set(cache_key, data)
        return data

    async def get_cex_compare(self) -> dict[str, Any]:
        """Full CEX comparison: snapshots + CoinGecko + CoinGlass."""
        cache_key = "compare:cex:full"
        cached = await cache.get(cache_key, TTL_COMPARE)
        if cached is not None:
            return cached

        t0 = time.monotonic()

        # Fire everything in parallel
        (
            binance_snap,
            bybit_snap,
            okx_snap,
            kraken_snap,
            kucoin_snap,
            cg_list,
            cg_fear,
            cg_global_oi,
            cg_liq,
        ) = await asyncio.gather(
            self._safe_get(binance_client.get_snapshot(), "binance"),
            self._safe_get(bybit_client.get_snapshot(), "bybit"),
            self._safe_get(okx_client.get_snapshot(), "okx"),
            self._safe_get(kraken_futures_client.get_snapshot(), "kraken"),
            self._safe_get(kucoin_futures_client.get_snapshot(), "kucoin"),
            self._safe_get(coingecko_deriv_client.get_exchanges(), "coingecko:list"),
            self._safe_get(coinglass_client.get_fear_greed(), "coinglass:fg"),
            self._safe_get(coinglass_client.get_global_oi(), "coinglass:oi"),
            self._safe_get(coinglass_client.get_liquidations(), "coinglass:liq"),
        )

        exchanges = {
            "binance": binance_snap,
            "bybit": bybit_snap,
            "okx": okx_snap,
            "kraken": kraken_snap,
            "kucoin": kucoin_snap,
        }

        result = {
            "exchanges": {k: v for k, v in exchanges.items() if v is not None},
            "coingecko": {
                "exchanges": cg_list or [],
            },
            "coinglass": {
                "fear_greed": cg_fear,
                "global_oi": cg_global_oi,
                "liquidations": cg_liq,
            },
            "generated_at": time.time(),
        }
        logger.info("[comparison] CEX compare gathered in %.2fs", time.monotonic() - t0)
        await cache.set(cache_key, result)
        return result

    async def get_dex_compare(self) -> dict[str, Any]:
        """Full DEX comparison with all available sources."""
        cache_key = "compare:dex:full"
        cached = await cache.get(cache_key, TTL_COMPARE)
        if cached is not None:
            return cached

        t0 = time.monotonic()
        results = await asyncio.gather(
            self._safe_get(hl_client.get_compare_snapshot(), "hyperliquid"),
            self._safe_get(paradex_client.get_compare_snapshot(), "paradex"),
            self._safe_get(aster_client.get_compare_snapshot(), "aster"),
            self._safe_get(extended_client.get_compare_snapshot(), "extended"),
            self._safe_get(grvt_client.get_compare_snapshot(), "grvt"),
            self._safe_get(lighter_client.get_compare_snapshot(), "lighter"),
            self._safe_get(edgex_client.get_compare_snapshot(), "edgex"),
            self._safe_get(variational_client.get_compare_snapshot(), "variational"),
        )
        labels = ["hyperliquid", "paradex", "aster", "extended", "grvt", "lighter", "edgex", "variational"]
        data = {
            label: result
            for label, result in zip(labels, results)
            if result is not None
        }
        logger.info("[comparison] DEX compare gathered in %.2fs", time.monotonic() - t0)
        await cache.set(cache_key, data)
        return data


comparison_service = ComparisonService()
