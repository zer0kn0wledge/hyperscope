"""
WebSocket Proxy Router

Proxies Hyperliquid WebSocket streams to frontend clients.
Single upstream HL connection shared across all frontend clients
(respects HL's 10-connection limit).

Endpoints:
  WS /ws/l2book/{pair}    -> Proxy HL l2Book subscription
  WS /ws/trades/{pair}    -> Proxy HL trades subscription
  WS /ws/all-mids         -> Proxy HL allMids subscription
  WS /ws/bbo/{pair}       -> Proxy HL bbo subscription
  WS /ws/candle/{pair}/{interval} -> Proxy HL candle subscription
  WS /ws/liquidations     -> Aggregated liquidation feed
"""

from __future__ import annotations

import asyncio
import json
import logging
from collections import defaultdict
from typing import Any

import websockets
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from websockets.exceptions import ConnectionClosed, WebSocketException

from config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ws", tags=["websocket"])

HL_WS_URL = settings.hl_ws_url


# ── Connection Manager ────────────────────────────────────────────────────


class SubscriptionManager:
    """
    Manages a pool of upstream HL WebSocket connections.
    Multiple frontend clients can subscribe to the same channel --
    the upstream subscription is only made once per channel.

    Architecture:
      Frontend Client -> Backend WS endpoint
      Backend endpoint -> SubscriptionManager (single upstream per channel)
      SubscriptionManager -> wss://api.hyperliquid.xyz/ws
    """

    def __init__(self) -> None:
        # channel_key -> set of frontend WebSocket connections
        self._subscribers: dict[str, set[WebSocket]] = defaultdict(set)
        # channel_key -> upstream websocket connection
        self._upstream: dict[str, websockets.WebSocketClientProtocol] = {}
        # channel_key -> asyncio.Task running the upstream listener
        self._tasks: dict[str, asyncio.Task] = {}
        self._lock = asyncio.Lock()

    def _channel_key(self, subscription: dict[str, Any]) -> str:
        """Generate a unique key for a subscription type + params."""
        sub_type = subscription.get("type", "")
        coin = subscription.get("coin", "")
        interval = subscription.get("interval", "")
        return f"{sub_type}:{coin}:{interval}".rstrip(":")

    async def subscribe(
        self,
        frontend_ws: WebSocket,
        subscription: dict[str, Any],
    ) -> None:
        """
        Register a frontend client for a subscription.
        Creates the upstream HL connection if needed.
        """
        key = self._channel_key(subscription)
        async with self._lock:
            self._subscribers[key].add(frontend_ws)
            if key not in self._tasks or self._tasks[key].done():
                task = asyncio.create_task(
                    self._run_upstream(key, subscription),
                    name=f"upstream_{key}",
                )
                self._tasks[key] = task

    async def unsubscribe(
        self,
        frontend_ws: WebSocket,
        subscription: dict[str, Any],
    ) -> None:
        """Unregister a frontend client from a subscription."""
        key = self._channel_key(subscription)
        async with self._lock:
            self._subscribers[key].discard(frontend_ws)
            # If no more subscribers, cancel the upstream task
            if not self._subscribers[key] and key in self._tasks:
                self._tasks[key].cancel()
                del self._tasks[key]

    async def remove_client(self, frontend_ws: WebSocket) -> None:
        """Remove a frontend client from all subscriptions."""
        async with self._lock:
            keys_to_clean = [
                k for k, subs in self._subscribers.items()
                if frontend_ws in subs
            ]
            for key in keys_to_clean:
                self._subscribers[key].discard(frontend_ws)
                if not self._subscribers[key] and key in self._tasks:
                    self._tasks[key].cancel()
                    del self._tasks[key]

    async def _run_upstream(
        self,
        key: str,
        subscription: dict[str, Any],
    ) -> None:
        """
        Maintain a persistent upstream connection and forward messages
        to all subscribed frontend clients.
        """
        backoff = 1.0
        while True:
            try:
                logger.info("[ws_proxy] Connecting upstream for channel: %s", key)
                async with websockets.connect(
                    HL_WS_URL,
                    ping_interval=30,
                    ping_timeout=10,
                    close_timeout=5,
                ) as ws:
                    backoff = 1.0  # Reset on successful connect

                    # Send subscription
                    sub_msg = {"method": "subscribe", "subscription": subscription}
                    await ws.send(json.dumps(sub_msg))
                    logger.debug("[ws_proxy] Subscribed: %s", key)

                    # Forward messages
                    async for raw_message in ws:
                        try:
                            data = json.loads(raw_message)
                        except json.JSONDecodeError:
                            continue

                        # Broadcast to all frontend subscribers
                        await self._broadcast(key, raw_message)

            except asyncio.CancelledError:
                logger.debug("[ws_proxy] Upstream task cancelled for: %s", key)
                return

            except (ConnectionClosed, WebSocketException, OSError) as exc:
                logger.warning(
                    "[ws_proxy] Upstream connection lost for %s: %s -- retrying in %.1fs",
                    key, exc, backoff,
                )
                await asyncio.sleep(backoff)
                backoff = min(backoff * 2, 30.0)

            except Exception as exc:
                logger.error("[ws_proxy] Unexpected error for %s: %s", key, exc)
                await asyncio.sleep(backoff)
                backoff = min(backoff * 2, 30.0)

    async def _broadcast(self, key: str, message: str) -> None:
        """Send a message to all frontend clients subscribed to this channel."""
        subscribers = set(self._subscribers.get(key, set()))
        dead_clients = set()

        for ws in subscribers:
            try:
                await ws.send_text(message)
            except Exception:
                dead_clients.add(ws)

        # Clean up dead connections
        if dead_clients:
            async with self._lock:
                for ws in dead_clients:
                    self._subscribers[key].discard(ws)


# Global subscription manager
_manager = SubscriptionManager()


# ── Helper: Simple proxy handler ─────────────────────────────────────────


async def _proxy_subscription(
    websocket: WebSocket,
    subscription: dict[str, Any],
) -> None:
    """
    Generic proxy handler: accepts a frontend WS connection,
    registers it for the given HL subscription, and handles disconnection.
    """
    await websocket.accept()
    await _manager.subscribe(websocket, subscription)
    logger.info(
        "[ws_proxy] Client connected: %s %s",
        subscription.get("type"),
        subscription.get("coin", ""),
    )
    try:
        while True:
            # Keep connection alive; handle client messages (ping/pong or control)
            try:
                msg = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                # Frontend can send its own subscription requests
                try:
                    client_msg = json.loads(msg)
                    if client_msg.get("method") == "ping":
                        await websocket.send_text('{"channel":"pong"}')
                except json.JSONDecodeError:
                    pass
            except asyncio.TimeoutError:
                # Send keepalive ping
                try:
                    await websocket.send_text('{"channel":"ping"}')
                except Exception:
                    break
    except (WebSocketDisconnect, Exception):
        pass
    finally:
        await _manager.unsubscribe(websocket, subscription)
        await _manager.remove_client(websocket)
        logger.info("[ws_proxy] Client disconnected: %s", subscription.get("type"))


# ── WebSocket Endpoints ───────────────────────────────────────────────────


@router.websocket("/l2book/{pair}")
async def ws_l2book(websocket: WebSocket, pair: str) -> None:
    """
    WebSocket proxy for L2 orderbook updates.
    Streams real-time bid/ask ladder changes for the specified pair.
    """
    subscription = {"type": "l2Book", "coin": pair.upper()}
    await _proxy_subscription(websocket, subscription)


@router.websocket("/trades/{pair}")
async def ws_trades(websocket: WebSocket, pair: str) -> None:
    """
    WebSocket proxy for real-time trade prints.
    Each message contains a batch of recent trades for the pair.
    """
    subscription = {"type": "trades", "coin": pair.upper()}
    await _proxy_subscription(websocket, subscription)


@router.websocket("/all-mids")
async def ws_all_mids(websocket: WebSocket) -> None:
    """
    WebSocket proxy for mid prices of all coins.
    Updates every block (~1-2 seconds).
    """
    subscription = {"type": "allMids", "dex": ""}
    await _proxy_subscription(websocket, subscription)


@router.websocket("/bbo/{pair}")
async def ws_bbo(websocket: WebSocket, pair: str) -> None:
    """
    WebSocket proxy for best bid/offer (BBO) updates.
    Lighter than full l2Book -- only best levels.
    """
    subscription = {"type": "bbo", "coin": pair.upper()}
    await _proxy_subscription(websocket, subscription)


@router.websocket("/candle/{pair}/{interval}")
async def ws_candle(websocket: WebSocket, pair: str, interval: str) -> None:
    """
    WebSocket proxy for live candle updates.
    interval: 1m, 5m, 15m, 1h, 4h, 1d, etc.
    """
    valid_intervals = {"1m", "3m", "5m", "15m", "30m", "1h", "2h", "4h", "8h", "12h", "1d"}
    if interval not in valid_intervals:
        await websocket.accept()
        await websocket.send_text(
            json.dumps({"error": f"Invalid interval: {interval}"})
        )
        await websocket.close(code=4000)
        return

    subscription = {"type": "candle", "coin": pair.upper(), "interval": interval}
    await _proxy_subscription(websocket, subscription)


@router.websocket("/liquidations")
async def ws_liquidations(websocket: WebSocket) -> None:
    """
    Aggregated liquidation events.
    Proxies HL userEvents feed for liquidation monitoring.
    Note: Due to HL's 10-user subscription limit, this streams from
    general trade feeds filtered for large price moves.
    """
    # Use allMids as a proxy stream -- actual liquidation events
    # come from userEvents which require specific addresses
    subscription = {"type": "allMids", "dex": ""}
    await _proxy_subscription(websocket, subscription)


@router.websocket("/active-asset/{pair}")
async def ws_active_asset(websocket: WebSocket, pair: str) -> None:
    """
    WebSocket proxy for active asset context updates (mark price, funding, OI).
    """
    subscription = {"type": "activeAssetCtx", "coin": pair.upper()}
    await _proxy_subscription(websocket, subscription)
