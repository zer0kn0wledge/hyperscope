import { API_URL } from './constants';
import type {
  KPIData,
  HeatmapAsset,
  RecentTrade,
  LargeTrade,
  MarketAsset,
  FundingRateEntry,
  OIDistributionEntry,
  VolumeHistoryEntry,
  CandleData,
  FundingHistoryEntry,
  LiquidationEntry,
  TakerVolumeEntry,
  OIHistoryEntry,
  OrderbookSnapshot,
  SpreadHistoryEntry,
  LargeOrder,
  TraderLeaderboardEntry,
  AccountSummary,
  Position,
  TradeHistoryEntry,
  FundingHistoryUserEntry,
  OpenOrder,
  PnLChartEntry,
  SubAccount,
  FeesData,
  RevenueData,
  AFData,
  HLPData,
  StakingData,
  HypeTokenData,
  DEXSnapshot,
  DEXVolumeHistory,
  DEXOIHistory,
  FundingRateComparison,
  CEXSnapshot,
  CEXOIHistory,
  CEXVolumeHistory,
  CEXLiquidations,
  LongShortRatio,
  PaginatedResponse,
} from './types';

class APIError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'APIError';
  }
}

async function request<T>(
  path: string,
  params?: Record<string, string | number | boolean>
): Promise<T> {
  const url = new URL(`${API_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });
  }

  const res = await fetch(url.toString(), {
    headers: { 'Accept': 'application/json' },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new APIError(
      `API request failed: ${res.statusText}`,
      res.status
    );
  }

  return res.json() as Promise<T>;
}

// Overview API
export const overviewAPI = {
  getKPIs: () => request<KPIData>('/api/overview/kpis'),
  getHeatmap: () => request<HeatmapAsset[]>('/api/overview/heatmap'),
  getRecentTrades: () => request<RecentTrade[]>('/api/overview/recent-trades'),
  getSparklines: () => request<KPIData['sparklines']>('/api/overview/sparklines'),
  getLargeTrades: () => request<LargeTrade[]>('/api/overview/recent-trades'),
};

// Markets API
export const marketsAPI = {
  getAllAssets: () => request<MarketAsset[]>('/api/markets/assets'),
  getFundingRates: () => request<FundingRateEntry[]>('/api/markets/funding-rates'),
  getOIDistribution: () => request<OIDistributionEntry[]>('/api/markets/oi-distribution'),
  getVolumeHistory: () => request<VolumeHistoryEntry[]>('/api/markets/volume-history'),
  getAssetCandles: (
    asset: string,
    interval: string,
    startTime?: number,
    endTime?: number
  ) =>
    request<CandleData[]>(`/api/markets/${asset}/candles`, {
      interval,
      ...(startTime ? { startTime } : {}),
      ...(endTime ? { endTime } : {}),
    }),
  getAssetOIHistory: (asset: string, interval?: string) =>
    request<OIHistoryEntry[]>(`/api/markets/${asset}/oi-history`, {
      ...(interval ? { interval } : {}),
    }),
  getAssetFundingHistory: (asset: string) =>
    request<FundingHistoryEntry[]>(`/api/markets/${asset}/funding-history`),
  getAssetLiquidations: (asset: string) =>
    request<LiquidationEntry[]>(`/api/markets/${asset}/liquidations`),
  getAssetTakerVolume: (asset: string) =>
    request<TakerVolumeEntry[]>(`/api/markets/${asset}/taker-volume`),
};

// Orderbook API
export const orderbookAPI = {
  getSnapshot: (pair: string) =>
    request<OrderbookSnapshot>(`/api/orderbook/${pair}`),
  getSpreadHistory: (pair: string, window?: string) =>
    request<SpreadHistoryEntry[]>(`/api/orderbook/${pair}/spread-history`, {
      ...(window ? { window } : {}),
    }),
  getLargeOrders: (pair: string) =>
    request<LargeOrder[]>(`/api/orderbook/${pair}/large-orders`),
};

// Traders API
export const tradersAPI = {
  getLeaderboard: (params?: { sort?: string; limit?: number }) =>
    request<TraderLeaderboardEntry[]>('/api/traders/leaderboard', params),
  getDistribution: () =>
    request<Array<{ bucket: string; count: number }>>('/api/traders/distribution'),
  getAccountSummary: (address: string) =>
    request<AccountSummary>(`/api/traders/${address}/summary`),
  getPositions: (address: string) =>
    request<Position[]>(`/api/traders/${address}/positions`),
  getFills: (
    address: string,
    params?: { page?: number; pageSize?: number; asset?: string }
  ) =>
    request<PaginatedResponse<TradeHistoryEntry>>(
      `/api/traders/${address}/fills`,
      params
    ),
  getFundingHistory: (address: string) =>
    request<FundingHistoryUserEntry[]>(`/api/traders/${address}/funding`),
  getPnLChart: (address: string, period?: string) =>
    request<PnLChartEntry[]>(`/api/traders/${address}/pnl-chart`, {
      ...(period ? { period } : {}),
    }),
  getOpenOrders: (address: string) =>
    request<OpenOrder[]>(`/api/traders/${address}/orders`),
  getSubAccounts: (address: string) =>
    request<SubAccount[]>(`/api/traders/${address}/sub-accounts`),
};

// Protocol API
export const protocolAPI = {
  getFees: (period?: string) =>
    request<FeesData>('/api/protocol/fees', { ...(period ? { period } : {}) }),
  getRevenue: () => request<RevenueData>('/api/protocol/revenue'),
  getAF: () => request<AFData>('/api/protocol/af'),
  getHLP: () => request<HLPData>('/api/protocol/hlp'),
  getStaking: () => request<StakingData>('/api/protocol/staking'),
  getHype: () => request<HypeTokenData>('/api/protocol/hype'),
};

// Compare DEX API
export const compareDEXAPI = {
  getSnapshot: () => request<DEXSnapshot[]>('/api/compare/dex/snapshot'),
  getVolumeHistory: () => request<DEXVolumeHistory[]>('/api/compare/dex/volume-history'),
  getOIHistory: () => request<DEXOIHistory[]>('/api/compare/dex/oi-history'),
  getFundingRates: () =>
    request<FundingRateComparison[]>('/api/compare/dex/funding-rates'),
};

// Compare CEX API
export const compareCEXAPI = {
  getSnapshot: () => request<CEXSnapshot[]>('/api/compare/cex/snapshot'),
  getOIHistory: () => request<CEXOIHistory[]>('/api/compare/cex/oi-history'),
  getVolumeHistory: () =>
    request<CEXVolumeHistory[]>('/api/compare/cex/volume-history'),
  getFundingHistory: () =>
    request<CEXVolumeHistory[]>('/api/compare/cex/funding-history'),
  getLiquidations: () =>
    request<CEXLiquidations[]>('/api/compare/cex/liquidations'),
  getLongShortRatio: () =>
    request<LongShortRatio[]>('/api/compare/cex/long-short'),
};

// Health / Status
export const statusAPI = {
  getHealth: () => request<{ status: string; version: string; uptime_seconds: number }>('/health'),
  getStatus: () =>
    request<{
      data_sources: Record<string, boolean>;
      last_refresh: Record<string, string>;
    }>('/api/status'),
};
