"""
CoinGecko Derivatives Exchange Data
Uses Pro API for exchange list, detail, and tickers.
"""

from __future__ import annotations

import logging
import os
from typing import Any

import httpx

logger = logging.getLogger(__name__)

COINGECKO_API_KEY = os.getenv("COINGECKO_API_KEY", "")
BASE_URL = "https://pro-api.coingecko.com/api/v3"


class CoinGeckoDerivClient:
    """CoinGecko Derivatives Exchange endpoints."""

    def _headers(self) -> dict[str, str]:
        if COINGECKO_API_KEY:
            return {"x-cg-pro-api-key": COINGECKO_API_KEY}
        # Fall back to demo key (rate-limited)
        return {"x-cg-demo-api-key": COINGECKO_API_KEY}

    async def get_exchanges(self) -> list[dict[str, Any]]:
        """List derivative exchanges with OI and volume."""
        url = f"{BASE_URL}/derivatives/exchanges"
        params = {"order": "open_interest_btc_desc", "per_page": 20, "page": 1}
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                r = await client.get(url, headers=self._headers(), params=params)
                r.raise_for_status()
                return r.json()
        except Exception as exc:
            logger.warning("[coingecko] exchanges failed: %s", exc)
            return []

    async def get_exchange_detail(self, exchange_id: str) -> dict[str, Any]:
        """Detail for a single derivative exchange."""
        url = f"{BASE_URL}/derivatives/exchanges/{exchange_id}"
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                r = await client.get(url, headers=self._headers())
                r.raise_for_status()
                return r.json()
        except Exception as exc:
            logger.warning("[coingecko] exchange detail failed: %s", exc)
            return {}

    async def get_tickers(self, exchange_id: str) -> list[dict[str, Any]]:
        """Tickers for a single derivative exchange."""
        url = f"{BASE_URL}/derivatives/exchanges/{exchange_id}"
        params = {"include_tickers": "perpetual"}
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                r = await client.get(url, headers=self._headers(), params=params)
                r.raise_for_status()
                data = r.json()
                return data.get("tickers", [])
        except Exception as exc:
            logger.warning("[coingecko] tickers failed: %s", exc)
            return []


coingecko_deriv_client = CoinGeckoDerivClient()
