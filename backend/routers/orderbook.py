"""
Orderbook Router
GET /api/orderbook/{pair}
GET /api/orderbook/{pair}/spread-history
GET /api/orderbook/{pair}/large-orders
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Query

from services.orderbook_service import orderbook_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/orderbook", tags=["orderbook"])


@router.get("/{pair}", summary="L2 orderbook snapshot")
async def get_orderbook(
    pair: str,
    depth: int = Query(default=20, ge=1, le=100, description="Number of price levels per side"),
) -> dict[str, Any]:
    """
    L2 orderbook snapshot for a trading pair.
    Returns normalized bids/asks with cumulative size, spread metrics, and depth stats.
    Data from Hyperliquid l2Book endpoint.
    """
    return await orderbook_service.get_l2_book(pair=pair.upper(), depth=depth)


@router.get("/{pair}/spread-history", summary="Bid-ask spread history")
async def get_spread_history(
    pair: str,
    window_hours: float = Query(default=1.0, ge=0.1, le=24.0, description="Time window in hours"),
) -> list[dict[str, Any]]:
    """
    Bid-ask spread history for a trading pair.
    Returns [{timestamp (ms), spread_bps, spread_usd, mid_price}] list.
    Computed from L2 book snapshots, stored in rolling memory buffer.
    """
    return await orderbook_service.get_spread_history(
        pair=pair.upper(),
        window_hours=window_hours,
    )


@router.get("/{pair}/large-orders", summary="Large limit orders")
async def get_large_orders(
    pair: str,
    exchange: str | None = Query(default=None, description="Filter by exchange"),
) -> list[dict[str, Any]]:
    """
    Large open limit orders from CoinGlass.
    Thresholds: BTC >= $1M, ETH >= $500K, others >= $50K.
    Returns exchange, side, price, size_usd, timestamp.
    """
    # Extract the base symbol from pair (e.g., "BTC-USD" -> "BTC")
    symbol = pair.upper().split("-")[0].split("/")[0]
    return await orderbook_service.get_large_orders(symbol=symbol, exchange=exchange)
