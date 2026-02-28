// ============================================================
// HyperScope Constants
// ============================================================

export const APP_NAME = 'HyperScope';
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? '0.1.0';

// API base URL — auto-fix missing protocol prefix
function normalizeApiUrl(raw: string): string {
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  // If no protocol, assume https in production
  return `https://${raw}`;
}

function normalizeWsUrl(raw: string): string {
  if (raw.startsWith('ws://') || raw.startsWith('wss://')) return raw;
  if (raw.startsWith('https://')) return raw.replace('https://', 'wss://');
  if (raw.startsWith('http://')) return raw.replace('http://', 'ws://');
  // If no protocol, assume wss in production
  return `wss://${raw}`;
}

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export const API_URL = normalizeApiUrl(rawApiUrl);

// WS URL: use explicit env var, or derive from API URL
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL
  ? normalizeWsUrl(process.env.NEXT_PUBLIC_WS_URL)
  : normalizeWsUrl(rawApiUrl);

// Protocol addresses
export const AF_ADDRESS = '0xfefefefefefefefefefefefefefefefefefefefe';
export const HLP_ADDRESS = '0xdfc24b077bc1425ad1dea75bcb6f8158e10df303';

// Default refetch intervals (ms)
export const REFETCH = {
  FAST: 15_000,     // 15s
  MEDIUM: 30_000,   // 30s
  SLOW: 60_000,     // 60s
  PROTOCOL: 300_000, // 5min
  LONG: 600_000,    // 10min
} as const;

// Chart color scheme
export const CHART_COLORS = {
  cyan: '#00D1FF',
  cyanDim: '#00A8CC',
  green: '#00FF88',
  greenDim: '#00CC6A',
  red: '#FF4D6A',
  redDim: '#CC3D55',
  orange: '#FF8C42',
  yellow: '#FFD700',
  purple: '#A78BFA',
  blue: '#5B9EFF',
  grid: '#1E2D3D',
  text: '#8B949E',
  bg: '#0A0F1A',
} as const;

// Exchange list for comparisons
export const DEX_EXCHANGES = [
  { id: 'hyperliquid', name: 'Hyperliquid', color: CHART_COLORS.cyan },
  { id: 'paradex', name: 'Paradex', color: CHART_COLORS.purple },
  { id: 'lighter', name: 'Lighter', color: CHART_COLORS.blue },
  { id: 'aster', name: 'Aster', color: CHART_COLORS.green },
  { id: 'grvt', name: 'GRVT', color: '#F59E0B' },
  { id: 'variational', name: 'Variational', color: '#6EE7B7' },
  { id: 'edgex', name: 'EdgeX', color: '#F97316' },
  { id: 'extended', name: 'Extended', color: '#EC4899' },
] as const;

export const CEX_EXCHANGES = [
  { id: 'hyperliquid', name: 'Hyperliquid', color: CHART_COLORS.cyan, isDex: true },
  { id: 'binance', name: 'Binance', color: '#F0B90B', isDex: false },
  { id: 'bybit', name: 'Bybit', color: '#F7A600', isDex: false },
  { id: 'okx', name: 'OKX', color: '#2D55FF', isDex: false },
] as const;

// Top HL perpetual pairs for WS connections
export const TOP_PAIRS = [
  'BTC', 'ETH', 'SOL', 'ARB', 'OP', 'AVAX', 'MATIC', 'LINK', 'DOGE', 'XRP',
];

// Chart intervals
export const CANDLE_INTERVALS = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '1h', value: '1h' },
  { label: '4h', value: '4h' },
  { label: '1d', value: '1d' },
  { label: '1w', value: '1w' },
] as const;

export type CandleInterval = (typeof CANDLE_INTERVALS)[number]['value'];

// Timeframe options for Select component dropdowns
export const TIMEFRAME_OPTIONS = [
  { label: '1 Min', value: '1m' },
  { label: '5 Min', value: '5m' },
  { label: '15 Min', value: '15m' },
  { label: '1 Hour', value: '1h' },
  { label: '4 Hour', value: '4h' },
  { label: '1 Day', value: '1d' },
  { label: '1 Week', value: '1w' },
];

export type TimeframeOption = (typeof TIMEFRAME_OPTIONS)[number]['value'];

// Heatmap color scale
export const HEATMAP_COLORS = {
  veryPositive: '#00D1FF',
  positive: '#00A8CC',
  neutral: '#1E2D3D',
  negative: '#FF4D6A',
  veryNegative: '#FF1A3D',
} as const;

export function getHeatmapColor(pctChange: number): string {
  if (pctChange >= 5) return HEATMAP_COLORS.veryPositive;
  if (pctChange >= 1) return HEATMAP_COLORS.positive;
  if (pctChange <= -5) return HEATMAP_COLORS.veryNegative;
  if (pctChange <= -1) return HEATMAP_COLORS.negative;
  return HEATMAP_COLORS.neutral;
}

// Large trade thresholds (USD)
export const LARGE_TRADE_THRESHOLDS: Record<string, number> = {
  BTC: 500_000,
  ETH: 500_000,
  default: 50_000,
  top10: 100_000,
};

// Orderbook depth levels
export const ORDERBOOK_DEFAULT_LEVELS = 20;
export const ORDERBOOK_MAX_LEVELS = 100;

// Navigation items
export const NAV_ITEMS = [
  { href: '/', label: 'Overview', icon: 'LayoutDashboard' },
  { href: '/markets', label: 'Markets', icon: 'BarChart2' },
  { href: '/orderbook', label: 'Orderbook', icon: 'Layers' },
  { href: '/traders', label: 'Traders', icon: 'Users' },
  { href: '/protocol', label: 'Protocol', icon: 'Shield' },
  { href: '/compare/dex', label: 'Compare DEX', icon: 'GitCompare' },
  { href: '/compare/cex', label: 'Compare CEX', icon: 'BarChart' },
  { href: '/settings', label: 'Settings', icon: 'Settings' },
] as const;
