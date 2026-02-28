"""
OKX V5 Public API Client

Base URL: https://www.okx.com
No auth required for public endpoints.
Rate limits: per-endpoint (10-100 req/2s)
"""

from __future__ import annotations

import logging
from typing import Any

from sources.base import BaseHTTPClient, TokenBucket

logger = logging.getLogger(__name__)

_okx_rate_limiter = TokenBucket(capacity=20, refill_rate=10.0)


class OKXClient(BaseHTTPClient):
    """Client for OKX V5 public API endpoints."""

    def __init__(self) -> None:
        super().__init__(
            base_url="https://www.okx.com",
            source_name="okx",
            rate_limiter=_okx_rate_limiter,
            max_retries=2,
            backoff_base=1.0,
        )

    def _extract_data(self, response: dict[str, Any] | None) -> Any | None:
        """Extract data from OKX response wrapper."""
        if response is None:
            return None
        if response.get("code") != "0":
            logger.warning("[okx] API error: %s", response.get("msg"))
            return None
        return response.get("data")

    async def tickers(
        self, inst_type: str = "SWAP", inst_family: str | None = None,
    ) -> list[dict[str, Any]] | None:
        """All tickers for an instrument type."""
        params: dict[str, Any] = {"instType": inst_type}
        if inst_family:
            params["instFamily"] = inst_family
        resp = await self.get("/api/v5/market/tickers", params=params)
        return self._extract_data(resp)

    async def ticker(self, inst_id: str) -> dict[str, Any] | None:
        """Single ticker by instrument ID."""
        resp = await self.get("/api/v5/market/ticker", params={"instId": inst_id})
        data = self._extract_data(resp)
        return data[0] if data else None

    async def open_interest(
        self, inst_type: str = "SWAP", inst_family: str | None = None, inst_id: str | None = None,
    ) -> list[dict[str, Any]] | None:
        """Current open interest."""
        params: dict[str, Any] = {"instType": inst_type}
        if inst_family:
            params["instFamily"] = inst_family
        if inst_id:
            params["instId"] = inst_id
        resp = await self.get("/api/v5/public/open-interest", params=params)
        return self._extract_data(resp)

    async def open_interest_history(
        self, inst_id: str, period: str = "1H",
        begin: int | None = None, end: int | None = None, limit: int = 100,
    ) -> list[list[str]] | None:
        """Historical OI (aggregated stats)."""
        params: dict[str, Any] = {"instId": inst_id, "period": period, "limit": str(limit)}
        if begin is not None:
            params["begin"] = str(begin)
        if end is not None:
            params["end"] = str(end)
        resp = await self.get("/api/v5/rubik/stat/contracts/open-interest-history", params=params)
        return self._extract_data(resp)

    async def funding_rate(self, inst_id: str) -> dict[str, Any] | None:
        """Current funding rate."""
        resp = await self.get("/api/v5/public/funding-rate", params={"instId": inst_id})
        data = self._extract_data(resp)
        return data[0] if data else None

    async def funding_rate_history(
        self, inst_id: str, limit: int = 100,
        before: str | None = None, after: str | None = None,
    ) -> list[dict[str, Any]] | None:
        """Historical funding rates."""
        params: dict[str, Any] = {"instId": inst_id, "limit": str(limit)}
        if before:
            params["before"] = before
        if after:
            params["after"] = after
        resp = await self.get("/api/v5/public/funding-rate-history", params=params)
        return self._extract_data(resp)

    async def long_short_ratio(
        self, inst_id: str, period: str = "1H",
        begin: int | None = None, end: int | None = None, limit: int = 100,
    ) -> list[list[str]] | None:
        """All traders account L/S ratio history."""
        params: dict[str, Any] = {"instId": inst_id, "period": period, "limit": str(limit)}
        if begin is not None:
            params["begin"] = str(begin)
        if end is not None:
            params["end"] = str(end)
        resp = await self.get(
            "/api/v5/rubik/stat/contracts/long-short-account-ratio-contract", params=params
        )
        return self._extract_data(resp)

    async def taker_volume(
        self, inst_id: str, period: str = "1H", unit: str = "2",
        begin: int | None = None, end: int | None = None, limit: int = 100,
    ) -> list[list[str]] | None:
        """Taker buy/sell volume history."""
        params: dict[str, Any] = {"instId": inst_id, "period": period, "unit": unit, "limit": str(limit)}
        if begin is not None:
            params["begin"] = str(begin)
        if end is not None:
            params["end"] = str(end)
        resp = await self.get("/api/v5/rubik/stat/taker-volume-contract", params=params)
        return self._extract_data(resp)

    async def liquidation_orders(
        self, inst_type: str = "SWAP", inst_family: str | None = None,
    ) -> list[dict[str, Any]] | None:
        """Current batch of liquidation orders."""
        params: dict[str, Any] = {"instType": inst_type}
        if inst_family:
            params["instFamily"] = inst_family
        resp = await self.get("/api/v5/public/liquidation-orders", params=params)
        return self._extract_data(resp)

    async def instruments(self, inst_type: str = "SWAP") -> list[dict[str, Any]] | None:
        """List all instruments of a given type."""
        resp = await self.get("/api/v5/public/instruments", params={"instType": inst_type})
        return self._extract_data(resp)

    async def platform_24_volume(self) -> dict[str, Any] | None:
        """Platform-wide 24h volume."""
        resp = await self.get("/api/v5/market/platform-24-volume")
        data = self._extract_data(resp)
        return data[0] if data else None


# Singleton instance
okx_client = OKXClient()
