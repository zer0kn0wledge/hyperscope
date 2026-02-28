"""
Orderbook Service
Handles L2 book fetching, spread calculation, and large order detection.
"""

from __future__ import annotations

import logging
import time
from typing import Any

from services.cache import TTL_ORDERBOOK, cache, spread_history
from sources.coinglass import coinglass_client
from sources.hyperliquid import hl_client

logger = logging.getLogger(__name__)


class OrderbookService:
    """Service for orderbook data and analytics."""

    async def get_l2_book(self, pair: str, depth: int = 20) -> dict[str, Any]:
        """
        Fetch L2 orderbook snapshot for a trading pair.
        Computes spread, mid price, and depth metrics.
        """
        cache_key = f"orderbook:{pair}"
        cached = await cache.get(cache_key, TTL_ORDERBOOK)
        if cached is not None:
            return cached

        raw = await hl_client.l2_book(coin=pair)
        if not raw:
            return {"bids": [], "asks": [], "spread_bps": 0.0, "mid_price": 0.0}

        levels = raw.get("levels", [[], []])
        bids = levels[0] if len(levels) > 0 else []
        asks = levels[1] if len(levels) > 1 else []

        # Limit to requested depth
        bids = bids[:depth]
        asks = asks[:depth]

        # Normalize levels
        def normalize_levels(raw_levels: list) -> list[dict[str, Any]]:
            out = []
            for lvl in raw_levels:
                if isinstance(lvl, dict):
                    out.append({
                        "price": float(lvl.get("px", 0)),
                        "size": float(lvl.get("sz", 0)),
                        "count": int(lvl.get("n", 0)),
                    })
                elif isinstance(lvl, (list, tuple)) and len(lvl) >= 2:
                    out.append({
                        "price": float(lvl[0]),
                        "size": float(lvl[1]),
                        "count": 0,
                    })
            return out

        norm_bids = normalize_levels(bids)
        norm_asks = normalize_levels(asks)

        # Compute spread metrics
        spread_bps = 0.0
        spread_usd = 0.0
        mid_price = 0.0

        if norm_bids and norm_asks:
            best_bid = norm_bids[0]["price"]
            best_ask = norm_asks[0]["price"]
            mid_price = (best_bid + best_ask) / 2
            if mid_price > 0:
                spread_usd = best_ask - best_bid
                spread_bps = spread_usd / mid_price * 10_000

            # Record spread history
            await spread_history.record(
                pair=pair,
                spread_bps=spread_bps,
                spread_usd=spread_usd,
                mid_price=mid_price,
            )

        # Cumulative depth
        def add_cumulative(levels: list[dict[str, Any]]) -> list[dict[str, Any]]:
            total = 0.0
            for lvl in levels:
                total += lvl["size"]
                lvl["cumulative_size"] = round(total, 8)
            return levels

        result: dict[str, Any] = {
            "pair": pair,
            "bids": add_cumulative(norm_bids),
            "asks": add_cumulative(norm_asks),
            "spread_bps": round(spread_bps, 4),
            "spread_usd": round(spread_usd, 6),
            "mid_price": round(mid_price, 6),
            "timestamp": raw.get("time", int(time.time() * 1000)),
            # Top-level depth metrics
            "bid_depth_usd": sum(l["price"] * l["size"] for l in norm_bids),
            "ask_depth_usd": sum(l["price"] * l["size"] for l in norm_asks),
        }

        await cache.set(cache_key, result, TTL_ORDERBOOK)
        return result

    async def get_spread_history(
        self,
        pair: str,
        window_hours: float = 1.0,
    ) -> list[dict[str, Any]]:
        """Spread history for a pair within a time window."""
        return await spread_history.get_history(pair, window_hours)

    async def get_large_orders(
        self,
        symbol: str = "BTC",
        exchange: str | None = None,
    ) -> list[dict[str, Any]]:
        """
        Large open limit orders from CoinGlass.
        BTC >= $1M, ETH >= $500K, others >= $50K
        """
        cache_key = f"large_orders:{symbol}"
        cached = await cache.get(cache_key, 30)
        if cached is not None:
            return cached

        raw = await coinglass_client.large_limit_orders(
            symbol=symbol, exchange=exchange
        )
        if not raw or not raw.get("data"):
            return []

        orders = []
        for item in raw.get("data", []):
            try:
                orders.append({
                    "exchange": item.get("exchange", ""),
                    "symbol": item.get("symbol", symbol),
                    "side": item.get("side", "").lower(),
                    "price": float(item.get("price", 0) or 0),
                    "size_usd": float(item.get("amount", 0) or 0),
                    "timestamp": item.get("createTime", 0),
                })
            except (TypeError, ValueError):
                continue

        await cache.set(cache_key, orders, 30)
        return orders


orderbook_service = OrderbookService()
