"""
CoinGlass V4 API Client

Base URL: https://open-api-v4.coinglass.com
Auth header: CG-API-KEY: {API_KEY}
Rate limit: 80 req/min (STARTUP tier)
"""

from __future__ import annotations

import logging
from typing import Any

from config import settings
from sources.base import BaseHTTPClient, TokenBucket

logger = logging.getLogger(__name__)

# 80 req/min
_cg_rate_limiter = TokenBucket(capacity=10, refill_rate=1.33)


class CoinGlassClient(BaseHTTPClient):
    """Client for CoinGlass V4 API."""

    def __init__(self) -> None:
        super().__init__(
            base_url="https://open-api-v4.coinglass.com",
            source_name="coinglass",
            headers={
                "CG-API-KEY": settings.coinglass_api_key,
                "Accept": "application/json",
            },
            rate_limiter=_cg_rate_limiter,
            max_retries=2,
            backoff_base=1.0,
        )

    async def oi_ohlc_history(
        self, symbol: str, exchange: str, interval: str = "1h", limit: int = 200,
        start_time: int | None = None, end_time: int | None = None,
    ) -> dict[str, Any] | None:
        """OI in OHLC candlestick format for a specific pair on a specific exchange."""
        params: dict[str, Any] = {"symbol": symbol, "exchange": exchange, "interval": interval, "limit": limit}
        if start_time is not None:
            params["startTime"] = start_time
        if end_time is not None:
            params["endTime"] = end_time
        return await self.get("/api/futures/openInterest/ohlc-history", params=params)

    async def oi_exchange_list(self, symbol: str) -> dict[str, Any] | None:
        """Current OI by exchange for a given coin."""
        return await self.get("/api/futures/openInterest/exchange-list", params={"symbol": symbol})

    async def oi_exchange_history_chart(
        self, symbol: str, exchange: str, interval: str = "1h", limit: int = 200,
    ) -> dict[str, Any] | None:
        """Historical OI per exchange formatted for charting."""
        return await self.get(
            "/api/futures/openInterest/exchange-history-chart",
            params={"symbol": symbol, "exchange": exchange, "interval": interval, "limit": limit},
        )

    async def oi_aggregated_history(
        self, symbol: str, interval: str = "1h", limit: int = 200,
    ) -> dict[str, Any] | None:
        """Aggregated OI across all exchanges in OHLC format."""
        return await self.get(
            "/api/futures/openInterest/aggregated-history",
            params={"symbol": symbol, "interval": interval, "limit": limit},
        )

    async def funding_rate_ohlc_history(
        self, symbol: str, exchange: str, interval: str = "8h", limit: int = 200,
    ) -> dict[str, Any] | None:
        """Funding rate OHLC history for a specific pair on a specific exchange."""
        return await self.get(
            "/api/futures/fundingRate/ohlc-history",
            params={"symbol": symbol, "exchange": exchange, "interval": interval, "limit": limit},
        )

    async def funding_rate_exchange_list(self, symbol: str) -> dict[str, Any] | None:
        """Current funding rates for a coin across all exchanges."""
        return await self.get("/api/futures/fundingRate/exchange-list", params={"symbol": symbol})

    async def funding_rate_oi_weighted(
        self, symbol: str, interval: str = "8h", limit: int = 200,
    ) -> dict[str, Any] | None:
        """OI-weighted funding rate OHLC history across exchanges."""
        return await self.get(
            "/api/futures/fundingRate/oi-weight-ohlc-history",
            params={"symbol": symbol, "interval": interval, "limit": limit},
        )

    async def liquidation_aggregated_history(
        self, symbol: str, exchange: str | None = None, interval: str = "1h", limit: int = 200,
    ) -> dict[str, Any] | None:
        """Aggregated liquidations across exchanges by asset."""
        params: dict[str, Any] = {"symbol": symbol, "interval": interval, "limit": limit}
        if exchange:
            params["exchange"] = exchange
        return await self.get("/api/futures/liquidation/aggregated-history", params=params)

    async def liquidation_history(
        self, symbol: str, exchange: str, interval: str = "1h", limit: int = 200,
    ) -> dict[str, Any] | None:
        """Historical liquidation data for a pair on an exchange."""
        return await self.get(
            "/api/futures/liquidation/history",
            params={"symbol": symbol, "exchange": exchange, "interval": interval, "limit": limit},
        )

    async def liquidation_exchange_list(self, symbol: str) -> dict[str, Any] | None:
        """Current liquidation data across all exchanges for a coin."""
        return await self.get("/api/futures/liquidation/exchange-list", params={"symbol": symbol})

    async def liquidation_heatmap(self, symbol: str) -> dict[str, Any] | None:
        """Liquidation heatmap."""
        return await self.get("/api/futures/liquidation/heatmap/model2", params={"symbol": symbol})

    async def global_long_short_ratio(
        self, symbol: str, exchange: str, period: str = "1h", limit: int = 200,
    ) -> dict[str, Any] | None:
        """Global account-based L/S ratio history."""
        return await self.get(
            "/api/futures/global-long-short-account-ratio/history",
            params={"symbol": symbol, "exchange": exchange, "period": period, "limit": limit},
        )

    async def top_long_short_account_ratio(
        self, symbol: str, exchange: str, period: str = "1h", limit: int = 200,
    ) -> dict[str, Any] | None:
        """Top trader account L/S ratio."""
        return await self.get(
            "/api/futures/top-long-short-account-ratio/history",
            params={"symbol": symbol, "exchange": exchange, "period": period, "limit": limit},
        )

    async def taker_buy_sell_volume(
        self, symbol: str, exchange: str, interval: str = "1h", limit: int = 200,
    ) -> dict[str, Any] | None:
        """Taker buy/sell volume history."""
        return await self.get(
            "/api/futures/taker-buy-sell-volume/history",
            params={"symbol": symbol, "exchange": exchange, "interval": interval, "limit": limit},
        )

    async def aggregated_taker_volume(
        self, symbol: str, interval: str = "1h", limit: int = 200,
    ) -> dict[str, Any] | None:
        """Aggregated taker buy/sell across all exchanges."""
        return await self.get(
            "/api/futures/aggregated-taker-buy-sell-volume/history",
            params={"symbol": symbol, "interval": interval, "limit": limit},
        )

    async def large_limit_orders(
        self, symbol: str = "BTC", exchange: str | None = None,
    ) -> dict[str, Any] | None:
        """Current large open limit orders."""
        params: dict[str, Any] = {"symbol": symbol}
        if exchange:
            params["exchange"] = exchange
        return await self.get("/api/futures/orderbook/large-limit-order", params=params)

    async def futures_coins_markets(self) -> dict[str, Any] | None:
        """Current market data for all futures coins."""
        return await self.get("/api/futures/coins-markets")

    async def futures_pairs_markets(self) -> dict[str, Any] | None:
        """Current market data for all futures pairs."""
        return await self.get("/api/futures/pairs-markets")

    async def supported_exchange_pairs(self) -> dict[str, Any] | None:
        """All supported futures exchanges and trading pairs."""
        return await self.get("/api/futures/supported-exchange-pairs")


# Singleton instance
coinglass_client = CoinGlassClient()
