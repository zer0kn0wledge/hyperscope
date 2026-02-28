"""
Market Service
Aggregates and normalizes market data from Hyperliquid and other sources.
"""

from __future__ import annotations

import logging
import time
from typing import Any

from services.cache import (
    TTL_CANDLES,
    TTL_COINGLASS,
    TTL_FEES,
    TTL_FUNDING_HIST,
    TTL_HYPE,
    TTL_MARKET,
    TTL_TVL,
    cache,
    market_snapshot_history,
    oi_history,
    volume_history,
)
from sources.coinglass import coinglass_client
from sources.defillama import defillama_client
from sources.hyperliquid import hl_client
from sources.hype import hype_client

logger = logging.getLogger(__name__)


class MarketService:
    """Aggregates and normalises market data from multiple sources."""

    # ─── Market snapshot ──────────────────────────────────────────────────────

    async def get_market_snapshot(self) -> dict[str, Any]:
        """Full market snapshot: assets, global OI, volume, fees, funding."""
        cache_key = "market:snapshot"
        cached = await cache.get(cache_key, TTL_MARKET)
        if cached is not None:
            return cached

        t0 = time.monotonic()
        snapshot = await hl_client.get_snapshot()
        logger.info("[market] snapshot in %.2fs", time.monotonic() - t0)

        await cache.set(cache_key, snapshot)
        market_snapshot_history.append(
            {"ts": time.time(), "data": snapshot}
        )
        return snapshot

    # ─── Specific asset ───────────────────────────────────────────────────────

    async def get_asset(self, asset: str) -> dict[str, Any]:
        """Single-asset detail: OI, funding, volume, mark price."""
        cache_key = f"market:asset:{asset}"
        cached = await cache.get(cache_key, TTL_MARKET)
        if cached is not None:
            return cached

        data = await hl_client.get_asset(asset)
        await cache.set(cache_key, data)
        return data

    # ─── OI history ───────────────────────────────────────────────────────────

    async def get_oi_history(self, asset: str, interval: str = "1d") -> list[dict]:
        """Open-interest history for an asset."""
        cache_key = f"market:oi_hist:{asset}:{interval}"
        cached = await cache.get(cache_key, TTL_MARKET)
        if cached is not None:
            return cached

        data = await hl_client.get_oi_history(asset, interval)
        await cache.set(cache_key, data)
        oi_history.append({"ts": time.time(), "asset": asset, "data": data})
        return data

    # ─── Volume history ───────────────────────────────────────────────────────

    async def get_volume_history(
        self, asset: str, interval: str = "1d"
    ) -> list[dict]:
        """Volume history for an asset."""
        cache_key = f"market:vol_hist:{asset}:{interval}"
        cached = await cache.get(cache_key, TTL_MARKET)
        if cached is not None:
            return cached

        data = await hl_client.get_volume_history(asset, interval)
        await cache.set(cache_key, data)
        volume_history.append({"ts": time.time(), "asset": asset, "data": data})
        return data

    # ─── Funding rate history ─────────────────────────────────────────────────

    async def get_funding_history(
        self, asset: str, interval: str = "1d"
    ) -> list[dict]:
        """Funding rate history for an asset."""
        cache_key = f"market:funding_hist:{asset}:{interval}"
        cached = await cache.get(cache_key, TTL_FUNDING_HIST)
        if cached is not None:
            return cached

        data = await hl_client.get_funding_history(asset, interval)
        await cache.set(cache_key, data)
        return data

    # ─── Price candles ────────────────────────────────────────────────────────

    async def get_candles(
        self, asset: str, interval: str = "1h", limit: int = 200
    ) -> list[dict]:
        """OHLCV candle data for an asset."""
        cache_key = f"market:candles:{asset}:{interval}:{limit}"
        cached = await cache.get(cache_key, TTL_CANDLES)
        if cached is not None:
            return cached

        data = await hl_client.get_candles(asset, interval, limit)
        await cache.set(cache_key, data)
        return data

    # ─── Protocol / TVL ───────────────────────────────────────────────────────

    async def get_tvl(self) -> dict[str, Any]:
        """Hyperliquid TVL from DefiLlama."""
        cache_key = "market:tvl"
        cached = await cache.get(cache_key, TTL_TVL)
        if cached is not None:
            return cached

        data = await defillama_client.get_tvl()
        await cache.set(cache_key, data)
        return data

    async def get_tvl_history(self) -> list[dict]:
        """Hyperliquid TVL history from DefiLlama."""
        cache_key = "market:tvl_history"
        cached = await cache.get(cache_key, TTL_TVL)
        if cached is not None:
            return cached

        data = await defillama_client.get_tvl_history()
        await cache.set(cache_key, data)
        return data

    # ─── Protocol fees ────────────────────────────────────────────────────────

    async def get_fees(self) -> dict[str, Any]:
        """Hyperliquid fee revenue from DefiLlama."""
        cache_key = "market:fees"
        cached = await cache.get(cache_key, TTL_FEES)
        if cached is not None:
            return cached

        data = await defillama_client.get_fees()
        await cache.set(cache_key, data)
        return data

    async def get_fees_history(self) -> list[dict]:
        """Historical fee data."""
        cache_key = "market:fees_history"
        cached = await cache.get(cache_key, TTL_FEES)
        if cached is not None:
            return cached

        data = await defillama_client.get_fees_history()
        await cache.set(cache_key, data)
        return data

    # ─── CoinGlass ────────────────────────────────────────────────────────────

    async def get_fear_greed(self) -> dict:
        """CoinGlass Fear & Greed index."""
        cache_key = "market:feargreed"
        cached = await cache.get(cache_key, TTL_COINGLASS)
        if cached is not None:
            return cached

        data = await coinglass_client.get_fear_greed()
        await cache.set(cache_key, data)
        return data

    async def get_global_oi(self) -> dict:
        """Global open-interest aggregated across all exchanges."""
        cache_key = "market:global_oi"
        cached = await cache.get(cache_key, TTL_COINGLASS)
        if cached is not None:
            return cached

        data = await coinglass_client.get_global_oi()
        await cache.set(cache_key, data)
        return data

    async def get_liquidations(self) -> dict:
        """Liquidation summary (last 24 h)."""
        cache_key = "market:liquidations"
        cached = await cache.get(cache_key, TTL_COINGLASS)
        if cached is not None:
            return cached

        data = await coinglass_client.get_liquidations()
        await cache.set(cache_key, data)
        return data

    # ─── HYPE token ───────────────────────────────────────────────────────────

    async def get_hype_price(self) -> dict:
        """Current HYPE token price and market data."""
        cache_key = "market:hype_price"
        cached = await cache.get(cache_key, TTL_HYPE)
        if cached is not None:
            return cached

        data = await hype_client.get_price()
        await cache.set(cache_key, data)
        return data

    async def get_hype_chart(self) -> list[dict]:
        """HYPE token 30-day price history."""
        cache_key = "market:hype_chart"
        cached = await cache.get(cache_key, TTL_HYPE)
        if cached is not None:
            return cached

        data = await hype_client.get_chart()
        await cache.set(cache_key, data)
        return data

    async def get_circulating_supply(self) -> dict:
        """HYPE circulating supply."""
        cache_key = "market:hype_supply"
        cached = await cache.get(cache_key, TTL_HYPE)
        if cached is not None:
            return cached

        data = await hype_client.get_circulating_supply()
        await cache.set(cache_key, data)
        return data

    async def get_staking_summary(self) -> dict:
        """HYPE staking summary (on-chain)."""
        cache_key = "market:hype_staking"
        cached = await cache.get(cache_key, TTL_HYPE)
        if cached is not None:
            return cached

        data = await hype_client.get_staking_summary()
        await cache.set(cache_key, data)
        return data

    async def get_staking_chart(self) -> list[dict]:
        """HYPE staking chart (history)."""
        cache_key = "market:hype_staking_chart"
        cached = await cache.get(cache_key, TTL_HYPE)
        if cached is not None:
            return cached

        data = await hype_client.get_staking_chart()
        await cache.set(cache_key, data)
        return data

    async def get_token_holders(self, page: int = 1, page_size: int = 50) -> dict:
        """HYPE token holders (paginated)."""
        cache_key = f"market:hype_holders:{page}:{page_size}"
        cached = await cache.get(cache_key, TTL_HYPE)
        if cached is not None:
            return cached

        data = await hype_client.get_token_holders(page, page_size)
        await cache.set(cache_key, data)
        return data

    async def get_token_supply(self) -> dict:
        """HYPE token total supply."""
        cache_key = "market:hype_token_supply"
        cached = await cache.get(cache_key, TTL_HYPE)
        if cached is not None:
            return cached

        data = await hype_client.get_token_supply()
        await cache.set(cache_key, data)
        return data

    # ─── Combined overviews ───────────────────────────────────────────────────

    async def get_overview(self) -> dict[str, Any]:
        """Combined overview: snapshot + TVL + fees + fear/greed + HYPE price."""
        import asyncio

        (
            snapshot,
            tvl,
            fees,
            fear_greed,
            global_oi,
            liquidations,
            hype_price,
        ) = await asyncio.gather(
            self.get_market_snapshot(),
            self.get_tvl(),
            self.get_fees(),
            self.get_fear_greed(),
            self.get_global_oi(),
            self.get_liquidations(),
            self.get_hype_price(),
        )

        return {
            "snapshot": snapshot,
            "tvl": tvl,
            "fees": fees,
            "fear_greed": fear_greed,
            "global_oi": global_oi,
            "liquidations": liquidations,
            "hype_price": hype_price,
        }


market_service = MarketService()
