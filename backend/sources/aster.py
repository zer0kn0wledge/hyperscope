"""
Aster DEX Public API Client

Base URL: https://fapi.asterdex.com
Public endpoints require no authentication.
API closely mirrors Binance Futures API structure.
Rate limit: 2400 weight/min
"""

from __future__ import annotations

import logging
from typing import Any

from sources.base import BaseHTTPClient, TokenBucket

logger = logging.getLogger(__name__)

_aster_rate_limiter = TokenBucket(capacity=100, refill_rate=40.0)


class AsterClient(BaseHTTPClient):
    """Client for Aster DEX public API."""

    def __init__(self) -> None:
        super().__init__(
            base_url="https://fapi.asterdex.com",
            source_name="aster",
            rate_limiter=_aster_rate_limiter,
            max_retries=2,
        )

    async def ticker_24hr(self, symbol: str | None = None) -> Any | None:
        """24h ticker statistics."""
        params: dict[str, Any] = {}
        if symbol:
            params["symbol"] = symbol
        return await self.get("/fapi/v1/ticker/24hr", params=params)

    async def open_interest(self, symbol: str) -> dict[str, Any] | None:
        """Current open interest for a symbol."""
        return await self.get("/fapi/v1/openInterest", params={"symbol": symbol})

    async def open_interest_hist(
        self, symbol: str, period: str = "1h", limit: int = 500,
    ) -> list[Any] | None:
        """Historical open interest."""
        return await self.get(
            "/fapi/v1/openInterestHist",
            params={"symbol": symbol, "period": period, "limit": limit},
        )

    async def premium_index(self, symbol: str | None = None) -> Any | None:
        """Mark price + current funding rate."""
        params: dict[str, Any] = {}
        if symbol:
            params["symbol"] = symbol
        return await self.get("/fapi/v1/premiumIndex", params=params)

    async def funding_rate(self, symbol: str, limit: int = 100) -> list[Any] | None:
        """Funding rate history."""
        return await self.get("/fapi/v1/fundingRate", params={"symbol": symbol, "limit": limit})

    async def klines(self, symbol: str, interval: str = "1h", limit: int = 500) -> list[Any] | None:
        """OHLCV candlestick data."""
        return await self.get("/fapi/v1/klines", params={"symbol": symbol, "interval": interval, "limit": limit})

    async def exchange_info(self) -> dict[str, Any] | None:
        """Exchange rules, symbols, rate limits."""
        return await self.get("/fapi/v1/exchangeInfo")


aster_client = AsterClient()
