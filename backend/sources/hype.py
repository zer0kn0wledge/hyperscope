"""
HYPE Token Data Client
Provides HYPE-specific market data, supply, and staking information
by composing data from CoinGecko and Hyperliquid on-chain APIs.
"""

from __future__ import annotations

import logging
import time
from typing import Any

logger = logging.getLogger(__name__)


class HypeClient:
    """HYPE token data aggregator — no HTTP session of its own.

    Delegates to:
    - coingecko_client  → price, market cap, chart
    - hl_client         → on-chain staking, supply
    """

    async def get_price(self) -> dict[str, Any]:
        """Current HYPE token price and market data from CoinGecko."""
        from sources.coingecko import coingecko_client
        try:
            data = await coingecko_client.hype_market_data()
            if isinstance(data, list) and data:
                coin = data[0]
                return {
                    "price": coin.get("current_price", 0),
                    "market_cap": coin.get("market_cap", 0),
                    "total_volume": coin.get("total_volume", 0),
                    "price_change_24h": coin.get("price_change_24h", 0),
                    "price_change_percentage_24h": coin.get("price_change_percentage_24h", 0),
                    "circulating_supply": coin.get("circulating_supply", 0),
                    "total_supply": coin.get("total_supply", 0),
                    "ath": coin.get("ath", 0),
                    "ath_change_percentage": coin.get("ath_change_percentage", 0),
                    "last_updated": coin.get("last_updated", ""),
                }
            return {"price": 0, "error": "no data"}
        except Exception as exc:
            logger.warning("[hype] get_price failed: %s", exc)
            return {"price": 0, "error": str(exc)}

    async def get_chart(self) -> list[dict[str, Any]]:
        """HYPE token 30-day price history from CoinGecko."""
        from sources.coingecko import coingecko_client
        try:
            raw = await coingecko_client.coin_market_chart(
                coin_id="hyperliquid", vs_currency="usd", days=30,
            )
            if not isinstance(raw, dict):
                return []
            prices = raw.get("prices", [])
            return [
                {"time": int(p[0]), "price": float(p[1])}
                for p in prices
                if isinstance(p, (list, tuple)) and len(p) >= 2
            ]
        except Exception as exc:
            logger.warning("[hype] get_chart failed: %s", exc)
            return []

    async def get_circulating_supply(self) -> dict[str, Any]:
        """HYPE circulating supply from CoinGecko coin data."""
        from sources.coingecko import coingecko_client
        try:
            data = await coingecko_client.coin_data(
                coin_id="hyperliquid", localization=False,
                tickers=False, community_data=False, developer_data=False,
            )
            if not isinstance(data, dict):
                return {}
            md = data.get("market_data", {})
            return {
                "circulating_supply": md.get("circulating_supply", 0),
                "total_supply": md.get("total_supply", 0),
                "max_supply": md.get("max_supply"),
            }
        except Exception as exc:
            logger.warning("[hype] get_circulating_supply failed: %s", exc)
            return {}

    async def get_token_supply(self) -> dict[str, Any]:
        return await self.get_circulating_supply()

    async def get_staking_summary(self) -> dict[str, Any]:
        """HYPE staking summary from on-chain validator data."""
        from sources.hyperliquid import hl_client
        try:
            validators = await hl_client.validator_summaries()
            if not isinstance(validators, list):
                return {}
            total_staked = 0.0
            validator_count = 0
            avg_apr = 0.0
            for v in validators:
                if not isinstance(v, dict):
                    continue
                stake = float(v.get("stake", 0) or 0)
                total_staked += stake
                validator_count += 1
                apr = float(v.get("apr", 0) or 0)
                avg_apr += apr
            if validator_count > 0:
                avg_apr /= validator_count
            return {
                "total_staked": total_staked,
                "validator_count": validator_count,
                "avg_apr": avg_apr,
                "timestamp": int(time.time() * 1000),
            }
        except Exception as exc:
            logger.warning("[hype] get_staking_summary failed: %s", exc)
            return {}

    async def get_staking_chart(self) -> list[dict[str, Any]]:
        summary = await self.get_staking_summary()
        if summary and summary.get("total_staked", 0) > 0:
            return [{
                "time": summary.get("timestamp", int(time.time() * 1000)),
                "total_staked": summary["total_staked"],
                "validator_count": summary.get("validator_count", 0),
            }]
        return []

    async def get_token_holders(self, page: int = 1, page_size: int = 50) -> dict[str, Any]:
        return {
            "holders": [], "total": 0,
            "page": page, "page_size": page_size,
            "note": "Token holder data not available via public API",
        }


hype_client = HypeClient()
