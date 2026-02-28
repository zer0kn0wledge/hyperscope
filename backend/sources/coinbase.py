"""
Coinbase International Exchange (Derivatives) Public API Client

Base URL: https://international.coinbase.com
Docs: https://docs.cdp.coinbase.com/intl-exchange/docs/welcome

Note: This is Coinbase International (derivatives), NOT the spot API.
Currently reserved for future integration; snapshot returns placeholder data.
"""

from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)


class CoinbaseDerivsClient:
    """Thin wrapper for Coinbase International Exchange public endpoints."""

    async def get_snapshot(self) -> dict[str, Any]:
        """Return a placeholder snapshot (API key required for real data)."""
        return {
            "exchange": "coinbase",
            "oi": None,
            "volume_24h": None,
            "funding_rate": None,
            "num_pairs": None,
            "note": "Coinbase Intl requires API key auth — placeholder only",
        }


coinbase_deriv_client = CoinbaseDerivsClient()
