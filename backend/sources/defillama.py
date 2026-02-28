"""
DeFiLlama API Client

All free, no authentication required.
Base URLs: https://api.llama.fi / https://fees.llama.fi
Rate limit: ~300 req/min (estimated)
"""

from __future__ import annotations

import logging
from typing import Any

from sources.base import BaseHTTPClient, TokenBucket

logger = logging.getLogger(__name__)

_llama_rate_limiter = TokenBucket(capacity=20, refill_rate=1.67)


class DeFiLlamaClient(BaseHTTPClient):
    """Client for DeFiLlama public APIs."""

    def __init__(self) -> None:
        super().__init__(
            base_url="https://api.llama.fi",
            source_name="defillama",
            rate_limiter=_llama_rate_limiter,
            max_retries=2,
            backoff_base=1.0,
        )
        self._fees_client: BaseHTTPClient | None = None

    async def _get_fees_client(self) -> BaseHTTPClient:
        if self._fees_client is None:
            self._fees_client = BaseHTTPClient(
                base_url="https://api.llama.fi",
                source_name="defillama_fees",
                rate_limiter=_llama_rate_limiter,
                max_retries=2,
            )
        return self._fees_client

    async def close(self) -> None:
        await super().close()
        if self._fees_client:
            await self._fees_client.close()

    async def protocol_tvl(self, protocol_slug: str) -> float | None:
        """Current TVL for a protocol."""
        return await self.get(f"/tvl/{protocol_slug}")

    async def protocol_data(self, protocol_slug: str) -> dict[str, Any] | None:
        """Full protocol data including TVL history, active users, links."""
        return await self.get(f"/protocol/{protocol_slug}")

    async def fees_summary(self, protocol_slug: str) -> dict[str, Any] | None:
        """Fee and revenue summary for a protocol."""
        return await self.get(f"/summary/fees/{protocol_slug}")

    async def dex_summary(self, protocol_slug: str) -> dict[str, Any] | None:
        """DEX/spot volume summary for a protocol."""
        return await self.get(f"/summary/dexs/{protocol_slug}")

    async def all_protocols(self) -> list[dict[str, Any]] | None:
        """All protocols tracked by DeFiLlama with current TVL."""
        return await self.get("/protocols")

    async def chains(self) -> list[dict[str, Any]] | None:
        """All chains with TVL data."""
        return await self.get("/chains")

    async def hyperliquid_fees(self) -> dict[str, Any] | None:
        """Fees + revenue + historical chart for Hyperliquid."""
        return await self.fees_summary("hyperliquid")

    async def hyperliquid_tvl(self) -> float | None:
        """Current TVL for Hyperliquid."""
        return await self.protocol_tvl("hyperliquid")

    async def hyperliquid_protocol(self) -> dict[str, Any] | None:
        """Full protocol data for Hyperliquid including user metrics."""
        return await self.protocol_data("hyperliquid")


# Singleton instance
defillama_client = DeFiLlamaClient()
