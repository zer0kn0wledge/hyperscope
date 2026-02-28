"""
Coinbase International Exchange (Derivatives) Public API Client

Base URL: https://api.coinbase.com
Note: Some endpoints require authentication. This client only exposes
public endpoints. Funding rate data requires auth and is skipped for now.
"""
from __future__ import annotations

import logging
from typing import Any

from sources.base import BaseHTTPClient, TokenBucket

logger = logging.getLogger(__name__)

_coinbase_rate_limiter = TokenBucket(capacity=10, refill_rate=2.0)


class CoinbaseDerivativesClient(BaseHTTPClient):
    """Client for Coinbase International Exchange public API endpoints."""

    def __init__(self) -> None:
        super().__init__(
            base_url="https://api.coinbase.com",
            source_name="coinbase_derivatives",
            rate_limiter=_coinbase_rate_limiter,
            max_retries=2,
            backoff_base=1.0,
        )

    async def perpetuals_products(self) -> dict[str, Any] | None:
        """List all perpetuals products (public)."""
        return await self.get("/api/v3/brokerage/market/products", params={"product_type": "FUTURE"})


# Singleton instance
coinbase_deriv_client = CoinbaseDerivativesClient()
