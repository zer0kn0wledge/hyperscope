"""
Lighter Public API Client

Base URL: https://mainnet.zklighter.elliot.ai
Public read endpoints require no authentication.
"""

from __future__ import annotations

import logging
from typing import Any

from sources.base import BaseHTTPClient, TokenBucket

logger = logging.getLogger(__name__)

_lighter_rate_limiter = TokenBucket(capacity=20, refill_rate=5.0)


class LighterClient(BaseHTTPClient):
    """Client for Lighter public API."""

    def __init__(self) -> None:
        super().__init__(
            base_url="https://mainnet.zklighter.elliot.ai",
            source_name="lighter",
            rate_limiter=_lighter_rate_limiter,
            max_retries=2,
        )

    async def exchange_stats(self) -> dict[str, Any] | None:
        """Exchange-wide statistics: total volume, OI per market."""
        return await self.get("/api/v1/exchangeStats")

    async def order_books(self) -> dict[str, Any] | None:
        """All orderbooks summary."""
        return await self.get("/api/v1/orderBooks")

    async def order_book_details(self, market_index: int) -> dict[str, Any] | None:
        """Orderbook detail for a specific market."""
        return await self.get("/api/v1/orderBookDetails", params={"market_index": market_index})

    async def recent_trades(self, market_index: int, limit: int = 100) -> dict[str, Any] | None:
        """Recent trades for a market."""
        return await self.get("/api/v1/recentTrades", params={"market_index": market_index, "limit": limit})

    async def candlesticks(
        self, market_index: int, resolution: str = "1h",
        start_time: int | None = None, end_time: int | None = None, count_back: int = 200,
    ) -> dict[str, Any] | None:
        """OHLCV candlestick data."""
        params: dict[str, Any] = {
            "market_index": market_index, "resolution": resolution, "count_back": count_back
        }
        if start_time is not None:
            params["start_time"] = start_time
        if end_time is not None:
            params["end_time"] = end_time
        return await self.get("/api/v1/candlesticks", params=params)

    async def fundings(self, market_index: int, limit: int = 100) -> dict[str, Any] | None:
        """Funding rate history for a market."""
        return await self.get("/api/v1/fundings", params={"market_index": market_index, "limit": limit})

    async def info(self) -> dict[str, Any] | None:
        """System/exchange info including market list."""
        return await self.get("/info")


lighter_client = LighterClient()
