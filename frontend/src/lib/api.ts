import { API_BASE } from './constants';

class APIError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'APIError';
  }
}

async function fetcher<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) url.searchParams.set(key, String(value));
    });
  }
  const res = await fetch(url.toString(), {
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new APIError(`${res.status}: ${body || res.statusText}`, res.status);
  }
  return res.json() as Promise<T>;
}

export const overviewAPI = {
  kpis: () => fetcher('/overview/kpis'),
  heatmap: () => fetcher('/overview/heatmap'),
  sparklines: () => fetcher('/overview/sparklines'),
};

export const marketsAPI = {
  all: () => fetcher('/markets/all'),
  candles: (asset: string, interval = '1h', limit = 200) =>
    fetcher('/markets/candles', { asset, interval, limit }),
  oiHistory: (asset: string, days = 30) =>
    fetcher('/markets/oi-history', { asset, days }),
  fundingHistory: (asset: string, days = 30) =>
    fetcher('/markets/funding-history', { asset, days }),
};

export const orderbookAPI = {
  snapshot: (pair: string) => fetcher('/orderbook/snapshot', { pair }),
  spreadHistory: (pair: string) => fetcher('/orderbook/spread-history', { pair }),
};

export const tradersAPI = {
  leaderboard: (params?: { sort?: string; limit?: number }) =>
    fetcher('/traders/leaderboard', params),
  summary: (address: string) => fetcher(`/traders/${address}/summary`),
  positions: (address: string) => fetcher(`/traders/${address}/positions`),
  fills: (address: string, params?: { limit?: number }) =>
    fetcher(`/traders/${address}/fills`, params),
  pnl: (address: string) => fetcher(`/traders/${address}/pnl`),
};

export const compareAPI = {
  dex: () => fetcher('/compare/dex'),
  cex: () => fetcher('/compare/cex'),
};

export const protocolAPI = {
  stats: () => fetcher('/protocol/stats'),
  vaults: () => fetcher('/protocol/vaults'),
  staking: () => fetcher('/protocol/staking'),
};

export const healthAPI = {
  check: () => fetcher('/health'),
};
