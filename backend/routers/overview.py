"""
Overview Router
GET /api/overview/kpis
GET /api/overview/heatmap
GET /api/overview/sparklines
GET /api/overview/recent-trades
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Query

from services.market_service import market_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/overview", tags=["overview"])


@router.get("/kpis", summary="Overview KPI cards")
async def get_kpis() -> dict[str, Any]:
    """
    Top-level KPI cards:
    - Total 24h volume (HL perps)
    - Total open interest (HL perps)
    - HYPE price + 24h change
    - TVL (DeFiLlama)
    - Total users (DeFiLlama)
    """
    return await market_service.get_kpis()


@router.get("/heatmap", summary="Market heatmap data")
async def get_heatmap() -> list[dict[str, Any]]:
    """
    All perp assets with price change %, volume, OI for heatmap grid.
    Sorted by volume descending.
    """
    return await market_service.get_heatmap()


@router.get("/sparklines", summary="7-day sparkline data for KPI metrics")
async def get_sparklines() -> dict[str, Any]:
    """
    7-day sparkline series for:
    - HYPE price (from candleSnapshot 1d)
    - Total OI (from accumulated snapshots)
    - Total volume (from accumulated snapshots)
    """
    return await market_service.get_sparklines()


@router.get("/recent-trades", summary="Recent large trades feed")
async def get_recent_trades(
    coins: str = Query(
        default="BTC,ETH,SOL,AVAX,ARB,DOGE,LINK,WIF,PEPE,SUI",
        description="Comma-separated list of coins to fetch trades for",
    ),
) -> list[dict[str, Any]]:
    """
    Large trades across top pairs, sorted by time (most recent first).
    Thresholds: BTC/ETH >= $500K, top-10 >= $100K, others >= $50K.
    """
    coin_list = [c.strip().upper() for c in coins.split(",") if c.strip()]
    return await market_service.get_recent_large_trades(top_coins=coin_list)
