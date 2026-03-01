/* ── Design tokens ─────────────────────────────────── */
export const CHART_COLORS = {
  neon: '#00ff88',
  neonDim: '#00ff8840',
  red: '#ff4d4d',
  redDim: '#ff4d4d40',
  white: '#e8e8e8',
  whiteDim: '#e8e8e840',
  bg: '#000000',
  card: '#0a0a0a',
  border: '#1a1a1a',
};

export const PAIRS = ['BTC-PERP', 'ETH-PERP', 'SOL-PERP', 'HYPE-PERP'];

/* ── API ──────────────────────────────────────────── */
export const API_BASE = 'https://hyperscope-production-7084.up.railway.app/api';

/* ── Timing ───────────────────────────────────────── */
export const REFRESH_INTERVAL = 30_000; // 30 s
export const REFETCH_INTERVAL = 30_000; // alias
export const STALE_TIME = 15_000; // 15 s
