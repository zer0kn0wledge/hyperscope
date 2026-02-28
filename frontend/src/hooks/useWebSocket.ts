'use client';

import { useEffect, useRef, useCallback } from 'react';
import { WS_URL } from '@/lib/constants';
import type { WSMessage } from '@/lib/types';

type MessageHandler = (data: unknown) => void;

interface SubscriptionMap {
  [channel: string]: Set<MessageHandler>;
}

// Singleton WebSocket manager
class WebSocketManager {
  private ws: WebSocket | null = null;
  private subscriptions: SubscriptionMap = {};
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectDelay = 30_000;
  private isConnecting = false;
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  connect(): void {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) return;
    this.isConnecting = true;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        // Re-subscribe to all channels
        Object.keys(this.subscriptions).forEach((channel) => {
          this.sendSubscribe(channel);
        });
      };

      this.ws.onmessage = (event: MessageEvent<string>) => {
        try {
          const msg = JSON.parse(event.data) as WSMessage;
          const handlers = this.subscriptions[msg.channel];
          if (handlers) {
            handlers.forEach((handler) => handler(msg.data));
          }
        } catch {
          // Ignore parse errors
        }
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.isConnecting = false;
        this.ws?.close();
      };
    } catch {
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    const delay = Math.min(
      1000 * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private sendSubscribe(channel: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'subscribe', channel }));
    }
  }

  private sendUnsubscribe(channel: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'unsubscribe', channel }));
    }
  }

  subscribe(channel: string, handler: MessageHandler): () => void {
    if (!this.subscriptions[channel]) {
      this.subscriptions[channel] = new Set();
    }
    this.subscriptions[channel].add(handler);

    // Connect and subscribe
    this.connect();
    this.sendSubscribe(channel);

    return () => this.unsubscribe(channel, handler);
  }

  unsubscribe(channel: string, handler: MessageHandler): void {
    const handlers = this.subscriptions[channel];
    if (!handlers) return;
    handlers.delete(handler);

    if (handlers.size === 0) {
      delete this.subscriptions[channel];
      this.sendUnsubscribe(channel);
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
    this.subscriptions = {};
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

let wsManagerInstance: WebSocketManager | null = null;

function getWSManager(): WebSocketManager {
  if (typeof window === 'undefined') {
    // Return a dummy manager on the server
    return {
      subscribe: () => () => {},
      unsubscribe: () => {},
      disconnect: () => {},
      isConnected: false,
    } as unknown as WebSocketManager;
  }
  if (!wsManagerInstance) {
    wsManagerInstance = new WebSocketManager(
      `${WS_URL}/ws`
    );
  }
  return wsManagerInstance;
}

/**
 * Hook to subscribe to a WebSocket channel.
 * Returns the latest message data.
 */
export function useWebSocket<T>(
  channel: string | null,
  onMessage?: (data: T) => void
): { isConnected: boolean } {
  const manager = getWSManager();
  const handlerRef = useRef(onMessage);
  handlerRef.current = onMessage;

  useEffect(() => {
    if (!channel) return;

    const handler = (data: unknown) => {
      handlerRef.current?.(data as T);
    };

    const unsubscribe = manager.subscribe(channel, handler);
    return unsubscribe;
  }, [channel, manager]);

  return { isConnected: manager.isConnected };
}

/**
 * Hook for orderbook WebSocket subscription.
 */
export function useOrderbookWS(
  pair: string | null,
  onUpdate: (data: unknown) => void
) {
  const stableOnUpdate = useCallback(onUpdate, []);
  return useWebSocket(
    pair ? `l2book.${pair}` : null,
    stableOnUpdate
  );
}

/**
 * Hook for trades WebSocket subscription.
 */
export function useTradesWS(
  pair: string | null,
  onTrade: (data: unknown) => void
) {
  const stableOnTrade = useCallback(onTrade, []);
  return useWebSocket(
    pair ? `trades.${pair}` : null,
    stableOnTrade
  );
}
