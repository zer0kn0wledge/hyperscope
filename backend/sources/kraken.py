"""
Kraken Futures Public API Client

Base URL: https://futures.kraken.com/derivatives/api/v3
Docs: https://docs.futures.kraken.com
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

logger = logging.getLogger(__name__)

BASE_URL = "https://futures.kraken.com/derivatives/api/v3"


class KrakenFuturesClient:
    """Public endpoints for Kraken Futures."""

    async def get_snapshot(self) -> dict[str, Any]:
        """Return aggregate OI, volume, and funding for Kraken Futures."""
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                r = await client.get(f"{BASE_URL}/tickers")
                r.raise_for_status()
                tickers = r.json().get("tickers", [])

            # Filter perpetual contracts only
            perps = [t for t in tickers if t.get("tag") == "perpetual"]

            total_oi = sum(t.get("openInterest", 0) or 0 for t in perps)
            total_vol = sum(t.get("vol24h", 0) or 0 for t in perps)

            # Use BTC perpetual funding as representative
            btc = next((t for t in perps if "XBT" in t.get("symbol", "").upper()), None)
            funding_rate = btc.get("fundingRate") if btc else None

            return {
                "exchange": "kraken",
                "oi": total_oi,
                "volume_24h": total_vol,
                "funding_rate": funding_rate,
                "num_pairs": len(perps),
            }
        except Exception as exc:
            logger.warning("[kraken] snapshot failed: %s", exc)
            return {"exchange": "kraken", "oi": None, "volume_24h": None}

    async def get_history(self) -> list[dict]:
        """Placeholder — Kraken public API does not expose historical OI/vol."""
        return []


kraken_futures_client = KrakenFuturesClient()
