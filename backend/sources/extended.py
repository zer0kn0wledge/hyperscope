"""
Extended Exchange Public API Client

Base URL: https://api.starknet.extended.exchange/api/v1
Public endpoints require no authentication.
Rate limit: 1000 req/min
Note: User-Agent header is REQUIRED for all requests.
"""

from __future__ import annotations

import logging
from typing import Any

from sources.base import BaseHTTPClient, TokenBucket

logger = logging.getLogger(__name__)

_extended_rate_limiter = TokenBucket(capacity=50, refill_rate=16.67)


class ExtendedClient(BaseHTTPClient):
    """Client for Extended Exchange public API."""

    def __init__(self) -> None:
        super().__init__(
            base_url="https://api.starknet.extended.exchange/api/v1",
            source_name="extended",
            headers={"User-Agent": "HyperScope/0.1.0"},
            rate_limiter=_extended_rate_limiter,
            max_retries=2,
        )

    async def all_markets(self) -> dict[str, Any] | None:
        """All markets with config and stats."""
        return await self.get("/info/markets")

    async def market_stats(self, market: str) -> dict[str, Any] | None:
        """Market ticker for a specific market."""
        return await self.get(f"/info/markets/{market}/stats")

    async def orderbook(self, market: str) -> dict[str, Any] | None:
        """Orderbook snapshot."""
        return await self.get(f"/info/markets/{market}/orderbook")

    async def recent_trades(self, market: str, limit: int = 100) -> dict[str, Any] | None:
        """Recent trades for a market."""
        return await self.get(f"/info/markets/{market}/trades", params={"limit": limit})

    async def candles(
        self, market: str, candle_type: str = "trades", resolution: str = "3600",
        from_ts: int | None = None, to_ts: int | None = None, limit: int = 200,
    ) -> dict[str, Any] | None:
        """OHLCV candlestick data."""
        params: dict[str, Any] = {"resolution": resolution, "limit": limit}
        if from_ts is not None:
            params["from"] = from_ts
        if to_ts is not None:
            params["to"] = to_ts
        return await self.get(f"/info/candles/{market}/{candle_type}", params=params)

    async def funding_history(
        self, market: str, start_time: int | None = None,
        end_time: int | None = None, limit: int = 200,
    ) -> dict[str, Any] | None:
        """Funding rate history for a market."""
        params: dict[str, Any] = {"limit": limit}
        if start_time is not None:
            params["startTime"] = start_time
        if end_time is not None:
            params["endTime"] = end_time
        return await self.get(f"/info/{market}/funding", params=params)

    async def open_interests(
        self, market: str, interval: str = "P1H", limit: int = 200,
    ) -> dict[str, Any] | None:
        """Open interest history (hourly or daily)."""
        return await self.get(
            f"/info/{market}/open-interests",
            params={"interval": interval, "limit": limit},
        )


extended_client = ExtendedClient()
