export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export const REFRESH_INTERVAL = 30_000; // 30 seconds

export const CHART_COLORS = {
  neon: '#00ff88',
  neonDim: '#00cc6a',
  red: '#ff4d4d',
  redDim: '#cc3333',
  blue: '#3b82f6',
  purple: '#a855f7',
  yellow: '#eab308',
  orange: '#f97316',
  cyan: '#06b6d4',
  white: '#e8e8e8',
  muted: 'rgba(255,255,255,0.3)',
} as const;

export const CANDLE_INTERVALS = ['5m', '15m', '1h', '4h', '1d'] as const;
export type CandleInterval = (typeof CANDLE_INTERVALS)[number];

export const DEFAULT_ASSETS = ['BTC', 'ETH', 'SOL', 'ARB', 'AVAX', 'BNB', 'DOGE', 'MATIC'] as const;
