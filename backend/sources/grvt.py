"""
GRVT (Gravity Markets) Public Market Data API Client

Base URL: https://market-data.grvt.io
All market data endpoints are public.
Rate limit: 1500 req/min (REST)
All requests use POST method.
"""

from __future__ import annotations

import logging
from typing import Any

from sources.base import BaseHTTPClient, TokenBucket

logger = logging.getLogger(__name__)

_grvt_rate_limiter = TokenBucket(capacity=50, refill_rate=25.0)


class GRVTClient(BaseHTTPClient):
    """Client for GRVT market data API."""

    def __init__(self) -> None:
        super().__init__(
            base_url="https://market-data.grvt.io",
            source_name="grvt",
            rate_limiter=_grvt_rate_limiter,
            max_retries=2,
        )

    async def ticker(
        self, instrument: str | None = None, instrument_type: str = "PERPS",
        underlying: str | None = None, quote_currency: str = "USDT",
    ) -> dict[str, Any] | None:
        """Full ticker for all or specific instruments."""
        payload: dict[str, Any] = {"instrument_type": instrument_type, "quote_currency": quote_currency}
        if instrument:
            payload["instrument"] = instrument
        if underlying:
            payload["underlying"] = underlying
        return await self.post("/full/v1/ticker", json=payload)

    async def mini_ticker(
        self, instrument: str | None = None, instrument_type: str = "PERPS",
    ) -> dict[str, Any] | None:
        """Mini ticker (mark price, bid/ask only)."""
        payload: dict[str, Any] = {"instrument_type": instrument_type}
        if instrument:
            payload["instrument"] = instrument
        return await self.post("/full/v1/mini", json=payload)

    async def all_instruments(
        self, instrument_type: str = "PERPS", quote_currency: str = "USDT",
    ) -> dict[str, Any] | None:
        """All available instruments."""
        return await self.post("/full/v1/all_instruments", json={"instrument_type": instrument_type, "quote_currency": quote_currency})

    async def orderbook(self, instrument: str, depth: int = 10, aggregate: int = 1) -> dict[str, Any] | None:
        """Orderbook for an instrument."""
        payload = {"instrument": instrument, "depth": depth, "aggregate": aggregate, "num_levels": depth}
        return await self.post("/full/v1/book", json=payload)

    async def trades(self, instrument: str, limit: int = 100) -> dict[str, Any] | None:
        """Recent trades (up to 1000)."""
        return await self.post("/full/v1/trades", json={"instrument": instrument, "limit": limit})

    async def kline(
        self, instrument: str, interval: str = "CI_1_H",
        start_time: int | None = None, end_time: int | None = None, limit: int = 200,
    ) -> dict[str, Any] | None:
        """OHLCV candlestick data."""
        payload: dict[str, Any] = {"instrument": instrument, "interval": interval, "limit": limit}
        if start_time is not None:
            payload["start_time"] = str(start_time * 1_000_000)
        if end_time is not None:
            payload["end_time"] = str(end_time * 1_000_000)
        return await self.post("/full/v1/kline", json=payload)

    async def funding(self, instrument: str, limit: int = 100) -> dict[str, Any] | None:
        """Funding rate history for an instrument."""
        return await self.post("/full/v1/funding", json={"instrument": instrument, "limit": limit})


grvt_client = GRVTClient()
