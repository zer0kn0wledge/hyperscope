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
)
from sources.aster import aster_client
from sources.binance import binance_client
from sources.bybit import bybit_client
from sources.coinglass import coinglass_client
from sources.edgex import edgex_client
from sources.extended import extended_client
from sources.grvt import grvt_client
from sources.hyperliquid import hl_client
from sources.lighter import lighter_client
from sources.okx import okx_client
from sources.paradex import paradex_client
from sources.variational import variational_client

logger = logging.getLogger(__name__)


class ComparisonService:
    """Service for cross-exchange comparison analytics."""

    # ── CEX Snapshots ────────────────────────────────────────────────────────

    async def get_binance_snapshot(self) -> dict[str, Any]:
        """Binance Futures current snapshot: total OI, volume, funding."""
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

        tickers, btc_oi, btc_funding = await asyncio.gather(
            okx_client.tickers(inst_type="SWAP"),
            okx_client.open_interest(inst_type="SWAP", inst_id="BTC-USDT-SWAP"),
            okx_client.funding_rate(inst_id="BTC-USDT-SWAP"),
            return_exceptions=True,
        )

        total_volume_usd = 0.0
        total_oi_usd = 0.0
        btc_funding_rate = 0.0
        btc_mark_price = 0.0

        if isinstance(tickers, list):
            for t in tickers:
                try:
                    # volCcy24h is quote currency volume (USD for linear)
                    total_volume_usd += float(t.get("volCcy24h", 0) or 0)
                except (TypeError, ValueError):
                    pass

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
        """
        All 4 exchanges (HL + Binance + Bybit + OKX) snapshot for comparison.
        """
        cache_key = "compare:cex:snapshot"
        cached = await cache.get(cache_key, TTL_COMPARE)
        if cached is not None:
            return cached

        results = await asyncio.gather(
            self.get_hl_snapshot(),
            self.get_binance_snapshot(),
            self.get_bybit_snapshot(),
            self.get_okx_snapshot(),
            return_exceptions=True,
        )

        exchanges = [
            r if not isinstance(r, Exception) else {"exchange": n, "error": str(r)}
            for r, n in zip(results, ["hyperliquid", "binance", "bybit", "okx"])
        ]

        # Compute market shares
        total_vol = sum(e.get("total_volume_24h_usd", 0) for e in exchanges if isinstance(e, dict))
        total_oi = sum(e.get("total_oi_usd", 0) for e in exchanges if isinstance(e, dict))

        for e in exchanges:
            if isinstance(e, dict):
                e["volume_share_pct"] = round(
                    e.get("total_volume_24h_usd", 0) / total_vol * 100 if total_vol > 0 else 0, 2
                )
                e["oi_share_pct"] = round(
                    e.get("total_oi_usd", 0) / total_oi * 100 if total_oi > 0 else 0, 2
                )

        result = {
            "exchanges": exchanges,
            "total_volume_24h_usd": total_vol,
            "total_oi_usd": total_oi,
            "timestamp": int(time.time() * 1000),
        }
        await cache.set(cache_key, result, TTL_COMPARE)
        return result

    async def get_cex_oi_history(
        self,
        symbol: str = "BTC",
        interval: str = "1h",
        limit: int = 200,
    ) -> dict[str, list[dict[str, Any]]]:
        """OI history for HL + Binance + Bybit + OKX."""
        cache_key = f"compare:cex:oi_history:{symbol}:{interval}"
        cached = await cache.get(cache_key, TTL_CEX_HISTORY)
        if cached is not None:
            return cached

        binance_sym = f"{symbol}USDT"
        okx_inst = f"{symbol}-USDT-SWAP"

        binance_hist, bybit_hist, okx_hist, hl_cg_hist = await asyncio.gather(
            binance_client.open_interest_hist(
                symbol=binance_sym,
                period=interval if interval in ("5m","15m","30m","1h","2h","4h","6h","12h","1d") else "1h",
                limit=limit,
            ),
            bybit_client.open_interest(
                symbol=binance_sym,
                interval_time=interval if interval in ("5min","15min","30min","1h","4h","1d") else "1h",
                limit=limit,
            ),
            okx_client.open_interest_history(
                inst_id=okx_inst,
                period=interval.upper() if interval != "1h" else "1H",
                limit=limit,
            ),
            coinglass_client.oi_ohlc_history(
                symbol=symbol,
                exchange="Hyperliquid",
                interval=interval,
                limit=limit,
            ),
            return_exceptions=True,
        )

        def parse_binance_oi(data: Any) -> list[dict[str, Any]]:
            if not isinstance(data, list):
                return []
            return [
                {
                    "time": int(d.get("timestamp", 0)),
                    "oi_usd": float(d.get("sumOpenInterestValue", 0) or 0),
                }
                for d in data if isinstance(d, dict)
            ]

        def parse_bybit_oi(data: Any) -> list[dict[str, Any]]:
            if not isinstance(data, list):
                return []
            return [
                {
                    "time": int(d.get("timestamp", 0)),
                    "oi_base": float(d.get("openInterest", 0) or 0),
                }
                for d in data if isinstance(d, dict)
            ]

        def parse_okx_oi(data: Any) -> list[dict[str, Any]]:
            if not isinstance(data, list):
                return []
            result = []
            for entry in data:
                if isinstance(entry, (list, tuple)) and len(entry) >= 4:
                    try:
                        result.append({
                            "time": int(entry[0]),
                            "oi_usd": float(entry[3] or 0),
                        })
                    except (ValueError, TypeError):
                        pass
            return result

        def parse_cg_oi(data: Any) -> list[dict[str, Any]]:
            if not isinstance(data, dict):
                return []
            items = data.get("data", [])
            result = []
            for item in items:
                if isinstance(item, dict):
                    try:
                        result.append({
                            "time": item.get("t", item.get("timestamp", 0)),
                            "oi_usd": float(item.get("c", 0) or 0),
                        })
                    except (TypeError, ValueError):
                        pass
            return result

        out = {
            "binance": parse_binance_oi(binance_hist),
            "bybit": parse_bybit_oi(bybit_hist),
            "okx": parse_okx_oi(okx_hist),
            "hyperliquid": parse_cg_oi(hl_cg_hist),
        }

        await cache.set(cache_key, out, TTL_CEX_HISTORY)
        return out

    async def get_cex_funding_history(
        self,
        symbol: str = "BTC",
        limit: int = 200,
    ) -> dict[str, list[dict[str, Any]]]:
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
            hl_client.funding_history(
                coin=symbol,
                start_time=int((time.time() - 90 * 86_400) * 1000),
            ),
            return_exceptions=True,
        )

        def parse_binance_f(data: Any) -> list[dict[str, Any]]:
            if not isinstance(data, list):
                return []
            return [
                {
                    "time": int(d.get("fundingTime", 0)),
                    "rate": float(d.get("fundingRate", 0) or 0),
                    "interval_hours": 8,
                }
                for d in data if isinstance(d, dict)
            ]

        def parse_bybit_f(data: Any) -> list[dict[str, Any]]:
            if not isinstance(data, list):
                return []
            return [
                {
                    "time": int(d.get("fundingRateTimestamp", 0)),
                    "rate": float(d.get("fundingRate", 0) or 0),
                    "interval_hours": 8,
                }
                for d in data if isinstance(d, dict)
            ]

        def parse_okx_f(data: Any) -> list[dict[str, Any]]:
            if not isinstance(data, list):
                return []
            return [
                {
                    "time": int(d.get("fundingTime", 0)),
                    "rate": float(d.get("realizedRate", d.get("fundingRate", 0)) or 0),
                    "interval_hours": 8,
                }
                for d in data if isinstance(d, dict)
            ]

        def parse_hl_f(data: Any) -> list[dict[str, Any]]:
            if not isinstance(data, list):
                return []
            return [
                {
                    "time": int(d.get("time", 0)),
                    "rate": float(d.get("fundingRate", 0) or 0),
                    "interval_hours": 1,  # HL settles hourly
                }
                for d in data if isinstance(d, dict)
            ]

        out = {
            "hyperliquid": parse_hl_f(hl_f),
            "binance": parse_binance_f(binance_f),
            "bybit": parse_bybit_f(bybit_f),
            "okx": parse_okx_f(okx_f),
        }
        await cache.set(cache_key, out, TTL_CEX_HISTORY)
        return out

    async def get_cex_long_short(
        self,
        symbol: str = "BTC",
        period: str = "1h",
        limit: int = 200,
    ) -> dict[str, list[dict[str, Any]]]:
        """L/S ratio history from Binance, Bybit, OKX (not available for DEXes)."""
        cache_key = f"compare:cex:ls:{symbol}:{period}"
        cached = await cache.get(cache_key, TTL_CEX_HISTORY)
        if cached is not None:
            return cached

        binance_sym = f"{symbol}USDT"
        okx_inst = f"{symbol}-USDT-SWAP"

        binance_ls, bybit_ls, okx_ls = await asyncio.gather(
            binance_client.global_long_short_ratio(symbol=binance_sym, period=period, limit=limit),
            bybit_client.account_ratio(symbol=binance_sym, period=period if period in ("5min","15min","30min","1h","4h","1d") else "1h", limit=limit),
            okx_client.long_short_ratio(inst_id=okx_inst, period=period.upper() if period != "1h" else "1H", limit=limit),
            return_exceptions=True,
        )

        def parse_binance_ls(data: Any) -> list[dict[str, Any]]:
            if not isinstance(data, list):
                return []
            return [
                {
                    "time": int(d.get("timestamp", 0)),
                    "long_pct": float(d.get("longAccount", 0) or 0),
                    "short_pct": float(d.get("shortAccount", 0) or 0),
                    "ratio": float(d.get("longShortRatio", 1) or 1),
                }
                for d in data if isinstance(d, dict)
            ]

        def parse_bybit_ls(data: Any) -> list[dict[str, Any]]:
            if not isinstance(data, list):
                return []
            return [
                {
                    "time": int(d.get("timestamp", 0)),
                    "long_pct": float(d.get("buyRatio", 0) or 0),
                    "short_pct": float(d.get("sellRatio", 0) or 0),
                    "ratio": float(d.get("buyRatio", 0.5) or 0.5) / max(float(d.get("sellRatio", 0.5) or 0.5), 0.0001),
                }
                for d in data if isinstance(d, dict)
            ]

        def parse_okx_ls(data: Any) -> list[dict[str, Any]]:
            if not isinstance(data, list):
                return []
            result = []
            for entry in data:
                if isinstance(entry, (list, tuple)) and len(entry) >= 2:
                    try:
                        ratio = float(entry[1])
                        result.append({
                            "time": int(entry[0]),
                            "ratio": ratio,
                            "long_pct": ratio / (1 + ratio) if ratio > 0 else 0.5,
                            "short_pct": 1 / (1 + ratio) if ratio > 0 else 0.5,
                        })
                    except (TypeError, ValueError):
                        pass
            return result

        out = {
            "binance": parse_binance_ls(binance_ls),
            "bybit": parse_bybit_ls(bybit_ls),
            "okx": parse_okx_ls(okx_ls),
        }
        await cache.set(cache_key, out, TTL_CEX_HISTORY)
        return out

    async def get_cex_liquidations(
        self,
        symbol: str = "BTC",
    ) -> dict[str, Any]:
        """Liquidation comparison from CoinGlass."""
        cache_key = f"compare:cex:liquidations:{symbol}"
        cached = await cache.get(cache_key, TTL_COINGLASS)
        if cached is not None:
            return cached

        raw = await coinglass_client.liquidation_exchange_list(symbol=symbol)

        result: dict[str, Any] = {
            "symbol": symbol,
            "exchanges": [],
            "timestamp": int(time.time() * 1000),
        }

        if isinstance(raw, dict) and raw.get("data"):
            for item in raw["data"]:
                try:
                    result["exchanges"].append({
                        "exchange": item.get("exchange", ""),
                        "long_liq_usd": float(item.get("longLiquidationUsd", 0) or 0),
                        "short_liq_usd": float(item.get("shortLiquidationUsd", 0) or 0),
                    })
                except (TypeError, ValueError):
                    pass

        await cache.set(cache_key, result, TTL_COINGLASS)
        return result

    # ── DEX Comparison ───────────────────────────────────────────────────────

    async def get_dex_snapshot(self) -> dict[str, Any]:
        """
        Current metrics for all tracked DEXes.
        """
        cache_key = "compare:dex:snapshot"
        cached = await cache.get(cache_key, TTL_COMPARE)
        if cached is not None:
            return cached

        # Gather all DEX data in parallel
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

        # Parse Hyperliquid
        if isinstance(hl_raw, list) and len(hl_raw) == 2:
            meta, ctxs = hl_raw
            total_vol = sum(float(c.get("dayNtlVlm", 0) or 0) for c in ctxs if c)
            total_oi = sum(
                float(c.get("openInterest", 0) or 0) * float(c.get("markPx", 0) or 0)
                for c in ctxs if c
            )
            btc_funding = next(
                (float(ctxs[i].get("funding", 0) or 0)
                 for i, a in enumerate(meta.get("universe", [])) if a.get("name") == "BTC" and i < len(ctxs)),
                0.0,
            )
            exchanges.append({
                "exchange": "Hyperliquid",
                "volume_24h": total_vol,
                "open_interest": total_oi,
                "pairs_count": len(meta.get("universe", [])),
                "btc_funding_rate": btc_funding,
                "source": "direct",
            })

        # Parse Paradex
        if isinstance(paradex_raw, dict):
            results = paradex_raw.get("results", paradex_raw.get("data", []))
            if not isinstance(results, list):
                results = []
            vol = sum(float(m.get("volume_24h", 0) or 0) for m in results if isinstance(m, dict))
            oi = sum(float(m.get("open_interest", 0) or 0) for m in results if isinstance(m, dict))
            btc_f = next(
                (float(m.get("funding_rate", 0) or 0)
                 for m in results if isinstance(m, dict) and "BTC" in m.get("market", "")),
                0.0,
            )
            exchanges.append({
                "exchange": "Paradex",
                "volume_24h": vol,
                "open_interest": oi,
                "pairs_count": len(results),
                "btc_funding_rate": btc_f,
                "source": "direct",
            })

        # Parse Lighter
        if isinstance(lighter_raw, dict):
            vol = float(lighter_raw.get("total24hVolume", lighter_raw.get("volume24h", 0)) or 0)
            oi = float(lighter_raw.get("totalOI", lighter_raw.get("openInterest", 0)) or 0)
            exchanges.append({
                "exchange": "Lighter",
                "volume_24h": vol,
                "open_interest": oi,
                "pairs_count": 0,
                "btc_funding_rate": 0.0,
                "source": "direct",
            })

        # Parse Aster
        if isinstance(aster_raw, list):
            vol = sum(float(t.get("quoteVolume", 0) or 0) for t in aster_raw if isinstance(t, dict))
            exchanges.append({
                "exchange": "Aster",
                "volume_24h": vol,
                "open_interest": 0.0,
                "pairs_count": len(aster_raw),
                "btc_funding_rate": 0.0,
                "source": "direct",
            })

        # Parse GRVT
        if isinstance(grvt_raw, dict):
            ticker_list = grvt_raw.get("result", grvt_raw.get("tickers", []))
            if isinstance(ticker_list, list):
                vol = sum(float(t.get("volume_24h_b", t.get("buy_volume_24h_b", 0)) or 0) for t in ticker_list if isinstance(t, dict))
                oi = sum(float(t.get("open_interest", 0) or 0) for t in ticker_list if isinstance(t, dict))
                btc_f = next(
                    (float(t.get("funding_rate_8h_curr", 0) or 0)
                     for t in ticker_list if isinstance(t, dict) and "BTC" in t.get("instrument", "")),
                    0.0,
                )
                exchanges.append({
                    "exchange": "GRVT",
                    "volume_24h": vol,
                    "open_interest": oi,
                    "pairs_count": len(ticker_list),
                    "btc_funding_rate": btc_f,
                    "source": "direct",
                })

        # Parse Variational
        if isinstance(variational_raw, dict):
            exchanges.append({
                "exchange": "Variational",
                "volume_24h": float(variational_raw.get("total_volume_24h", 0) or 0),
                "open_interest": float(variational_raw.get("open_interest", 0) or 0),
                "pairs_count": int(variational_raw.get("num_markets", 0)),
                "btc_funding_rate": next(
                    (float(l.get("funding_rate", 0) or 0)
                     for l in variational_raw.get("listings", []) if l.get("ticker") == "BTC"),
                    0.0,
                ),
                "source": "direct",
            })

        # Parse EdgeX
        if isinstance(edgex_raw, dict):
            ticker_list = edgex_raw.get("data", edgex_raw.get("list", []))
            if isinstance(ticker_list, list):
                vol = sum(float(t.get("volumeUsd24h", t.get("quoteVolume", 0)) or 0) for t in ticker_list if isinstance(t, dict))
                exchanges.append({
                    "exchange": "EdgeX",
                    "volume_24h": vol,
                    "open_interest": 0.0,
                    "pairs_count": len(ticker_list),
                    "btc_funding_rate": 0.0,
                    "source": "direct",
                })

        # Parse Extended
        if isinstance(extended_raw, dict):
            markets = extended_raw.get("data", [])
            if isinstance(markets, list):
                vol = sum(float(m.get("dailyVolume", 0) or 0) for m in markets if isinstance(m, dict))
                oi = sum(float(m.get("openInterest", 0) or 0) for m in markets if isinstance(m, dict))
                exchanges.append({
                    "exchange": "Extended",
                    "volume_24h": vol,
                    "open_interest": oi,
                    "pairs_count": len(markets),
                    "btc_funding_rate": 0.0,
                    "source": "direct",
                })

        # Sort by volume
        exchanges.sort(key=lambda x: x["volume_24h"], reverse=True)

        # Add ranks
        for i, ex in enumerate(exchanges, start=1):
            ex["rank"] = i

        result = {
            "exchanges": exchanges,
            "timestamp": int(time.time() * 1000),
        }
        await cache.set(cache_key, result, TTL_COMPARE)
        return result

    async def get_dex_oi_history(
        self,
        symbol: str = "BTC",
        exchange: str = "Hyperliquid",
        interval: str = "1h",
        limit: int = 200,
    ) -> list[dict[str, Any]]:
        """Historical OI for a DEX from CoinGlass."""
        cache_key = f"compare:dex:oi:{exchange}:{symbol}:{interval}"
        cached = await cache.get(cache_key, TTL_COINGLASS)
        if cached is not None:
            return cached

        raw = await coinglass_client.oi_ohlc_history(
            symbol=symbol,
            exchange=exchange,
            interval=interval,
            limit=limit,
        )

        result = []
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

        await cache.set(cache_key, result, TTL_COINGLASS)
        return result

    async def get_dex_funding_rates(self, symbol: str = "BTC") -> dict[str, Any]:
        """Current funding rates for BTC across all tracked DEXes."""
        cache_key = f"compare:dex:funding:{symbol}"
        cached = await cache.get(cache_key, TTL_COMPARE)
        if cached is not None:
            return cached

        cg_rates = await coinglass_client.funding_rate_exchange_list(symbol=symbol)

        rates = []
        if isinstance(cg_rates, dict) and cg_rates.get("data"):
            for item in cg_rates["data"]:
                if isinstance(item, dict):
                    try:
                        rate = float(item.get("fundingRate", 0) or 0)
                        rates.append({
                            "exchange": item.get("exchange", ""),
                            "funding_rate": rate,
                            "funding_rate_annual_pct": round(rate * 365 * 3 * 100, 4),
                            "interval_hours": 8,
                        })
                    except (TypeError, ValueError):
                        pass

        result = {"symbol": symbol, "rates": rates, "timestamp": int(time.time() * 1000)}
        await cache.set(cache_key, result, TTL_COMPARE)
        return result

    async def get_volume_history(
        self,
        symbol: str = "BTC",
        exchange: str = "Hyperliquid",
        interval: str = "1d",
        limit: int = 90,
    ) -> list[dict[str, Any]]:
        """Historical volume for an exchange from CoinGlass taker buy/sell data."""
        cache_key = f"compare:vol:{exchange}:{symbol}:{interval}"
        cached = await cache.get(cache_key, TTL_COINGLASS)
        if cached is not None:
            return cached

        raw = await coinglass_client.taker_buy_sell_volume(
            symbol=symbol,
            exchange=exchange,
            interval=interval,
            limit=limit,
        )

        result = []
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

        await cache.set(cache_key, result, TTL_COINGLASS)
        return result


comparison_service = ComparisonService()
