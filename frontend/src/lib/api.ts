import { API_BASE } from './constants';

class APIError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'APIError';
  }
}

async function fetcher<T>(path: string, params?: Record<string, string | number | boolean>): Promise<T> {
  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });
  }
  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new APIError(`API ${res.status}: ${res.statusText}`, res.status);
  return res.json() as Promise<T>;
}

/* ── Overview ─────────────────────────────────────── */
export const overviewAPI = {
  kpis: () => fetcher<any>('/overview/kpis'),
  heatmap: () => fetcher<any[]>('/overview/heatmap'),
  sparklines: () => fetcher<any>('/overview/sparklines'),
  recentTrades: () => fetcher<any[]>('/overview/recent-trades'),
};

/* ── Markets ──────────────────────────────────────── */
export const marketsAPI = {
  all: () => fetcher<any[]>('/markets/assets'),
  fundingRates: () => fetcher<any[]>('/markets/funding-rates'),
  oiDistribution: () => fetcher<any[]>('/markets/oi-distribution'),
  volumeHistory: () => fetcher<any[]>('/markets/volume-history'),
  candles: (asset: string, interval: string = '1h') =>
    fetcher<any[]>(`/markets/${asset}/candles`, { interval }),
  oiHistory: (asset: string, days?: number) =>
    fetcher<any[]>(`/markets/${asset}/oi-history`, days ? { days } : undefined),
  fundingHistory: (asset: string, days?: number) =>
    fetcher<any[]>(`/markets/${asset}/funding-history`, days ? { days } : undefined),
  liquidations: (asset: string) =>
    fetcher<any[]>(`/markets/${asset}/liquidations`),
  takerVolume: (asset: string) =>
    fetcher<any[]>(`/markets/${asset}/taker-volume`),
};

/* ── Orderbook ────────────────────────────────────── */
export const orderbookAPI = {
  snapshot: (pair: string) => fetcher<any>(`/orderbook/${pair}`),
  spreadHistory: (pair: string) => fetcher<any[]>(`/orderbook/${pair}/spread-history`),
  largeOrders: (pair: string) => fetcher<any[]>(`/orderbook/${pair}/large-orders`),
};

/* ── Traders ──────────────────────────────────────── */
export const tradersAPI = {
  leaderboard: (params?: Record<string, string | number | boolean>) =>
    fetcher<any[]>('/traders/leaderboard', params as any),
  distribution: () => fetcher<any>('/traders/distribution'),
  summary: (address: string) => fetcher<any>(`/traders/${address}/summary`),
  positions: (address: string) => fetcher<any[]>(`/traders/${address}/positions`),
  fills: (address: string, params?: Record<string, string | number | boolean>) =>
    fetcher<any[]>(`/traders/${address}/fills`, params as any),
  pnl: (address: string, period?: string) =>
    fetcher<any[]>(`/traders/${address}/pnl-chart`, period ? { period } : undefined),
  fundingHistory: (address: string) => fetcher<any[]>(`/traders/${address}/funding`),
  orders: (address: string) => fetcher<any[]>(`/traders/${address}/orders`),
};

/* ── Compare ──────────────────────────────────────── */
export const compareAPI = {
  dex: () => fetcher<any>('/compare/dex/snapshot'),
  cex: () => fetcher<any>('/compare/cex/snapshot'),
  dexVolumeHistory: () => fetcher<any[]>('/compare/dex/volume-history'),
  dexOIHistory: () => fetcher<any[]>('/compare/dex/oi-history'),
  dexFundingRates: () => fetcher<any[]>('/compare/dex/funding-rates'),
  cexVolumeHistory: () => fetcher<any[]>('/compare/cex/volume-history'),
  cexOIHistory: () => fetcher<any[]>('/compare/cex/oi-history'),
  cexFundingHistory: () => fetcher<any[]>('/compare/cex/funding-history'),
  cexLiquidations: () => fetcher<any[]>('/compare/cex/liquidations'),
  cexLongShort: () => fetcher<any[]>('/compare/cex/long-short'),
};

/* ── Protocol ─────────────────────────────────────── */
export const protocolAPI = {
  stats: () => fetcher<any>('/protocol/hype'),
  af: () => fetcher<any>('/protocol/af'),
  hlp: () => fetcher<any>('/protocol/hlp'),
  staking: () => fetcher<any>('/protocol/staking'),
  hype: () => fetcher<any>('/protocol/hype'),
  fees: (period?: string) => fetcher<any>('/protocol/fees', period ? { period } : undefined),
  revenue: () => fetcher<any>('/protocol/revenue'),
  tvl: () => fetcher<any>('/protocol/tvl'),
  vaults: () => fetcher<any>('/protocol/hlp'),
};

/* ── Health ───────────────────────────────────────── */
export const healthAPI = {
  check: () => fetch('https://hyperscope-production-7084.up.railway.app/health').then(r => r.json()),
};

export const statusAPI = {
  getHealth: () => healthAPI.check(),
  getStatus: () => fetcher<any>('/status'),
};
