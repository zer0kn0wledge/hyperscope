"""
EdgeX Public API Client

Base URL: https://pro.edgex.exchange
Public endpoints require no authentication.
"""

from __future__ import annotations

import logging
from typing import Any

from sources.base import BaseHTTPClient, TokenBucket

logger = logging.getLogger(__name__)

_edgex_rate_limiter = TokenBucket(capacity=20, refill_rate=5.0)


class EdgeXClient(BaseHTTPClient):
    """Client for EdgeX public API."""

    def __init__(self) -> None:
        super().__init__(
            base_url="https://pro.edgex.exchange",
            source_name="edgex",
            rate_limiter=_edgex_rate_limiter,
            max_retries=2,
        )

    async def ticker_list(self) -> dict[str, Any] | None:
        """All tickers with price, volume, OI, and funding rate data."""
        return await self.get("/api/v1/public/market/getTickerList")

    async def market_list(self) -> dict[str, Any] | None:
        """List all available markets."""
        return await self.get("/api/v1/public/global/getMarketList")

    async def orderbook(self, contract_id: str) -> dict[str, Any] | None:
        """Orderbook by contract ID."""
        return await self.get(
            "/api/v1/public/market/getOrderBookByContractId",
            params={"contractId": contract_id},
        )

    async def candle_list(
        self, contract_id: str, interval: str = "1h", limit: int = 200,
    ) -> dict[str, Any] | None:
        """OHLCV candlestick data."""
        return await self.get(
            "/api/v1/public/market/getCandleList",
            params={"contractId": contract_id, "interval": interval, "limit": limit},
        )

    async def funding_rate_list(self, contract_id: str, limit: int = 100) -> dict[str, Any] | None:
        """Funding rate history."""
        return await self.get(
            "/api/v1/public/market/getFundingRateList",
            params={"contractId": contract_id, "size": limit},
        )

    async def recent_trades(self, contract_id: str, limit: int = 100) -> dict[str, Any] | None:
        """Recent trades."""
        return await self.get(
            "/api/v1/public/trade/getTradeActiveList",
            params={"contractId": contract_id, "size": limit},
        )


edgex_client = EdgeXClient()
