"""
Bybit V5 Public API Client

Base URL: https://api.bybit.com
No auth required for public market data endpoints.
Rate limit: 600 req/5s (IP-based)
"""

from __future__ import annotations

import logging
from typing import Any

from sources.base import BaseHTTPClient, TokenBucket

logger = logging.getLogger(__name__)

_bybit_rate_limiter = TokenBucket(capacity=60, refill_rate=120.0)


class BybitClient(BaseHTTPClient):
    """Client for Bybit V5 public API endpoints."""

    def __init__(self) -> None:
        super().__init__(
            base_url="https://api.bybit.com",
            source_name="bybit",
            rate_limiter=_bybit_rate_limiter,
            max_retries=2,
            backoff_base=1.0,
        )

    def _extract(self, response: dict[str, Any] | None) -> Any | None:
        """Extract result.list from Bybit V5 response wrapper."""
        if response is None:
            return None
        if response.get("retCode") != 0:
            logger.warning("[bybit] API error: %s", response.get("retMsg"))
            return None
        result = response.get("result", {})
        return result.get("list", result)

    async def tickers(
        self, category: str = "linear", symbol: str | None = None,
    ) -> list[dict[str, Any]] | None:
        """Ticker snapshot for linear/inverse perps."""
        params: dict[str, Any] = {"category": category}
        if symbol:
            params["symbol"] = symbol
        resp = await self.get("/v5/market/tickers", params=params)
        return self._extract(resp)

    async def open_interest(
        self, symbol: str, category: str = "linear", interval_time: str = "1h",
        limit: int = 200, start_time: int | None = None, end_time: int | None = None,
    ) -> list[dict[str, Any]] | None:
        """Historical open interest."""
        params: dict[str, Any] = {
            "category": category, "symbol": symbol,
            "intervalTime": interval_time, "limit": limit,
        }
        if start_time is not None:
            params["startTime"] = start_time
        if end_time is not None:
            params["endTime"] = end_time
        resp = await self.get("/v5/market/open-interest", params=params)
        return self._extract(resp)

    async def funding_history(
        self, symbol: str, category: str = "linear", limit: int = 200,
        start_time: int | None = None, end_time: int | None = None,
    ) -> list[dict[str, Any]] | None:
        """Funding rate history."""
        params: dict[str, Any] = {"category": category, "symbol": symbol, "limit": limit}
        if start_time is not None:
            params["startTime"] = start_time
        if end_time is not None:
            params["endTime"] = end_time
        resp = await self.get("/v5/market/funding/history", params=params)
        return self._extract(resp)

    async def account_ratio(
        self, symbol: str, category: str = "linear", period: str = "1h",
        limit: int = 500, start_time: int | None = None, end_time: int | None = None,
    ) -> list[dict[str, Any]] | None:
        """Account-based L/S ratio history."""
        params: dict[str, Any] = {
            "category": category, "symbol": symbol, "period": period, "limit": limit,
        }
        if start_time is not None:
            params["startTime"] = str(start_time)
        if end_time is not None:
            params["endTime"] = str(end_time)
        resp = await self.get("/v5/market/account-ratio", params=params)
        return self._extract(resp)

    async def orderbook(
        self, symbol: str, category: str = "linear", limit: int = 50,
    ) -> dict[str, Any] | None:
        """Order book depth."""
        params = {"category": category, "symbol": symbol, "limit": limit}
        resp = await self.get("/v5/market/orderbook", params=params)
        if resp is None or resp.get("retCode") != 0:
            return None
        return resp.get("result")

    async def klines(
        self, symbol: str, category: str = "linear", interval: str = "60",
        limit: int = 200, start_time: int | None = None, end_time: int | None = None,
    ) -> list[list[Any]] | None:
        """OHLCV kline data."""
        params: dict[str, Any] = {
            "category": category, "symbol": symbol, "interval": interval, "limit": limit,
        }
        if start_time is not None:
            params["start"] = start_time
        if end_time is not None:
            params["end"] = end_time
        resp = await self.get("/v5/market/kline", params=params)
        return self._extract(resp)


# Singleton instance
bybit_client = BybitClient()
