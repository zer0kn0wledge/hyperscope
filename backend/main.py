"""
HyperScope FastAPI Backend - Application Entry Point
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

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger(__name__)

logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)
logging.getLogger("websockets").setLevel(logging.WARNING)

_START_TIME = time.time()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan context manager.
    """
    logger.info("HyperScope backend starting up (v%s)", settings.app_version)
    await warm_cache()
    start_background_tasks()
    logger.info("HyperScope backend ready")
    yield

    logger.info("HyperScope backend shutting down")
    stop_background_tasks()

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


app = FastAPI(
    title="HyperScope Analytics API",
    description="Backend API for HyperScope - a Hyperliquid analytics dashboard.",
    version=settings.app_version,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["*"],
    max_age=86400,
)

app.include_router(overview.router, prefix="/api")
app.include_router(markets.router, prefix="/api")
app.include_router(orderbook.router, prefix="/api")
app.include_router(traders.router, prefix="/api")
app.include_router(protocol.router, prefix="/api")
app.include_router(compare.router, prefix="/api")
app.include_router(ws.router)


@app.get("/health", tags=["system"])
async def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "version": settings.app_version,
        "uptime_seconds": int(time.time() - _START_TIME),
    }


@app.get("/api/status", tags=["system"])
async def status() -> dict[str, Any]:
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


@app.get("/api/sources", tags=["system"])
async def sources() -> dict[str, Any]:
    return {
        "sources": [
            {"name": "Hyperliquid Info API", "url": "https://api.hyperliquid.xyz/info", "auth": "none", "cost": "free"},
            {"name": "CoinGlass V4 API", "url": "https://open-api-v4.coinglass.com", "auth": "api_key", "cost": "$79/mo"},
            {"name": "CoinGecko Pro API", "url": "https://pro-api.coingecko.com/api/v3", "auth": "api_key", "cost": "$129/mo"},
            {"name": "DeFiLlama", "url": "https://api.llama.fi", "auth": "none", "cost": "free"},
            {"name": "Binance Futures", "url": "https://fapi.binance.com", "auth": "none", "cost": "free"},
            {"name": "Bybit V5", "url": "https://api.bybit.com", "auth": "none", "cost": "free"},
            {"name": "OKX V5", "url": "https://www.okx.com", "auth": "none", "cost": "free"},
        ]
    }


@app.middleware("http")
async def log_requests(request, call_next):
    start = time.time()
    response = await call_next(request)
    duration_ms = (time.time() - start) * 1000
    logger.debug("%s %s -> %d (%.1fms)", request.method, request.url.path, response.status_code, duration_ms)
    response.headers["X-Response-Time-Ms"] = f"{duration_ms:.1f}"
    response.headers["X-API-Version"] = settings.app_version
    return response


@app.get("/", tags=["system"])
async def root() -> dict[str, Any]:
    return {
        "name": "HyperScope Analytics API",
        "version": settings.app_version,
        "docs": "/docs",
        "health": "/health",
        "status": "/api/status",
        "sources": "/api/sources",
    }
