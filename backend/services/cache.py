"""
In-memory caching with TTLs using cachetools.

Cache TTLs:
  - Market data (metaAndAssetCtxs): 30s
  - Orderbook snapshots: 5s
  - Protocol stats (fees, TVL): 5min
  - Comparison data: 2min
  - Trader data: 60s
  - CoinGecko HYPE: 30s
  - DeFiLlama fees: 10min
  - Staking data: 10min
"""

from __future__ import annotations

import asyncio
import logging
import time
from collections import deque
from typing import Any

from cachetools import TTLCache

logger = logging.getLogger(__name__)

# ── TTL Constants (seconds) ───────────────────────────────────────────────

TTL_MARKET = 30         # metaAndAssetCtxs, heatmap, OI distribution
TTL_ORDERBOOK = 5       # L2 book snapshots
TTL_TRADER = 60         # Clearinghouse state, open orders
TTL_TRADER_FILLS = 120  # Fill history
TTL_PROTOCOL = 300      # HLP vault, AF state
TTL_STAKING = 600       # Validator summaries
TTL_FEES = 600          # DeFiLlama fees
TTL_TVL = 600           # DeFiLlama TVL
TTL_HYPE = 30           # HYPE price (CoinGecko)
TTL_CANDLES = 60        # Per-asset candles
TTL_FUNDING_HIST = 300  # Per-asset funding history
TTL_COMPARE = 120       # DEX/CEX comparison
TTL_CEX_SNAPSHOT = 30   # Binance/Bybit/OKX snapshots
TTL_CEX_HISTORY = 300   # CEX OI/funding history
TTL_COINGLASS = 300     # CoinGlass data


class Cache:
    """
    Multi-bucket in-memory cache using TTLCache.
    Each TTL gets its own bucket to avoid eviction side effects.
    """

    def __init__(self) -> None:
        # One TTLCache per TTL class
        self._buckets: dict[int, TTLCache] = {}
        self._lock = asyncio.Lock()

    def _bucket(self, ttl: int) -> TTLCache:
        if ttl not in self._buckets:
            # 10,000 items max per bucket
            self._buckets[ttl] = TTLCache(maxsize=10_000, ttl=ttl)
        return self._buckets[ttl]

    async def get(self, key: str, ttl: int) -> Any | None:
        """Retrieve a cached value. Returns None on cache miss or expiry."""
        async with self._lock:
            bucket = self._bucket(ttl)
            return bucket.get(key)

    async def set(self, key: str, value: Any, ttl: int) -> None:
        """Store a value in the cache with the given TTL."""
        async with self._lock:
            bucket = self._bucket(ttl)
            bucket[key] = value

    async def delete(self, key: str, ttl: int) -> None:
        """Remove a specific key from the cache."""
        async with self._lock:
            bucket = self._bucket(ttl)
            bucket.pop(key, None)

    async def clear(self) -> None:
        """Clear all cache buckets."""
        async with self._lock:
            for bucket in self._buckets.values():
                bucket.clear()

    def stats(self) -> dict[str, Any]:
        """Return cache statistics for monitoring."""
        return {
            ttl: {
                "size": len(bucket),
                "maxsize": bucket.maxsize,
                "ttl": bucket.ttl,
            }
            for ttl, bucket in self._buckets.items()
        }


# ── Time-Series Buffer ────────────────────────────────────────────────────


class TimeSeriesBuffer:
    """
    Rolling in-memory time series buffer.
    Stores (timestamp, value) pairs up to a max age (seconds).
    Used for 24h/7d rolling history of market snapshots.
    """

    def __init__(self, max_age_seconds: int = 86_400) -> None:
        self.max_age = max_age_seconds
        self._data: deque[tuple[float, Any]] = deque()
        self._lock = asyncio.Lock()

    async def append(self, value: Any) -> None:
        """Append a value with the current timestamp."""
        async with self._lock:
            now = time.time()
            self._data.append((now, value))
            self._evict(now)

    async def get_all(self) -> list[tuple[float, Any]]:
        """Return all non-expired (timestamp, value) pairs."""
        async with self._lock:
            self._evict(time.time())
            return list(self._data)

    async def get_since(self, since_ts: float) -> list[tuple[float, Any]]:
        """Return values since a given Unix timestamp."""
        async with self._lock:
            self._evict(time.time())
            return [(ts, v) for ts, v in self._data if ts >= since_ts]

    def _evict(self, now: float) -> None:
        """Remove entries older than max_age."""
        cutoff = now - self.max_age
        while self._data and self._data[0][0] < cutoff:
            self._data.popleft()

    async def latest(self) -> Any | None:
        """Return the most recent value or None."""
        async with self._lock:
            if self._data:
                return self._data[-1][1]
            return None

    def __len__(self) -> int:
        return len(self._data)


# ── Spread History Buffer ─────────────────────────────────────────────────


class SpreadHistoryBuffer:
    """
    Tracks bid-ask spread history per trading pair.
    Stores (timestamp, spread_bps, spread_usd) entries.
    """

    def __init__(self, max_age_seconds: int = 86_400) -> None:
        self._buffers: dict[str, TimeSeriesBuffer] = {}

    def _get_buffer(self, pair: str) -> TimeSeriesBuffer:
        if pair not in self._buffers:
            self._buffers[pair] = TimeSeriesBuffer(max_age_seconds=86_400)
        return self._buffers[pair]

    async def record(
        self,
        pair: str,
        spread_bps: float,
        spread_usd: float,
        mid_price: float,
    ) -> None:
        """Record a new spread observation."""
        await self._get_buffer(pair).append({
            "spread_bps": spread_bps,
            "spread_usd": spread_usd,
            "mid_price": mid_price,
        })

    async def get_history(
        self,
        pair: str,
        window_hours: float = 1.0,
    ) -> list[dict[str, Any]]:
        """Get spread history for a pair within the given window."""
        since = time.time() - window_hours * 3600
        buf = self._get_buffer(pair)
        data = await buf.get_since(since)
        return [
            {"timestamp": ts * 1000, **v}  # convert to ms
            for ts, v in data
        ]


# ── Singleton Instances ───────────────────────────────────────────────────

# Main cache
cache = Cache()

# Time-series buffers for background-collected data
market_snapshot_history = TimeSeriesBuffer(max_age_seconds=7 * 86_400)  # 7 days
oi_history = TimeSeriesBuffer(max_age_seconds=7 * 86_400)
volume_history = TimeSeriesBuffer(max_age_seconds=30 * 86_400)
spread_history = SpreadHistoryBuffer()
