"""
HyperScope FastAPI Backend — Application Entry Point

Startup sequence:
1. Configure logging
2. Create FastAPI app with lifespan
3. On startup: warm caches, start background tasks
4. Register all routers under /api prefix
5. Add CORS middleware
6. Health check and status endpoints
"""

from __future__ import annotations

import logging
import logging.config
import time
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from routers import compare, markets, orderbook, overview, protocol, traders, ws
from tasks.background import start_background_tasks, stop_background_tasks, warm_cache

# ── Logging Setup ─────────────────────────────────────────────────────────

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger(__name__)

# Reduce noise from third-party libraries
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)
logging.getLogger("websockets").setLevel(logging.WARNING)

# ── App Start Time ────────────────────────────────────────────────────────
_START_TIME = time.time()


# ── Lifespan ──────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan context manager.
    Handles startup (cache warmup, background tasks) and shutdown (cleanup).
    """
    logger.info("HyperScope backend starting up (v%s)", settings.app_version)

    # Pre-warm critical caches
    await warm_cache()

    # Start periodic background tasks
    start_background_tasks()

    logger.info("HyperScope backend ready")
    yield

    # Shutdown: cancel background tasks and close HTTP clients
    logger.info("HyperScope backend shutting down")
    stop_background_tasks()

    # Close all HTTP clients
    from sources.aster import aster_client
    from sources.binance import binance_client
    from sources.bybit import bybit_client
    from sources.coingecko import coingecko_client
    from sources.coinglass import coinglass_client
    from sources.defillama import defillama_client
    from sources.edgex import edgex_client
    from sources.extended import extended_client
    from sources.grvt import grvt_client
    from sources.hyperliquid import hl_client
    from sources.lighter import lighter_client
    from sources.okx import okx_client
    from sources.paradex import paradex_client
    from sources.variational import variational_client

    import asyncio
    await asyncio.gather(
        hl_client.close(),
        coinglass_client.close(),
        coingecko_client.close(),
        defillama_client.close(),
        binance_client.close(),
        bybit_client.close(),
        okx_client.close(),
        paradex_client.close(),
        lighter_client.close(),
        aster_client.close(),
        grvt_client.close(),
        variational_client.close(),
        edgex_client.close(),
        extended_client.close(),
        return_exceptions=True,
    )
    logger.info("HyperScope backend shutdown complete")


# ── FastAPI App ────────────────────────────────────────────────────────────

app = FastAPI(
    title="HyperScope Analytics API",
    description=(
        "Backend API for HyperScope — a Hyperliquid analytics dashboard. "
        "Aggregates data from Hyperliquid, CoinGlass, CoinGecko, DeFiLlama, "
        "and multiple CEX/DEX exchanges for comprehensive market analytics."
    ),
    version=settings.app_version,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=86400,
)

# ── Routers ───────────────────────────────────────────────────────────────

app.include_router(overview.router, prefix="/api")
app.include_router(markets.router, prefix="/api")
app.include_router(orderbook.router, prefix="/api")
app.include_router(traders.router, prefix="/api")
app.include_router(protocol.router, prefix="/api")
app.include_router(compare.router, prefix="/api")
app.include_router(ws.router)  # WebSocket — no /api prefix, already has /ws

# ── Health & Status Endpoints ─────────────────────────────────────────────


@app.get("/health", tags=["system"], summary="Health check")
async def health() -> dict[str, Any]:
    """
    Simple health check endpoint.
    Returns: status, version, uptime_seconds.
    """
    return {
        "status": "ok",
        "version": settings.app_version,
        "uptime_seconds": int(time.time() - _START_TIME),
    }


@app.get("/api/status", tags=["system"], summary="Data source connectivity status")
async def status() -> dict[str, Any]:
    """
    Check connectivity to all upstream data sources.
    Returns circuit breaker states and last update times.
    """
    from sources.aster import aster_client
    from sources.binance import binance_client
    from sources.bybit import bybit_client
    from sources.coingecko import coingecko_client
    from sources.coinglass import coinglass_client
    from sources.defillama import defillama_client
    from sources.hyperliquid import hl_client
    from sources.okx import okx_client

    from services.cache import cache

    return {
        "version": settings.app_version,
        "uptime_seconds": int(time.time() - _START_TIME),
        "data_sources": {
            "hyperliquid": {"circuit_state": hl_client.circuit_state},
            "coinglass": {"circuit_state": coinglass_client.circuit_state},
            "coingecko": {"circuit_state": coingecko_client.circuit_state},
            "defillama": {"circuit_state": defillama_client.circuit_state},
            "binance": {"circuit_state": binance_client.circuit_state},
            "bybit": {"circuit_state": bybit_client.circuit_state},
            "okx": {"circuit_state": okx_client.circuit_state},
        },
        "cache": cache.stats(),
        "timestamp": int(time.time() * 1000),
    }


@app.get("/api/sources", tags=["system"], summary="Data source attribution")
async def sources() -> dict[str, Any]:
    """
    Attribution information for all data sources used by HyperScope.
    """
    return {
        "sources": [
            {
                "name": "Hyperliquid Info API",
                "url": "https://api.hyperliquid.xyz/info",
                "auth": "none",
                "rate_limit": "1200 weight/min",
                "cost": "free",
                "coverage": "All HL market, orderbook, account, and protocol data",
            },
            {
                "name": "CoinGlass V4 API",
                "url": "https://open-api-v4.coinglass.com",
                "auth": "api_key",
                "rate_limit": "80 req/min (STARTUP tier)",
                "cost": "$79/mo",
                "coverage": "OI history, liquidations, L/S ratios, taker volume, funding rates",
            },
            {
                "name": "CoinGecko Pro API",
                "url": "https://pro-api.coingecko.com/api/v3",
                "auth": "api_key",
                "rate_limit": "500 req/min (Analyst tier)",
                "cost": "$129/mo",
                "coverage": "HYPE token market data, derivatives exchange data",
            },
            {
                "name": "DeFiLlama",
                "url": "https://api.llama.fi",
                "auth": "none",
                "rate_limit": "~300 req/min",
                "cost": "free",
                "coverage": "TVL, fees, revenue, spot volume",
            },
            {
                "name": "Binance Futures",
                "url": "https://fapi.binance.com",
                "auth": "none (public endpoints)",
                "rate_limit": "2400 weight/min",
                "cost": "free",
                "coverage": "BTC/ETH OI, volume, funding, L/S ratios",
            },
            {
                "name": "Bybit V5",
                "url": "https://api.bybit.com",
                "auth": "none (public endpoints)",
                "rate_limit": "600 req/5s",
                "cost": "free",
                "coverage": "Perp tickers, OI history, funding rates, L/S ratios",
            },
            {
                "name": "OKX V5",
                "url": "https://www.okx.com",
                "auth": "none (public endpoints)",
                "rate_limit": "10-100 req/2s per endpoint",
                "cost": "free",
                "coverage": "OI, funding rates, L/S ratios, liquidation orders",
            },
            {
                "name": "Paradex",
                "url": "https://api.prod.paradex.trade/v1",
                "auth": "none (public endpoints)",
                "rate_limit": "1500 req/min",
                "cost": "free",
                "coverage": "Markets, orderbook, funding, trades",
            },
            {
                "name": "Lighter",
                "url": "https://mainnet.zklighter.elliot.ai",
                "auth": "none (public endpoints)",
                "rate_limit": "unspecified",
                "cost": "free",
                "coverage": "Exchange stats, funding, candles",
            },
            {
                "name": "Aster DEX",
                "url": "https://fapi.asterdex.com",
                "auth": "none (public endpoints)",
                "rate_limit": "2400 weight/min",
                "cost": "free",
                "coverage": "Tickers, OI, funding rates",
            },
            {
                "name": "GRVT",
                "url": "https://market-data.grvt.io",
                "auth": "none (public endpoints)",
                "rate_limit": "1500 req/min",
                "cost": "free",
                "coverage": "Tickers, OI, funding rates, orderbook",
            },
            {
                "name": "Variational",
                "url": "https://omni-client-api.prod.ap-northeast-1.variational.io",
                "auth": "none",
                "rate_limit": "10 req/10s",
                "cost": "free",
                "coverage": "Platform stats (single endpoint only)",
            },
            {
                "name": "EdgeX",
                "url": "https://pro.edgex.exchange",
                "auth": "none (public endpoints)",
                "rate_limit": "unspecified",
                "cost": "free",
                "coverage": "Tickers, funding rates, orderbook",
            },
            {
                "name": "Extended Exchange",
                "url": "https://api.starknet.extended.exchange/api/v1",
                "auth": "none (public endpoints)",
                "rate_limit": "1000 req/min",
                "cost": "free",
                "coverage": "Markets, OI history, funding history, orderbook",
            },
        ]
    }


# ── Request Logging Middleware ─────────────────────────────────────────────

@app.middleware("http")
async def log_requests(request, call_next):
    """Log all incoming HTTP requests with timing."""
    start = time.time()
    response = await call_next(request)
    duration_ms = (time.time() - start) * 1000
    logger.debug(
        "%s %s → %d (%.1fms)",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    # Add response time header
    response.headers["X-Response-Time-Ms"] = f"{duration_ms:.1f}"
    response.headers["X-API-Version"] = settings.app_version
    return response


# ── Root endpoint ─────────────────────────────────────────────────────────

@app.get("/", tags=["system"], summary="API root")
async def root() -> dict[str, Any]:
    """API root — returns basic info and documentation links."""
    return {
        "name": "HyperScope Analytics API",
        "version": settings.app_version,
        "docs": "/docs",
        "health": "/health",
        "status": "/api/status",
        "sources": "/api/sources",
    }
