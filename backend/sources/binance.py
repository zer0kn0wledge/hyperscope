"""
Binance Futures Public API Client

Base URL: https://fapi.binance.com
No auth required for public endpoints.
Rate limit: 2400 weight/min (IP-based)
"""

from __future__ import annotations

import logging
from typing import Any

from sources.base import BaseHTTPClient, TokenBucket

logger = logging.getLogger(__name__)

_binance_rate_limiter = TokenBucket(capacity=100, refill_rate=40.0)


class BinanceClient(BaseHTTPClient):
    """Client for Binance Futures public API endpoints."""

    def __init__(self) -> None:
        super().__init__(
            base_url="https://fapi.binance.com",
            source_name="binance",
            rate_limiter=_binance_rate_limiter,
            max_retries=2,
            backoff_base=1.0,
        )

    async def open_interest(self, symbol: str) -> dict[str, Any] | None:
        """Current open interest for a symbol. Weight: 1"""
        return await self.get("/fapi/v1/openInterest", params={"symbol": symbol})

    async def open_interest_hist(
        self, symbol: str, period: str = "1h", limit: int = 500,
        start_time: int | None = None, end_time: int | None = None,
    ) -> list[dict[str, Any]] | None:
        """Historical open interest. Max 30 days history."""
        params: dict[str, Any] = {"symbol": symbol, "period": period, "limit": limit}
        if start_time is not None:
            params["startTime"] = start_time
        if end_time is not None:
            params["endTime"] = end_time
        return await self.get("/futures/data/openInterestHist", params=params)

    async def ticker_24hr(self, symbol: str | None = None) -> Any | None:
        """24h ticker statistics."""
        params: dict[str, Any] = {}
        if symbol:
            params["symbol"] = symbol
        return await self.get("/fapi/v1/ticker/24hr", params=params)

    async def premium_index(self, symbol: str | None = None) -> Any | None:
        """Mark price + index price + funding rate."""
        params: dict[str, Any] = {}
        if symbol:
            params["symbol"] = symbol
        return await self.get("/fapi/v1/premiumIndex", params=params)

    async def funding_rate(
        self, symbol: str | None = None, limit: int = 100,
        start_time: int | None = None, end_time: int | None = None,
    ) -> list[dict[str, Any]] | None:
        """Funding rate history."""
        params: dict[str, Any] = {"limit": limit}
        if symbol:
            params["symbol"] = symbol
        if start_time is not None:
            params["startTime"] = start_time
        if end_time is not None:
            params["endTime"] = end_time
        return await self.get("/fapi/v1/fundingRate", params=params)

    async def global_long_short_ratio(
        self, symbol: str, period: str = "1h", limit: int = 500,
        start_time: int | None = None, end_time: int | None = None,
    ) -> list[dict[str, Any]] | None:
        """Global account-based L/S ratio history."""
        params: dict[str, Any] = {"symbol": symbol, "period": period, "limit": limit}
        if start_time is not None:
            params["startTime"] = start_time
        if end_time is not None:
            params["endTime"] = end_time
        return await self.get("/futures/data/globalLongShortAccountRatio", params=params)

    async def top_long_short_account_ratio(
        self, symbol: str, period: str = "1h", limit: int = 500,
    ) -> list[dict[str, Any]] | None:
        """Top trader account L/S ratio."""
        return await self.get(
            "/futures/data/topLongShortAccountRatio",
            params={"symbol": symbol, "period": period, "limit": limit},
        )

    async def top_long_short_position_ratio(
        self, symbol: str, period: str = "1h", limit: int = 500,
    ) -> list[dict[str, Any]] | None:
        """Top trader position L/S ratio."""
        return await self.get(
            "/futures/data/topLongShortPositionRatio",
            params={"symbol": symbol, "period": period, "limit": limit},
        )

    async def taker_long_short_ratio(
        self, symbol: str, period: str = "1h", limit: int = 500,
    ) -> list[dict[str, Any]] | None:
        """Taker buy/sell volume ratio."""
        return await self.get(
            "/futures/data/takerlongshortRatio",
            params={"symbol": symbol, "period": period, "limit": limit},
        )

    async def klines(
        self, symbol: str, interval: str = "1h", limit: int = 500,
        start_time: int | None = None, end_time: int | None = None,
    ) -> list[list[Any]] | None:
        """OHLCV candlestick data."""
        params: dict[str, Any] = {"symbol": symbol, "interval": interval, "limit": limit}
        if start_time is not None:
            params["startTime"] = start_time
        if end_time is not None:
            params["endTime"] = end_time
        return await self.get("/fapi/v1/klines", params=params)


# Singleton instance
binance_client = BinanceClient()
