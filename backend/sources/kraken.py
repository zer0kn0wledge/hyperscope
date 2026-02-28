"""
Kraken Futures Public API Client

Base URL: https://futures.kraken.com/derivatives/api/v3
No auth required for public endpoints.
"""
from __future__ import annotations

import logging
from typing import Any

from sources.base import BaseHTTPClient, TokenBucket

logger = logging.getLogger(__name__)

_kraken_rate_limiter = TokenBucket(capacity=10, refill_rate=2.0)


class KrakenFuturesClient(BaseHTTPClient):
    """Client for Kraken Futures public API endpoints."""

    def __init__(self) -> None:
        super().__init__(
            base_url="https://futures.kraken.com",
            source_name="kraken_futures",
            rate_limiter=_kraken_rate_limiter,
            max_retries=2,
            backoff_base=1.0,
        )

    async def tickers(self) -> dict[str, Any] | None:
        """Get all tickers including funding rates."""
        return await self.get("/derivatives/api/v3/tickers")

    async def btc_funding_rate(self) -> float:
        """Get current BTC-USD perpetual funding rate."""
        data = await self.tickers()
        if not isinstance(data, dict):
            return 0.0
        tickers = data.get("tickers", [])
        for ticker in tickers:
            if isinstance(ticker, dict) and ticker.get("symbol") == "PF_XBTUSD":
                try:
                    return float(ticker.get("fundingRate", 0) or 0)
                except (TypeError, ValueError):
                    return 0.0
        return 0.0


# Singleton instance
kraken_futures_client = KrakenFuturesClient()
