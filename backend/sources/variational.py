"""
Variational Public API Client

Base URL: https://omni-client-api.prod.ap-northeast-1.variational.io
Only one public read-only endpoint available.
Rate limit: 10 req/10s (per IP)
"""

from __future__ import annotations

import logging
from typing import Any

from sources.base import BaseHTTPClient, TokenBucket

logger = logging.getLogger(__name__)

_variational_rate_limiter = TokenBucket(capacity=5, refill_rate=1.0)


class VariationalClient(BaseHTTPClient):
    """Client for Variational read-only stats API."""

    def __init__(self) -> None:
        super().__init__(
            base_url="https://omni-client-api.prod.ap-northeast-1.variational.io",
            source_name="variational",
            rate_limiter=_variational_rate_limiter,
            max_retries=2,
        )

    async def stats(self) -> dict[str, Any] | None:
        """
        Platform-wide and per-listing market statistics.
        Returns total_volume_24h, cumulative_volume, tvl, open_interest, num_markets, listings.
        """
        return await self.get("/metadata/stats")


variational_client = VariationalClient()
