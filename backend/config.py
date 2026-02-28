"""
HyperScope Backend Configuration
Loaded from environment variables (with .env file support).
"""

from __future__ import annotations

import os

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── API Keys ────────────────────────────────────────────────────────────
    coinglass_api_key: str = Field(default="", alias="COINGLASS_API_KEY")
    coingecko_api_key: str = Field(default="", alias="COINGECKO_API_KEY")

    # ── Hyperliquid ──────────────────────────────────────────────────────────
    hl_api_base: str = Field(
        default="https://api.hyperliquid.xyz",
        alias="HL_API_BASE",
    )
    hl_ws_url: str = Field(
        default="wss://api.hyperliquid.xyz/ws",
        alias="HL_WS_URL",
    )

    # ── CORS ─────────────────────────────────────────────────────────────────
    cors_origins: str = Field(
        default="http://localhost:3000",
        alias="CORS_ORIGINS",
    )

    def get_cors_origins(self) -> list[str]:
        """Return CORS origins as a list (supports comma-separated string)."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    # ── Redis (optional) ─────────────────────────────────────────────────────
    redis_url: str | None = Field(default=None, alias="REDIS_URL")

    # ── App ──────────────────────────────────────────────────────────────────
    app_version: str = Field(default="0.1.0", alias="APP_VERSION")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")

    # ── Protocol Addresses ───────────────────────────────────────────────────
    hlp_vault_address: str = "0xdfc24b077bc1425ad1dea75bcb6f8158e10df303"
    af_address: str = "0xfefefefefefefefefefefefefefefefefefefefe"

    # ── HTTP Client Timeouts (seconds) ───────────────────────────────────────
    http_timeout: float = 15.0
    http_connect_timeout: float = 5.0

    # ── Rate Limit Windows ───────────────────────────────────────────────────
    hl_rate_limit_weight_per_min: int = 1200
    coinglass_rate_limit_per_min: int = 80
    coingecko_rate_limit_per_min: int = 500


# Singleton settings instance
settings = Settings()
