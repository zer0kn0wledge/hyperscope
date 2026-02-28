"""
Trader Service
Account state, fills, funding, PnL, and leaderboard logic.
"""

from __future__ import annotations

import asyncio
import logging
import time
from typing import Any

from services.cache import (
    TTL_MARKET,
    TTL_TRADER,
    TTL_TRADER_FILLS,
    TTL_PROTOCOL,
    cache,
)
from sources.hyperliquid import hl_client

logger = logging.getLogger(__name__)

# Known whale addresses (seed set — expanded by background monitor)
SEED_WHALE_ADDRESSES: list[str] = [
    "0xdfc24b077bc1425ad1dea75bcb6f8158e10df303",  # HLP vault
    "0xfefefefefefefefefefefefefefefefefefefefe",   # AF
]


class TraderService:
    """Service for trader analytics and address lookups."""

    def __init__(self) -> None:
        self._monitored_addresses: set[str] = set(SEED_WHALE_ADDRESSES)

    def add_address(self, address: str) -> None:
        """Register an address for periodic monitoring."""
        self._monitored_addresses.add(address.lower())

    async def get_account_summary(self, address: str) -> dict[str, Any]:
        """
        Full account summary for an address.
        Returns positions, margins, PnL, withdrawable balance.
        """
        cache_key = f"trader:{address}:state"
        cached = await cache.get(cache_key, TTL_TRADER)
        if cached is not None:
            return cached

        state = await hl_client.clearinghouse_state(user=address)
        if not state:
            return {"address": address, "error": "Address not found or no data"}

        cross_margin = state.get("crossMarginSummary", {})
        margin_summary = state.get("marginSummary", {})
        positions_raw = state.get("assetPositions", [])

        positions = []
        total_unrealized_pnl = 0.0
        for pos_wrapper in positions_raw:
            pos = pos_wrapper.get("position", pos_wrapper)
            try:
                szi = float(pos.get("szi", 0) or 0)
                if szi == 0:
                    continue
                upnl = float(pos.get("unrealizedPnl", 0) or 0)
                total_unrealized_pnl += upnl
                positions.append({
                    "coin": pos.get("coin", ""),
                    "side": "long" if szi > 0 else "short",
                    "size": abs(szi),
                    "size_usd": abs(szi) * float(pos.get("entryPx", 0) or 0),
                    "entry_px": float(pos.get("entryPx", 0) or 0),
                    "mark_px": float(pos.get("markPx", 0) or 0) if pos.get("markPx") else None,
                    "liq_px": float(pos.get("liquidationPx", 0) or 0) if pos.get("liquidationPx") else None,
                    "unrealized_pnl": upnl,
                    "return_on_equity": float(pos.get("returnOnEquity", 0) or 0),
                    "margin_used": float(pos.get("marginUsed", 0) or 0),
                    "leverage": pos.get("leverage", {}),
                    "position_value": float(pos.get("positionValue", 0) or 0),
                })
            except (TypeError, ValueError):
                continue

        result: dict[str, Any] = {
            "address": address,
            "account_value": float(cross_margin.get("accountValue", 0) or 0),
            "total_margin_used": float(cross_margin.get("totalMarginUsed", 0) or 0),
            "total_notional_position": float(cross_margin.get("totalNtlPos", 0) or 0),
            "withdrawable": float(state.get("withdrawable", 0) or 0),
            "unrealized_pnl": total_unrealized_pnl,
            "positions": positions,
            "position_count": len(positions),
            "timestamp": state.get("time", int(time.time() * 1000)),
        }

        await cache.set(cache_key, result, TTL_TRADER)
        return result

    async def get_positions(self, address: str) -> list[dict[str, Any]]:
        """Open positions for an address."""
        summary = await self.get_account_summary(address)
        return summary.get("positions", [])

    async def get_fills(
        self,
        address: str,
        start_time: int | None = None,
        end_time: int | None = None,
        limit: int = 200,
    ) -> list[dict[str, Any]]:
        """Trade fill history for an address."""
        if start_time is None:
            start_time = int((time.time() - 30 * 86_400) * 1000)  # 30d default

        cache_key = f"trader:{address}:fills:{start_time}"
        cached = await cache.get(cache_key, TTL_TRADER_FILLS)
        if cached is not None:
            return cached

        raw = await hl_client.user_fills_by_time(
            user=address,
            start_time=start_time,
            end_time=end_time,
        )
        if not raw:
            return []

        fills = []
        for item in raw[:limit]:
            try:
                fills.append({
                    "time": item.get("time", 0),
                    "coin": item.get("coin", ""),
                    "side": "buy" if item.get("side") == "B" else "sell",
                    "size": float(item.get("sz", 0) or 0),
                    "price": float(item.get("px", 0) or 0),
                    "notional": float(item.get("sz", 0) or 0) * float(item.get("px", 0) or 0),
                    "fee": float(item.get("fee", 0) or 0),
                    "fee_token": item.get("feeToken", "USDC"),
                    "closed_pnl": float(item.get("closedPnl", 0) or 0),
                    "direction": item.get("dir", ""),
                    "is_maker": not item.get("crossed", True),
                    "hash": item.get("hash", ""),
                    "oid": item.get("oid", 0),
                })
            except (TypeError, ValueError):
                continue

        await cache.set(cache_key, fills, TTL_TRADER_FILLS)
        return fills

    async def get_funding_history(
        self,
        address: str,
        start_time: int | None = None,
        end_time: int | None = None,
    ) -> list[dict[str, Any]]:
        """Funding payment history for an address."""
        if start_time is None:
            start_time = int((time.time() - 30 * 86_400) * 1000)

        cache_key = f"trader:{address}:funding:{start_time}"
        cached = await cache.get(cache_key, TTL_PROTOCOL)
        if cached is not None:
            return cached

        raw = await hl_client.user_funding(
            user=address,
            start_time=start_time,
            end_time=end_time,
        )
        if not raw:
            return []

        history = []
        for item in raw:
            delta = item.get("delta", {})
            try:
                history.append({
                    "time": item.get("time", 0),
                    "coin": delta.get("coin", ""),
                    "usdc": float(delta.get("usdc", 0) or 0),
                    "size": float(delta.get("szi", 0) or 0),
                    "funding_rate": float(delta.get("fundingRate", 0) or 0),
                })
            except (TypeError, ValueError):
                continue

        await cache.set(cache_key, history, TTL_PROTOCOL)
        return history

    async def get_pnl_chart(self, address: str) -> dict[str, Any]:
        """
        PnL over time from HL portfolio endpoint.
        Returns account value history and PnL history.
        """
        cache_key = f"trader:{address}:pnl"
        cached = await cache.get(cache_key, TTL_PROTOCOL)
        if cached is not None:
            return cached

        portfolio = await hl_client.portfolio(user=address)
        if not portfolio:
            return {"account_value_history": [], "pnl_history": []}

        result: dict[str, Any] = {
            "account_value_history": [],
            "pnl_history": [],
        }

        # Portfolio structure varies — handle both list and dict
        if isinstance(portfolio, list):
            for entry in portfolio:
                if isinstance(entry, list) and len(entry) == 2:
                    # [date_str, value] format
                    result["pnl_history"].append({
                        "date": entry[0],
                        "value": float(entry[1]) if entry[1] else 0.0,
                    })
        elif isinstance(portfolio, dict):
            av_hist = portfolio.get("accountValueHistory", [])
            pnl_hist = portfolio.get("pnlHistory", [])
            for entry in av_hist:
                if isinstance(entry, list) and len(entry) == 2:
                    result["account_value_history"].append({
                        "date": entry[0],
                        "value": float(entry[1]) if entry[1] else 0.0,
                    })
            for entry in pnl_hist:
                if isinstance(entry, list) and len(entry) == 2:
                    result["pnl_history"].append({
                        "date": entry[0],
                        "value": float(entry[1]) if entry[1] else 0.0,
                    })

        await cache.set(cache_key, result, TTL_PROTOCOL)
        return result

    async def get_open_orders(self, address: str) -> list[dict[str, Any]]:
        """Open orders with TP/SL metadata for an address."""
        cache_key = f"trader:{address}:orders"
        cached = await cache.get(cache_key, TTL_TRADER)
        if cached is not None:
            return cached

        raw = await hl_client.frontend_open_orders(user=address)
        if not raw:
            return []

        orders = []
        for item in raw:
            try:
                orders.append({
                    "coin": item.get("coin", ""),
                    "side": "buy" if item.get("side") == "B" else "sell",
                    "price": float(item.get("limitPx", 0) or 0),
                    "size": float(item.get("sz", 0) or 0),
                    "orig_size": float(item.get("origSz", 0) or 0),
                    "oid": item.get("oid", 0),
                    "timestamp": item.get("timestamp", 0),
                    "order_type": item.get("orderType", ""),
                    "is_trigger": item.get("isTrigger", False),
                    "reduce_only": item.get("reduceOnly", False),
                    "tif": item.get("tif", ""),
                    "trigger_px": float(item.get("triggerPx", 0) or 0) if item.get("triggerPx") else None,
                    "trigger_condition": item.get("triggerCondition", ""),
                    "children": item.get("children", []),
                })
            except (TypeError, ValueError):
                continue

        await cache.set(cache_key, orders, TTL_TRADER)
        return orders

    async def get_sub_accounts(self, address: str) -> list[dict[str, Any]]:
        """Sub-accounts with balances for an address."""
        raw = await hl_client.sub_accounts2(user=address)
        if not raw:
            return []
        return raw if isinstance(raw, list) else []

    async def get_leaderboard(
        self,
        sort_by: str = "account_value",
        limit: int = 100,
    ) -> list[dict[str, Any]]:
        """
        Top traders leaderboard.
        Fetches account state for all monitored addresses and ranks them.
        """
        cache_key = f"leaderboard:{sort_by}"
        cached = await cache.get(cache_key, TTL_MARKET)
        if cached is not None:
            return cached[:limit]

        # Fetch state for all monitored addresses concurrently
        addresses = list(self._monitored_addresses)[:200]  # cap at 200

        states = await asyncio.gather(
            *[hl_client.clearinghouse_state(addr) for addr in addresses],
            return_exceptions=True,
        )

        leaderboard = []
        for addr, state in zip(addresses, states):
            if isinstance(state, Exception) or not state:
                continue
            try:
                cross = state.get("crossMarginSummary", {})
                acv = float(cross.get("accountValue", 0) or 0)
                upnl = sum(
                    float(p.get("position", p).get("unrealizedPnl", 0) or 0)
                    for p in state.get("assetPositions", [])
                )
                leaderboard.append({
                    "address": addr,
                    "account_value": acv,
                    "unrealized_pnl": upnl,
                    "total_margin_used": float(cross.get("totalMarginUsed", 0) or 0),
                    "withdrawable": float(state.get("withdrawable", 0) or 0),
                    "position_count": len(state.get("assetPositions", [])),
                })
            except (TypeError, ValueError):
                continue

        # Sort
        sort_keys = {
            "account_value": lambda x: x["account_value"],
            "unrealized_pnl": lambda x: x["unrealized_pnl"],
        }
        sort_fn = sort_keys.get(sort_by, sort_keys["account_value"])
        leaderboard.sort(key=sort_fn, reverse=True)

        # Add ranks
        for i, entry in enumerate(leaderboard, start=1):
            entry["rank"] = i

        await cache.set(cache_key, leaderboard, TTL_MARKET)
        return leaderboard[:limit]

    async def get_account_distribution(self) -> dict[str, Any]:
        """
        Account size distribution histogram.
        Buckets: <$10K, $10K-$100K, $100K-$1M, $1M-$10M, >$10M
        """
        leaderboard = await self.get_leaderboard(limit=500)

        buckets = {
            "under_10k": 0,
            "10k_to_100k": 0,
            "100k_to_1m": 0,
            "1m_to_10m": 0,
            "over_10m": 0,
        }

        for entry in leaderboard:
            val = entry["account_value"]
            if val < 10_000:
                buckets["under_10k"] += 1
            elif val < 100_000:
                buckets["10k_to_100k"] += 1
            elif val < 1_000_000:
                buckets["100k_to_1m"] += 1
            elif val < 10_000_000:
                buckets["1m_to_10m"] += 1
            else:
                buckets["over_10m"] += 1

        return {
            "buckets": buckets,
            "total_addresses": len(leaderboard),
        }


trader_service = TraderService()
