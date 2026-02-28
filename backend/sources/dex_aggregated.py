"""
DEX Aggregated Source
Utility module that combines data from multiple DEX sources for comparison views.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

from sources.aster import aster_client
from sources.edgex import edgex_client
from sources.extended import extended_client
from sources.grvt import grvt_client
from sources.hyperliquid import hl_client
from sources.lighter import lighter_client
from sources.paradex import paradex_client
from sources.variational import variational_client

logger = logging.getLogger(__name__)


async def get_all_dex_snapshots() -> dict[str, dict[str, Any] | None]:
    """
    Fetch current market snapshots from all DEX sources in parallel.
    Returns dict mapping exchange name to raw snapshot data.
    """
    results = await asyncio.gather(
        hl_client.meta_and_asset_ctxs(),
        paradex_client.markets_summary(),
        lighter_client.exchange_stats(),
        aster_client.ticker_24hr(),
        grvt_client.ticker(),
        variational_client.stats(),
        edgex_client.ticker_list(),
        extended_client.all_markets(),
        return_exceptions=True,
    )

    exchanges = ["hyperliquid", "paradex", "lighter", "aster", "grvt", "variational", "edgex", "extended"]

    snapshots: dict[str, dict[str, Any] | None] = {}
    for name, result in zip(exchanges, results):
        if isinstance(result, Exception):
            logger.warning("[dex_agg] %s failed: %s", name, result)
            snapshots[name] = None
        else:
            snapshots[name] = result

    return snapshots
