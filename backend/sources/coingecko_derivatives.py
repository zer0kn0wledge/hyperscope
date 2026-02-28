"""
CoinGecko Derivatives Exchange Data
Uses Pro API for exchange-level OI and volume comparison.
"""
from __future__ import annotations

import logging
from typing import Any

from config import settings
from sources.base import BaseHTTPClient, TokenBucket

logger = logging.getLogger(__name__)
_cg_deriv_limiter = TokenBucket(capacity=10, refill_rate=5.0)


class CoinGeckoDerivativesClient(BaseHTTPClient):
    def __init__(self) -> None:
        super().__init__(
            base_url="https://pro-api.coingecko.com",
            source_name="coingecko_derivatives",
            headers={
                "x-cg-pro-api-key": settings.coingecko_api_key,
                "Accept": "application/json",
            },
            rate_limiter=_cg_deriv_limiter,
            max_retries=2,
            backoff_base=1.0,
        )

    async def derivatives_exchanges(self, per_page: int = 50) -> list[dict[str, Any]] | None:
        """Get all derivatives exchanges with OI and volume."""
        return await self.get(
            "/api/v3/derivatives/exchanges",
            params={"per_page": per_page, "order": "open_interest_btc_desc"},
        )

    async def derivatives_exchange(self, exchange_id: str) -> dict[str, Any] | None:
        """Get single exchange details."""
        return await self.get(f"/api/v3/derivatives/exchanges/{exchange_id}")

    async def btc_price(self) -> float:
        """Get current BTC price in USD."""
        data = await self.get("/api/v3/simple/price", params={"ids": "bitcoin", "vs_currencies": "usd"})
        if isinstance(data, dict) and "bitcoin" in data:
            return float(data["bitcoin"].get("usd", 0))
        return 0.0


coingecko_deriv_client = CoinGeckoDerivativesClient()
