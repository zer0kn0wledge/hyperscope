"""
Markets Router
GET /api/markets/funding-rates
GET /api/markets/oi-distribution
GET /api/markets/volume-history
GET /api/markets/{asset}/candles
GET /api/markets/{asset}/oi-history
GET /api/markets/{asset}/funding-history
GET /api/markets/{asset}/liquidations
GET /api/markets/{asset}/taker-volume
"""

from __future__ import annotations

import logging
import time
from typing import Any

from fastapi import APIRouter, Query

from services.market_service import market_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/markets", tags=["markets"])

VALID_INTERVALS = {
    "1m", "3m", "5m", "15m", "30m", "1h", "2h", "4h", "8h", "12h", "1d", "3d", "1w", "1M"
}


@router.get("/assets", summary="All perp assets with market data")
async def get_all_assets() -> list[dict[str, Any]]:
    """
    All perp assets with current market data (price, change, volume, OI, funding).
    Essentially the same as the heatmap but exposed under /markets for clarity.
    """
    return await market_service.get_heatmap()


@router.get("/funding-rates", summary="All perp pairs funding rates")
async def get_funding_rates() -> list[dict[str, Any]]:
    """
    Current and predicted funding rates for all perp pairs.
    Sorted by absolute funding rate (highest first).
    Includes annualized percentage for comparison.
    """
    return await market_service.get_funding_rates()


@router.get("/oi-distribution", summary="Open interest distribution")
async def get_oi_distribution() -> dict[str, Any]:
    """
    OI allocation across all perp assets for pie/bar charts.
    Returns assets sorted by OI with percentage share.
    """
    return await market_service.get_oi_distribution()


@router.get("/volume-history", summary="Daily volume history")
async def get_volume_history() -> list[dict[str, Any]]:
    """
    Daily volume history from accumulated time series.
    Returns [{timestamp, total_volume}] sorted chronologically.
    """
    return await market_service.get_volume_history()


@router.get("/{asset}/candles", summary="OHLCV candles for an asset")
async def get_candles(
    asset: str,
    interval: str = Query(default="1h", description="Candle interval (1m, 5m, 15m, 1h, 4h, 1d, etc.)"),
    start_time: int | None = Query(default=None, description="Start time in milliseconds"),
    end_time: int | None = Query(default=None, description="End time in milliseconds"),
) -> list[dict[str, Any]]:
    """
    Historical OHLCV candles for a specific asset.
    Defaults to last 200 candles at requested interval if start_time not provided.
    """
    if interval not in VALID_INTERVALS:
        interval = "1h"

    if start_time is None:
        # Default: last 200 candles
        interval_seconds = {
            "1m": 60, "3m": 180, "5m": 300, "15m": 900, "30m": 1800,
            "1h": 3600, "2h": 7200, "4h": 14400, "8h": 28800, "12h": 43200,
            "1d": 86400, "3d": 259200, "1w": 604800,
        }
        secs = interval_seconds.get(interval, 3600)
        start_time = int((time.time() - 200 * secs) * 1000)

    return await market_service.get_candles(
        asset=asset.upper(),
        interval=interval,
        start_time=start_time,
        end_time=end_time,
    )


@router.get("/{asset}/oi-history", summary="Open interest over time for an asset")
async def get_oi_history(
    asset: str,
    exchange: str = Query(default="Hyperliquid", description="Exchange name"),
    interval: str = Query(default="1h", description="Interval (1h, 4h, 1d)"),
    limit: int = Query(default=200, le=500, description="Number of data points"),
) -> list[dict[str, Any]]:
    """
    Historical open interest for a specific asset.
    Uses CoinGlass as data source for extended history.
    """
    return await market_service.get_oi_history_for_asset(
        asset=asset.upper(),
        exchange=exchange,
        interval=interval,
        limit=limit,
    )


@router.get("/{asset}/funding-history", summary="Funding rate history for an asset")
async def get_funding_history(
    asset: str,
    start_time: int | None = Query(default=None, description="Start time in milliseconds"),
    end_time: int | None = Query(default=None, description="End time in milliseconds"),
) -> list[dict[str, Any]]:
    """
    Historical funding rates from the Hyperliquid Info API.
    Defaults to last 90 days if start_time not specified.
    """
    if start_time is None:
        start_time = int((time.time() - 90 * 86_400) * 1000)

    return await market_service.get_funding_history(
        asset=asset.upper(),
        start_time=start_time,
        end_time=end_time,
    )


@router.get("/{asset}/liquidations", summary="Liquidation history for an asset")
async def get_liquidations(
    asset: str,
    exchange: str = Query(default="Hyperliquid", description="Exchange name"),
    interval: str = Query(default="1h", description="Bar interval"),
    limit: int = Query(default=200, le=500),
) -> list[dict[str, Any]]:
    """
    Historical long/short liquidations.
    Data from CoinGlass liquidation/aggregated-history endpoint.
    """
    return await market_service.get_liquidations(
        asset=asset.upper(),
        exchange=exchange,
        interval=interval,
        limit=limit,
    )


@router.get("/{asset}/taker-volume", summary="Taker buy/sell volume for an asset")
async def get_taker_volume(
    asset: str,
    exchange: str = Query(default="Hyperliquid", description="Exchange name"),
    interval: str = Query(default="1h", description="Bar interval"),
    limit: int = Query(default=200, le=500),
) -> list[dict[str, Any]]:
    """
    Taker buy vs. sell volume bars.
    Data from CoinGlass taker-buy-sell-volume endpoint.
    """
    return await market_service.get_taker_volume(
        asset=asset.upper(),
        exchange=exchange,
        interval=interval,
        limit=limit,
    )
