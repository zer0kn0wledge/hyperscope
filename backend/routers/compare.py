"""
Compare Router
GET /api/compare/dex/snapshot
GET /api/compare/dex/volume-history
GET /api/compare/dex/oi-history
GET /api/compare/dex/funding-rates
GET /api/compare/cex/snapshot
GET /api/compare/cex/oi-history
GET /api/compare/cex/volume-history
GET /api/compare/cex/funding-history
GET /api/compare/cex/liquidations
GET /api/compare/cex/long-short
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Query

from services.comparison_service import comparison_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/compare", tags=["compare"])


# ── DEX Comparison ────────────────────────────────────────────────────────

@router.get("/dex/snapshot", summary="DEX comparison snapshot")
async def get_dex_snapshot() -> dict[str, Any]:
    """
    Current metrics for all tracked DEXes: Hyperliquid, Paradex, Lighter, Aster, GRVT, Variational, EdgeX, Extended.
    Returns: volume_24h, open_interest, pairs_count, btc_funding_rate per exchange.
    Sorted by volume descending with rank.
    """
    return await comparison_service.get_dex_snapshot()


@router.get("/dex/volume-history", summary="Historical volume per DEX")
async def get_dex_volume_history(
    symbol: str = Query(default="BTC", description="Asset symbol"),
    exchange: str = Query(default="Hyperliquid", description="Exchange name"),
    interval: str = Query(default="1d", description="Interval (1h, 4h, 1d)"),
    limit: int = Query(default=90, le=500),
) -> list[dict[str, Any]]:
    """
    Historical volume time series for a specific DEX.
    Returns [{time, buy_volume, sell_volume, total_volume}]
    Data from CoinGlass taker buy/sell volume endpoint.
    """
    return await comparison_service.get_volume_history(
        symbol=symbol.upper(),
        exchange=exchange,
        interval=interval,
        limit=limit,
    )


@router.get("/dex/oi-history", summary="Historical OI per DEX")
async def get_dex_oi_history(
    symbol: str = Query(default="BTC"),
    exchange: str = Query(default="Hyperliquid"),
    interval: str = Query(default="1h"),
    limit: int = Query(default=200, le=500),
) -> list[dict[str, Any]]:
    """
    Historical open interest for a DEX from CoinGlass.
    Returns [{time, oi_usd}]
    """
    return await comparison_service.get_dex_oi_history(
        symbol=symbol.upper(),
        exchange=exchange,
        interval=interval,
        limit=limit,
    )


@router.get("/dex/funding-rates", summary="Funding rates across DEXes")
async def get_dex_funding_rates(
    symbol: str = Query(default="BTC", description="Asset symbol"),
) -> dict[str, Any]:
    """
    Current funding rates for an asset across all tracked exchanges.
    Includes annualized percentage for fair comparison.
    Data from CoinGlass fundingRate/exchange-list endpoint.
    """
    return await comparison_service.get_dex_funding_rates(symbol=symbol.upper())


# ── CEX Comparison ────────────────────────────────────────────────────────

@router.get("/cex/snapshot", summary="CEX comparison snapshot")
async def get_cex_snapshot() -> dict[str, Any]:
    """
    Current metrics for HL + Binance + Bybit + OKX.
    Returns total volume, OI, BTC funding rate, and market share per exchange.
    """
    return await comparison_service.get_cex_comparison_snapshot()


@router.get("/cex/oi-history", summary="Historical OI comparison (HL vs CEXes)")
async def get_cex_oi_history(
    symbol: str = Query(default="BTC"),
    interval: str = Query(default="1h"),
    limit: int = Query(default=200, le=500),
) -> dict[str, Any]:
    """
    Historical open interest for HL, Binance, Bybit, OKX.
    Returns {binance: [...], bybit: [...], okx: [...], hyperliquid: [...]}
    Each series: [{time, oi_usd}]
    """
    return await comparison_service.get_cex_oi_history(
        symbol=symbol.upper(),
        interval=interval,
        limit=limit,
    )


@router.get("/cex/volume-history", summary="Historical volume comparison")
async def get_cex_volume_history(
    symbol: str = Query(default="BTC"),
    exchange: str = Query(default="Binance"),
    interval: str = Query(default="1d"),
    limit: int = Query(default=90, le=500),
) -> list[dict[str, Any]]:
    """
    Historical volume for a specific CEX from CoinGlass.
    Use /cex/snapshot for current totals.
    """
    return await comparison_service.get_volume_history(
        symbol=symbol.upper(),
        exchange=exchange,
        interval=interval,
        limit=limit,
    )


@router.get("/cex/funding-history", summary="Funding rate history comparison")
async def get_cex_funding_history(
    symbol: str = Query(default="BTC"),
    limit: int = Query(default=200, le=500),
) -> dict[str, Any]:
    """
    Funding rate history for HL, Binance, Bybit, OKX.
    Returns {hyperliquid: [...], binance: [...], bybit: [...], okx: [...]}
    Each series: [{time, rate, interval_hours}]
    Normalize with: annual_rate = rate * (365 * 24 / interval_hours)
    """
    return await comparison_service.get_cex_funding_history(
        symbol=symbol.upper(),
        limit=limit,
    )


@router.get("/cex/liquidations", summary="Liquidation comparison across exchanges")
async def get_cex_liquidations(
    symbol: str = Query(default="BTC"),
) -> dict[str, Any]:
    """
    Liquidation comparison from CoinGlass.
    Returns per-exchange long/short liquidation USD amounts.
    """
    return await comparison_service.get_cex_liquidations(symbol=symbol.upper())


@router.get("/cex/long-short", summary="Long/short ratio comparison")
async def get_cex_long_short(
    symbol: str = Query(default="BTC"),
    period: str = Query(default="1h", description="Period (5min, 15min, 30min, 1h, 4h, 1d)"),
    limit: int = Query(default=200, le=500),
) -> dict[str, Any]:
    """
    Account-based long/short ratio history from Binance, Bybit, OKX.
    Note: DEXes (including HL) do not expose per-account L/S data.
    Returns {binance: [...], bybit: [...], okx: [...]}
    Each series: [{time, long_pct, short_pct, ratio}]
    """
    return await comparison_service.get_cex_long_short(
        symbol=symbol.upper(),
        period=period,
        limit=limit,
    )
