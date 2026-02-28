"""
KuCoin Futures Public API Client

Base URL: https://api-futures.kucoin.com
No auth required for public endpoints.
"""
from __future__ import annotations

import logging
from typing import Any

from sources.base import BaseHTTPClient, TokenBucket

logger = logging.getLogger(__name__)

_kucoin_rate_limiter = TokenBucket(capacity=10, refill_rate=3.0)


class KuCoinFuturesClient(BaseHTTPClient):
    """Client for KuCoin Futures public API endpoints."""

    def __init__(self) -> None:
        super().__init__(
            base_url="https://api-futures.kucoin.com",
            source_name="kucoin_futures",
            rate_limiter=_kucoin_rate_limiter,
            max_retries=2,
            backoff_base=1.0,
        )

    async def funding_rate(self, symbol: str) -> dict[str, Any] | None:
        """Get current funding rate for a symbol."""
        resp = await self.get(f"/api/v1/funding-rate/{symbol}/current")
        if isinstance(resp, dict) and resp.get("code") == "200000":
            return resp.get("data")
        return None

    async def btc_funding_rate(self) -> float:
        """Get current BTC-USDT perpetual funding rate."""
        data = await self.funding_rate("XBTUSDTM")
        if isinstance(data, dict):
            try:
                return float(data.get("value", 0) or 0)
            except (TypeError, ValueError):
                pass
        return 0.0


# Singleton instance
kucoin_futures_client = KuCoinFuturesClient()
