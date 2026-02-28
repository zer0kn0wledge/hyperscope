"""
Traders Router
GET /api/traders/leaderboard
GET /api/traders/distribution
GET /api/traders/{address}/summary
GET /api/traders/{address}/positions
GET /api/traders/{address}/fills
GET /api/traders/{address}/funding
GET /api/traders/{address}/pnl-chart
GET /api/traders/{address}/orders
"""

from __future__ import annotations

import logging
import re
import time
from typing import Any

from fastapi import APIRouter, HTTPException, Query

from services.trader_service import trader_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/traders", tags=["traders"])

_ADDRESS_RE = re.compile(r"^0x[0-9a-fA-F]{40}$")


def validate_address(address: str) -> str:
    """Validate and normalize an Ethereum address."""
    if not _ADDRESS_RE.match(address):
        raise HTTPException(
            status_code=422,
            detail=f"Invalid Ethereum address: {address!r}. Expected 0x followed by 40 hex chars.",
        )
    return address.lower()


@router.get("/leaderboard", summary="Top traders leaderboard")
async def get_leaderboard(
    sort_by: str = Query(
        default="account_value",
        enum=["account_value", "unrealized_pnl"],
        description="Sort metric",
    ),
    limit: int = Query(default=50, ge=1, le=200, description="Number of results"),
) -> list[dict[str, Any]]:
    """
    Top traders ranked by account value or unrealized PnL.
    Derived from monitoring a set of known whale addresses.
    """
    return await trader_service.get_leaderboard(sort_by=sort_by, limit=limit)


@router.get("/distribution", summary="Account size distribution")
async def get_distribution() -> dict[str, Any]:
    """
    Histogram of account sizes across monitored addresses.
    Buckets: <$10K, $10K-$100K, $100K-$1M, $1M-$10M, >$10M
    """
    return await trader_service.get_account_distribution()


@router.get("/{address}/summary", summary="Account summary for an address")
async def get_summary(address: str) -> dict[str, Any]:
    """
    Full account summary: account value, margins, unrealized PnL, positions.
    Data from Hyperliquid clearinghouseState endpoint.
    Also registers the address for future leaderboard monitoring.
    """
    addr = validate_address(address)
    trader_service.add_address(addr)
    result = await trader_service.get_account_summary(addr)
    if result.get("error"):
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.get("/{address}/positions", summary="Open positions for an address")
async def get_positions(address: str) -> list[dict[str, Any]]:
    """
    Open perpetual positions: coin, side, size, entry/mark/liq price, unrealized PnL, leverage.
    """
    addr = validate_address(address)
    return await trader_service.get_positions(addr)


@router.get("/{address}/fills", summary="Trade fill history for an address")
async def get_fills(
    address: str,
    start_time: int | None = Query(
        default=None,
        description="Start time in milliseconds (default: 30 days ago)",
    ),
    end_time: int | None = Query(default=None, description="End time in milliseconds"),
    limit: int = Query(default=200, ge=1, le=1000, description="Max results"),
) -> list[dict[str, Any]]:
    """
    Trade fill history: time, coin, side, size, price, fee, closedPnL, direction.
    Paginate using start_time / end_time.
    """
    addr = validate_address(address)
    return await trader_service.get_fills(
        address=addr,
        start_time=start_time,
        end_time=end_time,
        limit=limit,
    )


@router.get("/{address}/funding", summary="Funding payment history for an address")
async def get_funding(
    address: str,
    start_time: int | None = Query(
        default=None,
        description="Start time in milliseconds (default: 30 days ago)",
    ),
    end_time: int | None = Query(default=None, description="End time in milliseconds"),
) -> list[dict[str, Any]]:
    """
    Funding payments received/paid: time, coin, USDC amount, position size, funding rate.
    Positive USDC = received; negative = paid.
    """
    addr = validate_address(address)
    return await trader_service.get_funding_history(
        address=addr,
        start_time=start_time,
        end_time=end_time,
    )


@router.get("/{address}/pnl-chart", summary="PnL over time chart data")
async def get_pnl_chart(address: str) -> dict[str, Any]:
    """
    Cumulative PnL and account value over time.
    Returns {account_value_history: [{date, value}], pnl_history: [{date, value}]}
    Data from Hyperliquid portfolio endpoint.
    """
    addr = validate_address(address)
    return await trader_service.get_pnl_chart(addr)


@router.get("/{address}/orders", summary="Open orders for an address")
async def get_orders(address: str) -> list[dict[str, Any]]:
    """
    Active open orders with TP/SL metadata.
    Returns: coin, side, price, size, type, trigger details, timestamps.
    """
    addr = validate_address(address)
    return await trader_service.get_open_orders(addr)


@router.get("/{address}/sub-accounts", summary="Sub-accounts for an address")
async def get_sub_accounts(address: str) -> list[dict[str, Any]]:
    """
    Sub-accounts linked to this address with balances.
    """
    addr = validate_address(address)
    return await trader_service.get_sub_accounts(addr)
