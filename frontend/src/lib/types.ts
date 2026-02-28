// ============================================================
// API Response Types
// ============================================================

export interface KPIData {
  totalVolume24h: number;
  totalOpenInterest: number;
  totalUsers: number;
  hypePrice: number;
  hypePriceChange24h: number;
  tvl: number;
  sparklines: {
    volume: number[];
    openInterest: number[];
    hypePrice: number[];
    tvl: number[];
  };
  updatedAt: string;
}

export interface HeatmapAsset {
  asset: string;
  priceChange24h: number;
  volume24h: number;
  markPx: number;
  openInterest: number;
}

export interface RecentTrade {
  id: string;
  time: number;
  pair: string;
  side: 'buy' | 'sell';
  size: number;
  price: number;
  notional: number;
  trader: string;
}

// ============================================================
// Market Types
// ============================================================

export interface MarketAsset {
  asset: string;
  markPx: number;
  prevDayPx: number;
  priceChange24h: number;
  priceChangePct24h: number;
  volume24h: number;
  openInterest: number;
  openInterestUsd: number;
  fundingRate: number;
  nextFundingRate: number;
  sparkline: number[];
}

export interface FundingRateEntry {
  asset: string;
  fundingRate: number;
  annualizedRate: number;
  predictedRate: number;
  sum1h: number;
  sum8h: number;
  sum24h: number;
}

export interface OIDistributionEntry {
  asset: string;
  openInterestUsd: number;
  percentage: number;
}

export interface VolumeHistoryEntry {
  date: string;
  perpVolume: number;
  spotVolume: number;
  total: number;
}

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface FundingHistoryEntry {
  time: number;
  fundingRate: number;
  premium: number;
}

export interface LiquidationEntry {
  time: number;
  longLiquidations: number;
  shortLiquidations: number;
}

export interface TakerVolumeEntry {
  time: number;
  buyVolume: number;
  sellVolume: number;
}

export interface OIHistoryEntry {
  time: number;
  openInterest: number;
}

// ============================================================
// Orderbook Types
// ============================================================

export interface OrderbookLevel {
  price: number;
  size: number;
  total: number;
  count?: number;
}

export interface OrderbookSnapshot {
  pair: string;
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  midPrice: number;
  spread: number;
  spreadBps: number;
  timestamp: number;
}

export interface SpreadHistoryEntry {
  time: number;
  spread: number;
  spreadBps: number;
}

export interface LargeOrder {
  id: string;
  price: number;
  size: number;
  side: 'bid' | 'ask';
  notional: number;
  timestamp: number;
  status: 'new' | 'cancelled' | 'filled';
}

// ============================================================
// Trader Types
// ============================================================

export interface TraderLeaderboardEntry {
  rank: number;
  address: string;
  realizedPnl30d: number;
  unrealizedPnl: number;
  volume30d: number;
  largestPositionUsd: number;
  winRate: number;
  totalTrades: number;
}

export interface AccountSummary {
  address: string;
  accountValue: number;
  withdrawable: number;
  unrealizedPnl: number;
  marginUsed: number;
  crossMarginRatio: number;
  leverage: number;
}

export interface Position {
  asset: string;
  side: 'long' | 'short';
  sizeUsd: number;
  sizeTokens: number;
  entryPrice: number;
  markPrice: number;
  liqPrice: number;
  unrealizedPnl: number;
  roe: number;
  leverage: number;
  marginUsed: number;
}

export interface TradeHistoryEntry {
  id: string;
  time: number;
  asset: string;
  side: 'buy' | 'sell';
  size: number;
  price: number;
  fee: number;
  closedPnl: number;
  type: 'open' | 'close' | 'liquidation' | 'partial';
  hash: string;
}

export interface FundingHistoryUserEntry {
  time: number;
  asset: string;
  fundingPaid: number;
  fundingReceived: number;
  net: number;
}

export interface OpenOrder {
  id: string;
  asset: string;
  side: 'buy' | 'sell';
  orderType: 'limit' | 'market' | 'stop' | 'tp';
  price: number;
  triggerPrice?: number;
  size: number;
  filled: number;
  timestamp: number;
}

export interface PnLChartEntry {
  time: number;
  cumulativePnl: number;
  dailyPnl: number;
}

export interface SubAccount {
  address: string;
  name?: string;
  accountValue: number;
  unrealizedPnl: number;
}

// ============================================================
// Protocol Types
// ============================================================

export interface FeesData {
  total24h: number;
  total7d: number;
  total30d: number;
  totalAllTime: number;
  chart: Array<{ date: string; fees: number }>;
}

export interface RevenueData {
  afRevenue: number;
  hlpRevenue: number;
  total: number;
  afPercentage: number;
  hlpPercentage: number;
}

export interface AFData {
  hypeBalance: number;
  hypeBalanceUsd: number;
  cumulativeBuybacks: number;
  recentBuybacks: Array<{ time: number; amount: number; usdValue: number }>;
  balanceHistory: Array<{ time: number; balance: number }>;
}

export interface HLPData {
  tvl: number;
  apr: number;
  cumulativePnl: number;
  depositorCount: number;
  tvlHistory: Array<{ time: number; tvl: number }>;
  pnlHistory: Array<{ time: number; pnl: number }>;
  positions: Position[];
}

export interface ValidatorEntry {
  name: string;
  address: string;
  stake: number;
  stakePercentage: number;
  apr: number;
  isActive: boolean;
}

export interface StakingData {
  totalStaked: number;
  totalStakedUsd: number;
  validatorCount: number;
  estimatedApr: number;
  validators: ValidatorEntry[];
}

export interface HypeTokenData {
  price: number;
  priceChange24h: number;
  priceChange7d: number;
  marketCap: number;
  fdv: number;
  circulatingSupply: number;
  totalSupply: number;
  volume24h: number;
}

// ============================================================
// Compare Types
// ============================================================

export interface DEXSnapshot {
  name: string;
  volume24h: number;
  openInterest: number;
  pairsCount: number;
  topFundingRate: number;
  topFundingAsset: string;
}

export interface DEXVolumeHistory {
  date: string;
  exchanges: Record<string, number>;
}

export interface DEXOIHistory {
  date: string;
  exchanges: Record<string, number>;
}

export interface FundingRateComparison {
  asset: string;
  rates: Record<string, number>;
}

export interface CEXSnapshot {
  name: string;
  isDex: boolean;
  volume24h: number;
  openInterest: number;
  btcFundingRate: number;
  ethFundingRate: number;
}

export interface CEXOIHistory {
  time: number;
  hyperliquid: number;
  binance: number;
  bybit: number;
  okx: number;
}

export interface CEXVolumeHistory {
  date: string;
  hyperliquid: number;
  binance: number;
  bybit: number;
  okx: number;
}

export interface CEXLiquidations {
  date: string;
  exchanges: Record<string, { longs: number; shorts: number }>;
}

export interface LongShortRatio {
  time: number;
  binance: number;
  bybit: number;
  okx: number;
}

// ============================================================
// Settings Types
// ============================================================

export interface AppSettings {
  theme: 'cyan' | 'green';
  timezone: 'utc' | 'local';
  denomination: 'usd' | 'btc';
  refreshIntervals: {
    overview: number;
    markets: number;
    orderbook: number;
    traders: number;
    protocol: number;
  };
}

// ============================================================
// WebSocket Types
// ============================================================

export type WSChannel =
  | 'l2book'
  | 'trades'
  | 'allMids'
  | 'bbo'
  | 'liquidations';

export interface WSMessage {
  channel: string;
  data: unknown;
}

export interface WSSubscription {
  channel: WSChannel;
  pair?: string;
}

// ============================================================
// API Client Types
// ============================================================

export interface APIError {
  message: string;
  status: number;
  code?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
