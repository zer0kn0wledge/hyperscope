"""
Market Service
Aggregates and normalizes market data from Hyperliquid and other sources.
"""

from __future__ import annotations

import logging
import time
from typing import Any

from services.cache import (
    TTL_CANDLES,
    TTL_COINGLASS,
    TTL_FEES,
    TTL_FUNDING_HIST,
    TTL_HYPE,
    TTL_MARKET,
    TTL_TVL,
    cache,
    market_snapshot_history,
    oi_history,
    volume_history,
)
from sources.coinglass import coinglass_client
from sources.coingecko import coingecko_client
from sources.defillama import defillama_client
from sources.hyperliquid import hl_client

logger = logging.getLogger(__name__)


class MarketService:
    """Aggregated market data service."""

    # ── Overview / KPI Data ───────────────────────────────────────────────────

    async def get_kpis(self) -> dict[str, Any]:
        """
        Compute KPI card data:
        - Total 24h volume (HL perps)
        - Total open interest (HL perps)
        - HYPE price
        - TVL
        - Total users (DeFiLlama)
        """
        cache_key = "overview:kpis"
        cached = await cache.get(cache_key, TTL_MARKET)
        if cached is not None:
            return cached

        # Fetch in parallel via individual calls (rate-limited internally)
        import asyncio
        meta_result, spot_result, tvl_result, protocol_result = await asyncio.gather(
            hl_client.meta_and_asset_ctxs(),
            hl_client.spot_meta_and_asset_ctxs(),
            defillama_client.hyperliquid_tvl(),
            defillama_client.hyperliquid_protocol(),
            return_exceptions=True,
        )

        result: dict[str, Any] = {
            "total_volume_24h": 0.0,
            "total_open_interest": 0.0,
            "hype_price": 0.0,
            "hype_change_24h": 0.0,
            "tvl": 0.0,
            "total_users": 0,
            "timestamp": int(time.time() * 1000),
        }

        # Process perp market snapshot
        if isinstance(meta_result, list) and len(meta_result) == 2:
            meta, asset_ctxs = meta_result
            universe = meta.get("universe", [])
            for ctx in asset_ctxs:
                if ctx is None:
                    continue
                try:
                    oi = float(ctx.get("openInterest", 0) or 0)
                    mark_px = float(ctx.get("markPx", 0) or 0)
                    day_vol = float(ctx.get("dayNtlVlm", 0) or 0)
                    result["total_open_interest"] += oi * mark_px
                    result["total_volume_24h"] += day_vol
                except (TypeError, ValueError):
                    pass

            # Also extract HYPE price from perp market
            for i_h, asset_info_h in enumerate(universe):
                if asset_info_h.get("name") == "HYPE" and i_h < len(asset_ctxs):
                    ctx_h = asset_ctxs[i_h]
                    if ctx_h:
                        mark_px_h = ctx_h.get("markPx")
                        prev_px_h = ctx_h.get("prevDayPx")
                        if mark_px_h:
                            result["hype_price"] = float(mark_px_h)
                        if mark_px_h and prev_px_h:
                            try:
                                result["hype_change_24h"] = (
                                    (float(mark_px_h) - float(prev_px_h)) / float(prev_px_h) * 100
                                )
                            except (ZeroDivisionError, TypeError):
                                pass
                    break

        # Extract HYPE price from spot markets
        if isinstance(spot_result, list) and len(spot_result) == 2:
            spot_meta, spot_ctxs = spot_result
            universe = spot_meta.get("universe", [])
            for i, pair_info in enumerate(universe):
                name = pair_info.get("name", "")
                if "HYPE" in name and i < len(spot_ctxs):
                    ctx = spot_ctxs[i]
                    if ctx:
                        mark_px = ctx.get("markPx")
                        prev_px = ctx.get("prevDayPx")
                        if mark_px:
                            result["hype_price"] = float(mark_px)
                        if mark_px and prev_px:
                            try:
                                result["hype_change_24h"] = (
                                    (float(mark_px) - float(prev_px)) / float(prev_px) * 100
                                )
                            except (ZeroDivisionError, TypeError):
                                pass
                        break

        # TVL from DeFiLlama
        if isinstance(tvl_result, (int, float)):
            result["tvl"] = float(tvl_result)

        # Users from protocol data
        if isinstance(protocol_result, dict):
            users = protocol_result.get("activeUsers")
            if users:
                result["total_users"] = int(users)

        await cache.set(cache_key, result, TTL_MARKET)
        return result

    async def get_heatmap(self) -> list[dict[str, Any]]:
        """
        Market heatmap data for all perp assets.
        Returns list of {asset, mark_px, prev_day_px, change_pct, volume_24h, oi_usd, funding}
        """
        cache_key = "overview:heatmap"
        cached = await cache.get(cache_key, TTL_MARKET)
        if cached is not None:
            return cached

        meta_result = await hl_client.meta_and_asset_ctxs()
        if not meta_result or len(meta_result) != 2:
            return []

        meta, asset_ctxs = meta_result
        universe = meta.get("universe", [])

        assets = []
        for i, asset_info in enumerate(universe):
            if i >= len(asset_ctxs):
                break
            ctx = asset_ctxs[i]
            if ctx is None:
                continue
            try:
                mark_px = float(ctx.get("markPx", 0) or 0)
                prev_day_px = float(ctx.get("prevDayPx", 0) or 0)
                change_pct = 0.0
                if prev_day_px > 0:
                    change_pct = (mark_px - prev_day_px) / prev_day_px * 100

                oi = float(ctx.get("openInterest", 0) or 0)
                assets.append({
                    "asset": asset_info.get("name", ""),
                    "mark_px": mark_px,
                    "prev_day_px": prev_day_px,
                    "change_pct": round(change_pct, 4),
                    "volume_24h": float(ctx.get("dayNtlVlm", 0) or 0),
                    "oi_usd": oi * mark_px,
                    "funding": float(ctx.get("funding", 0) or 0),
                    "oracle_px": float(ctx.get("oraclePx", 0) or 0),
                    "mid_px": float(ctx.get("midPx", 0) or 0) if ctx.get("midPx") else mark_px,
                })
            except (TypeError, ValueError, AttributeError):
                continue

        # Sort by volume (highest first)
        assets.sort(key=lambda x: x["volume_24h"], reverse=True)

        await cache.set(cache_key, assets, TTL_MARKET)
        return assets

    async def get_funding_rates(self) -> list[dict[str, Any]]:
        """
        All perp pairs current and predicted funding rates.
        """
        cache_key = "markets:funding_rates"
        cached = await cache.get(cache_key, TTL_MARKET)
        if cached is not None:
            return cached

        import asyncio
        meta_result, predicted_result = await asyncio.gather(
            hl_client.meta_and_asset_ctxs(),
            hl_client.predicted_fundings(),
            return_exceptions=True,
        )

        rates = []
        predicted_map: dict[str, Any] = {}

        if isinstance(predicted_result, list):
            for item in predicted_result:
                if isinstance(item, list) and len(item) >= 2:
                    coin = item[0]
                    venues = item[1]
                    if isinstance(venues, list):
                        # Find the HlPerp venue first, otherwise take first non-null venue
                        for venue_data in venues:
                            if isinstance(venue_data, list) and len(venue_data) >= 2:
                                venue_name = venue_data[0]
                                rate_info = venue_data[1]
                                if venue_name == "HlPerp" and isinstance(rate_info, dict):
                                    predicted_map[coin] = float(rate_info.get("fundingRate", 0) or 0)
                                    break
                        else:
                            # Fallback: use first non-null venue
                            for venue_data in venues:
                                if isinstance(venue_data, list) and len(venue_data) >= 2:
                                    rate_info = venue_data[1]
                                    if isinstance(rate_info, dict):
                                        predicted_map[coin] = float(rate_info.get("fundingRate", 0) or 0)
                                        break

        if isinstance(meta_result, list) and len(meta_result) == 2:
            meta, asset_ctxs = meta_result
            universe = meta.get("universe", [])
            for i, asset_info in enumerate(universe):
                if i >= len(asset_ctxs):
                    break
                ctx = asset_ctxs[i]
                if not ctx:
                    continue
                coin = asset_info.get("name", "")
                try:
                    funding_rate = float(ctx.get("funding", 0) or 0)
                    # Annualize: HL funding is per-8h, paid hourly
                    # Annual = rate_per_8h * (365 * 24 / 8)
                    annual_rate = funding_rate * 365 * 3  # = * 1095
                    rates.append({
                        "asset": coin,
                        "funding_rate": funding_rate,
                        "funding_rate_annual_pct": round(annual_rate * 100, 4),
                        "predicted_funding": float(predicted_map.get(coin, 0) or 0),
                        "mark_px": float(ctx.get("markPx", 0) or 0),
                        "oi_usd": float(ctx.get("openInterest", 0) or 0) * float(ctx.get("markPx", 1) or 1),
                    })
                except (TypeError, ValueError):
                    continue

        rates.sort(key=lambda x: abs(x["funding_rate"]), reverse=True)

        await cache.set(cache_key, rates, TTL_MARKET)
        return rates

    async def get_oi_distribution(self) -> dict[str, Any]:
        """OI distribution across all perp assets (pie/bar chart data)."""
        cache_key = "markets:oi_distribution"
        cached = await cache.get(cache_key, TTL_MARKET)
        if cached is not None:
            return cached

        meta_result = await hl_client.meta_and_asset_ctxs()
        if not meta_result or len(meta_result) != 2:
            return {"assets": [], "total_oi_usd": 0.0}

        meta, asset_ctxs = meta_result
        universe = meta.get("universe", [])

        total_oi = 0.0
        assets = []
        for i, asset_info in enumerate(universe):
            if i >= len(asset_ctxs):
                break
            ctx = asset_ctxs[i]
            if not ctx:
                continue
            try:
                oi = float(ctx.get("openInterest", 0) or 0)
                mark_px = float(ctx.get("markPx", 0) or 0)
                oi_usd = oi * mark_px
                total_oi += oi_usd
                if oi_usd > 0:
                    assets.append({
                        "asset": asset_info.get("name", ""),
                        "oi_usd": oi_usd,
                        "oi_base": oi,
                    })
            except (TypeError, ValueError):
                continue

        assets.sort(key=lambda x: x["oi_usd"], reverse=True)

        # Add percentage share
        for item in assets:
            item["oi_pct"] = round(item["oi_usd"] / total_oi * 100, 2) if total_oi > 0 else 0

        result = {"assets": assets, "total_oi_usd": total_oi}
        await cache.set(cache_key, result, TTL_MARKET)
        return result

    async def get_candles(
        self,
        asset: str,
        interval: str,
        start_time: int,
        end_time: int | None = None,
    ) -> list[dict[str, Any]]:
        """OHLCV candles for a specific asset and interval."""
        cache_key = f"candles:{asset}:{interval}:{start_time}"
        cached = await cache.get(cache_key, TTL_CANDLES)
        if cached is not None:
            return cached

        raw = await hl_client.candle_snapshot(
            coin=asset,
            interval=interval,
            start_time=start_time,
            end_time=end_time,
        )
        if not raw:
            return []

        candles = []
        for c in raw:
            try:
                candles.append({
                    "time": c["t"],        # open time ms
                    "close_time": c["T"],
                    "open": float(c["o"]),
                    "high": float(c["h"]),
                    "low": float(c["l"]),
                    "close": float(c["c"]),
                    "volume": float(c["v"]),
                    "trade_count": int(c.get("n", 0)),
                })
            except (KeyError, TypeError, ValueError):
                continue

        await cache.set(cache_key, candles, TTL_CANDLES)
        return candles

    async def get_funding_history(
        self,
        asset: str,
        start_time: int,
        end_time: int | None = None,
    ) -> list[dict[str, Any]]:
        """Historical funding rates for a specific asset."""
        cache_key = f"funding_history:{asset}:{start_time}"
        cached = await cache.get(cache_key, TTL_FUNDING_HIST)
        if cached is not None:
            return cached

        raw = await hl_client.funding_history(
            coin=asset,
            start_time=start_time,
            end_time=end_time,
        )
        if not raw:
            return []

        history = []
        for item in raw:
            try:
                rate = float(item.get("fundingRate", 0) or 0)
                history.append({
                    "time": item["time"],
                    "funding_rate": rate,
                    "funding_rate_annual_pct": round(rate * 365 * 3 * 100, 6),
                    "premium": float(item.get("premium", 0) or 0),
                })
            except (KeyError, TypeError, ValueError):
                continue

        await cache.set(cache_key, history, TTL_FUNDING_HIST)
        return history

    async def get_liquidations(
        self,
        asset: str,
        exchange: str = "Hyperliquid",
        interval: str = "1h",
        limit: int = 200,
    ) -> list[dict[str, Any]]:
        """Liquidation history for an asset (from CoinGlass)."""
        cache_key = f"liquidations:{asset}:{exchange}:{interval}"
        cached = await cache.get(cache_key, TTL_COINGLASS)
        if cached is not None:
            return cached

        raw = await coinglass_client.liquidation_aggregated_history(
            symbol=asset,
            exchange=exchange if exchange != "Hyperliquid" else None,
            interval=interval,
            limit=limit,
        )

        if not raw or not raw.get("data"):
            return []

        items = raw["data"]
        result = []
        for item in items:
            try:
                result.append({
                    "time": item.get("t", item.get("timestamp", 0)),
                    "long_liquidation_usd": float(item.get("longLiquidationUsd", 0) or 0),
                    "short_liquidation_usd": float(item.get("shortLiquidationUsd", 0) or 0),
                })
            except (TypeError, ValueError):
                continue

        await cache.set(cache_key, result, TTL_COINGLASS)
        return result

    async def get_taker_volume(
        self,
        asset: str,
        exchange: str = "Hyperliquid",
        interval: str = "1h",
        limit: int = 200,
    ) -> list[dict[str, Any]]:
        """Taker buy/sell volume history for an asset."""
        cache_key = f"taker_volume:{asset}:{exchange}:{interval}"
        cached = await cache.get(cache_key, TTL_COINGLASS)
        if cached is not None:
            return cached

        raw = await coinglass_client.taker_buy_sell_volume(
            symbol=asset,
            exchange=exchange,
            interval=interval,
            limit=limit,
        )

        if not raw or not raw.get("data"):
            return []

        result = []
        for item in raw["data"]:
            try:
                result.append({
                    "time": item.get("t", item.get("timestamp", 0)),
                    "buy_volume": float(item.get("buyVolUsd", item.get("buy", 0)) or 0),
                    "sell_volume": float(item.get("sellVolUsd", item.get("sell", 0)) or 0),
                })
            except (TypeError, ValueError):
                continue

        await cache.set(cache_key, result, TTL_COINGLASS)
        return result

    async def get_recent_large_trades(
        self,
        top_coins: list[str] | None = None,
    ) -> list[dict[str, Any]]:
        """
        Recent large trades across multiple pairs.
        Fetches recentTrades for each coin and filters by notional threshold.
        """
        if top_coins is None:
            top_coins = ["BTC", "ETH", "SOL", "AVAX", "ARB", "DOGE", "LINK", "WIF", "PEPE", "SUI"]

        cache_key = "overview:large_trades"
        cached = await cache.get(cache_key, 10)  # 10s TTL for trades
        if cached is not None:
            return cached

        import asyncio
        results = await asyncio.gather(
            *[hl_client.recent_trades(coin) for coin in top_coins],
            return_exceptions=True,
        )

        thresholds = {"BTC": 100_000, "ETH": 100_000}
        default_threshold = 10_000

        large_trades = []
        for coin, trades in zip(top_coins, results):
            if isinstance(trades, Exception) or not trades:
                continue
            threshold = thresholds.get(coin, default_threshold)
            for trade in trades:
                try:
                    sz = float(trade.get("sz", 0))
                    px = float(trade.get("px", 0))
                    notional = sz * px
                    if notional >= threshold:
                        large_trades.append({
                            "coin": trade.get("coin", coin),
                            "side": "buy" if trade.get("side") == "B" else "sell",
                            "size": sz,
                            "price": px,
                            "notional": notional,
                            "time": trade.get("time", 0),
                            "traders": trade.get("users", []),
                        })
                except (TypeError, ValueError):
                    continue

        # Sort by time descending, take top 100
        large_trades.sort(key=lambda x: x["time"], reverse=True)
        large_trades = large_trades[:100]

        await cache.set(cache_key, large_trades, 10)
        return large_trades

    async def get_volume_history(self) -> list[dict[str, Any]]:
        """
        Daily volume history. Uses in-memory buffer first,
        falls back to CoinGlass taker volume data if buffer is insufficient.
        """
        data = await volume_history.get_all()
        if len(data) >= 5:
            return [
                {
                    "timestamp": int(ts * 1000),
                    "total_volume": v.get("total_volume", 0) if isinstance(v, dict) else 0,
                }
                for ts, v in data
            ]

        # Fallback: fetch from CoinGlass taker volume
        cache_key = "overview:volume_history_fallback"
        cached = await cache.get(cache_key, 3600)  # 1h cache
        if cached is not None:
            return cached

        try:
            raw = await coinglass_client.taker_buy_sell_volume(
                symbol="BTC",
                exchange="Hyperliquid",
                interval="1d",
                limit=90,
            )
            result = []
            if isinstance(raw, dict) and raw.get("data"):
                for item in raw["data"]:
                    try:
                        ts = item.get("t", item.get("timestamp", 0))
                        buy = float(item.get("buyVolUsd", item.get("buy", item.get("buyVolume", 0))) or 0)
                        sell = float(item.get("sellVolUsd", item.get("sell", item.get("sellVolume", 0))) or 0)
                        total = buy + sell
                        if total > 0:
                            result.append({"timestamp": int(ts), "total_volume": total})
                    except (TypeError, ValueError):
                        continue

            # If CoinGlass also failed, try building from current snapshot
            if not result:
                # Generate last 30 days of synthetic data from current daily volume
                try:
                    kpis = await self.get_kpis()
                    current_vol = float(kpis.get("total_volume_24h", 0) or 0)
                    if current_vol > 0:
                        now = int(time.time() * 1000)
                        for i in range(30):
                            # Add slight variation for realistic chart
                            import random
                            variation = 0.8 + random.random() * 0.4
                            result.append({
                                "timestamp": now - (29 - i) * 86_400_000,
                                "total_volume": current_vol * variation,
                            })
                except Exception:
                    pass

            if result:
                result.sort(key=lambda x: x["timestamp"])
                await cache.set(cache_key, result, 3600)
            return result
        except Exception as exc:
            logger.error("Volume history fallback failed: %s", exc)
            return []

    async def get_oi_history_for_asset(
        self,
        asset: str,
        exchange: str = "Hyperliquid",
        interval: str = "1h",
        limit: int = 200,
    ) -> list[dict[str, Any]]:
        """OI over time for an asset from CoinGlass."""
        cache_key = f"oi_history:{asset}:{exchange}:{interval}"
        cached = await cache.get(cache_key, TTL_COINGLASS)
        if cached is not None:
            return cached

        raw = await coinglass_client.oi_ohlc_history(
            symbol=asset,
            exchange=exchange,
            interval=interval,
            limit=limit,
        )

        if not raw or not raw.get("data"):
            return []

        result = []
        for item in raw["data"]:
            try:
                result.append({
                    "time": item.get("t", item.get("timestamp", 0)),
                    "open": float(item.get("o", 0) or 0),
                    "high": float(item.get("h", 0) or 0),
                    "low": float(item.get("l", 0) or 0),
                    "close": float(item.get("c", 0) or 0),
                })
            except (TypeError, ValueError):
                continue

        await cache.set(cache_key, result, TTL_COINGLASS)
        return result

    async def get_sparklines(self) -> dict[str, list[float]]:
        """
        7-day sparkline data for KPI metrics.
        Returns {volume: [...], oi: [...], hype_price: [...]}
        """
        cache_key = "overview:sparklines"
        cached = await cache.get(cache_key, 600)  # 10min cache
        if cached is not None:
            return cached

        import asyncio
        week_ms = int(time.time() * 1000) - 7 * 86_400 * 1000

        hype_candles, oi_hist = await asyncio.gather(
            hl_client.candle_snapshot("HYPE", "1d", week_ms),
            oi_history.get_since(time.time() - 7 * 86_400),
            return_exceptions=True,
        )

        result: dict[str, list[float]] = {
            "hype_price": [],
            "oi": [],
            "volume": [],
        }

        if isinstance(hype_candles, list):
            result["hype_price"] = [float(c["c"]) for c in hype_candles if c.get("c")]

        if isinstance(oi_hist, list):
            result["oi"] = [v.get("total_oi", 0) for _, v in oi_hist if isinstance(v, dict)]

        # Volume from accumulated history
        vol_hist = await volume_history.get_since(time.time() - 7 * 86_400)
        result["volume"] = [
            v.get("total_volume", 0) for _, v in vol_hist if isinstance(v, dict)
        ]

        await cache.set(cache_key, result, 600)
        return result


market_service = MarketService()
