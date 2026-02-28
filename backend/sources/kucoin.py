"""
KuCoin Futures Public API Client

Base URL: https://api-futures.kucoin.com
Docs: https://www.kucoin.com/docs/derivatives/futures-trading/market-data
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

logger = logging.getLogger(__name__)

BASE_URL = "https://api-futures.kucoin.com"


class KuCoinFuturesClient:
    """Public endpoints for KuCoin Futures."""

    async def get_snapshot(self) -> dict[str, Any]:
        """Return aggregate OI and volume for KuCoin Futures."""
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                r = await client.get(f"{BASE_URL}/api/v1/contracts/active")
                r.raise_for_status()
                data = r.json()

            contracts = data.get("data", [])
            total_oi = sum(c.get("openInterest", 0) or 0 for c in contracts)
            total_vol = sum(c.get("volumeOf24h", 0) or 0 for c in contracts)

            # BTC representative funding
            btc = next(
                (c for c in contracts if c.get("baseCurrency") == "XBT" and c.get("isInverse")),
                next((c for c in contracts if "BTC" in c.get("symbol", "")), None),
            )
            funding_rate = btc.get("fundingFeeRate") if btc else None

            return {
                "exchange": "kucoin",
                "oi": total_oi,
                "volume_24h": total_vol,
                "funding_rate": funding_rate,
                "num_pairs": len(contracts),
            }
        except Exception as exc:
            logger.warning("[kucoin] snapshot failed: %s", exc)
            return {"exchange": "kucoin", "oi": None, "volume_24h": None}

    async def get_history(self) -> list[dict]:
        """Placeholder — KuCoin public API does not expose historical OI/vol."""
        return []


kucoin_futures_client = KuCoinFuturesClient()
