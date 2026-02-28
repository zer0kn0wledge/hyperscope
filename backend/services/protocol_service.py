"""
Protocol Service
Revenue metrics, AF, HLP vault performance, staking, HYPE token data.
"""

from __future__ import annotations

import asyncio
import logging
import time
from typing import Any

from config import settings
from services.cache import (
    TTL_FEES,
    TTL_HYPE,
    TTL_MARKET,
    TTL_PROTOCOL,
    TTL_STAKING,
    TTL_TVL,
    cache,
)
from sources.coingecko import coingecko_client
from sources.defillama import defillama_client
from sources.hyperliquid import hl_client

logger = logging.getLogger(__name__)

# Revenue split constants
AF_REVENUE_FRACTION = 0.97  # 97% to Assistance Fund
HLP_REVENUE_FRACTION = 0.03  # 3% to HLP


class ProtocolService:
    """Service for protocol health and revenue analytics."""

    async def get_fees(self) -> dict[str, Any]:
        """
        Daily/weekly/monthly/all-time fees from DeFiLlama.
        """
        cache_key = "protocol:fees"
        cached = await cache.get(cache_key, TTL_FEES)
        if cached is not None:
            return cached

        raw = await defillama_client.hyperliquid_fees()
        if not raw:
            return {
                "total_24h": 0.0,
                "total_7d": 0.0,
                "total_30d": 0.0,
                "total_all_time": 0.0,
                "daily_chart": [],
            }

        # Parse daily chart data
        daily_chart_raw = raw.get("totalDataChart", [])
        daily_chart = []
        total_30d = 0.0
        cutoff_30d = int(time.time()) - 30 * 86_400

        for entry in daily_chart_raw:
            if isinstance(entry, (list, tuple)) and len(entry) == 2:
                try:
                    ts = int(entry[0])
                    val = float(entry[1])
                    daily_chart.append({"date": ts, "fees": val})
                    if ts >= cutoff_30d:
                        total_30d += val
                except (TypeError, ValueError):
                    pass

        result = {
            "total_24h": float(raw.get("total24h", 0) or 0),
            "total_7d": float(raw.get("total7d", 0) or 0),
            "total_30d": total_30d,
            "total_all_time": float(raw.get("totalAllTime", 0) or 0),
            "daily_chart": daily_chart[-90:],  # last 90 days
        }

        await cache.set(cache_key, result, TTL_FEES)
        return result

    async def get_revenue(self) -> dict[str, Any]:
        """
        Revenue breakdown: AF (97%) vs HLP (3%).
        """
        fees = await self.get_fees()
        return {
            "total_24h": fees["total_24h"],
            "total_7d": fees["total_7d"],
            "total_30d": fees["total_30d"],
            "total_all_time": fees["total_all_time"],
            "af_share": {
                "fraction": AF_REVENUE_FRACTION,
                "revenue_24h": fees["total_24h"] * AF_REVENUE_FRACTION,
                "revenue_7d": fees["total_7d"] * AF_REVENUE_FRACTION,
                "revenue_all_time": fees["total_all_time"] * AF_REVENUE_FRACTION,
            },
            "hlp_share": {
                "fraction": HLP_REVENUE_FRACTION,
                "revenue_24h": fees["total_24h"] * HLP_REVENUE_FRACTION,
                "revenue_7d": fees["total_7d"] * HLP_REVENUE_FRACTION,
                "revenue_all_time": fees["total_all_time"] * HLP_REVENUE_FRACTION,
            },
        }

    async def get_af_state(self) -> dict[str, Any]:
        """
        Assistance Fund state: HYPE spot balance and recent buyback events.
        """
        cache_key = "protocol:af"
        cached = await cache.get(cache_key, TTL_PROTOCOL)
        if cached is not None:
            return cached

        af_address = settings.af_address
        start_time = int((time.time() - 30 * 86_400) * 1000)  # 30 days

        spot_state, ledger_updates = await asyncio.gather(
            hl_client.spot_clearinghouse_state(user=af_address),
            hl_client.user_non_funding_ledger_updates(
                user=af_address,
                start_time=start_time,
            ),
            return_exceptions=True,
        )

        # Extract HYPE balance
        hype_balance = 0.0
        usdc_balance = 0.0
        if isinstance(spot_state, dict):
            balances = spot_state.get("balances", [])
            for bal in balances:
                coin = bal.get("coin", "")
                total = float(bal.get("total", 0) or 0)
                if coin == "HYPE":
                    hype_balance = total
                elif coin in ("USDC", "USDC.e"):
                    usdc_balance += total

        # Parse buyback events from ledger
        buyback_events = []
        if isinstance(ledger_updates, list):
            for item in ledger_updates[:50]:
                delta = item.get("delta", {})
                if not delta:
                    continue
                try:
                    buyback_events.append({
                        "time": item.get("time", 0),
                        "type": delta.get("type", ""),
                        "amount": float(delta.get("usdc", delta.get("amount", 0)) or 0),
                        "coin": delta.get("coin", ""),
                    })
                except (TypeError, ValueError):
                    continue

        result = {
            "address": af_address,
            "hype_balance": hype_balance,
            "usdc_balance": usdc_balance,
            "recent_buybacks": buyback_events,
            "timestamp": int(time.time() * 1000),
        }

        await cache.set(cache_key, result, TTL_PROTOCOL)
        return result

    async def get_hlp_vault(self) -> dict[str, Any]:
        """
        HLP Vault performance: TVL, APR, PnL history, positions, depositor count.
        """
        cache_key = "protocol:hlp"
        cached = await cache.get(cache_key, TTL_PROTOCOL)
        if cached is not None:
            return cached

        hlp_address = settings.hlp_vault_address

        vault_data, positions_data = await asyncio.gather(
            hl_client.vault_details(vault_address=hlp_address),
            hl_client.clearinghouse_state(user=hlp_address),
            return_exceptions=True,
        )

        result: dict[str, Any] = {
            "address": hlp_address,
            "name": "HLP",
            "tvl": 0.0,
            "apr": 0.0,
            "total_volume": 0.0,
            "depositor_count": 0,
            "account_value_history": [],
            "pnl_history": [],
            "current_positions": [],
            "timestamp": int(time.time() * 1000),
        }

        if isinstance(vault_data, dict):
            result["name"] = vault_data.get("name", "HLP")
            result["apr"] = float(vault_data.get("apr", 0) or 0)
            result["total_volume"] = float(vault_data.get("vlm", 0) or 0)
            followers = vault_data.get("followers", [])
            result["depositor_count"] = len(followers)

            # TVL = sum of follower equity + leader equity
            total_equity = 0.0
            for follower in followers:
                try:
                    total_equity += float(follower.get("vaultEquity", 0) or 0)
                except (TypeError, ValueError):
                    pass
            result["tvl"] = total_equity

            # Account value history
            for entry in vault_data.get("accountValueHistory", []):
                if isinstance(entry, (list, tuple)) and len(entry) == 2:
                    try:
                        result["account_value_history"].append({
                            "date": entry[0],
                            "value": float(entry[1]) if entry[1] else 0.0,
                        })
                    except (TypeError, ValueError):
                        pass

            # PnL history
            for entry in vault_data.get("pnlHistory", []):
                if isinstance(entry, (list, tuple)) and len(entry) == 2:
                    try:
                        result["pnl_history"].append({
                            "date": entry[0],
                            "value": float(entry[1]) if entry[1] else 0.0,
                        })
                    except (TypeError, ValueError):
                        pass

        # Current positions
        if isinstance(positions_data, dict):
            for pos_wrapper in positions_data.get("assetPositions", []):
                pos = pos_wrapper.get("position", pos_wrapper)
                try:
                    szi = float(pos.get("szi", 0) or 0)
                    if szi == 0:
                        continue
                    result["current_positions"].append({
                        "coin": pos.get("coin", ""),
                        "side": "long" if szi > 0 else "short",
                        "size": abs(szi),
                        "entry_px": float(pos.get("entryPx", 0) or 0),
                        "unrealized_pnl": float(pos.get("unrealizedPnl", 0) or 0),
                        "position_value": float(pos.get("positionValue", 0) or 0),
                    })
                except (TypeError, ValueError):
                    continue

            cross = positions_data.get("crossMarginSummary", {})
            result["tvl"] = max(
                result["tvl"],
                float(cross.get("accountValue", 0) or 0),
            )

        await cache.set(cache_key, result, TTL_PROTOCOL)
        return result

    async def get_staking(self) -> dict[str, Any]:
        """
        Staking statistics: validator list, total staked, APR estimates.
        """
        cache_key = "protocol:staking"
        cached = await cache.get(cache_key, TTL_STAKING)
        if cached is not None:
            return cached

        validators_raw = await hl_client.validator_summaries()
        if not validators_raw:
            return {"validators": [], "total_staked": 0.0, "validator_count": 0}

        validators = []
        total_staked = 0.0

        for v in validators_raw:
            try:
                stake = float(v.get("stake", 0) or 0)
                total_staked += stake
                validators.append({
                    "validator": v.get("validator", ""),
                    "name": v.get("name", v.get("validator", "")[:10]),
                    "stake": stake,
                    "is_jailed": v.get("isJailed", False),
                    "commission": float(v.get("commission", 0) or 0),
                    "apr": float(v.get("apr", 0) or 0),
                    "n_delegators": int(v.get("nDelegators", 0) or 0),
                })
            except (TypeError, ValueError):
                continue

        # Sort by stake
        validators.sort(key=lambda x: x["stake"], reverse=True)

        # Add stake percentage
        for v in validators:
            v["stake_pct"] = round(v["stake"] / total_staked * 100, 2) if total_staked > 0 else 0

        # Estimate average APR
        avg_apr = 0.0
        if validators:
            valid_aprs = [v["apr"] for v in validators if v["apr"] > 0]
            if valid_aprs:
                avg_apr = sum(valid_aprs) / len(valid_aprs)

        result = {
            "validators": validators,
            "total_staked": total_staked,
            "validator_count": len(validators),
            "active_validator_count": sum(1 for v in validators if not v["is_jailed"]),
            "average_apr": avg_apr,
            "timestamp": int(time.time() * 1000),
        }

        await cache.set(cache_key, result, TTL_STAKING)
        return result

    async def get_hype_metrics(self) -> dict[str, Any]:
        """
        HYPE token metrics: price, market cap, FDV, volume, supply.
        Primary: CoinGecko; Fallback: HL spot markets.
        """
        cache_key = "protocol:hype"
        cached = await cache.get(cache_key, TTL_HYPE)
        if cached is not None:
            return cached

        # Try CoinGecko first
        gecko_data = await coingecko_client.hype_market_data()
        if gecko_data:
            result = {
                "price": float(gecko_data.get("current_price", 0) or 0),
                "price_change_24h": float(gecko_data.get("price_change_percentage_24h", 0) or 0),
                "price_change_7d": float(gecko_data.get("price_change_percentage_7d_in_currency", 0) or 0),
                "market_cap": float(gecko_data.get("market_cap", 0) or 0),
                "fully_diluted_valuation": float(gecko_data.get("fully_diluted_valuation", 0) or 0),
                "volume_24h": float(gecko_data.get("total_volume", 0) or 0),
                "circulating_supply": float(gecko_data.get("circulating_supply", 0) or 0),
                "total_supply": float(gecko_data.get("total_supply", 0) or 0),
                "source": "coingecko",
                "timestamp": int(time.time() * 1000),
            }
            await cache.set(cache_key, result, TTL_HYPE)
            return result

        # Fallback: HL spot markets
        spot_result = await hl_client.spot_meta_and_asset_ctxs()
        result = {
            "price": 0.0,
            "price_change_24h": 0.0,
            "market_cap": 0.0,
            "volume_24h": 0.0,
            "source": "hyperliquid",
            "timestamp": int(time.time() * 1000),
        }

        if isinstance(spot_result, list) and len(spot_result) == 2:
            spot_meta, spot_ctxs = spot_result
            universe = spot_meta.get("universe", [])
            for i, pair_info in enumerate(universe):
                if "HYPE" in pair_info.get("name", "") and i < len(spot_ctxs):
                    ctx = spot_ctxs[i]
                    if ctx:
                        mark_px = float(ctx.get("markPx", 0) or 0)
                        prev_px = float(ctx.get("prevDayPx", 0) or 0)
                        vol = float(ctx.get("dayNtlVlm", 0) or 0)
                        supply = float(ctx.get("circulatingSupply", 0) or 0)
                        result.update({
                            "price": mark_px,
                            "price_change_24h": (
                                (mark_px - prev_px) / prev_px * 100
                                if prev_px > 0 else 0.0
                            ),
                            "market_cap": mark_px * supply,
                            "circulating_supply": supply,
                            "volume_24h": vol,
                        })
                    break

        await cache.set(cache_key, result, TTL_HYPE)
        return result

    async def get_tvl(self) -> dict[str, Any]:
        """Protocol TVL from DeFiLlama."""
        cache_key = "protocol:tvl"
        cached = await cache.get(cache_key, TTL_TVL)
        if cached is not None:
            return cached

        protocol = await defillama_client.hyperliquid_protocol()
        tvl = await defillama_client.hyperliquid_tvl()

        result: dict[str, Any] = {
            "current_tvl": float(tvl) if isinstance(tvl, (int, float)) else 0.0,
            "tvl_prev_day": 0.0,
            "tvl_prev_week": 0.0,
            "tvl_prev_month": 0.0,
            "tvl_history": [],
            "timestamp": int(time.time() * 1000),
        }

        if isinstance(protocol, dict):
            result["tvl_prev_day"] = float(protocol.get("tvlPrevDay", 0) or 0)
            result["tvl_prev_week"] = float(protocol.get("tvlPrevWeek", 0) or 0)
            result["tvl_prev_month"] = float(protocol.get("tvlPrevMonth", 0) or 0)

            # TVL history from chainTvls
            chain_tvls = protocol.get("chainTvls", {})
            if chain_tvls:
                # Take the first chain's TVL series as overall proxy
                for chain_data in chain_tvls.values():
                    if isinstance(chain_data, dict):
                        tvl_series = chain_data.get("tvl", [])
                        for entry in tvl_series[-90:]:  # last 90 days
                            if isinstance(entry, dict):
                                result["tvl_history"].append({
                                    "date": entry.get("date", 0),
                                    "totalLiquidityUSD": float(entry.get("totalLiquidityUSD", 0) or 0),
                                })
                        break

        await cache.set(cache_key, result, TTL_TVL)
        return result


protocol_service = ProtocolService()
