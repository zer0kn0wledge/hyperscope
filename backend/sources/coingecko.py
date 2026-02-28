"""
CoinGecko Pro API Client

Base URL: https://pro-api.coingecko.com/api/v3
Auth header: x-cg-pro-api-key: {API_KEY}
Rate limit: 500 req/min (Analyst tier)
"""

from __future__ import annotations

import logging
from typing import Any

from config import settings
from sources.base import BaseHTTPClient, TokenBucket

logger = logging.getLogger(__name__)

_gecko_rate_limiter = TokenBucket(capacity=30, refill_rate=8.33)


class CoinGeckoClient(BaseHTTPClient):
    """Client for CoinGecko Pro API."""

    def __init__(self) -> None:
        super().__init__(
            base_url="https://pro-api.coingecko.com/api/v3",
            source_name="coingecko",
            headers={
                "x-cg-pro-api-key": settings.coingecko_api_key,
                "Accept": "application/json",
            },
            rate_limiter=_gecko_rate_limiter,
            max_retries=2,
            backoff_base=1.0,
        )

    async def simple_price(
        self, ids: str, vs_currencies: str = "usd",
        include_market_cap: bool = False, include_24hr_vol: bool = False,
        include_24hr_change: bool = False,
    ) -> dict[str, Any] | None:
        """Simple price lookup for one or more coins."""
        params: dict[str, Any] = {"ids": ids, "vs_currencies": vs_currencies}
        if include_market_cap:
            params["include_market_cap"] = "true"
        if include_24hr_vol:
            params["include_24hr_vol"] = "true"
        if include_24hr_change:
            params["include_24hr_change"] = "true"
        return await self.get("/simple/price", params=params)

    async def coins_markets(
        self, ids: str | None = None, vs_currency: str = "usd",
        order: str = "market_cap_desc", per_page: int = 50, page: int = 1,
        sparkline: bool = False, price_change_percentage: str = "24h,7d",
    ) -> list[dict[str, Any]] | None:
        """Coins market data including price, market cap, volume, supply."""
        params: dict[str, Any] = {
            "vs_currency": vs_currency, "order": order, "per_page": per_page,
            "page": page, "sparkline": str(sparkline).lower(),
            "price_change_percentage": price_change_percentage,
        }
        if ids:
            params["ids"] = ids
        return await self.get("/coins/markets", params=params)

    async def coin_data(
        self, coin_id: str, localization: bool = False, tickers: bool = False,
        market_data: bool = True, community_data: bool = False, developer_data: bool = False,
    ) -> dict[str, Any] | None:
        """Full data for a single coin."""
        params = {
            "localization": str(localization).lower(), "tickers": str(tickers).lower(),
            "market_data": str(market_data).lower(), "community_data": str(community_data).lower(),
            "developer_data": str(developer_data).lower(),
        }
        return await self.get(f"/coins/{coin_id}", params=params)

    async def coin_ohlc(
        self, coin_id: str, vs_currency: str = "usd", days: int = 30,
    ) -> list[list[float]] | None:
        """OHLC candles for a coin."""
        return await self.get(f"/coins/{coin_id}/ohlc", params={"vs_currency": vs_currency, "days": days})

    async def coin_market_chart(
        self, coin_id: str, vs_currency: str = "usd", days: int = 7, interval: str | None = None,
    ) -> dict[str, Any] | None:
        """Historical market data (prices, market caps, volumes) for a coin."""
        params: dict[str, Any] = {"vs_currency": vs_currency, "days": days}
        if interval:
            params["interval"] = interval
        return await self.get(f"/coins/{coin_id}/market_chart", params=params)

    async def derivatives_exchanges(
        self, order: str = "open_interest_btc_desc", per_page: int = 100, page: int = 1,
    ) -> list[dict[str, Any]] | None:
        """List of derivatives exchanges with OI, volume, funding rates."""
        return await self.get("/derivatives/exchanges", params={"order": order, "per_page": per_page, "page": page})

    async def derivatives_exchange(
        self, exchange_id: str, include_tickers: str = "unexpired",
    ) -> dict[str, Any] | None:
        """Specific derivatives exchange data."""
        return await self.get(f"/derivatives/exchanges/{exchange_id}", params={"include_tickers": include_tickers})

    async def hype_market_data(self) -> dict[str, Any] | None:
        """Convenience method: HYPE token market data."""
        result = await self.coins_markets(ids="hyperliquid", vs_currency="usd", per_page=1, price_change_percentage="24h,7d")
        if result and len(result) > 0:
            return result[0]
        return None


# Singleton instance
coingecko_client = CoinGeckoClient()
