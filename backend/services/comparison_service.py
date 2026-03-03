"""
Comparison Service
DEX vs DEX and DEX vs CEX comparison data aggregation.
"""

from __future__ import annotations

import asyncio
import logging
import time
from typing import Any

from services.cache import (
    TTL_CEX_HISTORY,
    TTL_CEX_SNAPSHOT,
    TTL_COINGLASS,
    TTL_COMPARE,
    cache,
    market_snapshot_history,
)
from sources.aster import aster_client
from sources.binance import binance_client
from sources.bybit import bybit_client
from sources.coingecko_derivatives import coingecko_deriv_client
from sources.coinglass import coinglass_client
from sources.coinbase import coinbase_deriv_client  # noqa: F401
from sources.edgex import edgex_client
from sources.extended import extended_client
from sources.grvt import grvt_client
from sources.hyperliquid import hl_client
from sources.kraken import kraken_futures_client
from sources.kucoin import kucoin_futures_client
from sources.lighter import lighter_client
from sources.okx import okx_client
from sources.paradex import paradex_client
from sources.variational import variational_client

logger = logging.getLogger(__name__)


class ComparisonService:
    """Service for cross-exchange comparison analytics."""

    async def get_binance_snapshot(self) -> dict[str, Any]:
        """Binance Futures current snapshot."""
        cache_key = "cex:snapshot:binance"
        cached = await cache.get(cache_key, TTL_CEX_SNAPSHOT)
        if cached is not None:
            return cached

        tickers, premium = await asyncio.gather(
            binance_client.ticker_24hr(),
            binance_client.premium_index(),
            return_exceptions=True,
        )

        total_volume_usd = 0.0
        total_oi_usd = 0.0
        btc_funding = 0.0
        btc_mark_price = 0.0

        if isinstance(tickers, list):
            for t in tickers:
                try:
                    total_volume_usd += float(t.get("quoteVolume", 0) or 0)
                except (TypeError, ValueError):
                    pass

        if isinstance(premium, list):
            for p in premium:
                sym = p.get("symbol", "")
                try:
                    if sym == "BTCUSDT":
                        btc_funding = float(p.get("lastFundingRate", 0) or 0)
                        btc_mark_price = float(p.get("markPrice", 0) or 0)
                except (TypeError, ValueError):
                    pass

        result = {
            "exchange": "binance",
            "total_volume_24h_usd": total_volume_usd,
            "total_oi_usd": total_oi_usd,
            "btc_funding_rate": btc_funding,
            "btc_mark_price": btc_mark_price,
            "timestamp": int(time.time() * 1000),
        }
        await cache.set(cache_key, result, TTL_CEX_SNAPSHOT)
        return result

    async def get_bybit_snapshot(self) -> dict[str, Any]:
        """Bybit current snapshot."""
        cache_key = "cex:snapshot:bybit"
        cached = await cache.get(cache_key, TTL_CEX_SNAPSHOT)
        if cached is not None:
            return cached

        tickers = await bybit_client.tickers(category="linear")

        total_volume_usd = 0.0
        total_oi_usd = 0.0
        btc_funding = 0.0
        btc_mark_price = 0.0

        if isinstance(tickers, list):
            for t in tickers:
                try:
                    total_volume_usd += float(t.get("turnover24h", 0) or 0)
                    total_oi_usd += float(t.get("openInterestValue", 0) or 0)
                    if t.get("symbol") == "BTCUSDT":
                        btc_funding = float(t.get("fundingRate", 0) or 0)
                        btc_mark_price = float(t.get("markPrice", 0) or 0)
                except (TypeError, ValueError):
                    pass

        result = {
            "exchange": "bybit",
            "total_volume_24h_usd": total_volume_usd,
            "total_oi_usd": total_oi_usd,
            "btc_funding_rate": btc_funding,
            "btc_mark_price": btc_mark_price,
            "timestamp": int(time.time() * 1000),
        }
        await cache.set(cache_key, result, TTL_CEX_SNAPSHOT)
        return result

    async def get_okx_snapshot(self) -> dict[str, Any]:
        """OKX current snapshot."""
        cache_key = "cex:snapshot:okx"
        cached = await cache.get(cache_key, TTL_CEX_SNAPSHOT)
        if cached is not None:
            return cached

        _tickers, btc_oi, btc_funding = await asyncio.gather(
            okx_client.tickers(inst_type="SWAP"),
            okx_client.open_interest(inst_type="SWAP", inst_id="BTC-USDT-SWAP"),
            okx_client.funding_rate(inst_id="BTC-USDT-SWAP"),
            return_exceptions=True,
        )
        platform_vol = await okx_client.platform_24_volume()

        total_volume_usd = 0.0
        total_oi_usd = 0.0
        btc_funding_rate = 0.0
        btc_mark_price = 0.0

        if isinstance(platform_vol, dict):
            total_volume_usd = float(platform_vol.get("totalVolume24H", 0) or 0)

        if isinstance(btc_oi, list) and btc_oi:
            try:
                total_oi_usd = float(btc_oi[0].get("oiUsd", 0) or 0)
            except (TypeError, ValueError, IndexError):
                pass

        if isinstance(btc_funding, dict):
            try:
                btc_funding_rate = float(btc_funding.get("fundingRate", 0) or 0)
            except (TypeError, ValueError):
                pass

        result = {
            "exchange": "okx",
            "total_volume_24h_usd": total_volume_usd,
            "total_oi_usd": total_oi_usd,
            "btc_funding_rate": btc_funding_rate,
            "btc_mark_price": btc_mark_price,
            "timestamp": int(time.time() * 1000),
        }
        await cache.set(cache_key, result, TTL_CEX_SNAPSHOT)
        return result

    async def get_hl_snapshot(self) -> dict[str, Any]:
        """Hyperliquid current snapshot."""
        cache_key = "cex:snapshot:hyperliquid"
        cached = await cache.get(cache_key, TTL_CEX_SNAPSHOT)
        if cached is not None:
            return cached

        meta_result = await hl_client.meta_and_asset_ctxs()
        total_volume_usd = 0.0
        total_oi_usd = 0.0
        btc_funding = 0.0
        btc_mark_price = 0.0

        if isinstance(meta_result, list) and len(meta_result) == 2:
            meta, asset_ctxs = meta_result
            universe = meta.get("universe", [])
            for i, asset_info in enumerate(universe):
                if i >= len(asset_ctxs):
                    break
                ctx = asset_ctxs[i]
                if not ctx:
                    continue
                try:
                    vol = float(ctx.get("dayNtlVlm", 0) or 0)
                    oi = float(ctx.get("openInterest", 0) or 0)
                    mark = float(ctx.get("markPx", 0) or 0)
                    total_volume_usd += vol
                    total_oi_usd += oi * mark
                    if asset_info.get("name") == "BTC":
                        btc_funding = float(ctx.get("funding", 0) or 0)
                        btc_mark_price = mark
                except (TypeError, ValueError):
                    pass

        result = {
            "exchange": "hyperliquid",
            "total_volume_24h_usd": total_volume_usd,
            "total_oi_usd": total_oi_usd,
            "btc_funding_rate": btc_funding,
            "btc_mark_price": btc_mark_price,
            "timestamp": int(time.time() * 1000),
        }
        await cache.set(cache_key, result, TTL_CEX_SNAPSHOT)
        return result

    async def get_cex_comparison_snapshot(self) -> dict[str, Any]:
        """CEX comparison snapshot using CoinGecko as the universal data source."""
        cache_key = "compare:cex:snapshot"
        cached = await cache.get(cache_key, TTL_COMPARE)
        if cached is not None:
            return cached

        CEX_EXCHANGE_MAP: dict[str, str] = {
            "binance_futures": "Binance",
            "bybit": "Bybit",
            "okex_swap": "OKX",
            "kraken_futures": "Kraken",
            "coinbase_international_derivatives": "Coinbase",
            "kumex": "KuCoin",
        }
        HL_CG_ID = "hyperliquid"

        cg_data, hl_meta_raw, btc_price, okx_funding, kraken_funding, kucoin_funding = (
            await asyncio.gather(
                coingecko_deriv_client.derivatives_exchanges(per_page=50),
                hl_client.meta_and_asset_ctxs(),
                coingecko_deriv_client.btc_price(),
                okx_client.funding_rate(inst_id="BTC-USDT-SWAP"),
                kraken_futures_client.btc_funding_rate(),
                kucoin_futures_client.btc_funding_rate(),
                return_exceptions=True,
            )
        )

        btc_usd = float(btc_price) if isinstance(btc_price, (int, float)) and btc_price else 0.0

        cg_by_id: dict[str, dict[str, Any]] = {}
        if isinstance(cg_data, list):
            for ex in cg_data:
                if isinstance(ex, dict) and ex.get("id"):
                    cg_by_id[ex["id"]] = ex

        cex_rows: list[dict[str, Any]] = []
        for cg_id, display_name in CEX_EXCHANGE_MAP.items():
            ex = cg_by_id.get(cg_id, {})
            oi_btc = float(ex.get("open_interest_btc", 0) or 0)
            vol_btc = float(ex.get("trade_volume_24h_btc", 0) or 0)
            oi_usd = oi_btc * btc_usd
            vol_usd = vol_btc * btc_usd
            num_pairs = int(ex.get("number_of_perpetual_pairs", 0) or 0)

            funding: float = 0.0
            if display_name == "OKX":
                if isinstance(okx_funding, dict):
                    try:
                        funding = float(okx_funding.get("fundingRate", 0) or 0)
                    except (TypeError, ValueError):
                        funding = 0.0
            elif display_name == "Kraken":
                funding = float(kraken_funding) if isinstance(kraken_funding, float) else 0.0
            elif display_name == "KuCoin":
                funding = float(kucoin_funding) if isinstance(kucoin_funding, float) else 0.0

            cex_rows.append({
                "exchange": display_name,
                "type": "cex",
                "total_volume_24h_usd": round(vol_usd, 2),
                "total_oi_usd": round(oi_usd, 2),
                "btc_funding_rate": funding,
                "perpetual_pairs": num_pairs,
                "data_source": "coingecko" if ex else "unavailable",
                "timestamp": int(time.time() * 1000),
            })

        hl_vol_usd = 0.0
        hl_oi_usd = 0.0
        hl_btc_funding = 0.0
        hl_btc_mark = 0.0
        hl_num_pairs = 0

        if isinstance(hl_meta_raw, list) and len(hl_meta_raw) == 2:
            meta, asset_ctxs = hl_meta_raw
            universe = meta.get("universe", [])
            hl_num_pairs = len(universe)
            for i, asset_info in enumerate(universe):
                if i >= len(asset_ctxs):
                    break
                ctx = asset_ctxs[i]
                if not ctx:
                    continue
                try:
                    vol = float(ctx.get("dayNtlVlm", 0) or 0)
                    oi_contracts = float(ctx.get("openInterest", 0) or 0)
                    mark = float(ctx.get("markPx", 0) or 0)
                    hl_vol_usd += vol
                    hl_oi_usd += oi_contracts * mark
                    if asset_info.get("name") == "BTC":
                        hl_btc_funding = float(ctx.get("funding", 0) or 0)
                        hl_btc_mark = mark
                except (TypeError, ValueError):
                    pass

        cg_hl = cg_by_id.get(HL_CG_ID, {})
        if hl_vol_usd == 0.0 and cg_hl:
            hl_vol_usd = float(cg_hl.get("trade_volume_24h_btc", 0) or 0) * btc_usd
            hl_oi_usd = float(cg_hl.get("open_interest_btc", 0) or 0) * btc_usd

        benchmark: dict[str, Any] = {
            "exchange": "Hyperliquid",
            "type": "dex",
            "total_volume_24h_usd": round(hl_vol_usd, 2),
            "total_oi_usd": round(hl_oi_usd, 2),
            "btc_funding_rate": hl_btc_funding,
            "btc_mark_price": hl_btc_mark,
            "perpetual_pairs": hl_num_pairs,
            "data_source": "hyperliquid_direct",
            "timestamp": int(time.time() * 1000),
        }

        all_entries = [benchmark] + cex_rows
        total_vol = sum(e.get("total_volume_24h_usd", 0) for e in all_entries)
        total_oi = sum(e.get("total_oi_usd", 0) for e in all_entries)

        for e in all_entries:
            e["volume_share_pct"] = round(
                e.get("total_volume_24h_usd", 0) / total_vol * 100 if total_vol > 0 else 0, 2
            )
            e["oi_share_pct"] = round(
                e.get("total_oi_usd", 0) / total_oi * 100 if total_oi > 0 else 0, 2
            )

        result = {
            "benchmark": benchmark,
            "exchanges": cex_rows,
            "total_volume_24h_usd": round(total_vol, 2),
            "total_oi_usd": round(total_oi, 2),
            "btc_price_usd": btc_usd,
            "timestamp": int(time.time() * 1000),
        }
        await cache.set(cache_key, result, TTL_COMPARE)
        return result

    async def get_cex_oi_history(self, symbol: str = "BTC", interval: str = "1h", limit: int = 200) -> dict[str, list[dict[str, Any]]]:
        """OI history for HL + Binance + Bybit + OKX."""
        cache_key = f"compare:cex:oi_history:{symbol}:{interval}"
        cached = await cache.get(cache_key, TTL_CEX_HISTORY)
        if cached is not None:
            return cached

        # Binance expects "BTCUSDT" — the existing code already builds binance_sym correctly.
        # However open_interest_hist period param must be one of the valid Binance intervals.
        # Map generic intervals to valid Binance period strings.
        BINANCE_PERIOD_MAP = {
            "5m": "5m", "15m": "15m", "30m": "30m",
            "1h": "1h", "2h": "2h", "4h": "4h", "6h": "6h",
            "12h": "12h", "1d": "1d",
        }
        # Bybit intervalTime valid values
        BYBIT_INTERVAL_MAP = {
            "5m": "5min", "15m": "15min", "30m": "30min",
            "1h": "1h", "4h": "4h", "1d": "1d",
        }
        # OKX period (uppercase)
        OKX_PERIOD_MAP = {
            "5m": "5M", "15m": "15M", "30m": "30M",
            "1h": "1H", "2h": "2H", "4h": "4H", "6h": "6H",
            "12h": "12H", "1d": "1D",
        }

        binance_sym = f"{symbol}USDT"
        okx_inst = f"{symbol}-USDT-SWAP"

        binance_period = BINANCE_PERIOD_MAP.get(interval, "1h")
        bybit_interval = BYBIT_INTERVAL_MAP.get(interval, "1h")
        okx_period = OKX_PERIOD_MAP.get(interval, "1H")

        binance_hist, bybit_hist, okx_hist = await asyncio.gather(
            binance_client.open_interest_hist(symbol=binance_sym, period=binance_period, limit=limit),
            bybit_client.open_interest(symbol=binance_sym, interval_time=bybit_interval, limit=limit),
            okx_client.open_interest_history(inst_id=okx_inst, period=okx_period, limit=limit),
            return_exceptions=True,
        )

        # Hyperliquid OI from market_snapshot_history ring buffer (since CoinGlass oi_ohlc_history 404s)
        hl_oi: list[dict[str, Any]] = []
        try:
            snapshots = await market_snapshot_history.get_all()
            for ts, snapshot in snapshots:
                if not isinstance(snapshot, dict):
                    continue
                universe = []
                asset_ctxs = []
                if isinstance(snapshot, list) and len(snapshot) == 2:
                    meta, asset_ctxs = snapshot
                    universe = meta.get("universe", [])
                elif isinstance(snapshot, dict):
                    universe = snapshot.get("universe", [])
                    asset_ctxs = snapshot.get("asset_ctxs", snapshot.get("contexts", []))
                total_oi = 0.0
                for i, asset_info in enumerate(universe):
                    if i >= len(asset_ctxs):
                        break
                    ctx = asset_ctxs[i] if asset_ctxs else {}
                    if not ctx:
                        continue
                    name = asset_info.get("name", "") if isinstance(asset_info, dict) else ""
                    if name != symbol:
                        continue
                    try:
                        oi_contracts = float(ctx.get("openInterest", 0) or 0)
                        mark = float(ctx.get("markPx", 0) or 0)
                        total_oi = oi_contracts * mark
                    except (TypeError, ValueError):
                        pass
                if total_oi > 0:
                    hl_oi.append({"time": int(ts * 1000), "oi_usd": total_oi})
        except Exception as exc:
            logger.warning("[comparison] Failed to read HL OI from snapshot history: %s", exc)
            # Fall back to CoinGlass (may 404 on Startup tier)
            try:
                raw = await coinglass_client.oi_ohlc_history(
                    symbol=symbol, exchange="Hyperliquid", interval=interval, limit=limit
                )
                if isinstance(raw, dict) and raw.get("data"):
                    for item in raw["data"]:
                        if isinstance(item, dict):
                            try:
                                hl_oi.append({"time": item.get("t", item.get("timestamp", 0)), "oi_usd": float(item.get("c", 0) or 0)})
                            except (TypeError, ValueError):
                                pass
            except Exception:
                pass

        def parse_binance_oi(data: Any) -> list[dict[str, Any]]:
            if not isinstance(data, list): return []
            return [{"time": int(d.get("timestamp", 0)), "oi_usd": float(d.get("sumOpenInterestValue", 0) or 0)} for d in data if isinstance(d, dict)]

        def parse_bybit_oi(data: Any) -> list[dict[str, Any]]:
            if not isinstance(data, list): return []
            return [{"time": int(d.get("timestamp", 0)), "oi_base": float(d.get("openInterest", 0) or 0)} for d in data if isinstance(d, dict)]

        def parse_okx_oi(data: Any) -> list[dict[str, Any]]:
            if not isinstance(data, list): return []
            result = []
            for entry in data:
                if isinstance(entry, (list, tuple)) and len(entry) >= 4:
                    try: result.append({"time": int(entry[0]), "oi_usd": float(entry[3] or 0)})
                    except (ValueError, TypeError): pass
            return result

        out = {
            "binance": parse_binance_oi(binance_hist),
            "bybit": parse_bybit_oi(bybit_hist),
            "okx": parse_okx_oi(okx_hist),
            "hyperliquid": hl_oi,
        }
        await cache.set(cache_key, out, TTL_CEX_HISTORY)
        return out

    async def get_cex_funding_history(self, symbol: str = "BTC", limit: int = 200) -> dict[str, list[dict[str, Any]]]:
        """Funding rate history comparison across HL, Binance, Bybit, OKX."""
        cache_key = f"compare:cex:funding:{symbol}"
        cached = await cache.get(cache_key, TTL_CEX_HISTORY)
        if cached is not None:
            return cached

        binance_sym = f"{symbol}USDT"
        okx_inst = f"{symbol}-USDT-SWAP"

        binance_f, bybit_f, okx_f, hl_f = await asyncio.gather(
            binance_client.funding_rate(symbol=binance_sym, limit=limit),
            bybit_client.funding_history(symbol=binance_sym, limit=limit),
            okx_client.funding_rate_history(inst_id=okx_inst, limit=limit),
            hl_client.funding_history(coin=symbol, start_time=int((time.time() - 90 * 86_400) * 1000)),
            return_exceptions=True,
        )

        def parse_binance_f(data: Any) -> list[dict[str, Any]]:
            if not isinstance(data, list): return []
            return [{"time": int(d.get("fundingTime", 0)), "rate": float(d.get("fundingRate", 0) or 0), "interval_hours": 8} for d in data if isinstance(d, dict)]

        def parse_bybit_f(data: Any) -> list[dict[str, Any]]:
            if not isinstance(data, list): return []
            return [{"time": int(d.get("fundingRateTimestamp", 0)), "rate": float(d.get("fundingRate", 0) or 0), "interval_hours": 8} for d in data if isinstance(d, dict)]

        def parse_okx_f(data: Any) -> list[dict[str, Any]]:
            if not isinstance(data, list): return []
            return [{"time": int(d.get("fundingTime", 0)), "rate": float(d.get("realizedRate", d.get("fundingRate", 0)) or 0), "interval_hours": 8} for d in data if isinstance(d, dict)]

        def parse_hl_f(data: Any) -> list[dict[str, Any]]:
            if not isinstance(data, list): return []
            return [{"time": int(d.get("time", 0)), "rate": float(d.get("fundingRate", 0) or 0), "interval_hours": 1} for d in data if isinstance(d, dict)]

        out = {"hyperliquid": parse_hl_f(hl_f), "binance": parse_binance_f(binance_f), "bybit": parse_bybit_f(bybit_f), "okx": parse_okx_f(okx_f)}
        await cache.set(cache_key, out, TTL_CEX_HISTORY)
        return out

    async def get_cex_long_short(self, symbol: str = "BTC", period: str = "1h", limit: int = 200) -> dict[str, list[dict[str, Any]]]:
        """L/S ratio history from Binance, Bybit, OKX."""
        cache_key = f"compare:cex:ls:{symbol}:{period}"
        cached = await cache.get(cache_key, TTL_CEX_HISTORY)
        if cached is not None:
            return cached

        binance_sym = f"{symbol}USDT"
        okx_inst = f"{symbol}-USDT-SWAP"

        # Valid Bybit period values
        BYBIT_PERIOD_MAP = {
            "5m": "5min", "5min": "5min",
            "15m": "15min", "15min": "15min",
            "30m": "30min", "30min": "30min",
            "1h": "1h",
            "4h": "4h",
            "1d": "1d",
        }
        bybit_period = BYBIT_PERIOD_MAP.get(period, "1h")

        # OKX period (uppercase)
        OKX_PERIOD_MAP = {
            "5m": "5M", "15m": "15M", "30m": "30M",
            "1h": "1H", "2h": "2H", "4h": "4H",
            "12h": "12H", "1d": "1D",
        }
        okx_period = OKX_PERIOD_MAP.get(period, "1H")

        # Binance global_long_short_ratio requires VALID period from their enum.
        # If CoinGlass global_long_short_ratio returns 400 on Startup tier, fall back
        # to Binance direct API (top trader long/short ratio).
        BINANCE_PERIOD_MAP = {
            "5m": "5m", "15m": "15m", "30m": "30m",
            "1h": "1h", "2h": "2h", "4h": "4h",
            "6h": "6h", "12h": "12h", "1d": "1d",
        }
        binance_period = BINANCE_PERIOD_MAP.get(period, "1h")

        # Try Binance top_long_short_account_ratio (direct API, always available)
        # as primary source; fall back to global_long_short_ratio
        binance_ls_top, bybit_ls, okx_ls = await asyncio.gather(
            binance_client.top_long_short_account_ratio(symbol=binance_sym, period=binance_period, limit=limit),
            bybit_client.account_ratio(symbol=binance_sym, period=bybit_period, limit=limit),
            okx_client.long_short_ratio(inst_id=okx_inst, period=okx_period, limit=limit),
            return_exceptions=True,
        )

        # If top_long_short_account_ratio fails, try global_long_short_ratio
        if not isinstance(binance_ls_top, list) or len(binance_ls_top) == 0:
            try:
                binance_ls_global = await binance_client.global_long_short_ratio(
                    symbol=binance_sym, period=binance_period, limit=limit
                )
                if isinstance(binance_ls_global, list) and len(binance_ls_global) > 0:
                    binance_ls_top = binance_ls_global
            except Exception as exc:
                logger.warning("[comparison] Binance global L/S fallback failed: %s", exc)

        def parse_binance_ls(data: Any) -> list[dict[str, Any]]:
            if not isinstance(data, list): return []
            result = []
            for d in data:
                if not isinstance(d, dict): continue
                try:
                    # top_long_short_account_ratio uses longAccount/shortAccount
                    # global_long_short_ratio also uses longAccount/shortAccount/longShortRatio
                    long_pct = float(d.get("longAccount", d.get("longPositionProportion", 0)) or 0)
                    short_pct = float(d.get("shortAccount", d.get("shortPositionProportion", 0)) or 0)
                    ratio = float(d.get("longShortRatio", 1.0) or 1.0)
                    ts = int(d.get("timestamp", 0))
                    result.append({"time": ts, "long_pct": long_pct, "short_pct": short_pct, "ratio": ratio})
                except (TypeError, ValueError):
                    pass
            return result

        def parse_bybit_ls(data: Any) -> list[dict[str, Any]]:
            if not isinstance(data, list): return []
            return [{"time": int(d.get("timestamp", 0)), "long_pct": float(d.get("buyRatio", 0) or 0), "short_pct": float(d.get("sellRatio", 0) or 0), "ratio": float(d.get("buyRatio", 0.5) or 0.5) / max(float(d.get("sellRatio", 0.5) or 0.5), 0.0001)} for d in data if isinstance(d, dict)]

        def parse_okx_ls(data: Any) -> list[dict[str, Any]]:
            if not isinstance(data, list): return []
            result = []
            for entry in data:
                if isinstance(entry, (list, tuple)) and len(entry) >= 2:
                    try:
                        ratio = float(entry[1])
                        result.append({"time": int(entry[0]), "ratio": ratio, "long_pct": ratio / (1 + ratio) if ratio > 0 else 0.5, "short_pct": 1 / (1 + ratio) if ratio > 0 else 0.5})
                    except (TypeError, ValueError): pass
            return result

        out = {"binance": parse_binance_ls(binance_ls_top), "bybit": parse_bybit_ls(bybit_ls), "okx": parse_okx_ls(okx_ls)}
        await cache.set(cache_key, out, TTL_CEX_HISTORY)
        return out

    async def get_cex_liquidations(self, symbol: str = "BTC") -> dict[str, Any]:
        """Liquidation comparison using CoinGlass V4 aggregated-history with exchange_list."""
        cache_key = f"compare:cex:liquidations:{symbol}"
        cached = await cache.get(cache_key, TTL_COINGLASS)
        if cached is not None:
            return cached

        # CoinGlass liquidation_exchange_list 404s on Startup tier.
        # Use liquidation_aggregated_history_v2 with exchange_list per exchange instead.
        EXCHANGE_LIST_MAP = {
            "Binance": "Binance",
            "Bybit": "Bybit",
            "OKX": "OKX",
            "Hyperliquid": "Hyperliquid",
        }

        result: dict[str, Any] = {"symbol": symbol, "exchanges": [], "timestamp": int(time.time() * 1000)}

        # Fetch aggregated history for each exchange with a recent short interval to get totals
        tasks = {
            exchange: coinglass_client.liquidation_aggregated_history_v2(
                symbol=symbol,
                exchange_list=cg_name,
                interval="h4",
                limit=6,  # last 24h in 4h buckets
            )
            for exchange, cg_name in EXCHANGE_LIST_MAP.items()
        }

        raw_results = await asyncio.gather(*tasks.values(), return_exceptions=True)

        for exchange_name, raw in zip(tasks.keys(), raw_results):
            if isinstance(raw, Exception) or raw is None:
                logger.debug("[comparison] Liq data unavailable for %s: %s", exchange_name, raw)
                continue
            long_liq = 0.0
            short_liq = 0.0
            try:
                data_items = raw.get("data", []) if isinstance(raw, dict) else []
                for item in data_items:
                    if isinstance(item, dict):
                        long_liq += float(item.get("longLiquidationUsd", item.get("buy_liquidation_usd", 0)) or 0)
                        short_liq += float(item.get("shortLiquidationUsd", item.get("sell_liquidation_usd", 0)) or 0)
            except (TypeError, ValueError, AttributeError) as exc:
                logger.debug("[comparison] Error parsing liq for %s: %s", exchange_name, exc)
                continue
            result["exchanges"].append({
                "exchange": exchange_name,
                "long_liq_usd": long_liq,
                "short_liq_usd": short_liq,
            })

        # If CoinGlass returned nothing at all, try the old endpoint as final fallback
        if not result["exchanges"]:
            try:
                raw_list = await coinglass_client.liquidation_exchange_list(symbol=symbol)
                if isinstance(raw_list, dict) and raw_list.get("data"):
                    for item in raw_list["data"]:
                        try:
                            result["exchanges"].append({
                                "exchange": item.get("exchange", ""),
                                "long_liq_usd": float(item.get("longLiquidationUsd", 0) or 0),
                                "short_liq_usd": float(item.get("shortLiquidationUsd", 0) or 0),
                            })
                        except (TypeError, ValueError):
                            pass
            except Exception as exc:
                logger.warning("[comparison] Liquidation exchange list fallback failed: %s", exc)

        await cache.set(cache_key, result, TTL_COINGLASS)
        return result

    async def get_dex_snapshot(self) -> dict[str, Any]:
        """Current metrics for all tracked DEXes."""
        cache_key = "compare:dex:snapshot"
        cached = await cache.get(cache_key, TTL_COMPARE)
        if cached is not None:
            return cached

        hl_raw, paradex_raw, lighter_raw, aster_raw, grvt_raw, variational_raw, edgex_raw, extended_raw = await asyncio.gather(
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

        exchanges = []

        if isinstance(hl_raw, list) and len(hl_raw) == 2:
            meta, ctxs = hl_raw
            total_vol = sum(float(c.get("dayNtlVlm", 0) or 0) for c in ctxs if c)
            total_oi = sum(float(c.get("openInterest", 0) or 0) * float(c.get("markPx", 0) or 0) for c in ctxs if c)
            btc_funding = next((float(ctxs[i].get("funding", 0) or 0) for i, a in enumerate(meta.get("universe", [])) if a.get("name") == "BTC" and i < len(ctxs)), 0.0)
            exchanges.append({"exchange": "Hyperliquid", "volume_24h": total_vol, "open_interest": total_oi, "pairs_count": len(meta.get("universe", [])), "btc_funding_rate": btc_funding, "source": "direct"})

        if isinstance(paradex_raw, dict):
            results = paradex_raw.get("results", paradex_raw.get("data", []))
            if not isinstance(results, list): results = []
            vol = sum(float(m.get("volume_24h", 0) or 0) for m in results if isinstance(m, dict))
            oi = sum(float(m.get("open_interest", 0) or 0) for m in results if isinstance(m, dict))
            btc_f = next((float(m.get("funding_rate", 0) or 0) for m in results if isinstance(m, dict) and "BTC" in m.get("market", "")), 0.0)
            exchanges.append({"exchange": "Paradex", "volume_24h": vol, "open_interest": oi, "pairs_count": len(results), "btc_funding_rate": btc_f, "source": "direct"})

        if isinstance(lighter_raw, dict):
            vol = float(lighter_raw.get("total24hVolume", lighter_raw.get("volume24h", 0)) or 0)
            oi = float(lighter_raw.get("totalOI", lighter_raw.get("openInterest", 0)) or 0)
            exchanges.append({"exchange": "Lighter", "volume_24h": vol, "open_interest": oi, "pairs_count": 0, "btc_funding_rate": 0.0, "source": "direct"})

        if isinstance(aster_raw, list):
            vol = sum(float(t.get("quoteVolume", 0) or 0) for t in aster_raw if isinstance(t, dict))
            exchanges.append({"exchange": "Aster", "volume_24h": vol, "open_interest": 0.0, "pairs_count": len(aster_raw), "btc_funding_rate": 0.0, "source": "direct"})

        if isinstance(grvt_raw, dict):
            ticker_list = grvt_raw.get("result", grvt_raw.get("tickers", []))
            if isinstance(ticker_list, list):
                vol = sum(float(t.get("volume_24h_b", t.get("buy_volume_24h_b", 0)) or 0) for t in ticker_list if isinstance(t, dict))
                oi = sum(float(t.get("open_interest", 0) or 0) for t in ticker_list if isinstance(t, dict))
                btc_f = next((float(t.get("funding_rate_8h_curr", 0) or 0) for t in ticker_list if isinstance(t, dict) and "BTC" in t.get("instrument", "")), 0.0)
                exchanges.append({"exchange": "GRVT", "volume_24h": vol, "open_interest": oi, "pairs_count": len(ticker_list), "btc_funding_rate": btc_f, "source": "direct"})

        if isinstance(variational_raw, dict):
            exchanges.append({"exchange": "Variational", "volume_24h": float(variational_raw.get("total_volume_24h", 0) or 0), "open_interest": float(variational_raw.get("open_interest", 0) or 0), "pairs_count": int(variational_raw.get("num_markets", 0)), "btc_funding_rate": next((float(l.get("funding_rate", 0) or 0) for l in variational_raw.get("listings", []) if l.get("ticker") == "BTC"), 0.0), "source": "direct"})

        if isinstance(edgex_raw, dict):
            ticker_list = edgex_raw.get("data", edgex_raw.get("list", []))
            if isinstance(ticker_list, list):
                vol = sum(float(t.get("volumeUsd24h", t.get("quoteVolume", 0)) or 0) for t in ticker_list if isinstance(t, dict))
                exchanges.append({"exchange": "EdgeX", "volume_24h": vol, "open_interest": 0.0, "pairs_count": len(ticker_list), "btc_funding_rate": 0.0, "source": "direct"})

        if isinstance(extended_raw, dict):
            markets = extended_raw.get("data", [])
            if isinstance(markets, list):
                vol = sum(float(m.get("dailyVolume", 0) or 0) for m in markets if isinstance(m, dict))
                oi = sum(float(m.get("openInterest", 0) or 0) for m in markets if isinstance(m, dict))
                exchanges.append({"exchange": "Extended", "volume_24h": vol, "open_interest": oi, "pairs_count": len(markets), "btc_funding_rate": 0.0, "source": "direct"})

        try:
            from sources.defillama import defillama_client
            DEFILLAMA_PERPS = {"dydx": "dYdX", "gmx": "GMX", "drift-protocol": "Drift", "aevo": "Aevo"}
            existing_names = {e["exchange"].lower() for e in exchanges}
            for slug, display_name in DEFILLAMA_PERPS.items():
                if display_name.lower() not in existing_names:
                    try:
                        protocol_data = await defillama_client.get(f"/protocol/{slug}")
                        if isinstance(protocol_data, dict):
                            vol_data = await defillama_client.get(f"/summary/derivatives/protocol/{slug}")
                            vol_24h = 0.0
                            if isinstance(vol_data, dict):
                                vol_24h = float(vol_data.get("total24h", 0) or 0)
                            exchanges.append({"exchange": display_name, "volume_24h": vol_24h, "open_interest": 0.0, "pairs_count": 0, "btc_funding_rate": 0.0, "source": "defillama"})
                    except Exception: pass
        except Exception: pass

        exchanges.sort(key=lambda x: x["volume_24h"], reverse=True)
        for i, ex in enumerate(exchanges, start=1):
            ex["rank"] = i

        result = {"exchanges": exchanges, "timestamp": int(time.time() * 1000)}
        await cache.set(cache_key, result, TTL_COMPARE)
        return result

    async def get_dex_oi_history(self, symbol: str = "BTC", exchange: str = "Hyperliquid", interval: str = "1h", limit: int = 200) -> list[dict[str, Any]]:
        """Historical OI for a DEX using market_snapshot_history ring buffer (primary) with CoinGlass fallback."""
        cache_key = f"compare:dex:oi:{exchange}:{symbol}:{interval}"
        cached = await cache.get(cache_key, TTL_COINGLASS)
        if cached is not None:
            return cached

        result: list[dict[str, Any]] = []

        # Primary: use market_snapshot_history ring buffer for Hyperliquid
        if exchange.lower() in ("hyperliquid", "hl"):
            try:
                snapshots = await market_snapshot_history.get_all()
                for ts, snapshot in snapshots:
                    # snapshot can be the raw list [meta, asset_ctxs] or a pre-processed dict
                    universe: list = []
                    asset_ctxs: list = []

                    if isinstance(snapshot, list) and len(snapshot) == 2:
                        meta, asset_ctxs = snapshot
                        universe = meta.get("universe", []) if isinstance(meta, dict) else []
                    elif isinstance(snapshot, dict):
                        universe = snapshot.get("universe", [])
                        asset_ctxs = snapshot.get("asset_ctxs", snapshot.get("contexts", []))

                    for i, asset_info in enumerate(universe):
                        if i >= len(asset_ctxs):
                            break
                        ctx = asset_ctxs[i] if asset_ctxs else {}
                        if not ctx:
                            continue
                        name = asset_info.get("name", "") if isinstance(asset_info, dict) else ""
                        if name != symbol:
                            continue
                        try:
                            oi_contracts = float(ctx.get("openInterest", 0) or 0)
                            mark = float(ctx.get("markPx", 0) or 0)
                            oi_usd = oi_contracts * mark
                            if oi_usd > 0:
                                result.append({"time": int(ts * 1000), "oi_usd": oi_usd})
                        except (TypeError, ValueError):
                            pass
            except Exception as exc:
                logger.warning("[comparison] HL OI from snapshot history failed: %s", exc)

        # Fallback to CoinGlass if no data from ring buffer (or non-HL exchange)
        if not result:
            try:
                raw = await coinglass_client.oi_ohlc_history(
                    symbol=symbol, exchange=exchange, interval=interval, limit=limit
                )
                if isinstance(raw, dict) and raw.get("data"):
                    for item in raw["data"]:
                        if isinstance(item, dict):
                            try:
                                result.append({
                                    "time": item.get("t", item.get("timestamp", 0)),
                                    "oi_usd": float(item.get("c", 0) or 0),
                                })
                            except (TypeError, ValueError):
                                pass
            except Exception as exc:
                logger.warning("[comparison] CoinGlass OI fallback failed for %s: %s", exchange, exc)

        await cache.set(cache_key, result, TTL_COINGLASS)
        return result

    async def get_dex_funding_rates(self, symbol: str = "BTC") -> dict[str, Any]:
        """Current funding rates for an asset across all tracked DEXes.

        Uses Hyperliquid metaAndAssetCtxs directly as the primary source,
        supplemented by CoinGlass funding_rate_exchange_list if available.
        """
        cache_key = f"compare:dex:funding:{symbol}"
        cached = await cache.get(cache_key, TTL_COMPARE)
        if cached is not None:
            return cached

        rates: list[dict[str, Any]] = []

        # Primary: fetch HL funding rate directly from metaAndAssetCtxs
        try:
            meta_result = await hl_client.meta_and_asset_ctxs()
            if isinstance(meta_result, list) and len(meta_result) == 2:
                meta, asset_ctxs = meta_result
                universe = meta.get("universe", [])
                for i, asset_info in enumerate(universe):
                    if i >= len(asset_ctxs):
                        break
                    if not isinstance(asset_info, dict):
                        continue
                    if asset_info.get("name") != symbol:
                        continue
                    ctx = asset_ctxs[i]
                    if not ctx:
                        continue
                    try:
                        rate = float(ctx.get("funding", 0) or 0)
                        # HL funding is per-hour; annualize: rate * 24 * 365
                        rates.append({
                            "exchange": "Hyperliquid",
                            "funding_rate": rate,
                            "funding_rate_annual_pct": round(rate * 24 * 365 * 100, 4),
                            "interval_hours": 1,
                        })
                    except (TypeError, ValueError):
                        pass
        except Exception as exc:
            logger.warning("[comparison] HL funding rate fetch failed: %s", exc)

        # Supplementary: try CoinGlass funding_rate_exchange_list for other DEX rates
        # (will 404 on Startup tier, but try anyway and silently skip if unavailable)
        try:
            cg_rates = await coinglass_client.funding_rate_exchange_list(symbol=symbol)
            if isinstance(cg_rates, dict) and cg_rates.get("data"):
                existing_exchanges = {r["exchange"].lower() for r in rates}
                for item in cg_rates["data"]:
                    if not isinstance(item, dict):
                        continue
                    ex_name = item.get("exchange", "")
                    if not ex_name or ex_name.lower() in existing_exchanges:
                        continue
                    try:
                        rate = float(item.get("fundingRate", 0) or 0)
                        rates.append({
                            "exchange": ex_name,
                            "funding_rate": rate,
                            "funding_rate_annual_pct": round(rate * 365 * 3 * 100, 4),
                            "interval_hours": 8,
                        })
                    except (TypeError, ValueError):
                        pass
        except Exception as exc:
            logger.debug("[comparison] CoinGlass funding_rate_exchange_list unavailable: %s", exc)

        result = {"symbol": symbol, "rates": rates, "timestamp": int(time.time() * 1000)}
        await cache.set(cache_key, result, TTL_COMPARE)
        return result

    async def get_volume_history(self, symbol: str = "BTC", exchange: str = "Hyperliquid", interval: str = "1d", limit: int = 90) -> list[dict[str, Any]]:
        """Historical volume for an exchange.

        For Hyperliquid/DEX: uses CoinGlass aggregated_taker_volume_v2 (V4 format with exchange_list).
        For CEX (Binance/OKX/Bybit): uses direct exchange API klines/taker volume endpoints.
        Falls back to the legacy CoinGlass taker_buy_sell_volume method.
        """
        cache_key = f"compare:vol:{exchange}:{symbol}:{interval}"
        cached = await cache.get(cache_key, TTL_COINGLASS)
        if cached is not None:
            return cached

        result: list[dict[str, Any]] = []
        exchange_lower = exchange.lower()

        # ── Hyperliquid / generic DEX ────────────────────────────────────────
        if exchange_lower in ("hyperliquid", "hl"):
            # Map caller interval to CoinGlass V4 h-prefixed format
            INTERVAL_MAP = {
                "1h": "h1", "4h": "h4", "8h": "h8", "12h": "h12",
                "1d": "h24", "24h": "h24",
                # Already h-prefixed — pass through
                "h1": "h1", "h4": "h4", "h8": "h8", "h12": "h12", "h24": "h24",
            }
            cg_interval = INTERVAL_MAP.get(interval, "h24")

            try:
                raw = await coinglass_client.aggregated_taker_volume_v2(
                    symbol=symbol,
                    exchange_list="Hyperliquid",
                    interval=cg_interval,
                    limit=limit,
                )
                if isinstance(raw, dict) and raw.get("data"):
                    for item in raw["data"]:
                        if isinstance(item, dict):
                            try:
                                buy = float(item.get("aggregated_buy_volume_usd", item.get("buyVolUsd", item.get("buy", 0))) or 0)
                                sell = float(item.get("aggregated_sell_volume_usd", item.get("sellVolUsd", item.get("sell", 0))) or 0)
                                result.append({
                                    "time": item.get("t", item.get("timestamp", 0)),
                                    "buy_volume": buy,
                                    "sell_volume": sell,
                                    "total_volume": buy + sell,
                                })
                            except (TypeError, ValueError):
                                pass
            except Exception as exc:
                logger.warning("[comparison] aggregated_taker_volume_v2 failed for HL: %s", exc)

        # ── Binance ──────────────────────────────────────────────────────────
        elif exchange_lower == "binance":
            binance_sym = f"{symbol}USDT"
            # Map interval to Binance klines format
            BINANCE_INTERVAL_MAP = {
                "1h": "1h", "4h": "4h", "8h": "8h", "12h": "12h",
                "1d": "1d", "24h": "1d",
            }
            kline_interval = BINANCE_INTERVAL_MAP.get(interval, "1d")
            try:
                klines = await binance_client.klines(symbol=binance_sym, interval=kline_interval, limit=limit)
                if isinstance(klines, list):
                    for k in klines:
                        if isinstance(k, (list, tuple)) and len(k) >= 10:
                            try:
                                # Binance kline: [open_time, open, high, low, close, volume, close_time,
                                #                 quote_asset_volume, num_trades, taker_buy_base, taker_buy_quote, ...]
                                open_time = int(k[0])
                                quote_vol = float(k[7] or 0)       # total quote asset volume
                                taker_buy_quote = float(k[10] or 0)  # taker buy quote volume
                                taker_sell_quote = quote_vol - taker_buy_quote
                                result.append({
                                    "time": open_time,
                                    "buy_volume": taker_buy_quote,
                                    "sell_volume": taker_sell_quote,
                                    "total_volume": quote_vol,
                                })
                            except (TypeError, ValueError, IndexError):
                                pass
            except Exception as exc:
                logger.warning("[comparison] Binance klines volume failed: %s", exc)

        # ── OKX ─────────────────────────────────────────────────────────────
        elif exchange_lower == "okx":
            okx_inst = f"{symbol}-USDT-SWAP"
            OKX_PERIOD_MAP = {
                "1h": "1H", "4h": "4H", "8h": "8H", "12h": "12H",
                "1d": "1D", "24h": "1D",
            }
            okx_period = OKX_PERIOD_MAP.get(interval, "1D")
            try:
                taker_vol = await okx_client.taker_volume(inst_id=okx_inst, period=okx_period, limit=limit)
                if isinstance(taker_vol, list):
                    for entry in taker_vol:
                        if isinstance(entry, (list, tuple)) and len(entry) >= 3:
                            try:
                                # OKX taker_volume: [ts, sell_vol, buy_vol]
                                ts = int(entry[0])
                                sell = float(entry[1] or 0)
                                buy = float(entry[2] or 0)
                                result.append({
                                    "time": ts,
                                    "buy_volume": buy,
                                    "sell_volume": sell,
                                    "total_volume": buy + sell,
                                })
                            except (TypeError, ValueError, IndexError):
                                pass
            except Exception as exc:
                logger.warning("[comparison] OKX taker volume failed: %s", exc)

        # ── Bybit ────────────────────────────────────────────────────────────
        elif exchange_lower == "bybit":
            bybit_sym = f"{symbol}USDT"
            # Bybit klines interval: "60" = 1h, "240" = 4h, "D" = 1d
            BYBIT_INTERVAL_MAP = {
                "1h": "60", "4h": "240", "8h": "480", "12h": "720",
                "1d": "D", "24h": "D",
            }
            bybit_interval = BYBIT_INTERVAL_MAP.get(interval, "D")
            try:
                klines = await bybit_client.klines(symbol=bybit_sym, interval=bybit_interval, limit=limit)
                if isinstance(klines, list):
                    for k in klines:
                        if isinstance(k, (list, tuple)) and len(k) >= 6:
                            try:
                                # Bybit kline: [startTime, open, high, low, close, volume, turnover]
                                ts = int(k[0])
                                turnover = float(k[6] if len(k) > 6 else 0 or 0)  # quote volume
                                # Bybit does not expose taker buy/sell split in klines; approximate 50/50
                                result.append({
                                    "time": ts,
                                    "buy_volume": turnover / 2,
                                    "sell_volume": turnover / 2,
                                    "total_volume": turnover,
                                })
                            except (TypeError, ValueError, IndexError):
                                pass
            except Exception as exc:
                logger.warning("[comparison] Bybit klines volume failed: %s", exc)

        # ── Generic fallback via CoinGlass aggregated_taker_volume_v2 ────────
        if not result:
            INTERVAL_MAP = {
                "1h": "h1", "4h": "h4", "8h": "h8", "12h": "h12",
                "1d": "h24", "24h": "h24",
                "h1": "h1", "h4": "h4", "h8": "h8", "h12": "h12", "h24": "h24",
            }
            cg_interval = INTERVAL_MAP.get(interval, "h24")
            try:
                raw = await coinglass_client.aggregated_taker_volume_v2(
                    symbol=symbol,
                    exchange_list=exchange,
                    interval=cg_interval,
                    limit=limit,
                )
                if isinstance(raw, dict) and raw.get("data"):
                    for item in raw["data"]:
                        if isinstance(item, dict):
                            try:
                                buy = float(item.get("aggregated_buy_volume_usd", item.get("buyVolUsd", item.get("buy", 0))) or 0)
                                sell = float(item.get("aggregated_sell_volume_usd", item.get("sellVolUsd", item.get("sell", 0))) or 0)
                                result.append({
                                    "time": item.get("t", item.get("timestamp", 0)),
                                    "buy_volume": buy,
                                    "sell_volume": sell,
                                    "total_volume": buy + sell,
                                })
                            except (TypeError, ValueError):
                                pass
            except Exception as exc:
                logger.debug("[comparison] CoinGlass aggregated_taker_volume_v2 fallback failed: %s", exc)

        # ── Last resort: legacy taker_buy_sell_volume (may 404 on Startup) ──
        if not result:
            try:
                raw = await coinglass_client.taker_buy_sell_volume(
                    symbol=symbol, exchange=exchange, interval=interval, limit=limit
                )
                if isinstance(raw, dict) and raw.get("data"):
                    for item in raw["data"]:
                        if isinstance(item, dict):
                            try:
                                buy = float(item.get("buyVolUsd", item.get("buy", 0)) or 0)
                                sell = float(item.get("sellVolUsd", item.get("sell", 0)) or 0)
                                result.append({
                                    "time": item.get("t", item.get("timestamp", 0)),
                                    "buy_volume": buy,
                                    "sell_volume": sell,
                                    "total_volume": buy + sell,
                                })
                            except (TypeError, ValueError):
                                pass
            except Exception as exc:
                logger.debug("[comparison] Legacy taker_buy_sell_volume fallback failed: %s", exc)

        await cache.set(cache_key, result, TTL_COINGLASS)
        return result


comparison_service = ComparisonService()
