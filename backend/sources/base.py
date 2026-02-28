"""
Base HTTP client with:
- httpx AsyncClient + connection pooling
- Exponential backoff retry logic
- Per-source rate limiting (token bucket)
- Circuit breaker (5 failures -> 60s cooldown)
- Consistent None-on-failure error handling
"""

from __future__ import annotations

import asyncio
import logging
import time
from collections import deque
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

import httpx

from config import settings

logger = logging.getLogger(__name__)


class CircuitState(Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


@dataclass
class CircuitBreaker:
    """Simple circuit breaker per data source."""

    failure_threshold: int = 5
    recovery_timeout: float = 60.0

    _state: CircuitState = field(default=CircuitState.CLOSED, init=False)
    _failure_count: int = field(default=0, init=False)
    _last_failure_time: float = field(default=0.0, init=False)

    @property
    def is_open(self) -> bool:
        if self._state == CircuitState.OPEN:
            if time.monotonic() - self._last_failure_time > self.recovery_timeout:
                self._state = CircuitState.HALF_OPEN
                return False
            return True
        return False

    def record_success(self) -> None:
        self._failure_count = 0
        self._state = CircuitState.CLOSED

    def record_failure(self) -> None:
        self._failure_count += 1
        self._last_failure_time = time.monotonic()
        if self._failure_count >= self.failure_threshold:
            self._state = CircuitState.OPEN
            logger.warning("Circuit breaker OPENED after %d failures", self._failure_count)


@dataclass
class TokenBucket:
    """Token bucket rate limiter (thread-safe via asyncio)."""

    capacity: float
    refill_rate: float

    _tokens: float = field(init=False)
    _last_refill: float = field(init=False)
    _lock: asyncio.Lock = field(init=False)

    def __post_init__(self) -> None:
        self._tokens = self.capacity
        self._last_refill = time.monotonic()
        self._lock = asyncio.Lock()

    async def consume(self, tokens: float = 1.0) -> bool:
        async with self._lock:
            now = time.monotonic()
            elapsed = now - self._last_refill
            self._tokens = min(self.capacity, self._tokens + elapsed * self.refill_rate)
            self._last_refill = now
            if self._tokens >= tokens:
                self._tokens -= tokens
                return True
            return False

    async def wait_for_token(self, tokens: float = 1.0, max_wait: float = 30.0) -> bool:
        start = time.monotonic()
        while True:
            if await self.consume(tokens):
                return True
            waited = time.monotonic() - start
            if waited >= max_wait:
                return False
            await asyncio.sleep(0.1)


class BaseHTTPClient:
    """
    Async HTTP client base class with retry + circuit breaker.
    """

    def __init__(
        self,
        base_url: str,
        source_name: str,
        headers: dict[str, str] | None = None,
        rate_limiter: TokenBucket | None = None,
        max_retries: int = 3,
        backoff_base: float = 1.0,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.source_name = source_name
        self.max_retries = max_retries
        self.backoff_base = backoff_base
        self._rate_limiter = rate_limiter
        self._circuit = CircuitBreaker()

        self._client: httpx.AsyncClient | None = None
        self._default_headers = {
            "Accept": "application/json",
            "User-Agent": "HyperScope/0.1.0",
        }
        if headers:
            self._default_headers.update(headers)

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                headers=self._default_headers,
                timeout=httpx.Timeout(
                    connect=settings.http_connect_timeout,
                    read=settings.http_timeout,
                    write=settings.http_timeout,
                    pool=settings.http_timeout,
                ),
                limits=httpx.Limits(
                    max_connections=20,
                    max_keepalive_connections=10,
                    keepalive_expiry=30.0,
                ),
                follow_redirects=True,
            )
        return self._client

    async def close(self) -> None:
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    async def _request(
        self,
        method: str,
        path: str,
        *,
        params: dict[str, Any] | None = None,
        json: Any | None = None,
        extra_headers: dict[str, str] | None = None,
    ) -> Any | None:
        if self._circuit.is_open:
            logger.debug("[%s] Circuit open - skipping request to %s", self.source_name, path)
            return None

        if self._rate_limiter:
            allowed = await self._rate_limiter.wait_for_token(max_wait=10.0)
            if not allowed:
                logger.warning("[%s] Rate limit exceeded for %s", self.source_name, path)
                return None

        client = await self._get_client()
        last_exc: Exception | None = None

        for attempt in range(self.max_retries + 1):
            try:
                response = await client.request(
                    method, path, params=params, json=json, headers=extra_headers
                )

                if response.status_code == 429:
                    wait = float(response.headers.get("Retry-After", 5.0 * (attempt + 1)))
                    logger.warning("[%s] 429 rate limited - waiting %.1fs", self.source_name, wait)
                    await asyncio.sleep(min(wait, 30.0))
                    continue

                response.raise_for_status()
                self._circuit.record_success()
                return response.json()

            except httpx.HTTPStatusError as exc:
                last_exc = exc
                status = exc.response.status_code
                logger.warning("[%s] HTTP %d on %s (attempt %d/%d)", self.source_name, status, path, attempt + 1, self.max_retries + 1)
                if 400 <= status < 500:
                    self._circuit.record_failure()
                    return None

            except (httpx.ConnectError, httpx.TimeoutException, httpx.ReadError) as exc:
                last_exc = exc
                logger.warning("[%s] Network error on %s (attempt %d/%d): %s", self.source_name, path, attempt + 1, self.max_retries + 1, exc)

            except Exception as exc:
                last_exc = exc
                logger.error("[%s] Unexpected error on %s: %s", self.source_name, path, exc)
                self._circuit.record_failure()
                return None

            if attempt < self.max_retries:
                wait = self.backoff_base * (2 ** attempt)
                await asyncio.sleep(wait)

        logger.error("[%s] All %d attempts failed for %s: %s", self.source_name, self.max_retries + 1, path, last_exc)
        self._circuit.record_failure()
        return None

    async def get(self, path: str, params: dict[str, Any] | None = None, extra_headers: dict[str, str] | None = None) -> Any | None:
        return await self._request("GET", path, params=params, extra_headers=extra_headers)

    async def post(self, path: str, json: Any | None = None, params: dict[str, Any] | None = None, extra_headers: dict[str, str] | None = None) -> Any | None:
        return await self._request("POST", path, json=json, params=params, extra_headers=extra_headers)

    @property
    def circuit_state(self) -> str:
        return self._circuit._state.value
