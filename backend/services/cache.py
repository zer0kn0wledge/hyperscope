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

# ── TTL Constants (seconds) ───────────────────────────────────────────────────

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

# Default TTL when not specified (matches TTL_COMPARE for safety)
_DEFAULT_TTL = TTL_COMPARE


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

    async def get(self, key: str, ttl: int = _DEFAULT_TTL) -> Any | None:
        """Retrieve a cached value. Returns None on cache miss or expiry."""
        async with self._lock:
            bucket = self._bucket(ttl)
            return bucket.get(key)

    async def set(self, key: str, value: Any, ttl: int = _DEFAULT_TTL) -> None:
        """Store a value in the cache with the given TTL.

        TTL is optional — defaults to _DEFAULT_TTL (120s) if not provided.
        This prevents TypeError when callers forget the TTL argument.
        """
        async with self._lock:
            bucket = self._bucket(ttl)
            bucket[key] = value

    async def delete(self, key: str, ttl: int = _DEFAULT_TTL) -> None:
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


class TimeSeriesBuffer:
    """
    Rolling time-series buffer for accumulating periodic snapshots.
    Stores (timestamp, value) pairs and evicts entries older than max_age_seconds.
    Thread-safe via asyncio.Lock.
    """

    def __init__(self, max_age_seconds: float = 86_400) -> None:
        self._data: deque[tuple[float, Any]] = deque()
        self._lock = asyncio.Lock()
        self._max_age = max_age_seconds

    async def append(self, value: Any) -> None:
        """Append a new value with the current timestamp."""
        now = time.time()
        async with self._lock:
            self._data.append((now, value))
            # Evict old entries
            cutoff = now - self._max_age
            while self._data and self._data[0][0] < cutoff:
                self._data.popleft()

    async def get_all(self) -> list[tuple[float, Any]]:
        """Return all stored (timestamp, value) pairs."""
        async with self._lock:
            return list(self._data)

    async def get_since(self, since_ts: float) -> list[tuple[float, Any]]:
        """Return entries with timestamp >= since_ts."""
        async with self._lock:
            return [(ts, v) for ts, v in self._data if ts >= since_ts]

    async def latest(self) -> tuple[float, Any] | None:
        """Return the most recent entry, or None if empty."""
        async with self._lock:
            return self._data[-1] if self._data else None

    def __len__(self) -> int:
        return len(self._data)


class SpreadHistoryBuffer:
    """
    Specialized buffer for tracking bid/ask spread history per asset.
    Stores {asset: deque[(timestamp, spread_bps)]} up to max_age_seconds.
    """

    def __init__(self, max_age_seconds: float = 3_600) -> None:
        self._data: dict[str, deque[tuple[float, float]]] = {}
        self._lock = asyncio.Lock()
        self._max_age = max_age_seconds

    async def append(self, asset: str, spread_bps: float) -> None:
        """Append a new spread observation for the given asset."""
        now = time.time()
        async with self._lock:
            if asset not in self._data:
                self._data[asset] = deque()
            self._data[asset].append((now, spread_bps))
            cutoff = now - self._max_age
            while self._data[asset] and self._data[asset][0][0] < cutoff:
                self._data[asset].popleft()

    async def get_asset(self, asset: str) -> list[tuple[float, float]]:
        """Return spread history for a specific asset."""
        async with self._lock:
            return list(self._data.get(asset, []))

    async def get_all(self) -> dict[str, list[tuple[float, float]]]:
        """Return spread history for all assets."""
        async with self._lock:
            return {asset: list(buf) for asset, buf in self._data.items()}


# ── Singleton instances ───────────────────────────────────────────────────────

cache = Cache()
market_snapshot_history = TimeSeriesBuffer(max_age_seconds=7 * 86_400)  # 7 days
oi_history = TimeSeriesBuffer(max_age_seconds=7 * 86_400)
volume_history = TimeSeriesBuffer(max_age_seconds=30 * 86_400)
spread_history = SpreadHistoryBuffer()
