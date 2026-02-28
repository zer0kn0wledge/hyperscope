"""
Hyperliquid Info API Client

All calls are POST to https://api.hyperliquid.xyz/info
Rate limit: 1200 weight/minute (IP-based)
"""

from __future__ import annotations

import logging
from typing import Any

from config import settings
from sources.base import BaseHTTPClient, TokenBucket

logger = logging.getLogger(__name__)

# Token bucket: 1200 weight/min
_hl_rate_limiter = TokenBucket(capacity=200, refill_rate=20.0)


class HyperliquidClient(BaseHTTPClient):
    """
    Client for the Hyperliquid Info API.
    All endpoints POST to /info with a JSON body containing {"type": "...", ...params}.
    """

    def __init__(self) -> None:
        super().__init__(
            base_url=settings.hl_api_base,
            source_name="hyperliquid",
            headers={"Content-Type": "application/json"},
            rate_limiter=_hl_rate_limiter,
            max_retries=3,
            backoff_base=0.5,
        )

    async def _info(self, payload: dict[str, Any]) -> Any | None:
        """Send a POST /info request."""
        return await self.post("/info", json=payload)

    async def all_mids(self) -> dict[str, str] | None:
        """All mid prices for every coin. Weight: 2"""
        return await self._info({"type": "allMids", "dex": ""})

    async def meta_and_asset_ctxs(self) -> list[Any] | None:
        """Full market snapshot: metadata + live asset contexts. Weight: 20"""
        return await self._info({"type": "metaAndAssetCtxs"})

    async def spot_meta_and_asset_ctxs(self) -> list[Any] | None:
        """Full spot market snapshot. Weight: 20"""
        return await self._info({"type": "spotMetaAndAssetCtxs"})

    async def predicted_fundings(self) -> list[Any] | None:
        """Predicted next funding rates for all assets. Weight: 20"""
        return await self._info({"type": "predictedFundings"})

    async def recent_trades(self, coin: str) -> list[dict[str, Any]] | None:
        """Recent trades for a specific coin. Weight: 20"""
        return await self._info({"type": "recentTrades", "coin": coin})

    async def funding_history(
        self, coin: str, start_time: int, end_time: int | None = None
    ) -> list[dict[str, Any]] | None:
        """Historical funding rates for a coin. Weight: 20"""
        payload: dict[str, Any] = {"type": "fundingHistory", "coin": coin, "startTime": start_time}
        if end_time is not None:
            payload["endTime"] = end_time
        return await self._info(payload)

    async def l2_book(self, coin: str, n_sig_figs: int | None = None) -> dict[str, Any] | None:
        """L2 orderbook snapshot. Weight: 2"""
        payload: dict[str, Any] = {"type": "l2Book", "coin": coin}
        if n_sig_figs is not None:
            payload["nSigFigs"] = n_sig_figs
        return await self._info(payload)

    async def candle_snapshot(
        self, coin: str, interval: str, start_time: int, end_time: int | None = None
    ) -> list[dict[str, Any]] | None:
        """Historical OHLCV candles. Weight: 20"""
        req: dict[str, Any] = {"coin": coin, "interval": interval, "startTime": start_time}
        if end_time is not None:
            req["endTime"] = end_time
        return await self._info({"type": "candleSnapshot", "req": req})

    async def clearinghouse_state(self, user: str) -> dict[str, Any] | None:
        """User's perp account state. Weight: 2"""
        return await self._info({"type": "clearinghouseState", "user": user, "dex": ""})

    async def spot_clearinghouse_state(self, user: str) -> dict[str, Any] | None:
        """User's spot token balances. Weight: 2"""
        return await self._info({"type": "spotClearinghouseState", "user": user})

    async def portfolio(self, user: str) -> dict[str, Any] | None:
        """User's historical portfolio performance. Weight: 20"""
        return await self._info({"type": "portfolio", "user": user})

    async def sub_accounts(self, user: str) -> list[Any] | None:
        """User's sub-account addresses. Weight: 20"""
        return await self._info({"type": "subAccounts", "user": user})

    async def sub_accounts2(self, user: str) -> list[Any] | None:
        """Extended sub-account data with balances. Weight: 20"""
        return await self._info({"type": "subAccounts2", "user": user})

    async def user_fees(self, user: str) -> dict[str, Any] | None:
        """User's fee schedule and daily volume. Weight: 20"""
        return await self._info({"type": "userFees", "user": user})

    async def user_rate_limit(self, user: str) -> dict[str, Any] | None:
        """User's address-based rate limit status. Weight: 2"""
        return await self._info({"type": "userRateLimit", "user": user})

    async def open_orders(self, user: str) -> list[dict[str, Any]] | None:
        """User's current open orders. Weight: 20"""
        return await self._info({"type": "openOrders", "user": user, "dex": ""})

    async def frontend_open_orders(self, user: str) -> list[dict[str, Any]] | None:
        """Open orders with full UI metadata. Weight: 20"""
        return await self._info({"type": "frontendOpenOrders", "user": user, "dex": ""})

    async def user_fills(self, user: str) -> list[dict[str, Any]] | None:
        """All fills (trade history) for a user. Weight: 20"""
        return await self._info({"type": "userFills", "user": user})

    async def user_fills_by_time(
        self, user: str, start_time: int, end_time: int | None = None, aggregate_by_time: bool = False
    ) -> list[dict[str, Any]] | None:
        """Fill history filtered by time range. Weight: 20"""
        payload: dict[str, Any] = {
            "type": "userFillsByTime", "user": user, "startTime": start_time,
            "aggregateByTime": aggregate_by_time,
        }
        if end_time is not None:
            payload["endTime"] = end_time
        return await self._info(payload)

    async def historical_orders(self, user: str) -> list[dict[str, Any]] | None:
        """User's full historical order history. Weight: 20"""
        return await self._info({"type": "historicalOrders", "user": user})

    async def order_status(self, user: str, oid: int | str) -> dict[str, Any] | None:
        """Status of a specific order. Weight: 2"""
        return await self._info({"type": "orderStatus", "user": user, "oid": oid})

    async def user_funding(
        self, user: str, start_time: int, end_time: int | None = None
    ) -> list[dict[str, Any]] | None:
        """User's funding payment history. Weight: 20"""
        payload: dict[str, Any] = {"type": "userFunding", "user": user, "startTime": start_time}
        if end_time is not None:
            payload["endTime"] = end_time
        return await self._info(payload)

    async def user_non_funding_ledger_updates(
        self, user: str, start_time: int, end_time: int | None = None
    ) -> list[dict[str, Any]] | None:
        """Non-funding balance changes. Weight: 20"""
        payload: dict[str, Any] = {
            "type": "userNonFundingLedgerUpdates", "user": user, "startTime": start_time
        }
        if end_time is not None:
            payload["endTime"] = end_time
        return await self._info(payload)

    async def vault_details(
        self, vault_address: str, user: str | None = None
    ) -> dict[str, Any] | None:
        """Detailed vault analytics including TVL history. Weight: 20"""
        payload: dict[str, Any] = {"type": "vaultDetails", "vaultAddress": vault_address}
        if user is not None:
            payload["user"] = user
        return await self._info(payload)

    async def vault_summaries(self) -> list[dict[str, Any]] | None:
        """All vaults overview. Weight: 20"""
        return await self._info({"type": "vaultSummaries"})

    async def delegator_summary(self, user: str) -> dict[str, Any] | None:
        """User's HYPE staking summary. Weight: 20"""
        return await self._info({"type": "delegatorSummary", "user": user})

    async def delegations(self, user: str) -> list[dict[str, Any]] | None:
        """User's active HYPE delegations. Weight: 20"""
        return await self._info({"type": "delegations", "user": user})

    async def delegator_rewards(self, user: str) -> list[dict[str, Any]] | None:
        """Staking rewards history. Weight: 20"""
        return await self._info({"type": "delegatorRewards", "user": user})

    async def validator_summaries(self) -> list[dict[str, Any]] | None:
        """All validators with stake amounts, APR, commission. Weight: 20"""
        return await self._info({"type": "validatorSummaries"})

    async def exchange_status(self) -> dict[str, Any] | None:
        """Exchange health: maintenance mode flag, block height. Weight: 2"""
        return await self._info({"type": "exchangeStatus"})

    async def meta(self) -> dict[str, Any] | None:
        """Perpetuals metadata: all tradable pairs. Weight: 20"""
        return await self._info({"type": "meta", "dex": ""})

    async def spot_meta(self) -> dict[str, Any] | None:
        """Spot trading metadata. Weight: 20"""
        return await self._info({"type": "spotMeta"})


# Singleton instance
hl_client = HyperliquidClient()
