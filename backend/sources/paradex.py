"""
Paradex Public API Client

Base URL: https://api.prod.paradex.trade/v1
Public endpoints require no authentication.
Rate limit: 1500 req/min (IP)
"""

from __future__ import annotations

import logging
from typing import Any

from sources.base import BaseHTTPClient, TokenBucket

logger = logging.getLogger(__name__)

_paradex_rate_limiter = TokenBucket(capacity=50, refill_rate=25.0)


class ParadexClient(BaseHTTPClient):
    """Client for Paradex public API."""

    def __init__(self) -> None:
        super().__init__(
            base_url="https://api.prod.paradex.trade/v1",
            source_name="paradex",
            rate_limiter=_paradex_rate_limiter,
            max_retries=2,
        )

    async def markets(self) -> dict[str, Any] | None:
        """List all available markets."""
        return await self.get("/markets")

    async def markets_summary(self) -> dict[str, Any] | None:
        """Ticker/summary for all markets."""
        return await self.get("/markets/summary")

    async def orderbook(self, market_symbol: str) -> dict[str, Any] | None:
        """Full L2 orderbook snapshot for a market."""
        return await self.get(f"/orderbook/{market_symbol}")

    async def trades(
        self, market: str | None = None, limit: int = 100,
    ) -> dict[str, Any] | None:
        """Recent public trades."""
        params: dict[str, Any] = {"limit": limit}
        if market:
            params["market"] = market
        return await self.get("/trades", params=params)

    async def funding_data(
        self, market: str | None = None, page_size: int = 100,
    ) -> dict[str, Any] | None:
        """Historical funding rate data."""
        params: dict[str, Any] = {"page_size": page_size}
        if market:
            params["market"] = market
        return await self.get("/funding/data", params=params)

    async def klines(
        self, market: str, resolution: int = 60,
        start_at: int | None = None, end_at: int | None = None, limit: int = 200,
    ) -> dict[str, Any] | None:
        """OHLCV candlestick data."""
        params: dict[str, Any] = {"market": market, "resolution": resolution, "limit": limit}
        if start_at is not None:
            params["start_at"] = start_at
        if end_at is not None:
            params["end_at"] = end_at
        return await self.get("/klines", params=params)

    async def insurance_fund(self) -> dict[str, Any] | None:
        """Insurance fund balance."""
        return await self.get("/insurance-fund")


paradex_client = ParadexClient()
