"""
Protocol Router
GET /api/protocol/fees
GET /api/protocol/revenue
GET /api/protocol/af
GET /api/protocol/hlp
GET /api/protocol/staking
GET /api/protocol/hype
GET /api/protocol/tvl
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter

from services.protocol_service import protocol_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/protocol", tags=["protocol"])


@router.get("/fees", summary="Protocol fee data")
async def get_fees() -> dict[str, Any]:
    """
    Daily, weekly, monthly, and all-time fee data from DeFiLlama.
    Includes last 90 days of daily fee chart data.
    """
    return await protocol_service.get_fees()


@router.get("/revenue", summary="Revenue breakdown")
async def get_revenue() -> dict[str, Any]:
    """
    Revenue split between Assistance Fund (97%) and HLP vault (3%).
    Includes dollar amounts for 24h, 7d, and all-time periods.
    """
    return await protocol_service.get_revenue()


@router.get("/af", summary="Assistance Fund state")
async def get_af_state() -> dict[str, Any]:
    """
    Assistance Fund analytics:
    - HYPE spot balance (before burning)
    - USDC balance
    - Recent buyback/ledger events (last 30 days)
    AF address: 0xfefefefefefefefefefefefefefefefefefefefe
    """
    return await protocol_service.get_af_state()


@router.get("/hlp", summary="HLP Vault performance")
async def get_hlp() -> dict[str, Any]:
    """
    Hyperliquid Liquidity Provider vault:
    - TVL (current + historical)
    - APR
    - Cumulative PnL history
    - Current positions
    - Depositor count
    HLP address: 0xdfc24b077bc1425ad1dea75bcb6f8158e10df303
    """
    return await protocol_service.get_hlp_vault()


@router.get("/staking", summary="HYPE staking statistics")
async def get_staking() -> dict[str, Any]:
    """
    HYPE staking stats:
    - Total HYPE staked
    - Validator list with stake amounts, APR, commission
    - Average staking APR
    """
    return await protocol_service.get_staking()


@router.get("/hype", summary="HYPE token metrics")
async def get_hype_metrics() -> dict[str, Any]:
    """
    HYPE token market data:
    - Price, 24h/7d change
    - Market cap, FDV
    - Circulating supply, total supply
    - 24h trading volume
    Primary: CoinGecko; Fallback: HL spot markets.
    """
    return await protocol_service.get_hype_metrics()


@router.get("/tvl", summary="Protocol TVL")
async def get_tvl() -> dict[str, Any]:
    """
    Total Value Locked (bridge TVL on Arbitrum + HL L1).
    Includes current TVL, 24h/7d/30d comparisons, and historical chart data.
    Source: DeFiLlama.
    """
    return await protocol_service.get_tvl()
