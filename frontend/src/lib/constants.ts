// ===========================================================================
// API
// ===========================================================================
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

// ===========================================================================
// Refresh intervals (ms)
// ===========================================================================
export const REFRESH = {
  /** Overview page — 20 s */
  OVERVIEW: 20_000,
  /** Individual market — 15 s */
  MARKET: 15_000,
  /** Orderbook — 5 s */
  ORDERBOOK: 5_000,
  /** Traders / leaderboard — 60 s */
  TRADERS: 60_000,
  /** Protocol stats — 60 s */
  PROTOCOL: 60_000,
  /** Compare page — 30 s */
  COMPARE: 30_000,
  /** Candles — 30 s */
  CANDLES: 30_000,
  /** Funding history — 60 s */
  FUNDING: 60_000,
} as const;

// ===========================================================================
// Chart colours
// ===========================================================================
export const CHART_COLORS = {
  neonGreen: '#00ff88',
  red: '#ff4d4d',
  purple: '#8b5cf6',
  blue: '#3b82f6',
  orange: '#f97316',
  yellow: '#eab308',
  teal: '#14b8a6',
  pink: '#ec4899',
} as const;

export const CHART_COLOR_ARRAY = Object.values(CHART_COLORS);

// ===========================================================================
// DEX exchange display names
// ===========================================================================
export const DEX_LABELS: Record<string, string> = {
  hyperliquid: 'Hyperliquid',
  paradex: 'Paradex',
  aster: 'Aster',
  extended: 'Extended',
  grvt: 'GRVT',
  lighter: 'Lighter',
  edgex: 'EdgeX',
  variational: 'Variational',
};

// ===========================================================================
// CEX exchange display names
// ===========================================================================
export const CEX_LABELS: Record<string, string> = {
  binance: 'Binance',
  bybit: 'Bybit',
  okx: 'OKX',
  kraken: 'Kraken',
  kucoin: 'KuCoin',
};

// ===========================================================================
// Funding thresholds
// ===========================================================================
export const FUNDING_THRESHOLDS = {
  HIGH: 0.0005,
  EXTREME: 0.002,
} as const;

// ===========================================================================
// Pagination
// ===========================================================================
export const PAGE_SIZE = 50;

// ===========================================================================
// Supported candle intervals
// ===========================================================================
export const CANDLE_INTERVALS = ['1m', '5m', '15m', '1h', '4h', '1d'] as const;
export type CandleInterval = (typeof CANDLE_INTERVALS)[number];
