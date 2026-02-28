import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  overviewAPI,
  marketsAPI,
  orderbookAPI,
  tradersAPI,
  protocolAPI,
  compareDEXAPI,
  compareCEXAPI,
  statusAPI,
} from '@/lib/api';
import { REFETCH } from '@/lib/constants';

// ============================================================
// Overview Hooks
// ============================================================

export function useKPIs() {
  return useQuery({
    queryKey: ['overview', 'kpis'],
    queryFn: overviewAPI.getKPIs,
    staleTime: REFETCH.FAST,
    refetchInterval: REFETCH.MEDIUM,
  });
}

export function useHeatmap() {
  return useQuery({
    queryKey: ['overview', 'heatmap'],
    queryFn: overviewAPI.getHeatmap,
    staleTime: REFETCH.FAST,
    refetchInterval: REFETCH.FAST,
  });
}

export function useRecentTrades() {
  return useQuery({
    queryKey: ['overview', 'recent-trades'],
    queryFn: overviewAPI.getRecentTrades,
    staleTime: 5_000,
    refetchInterval: 10_000,
  });
}

// ============================================================
// Markets Hooks
// ============================================================

export function useAllAssets() {
  return useQuery({
    queryKey: ['markets', 'assets'],
    queryFn: marketsAPI.getAllAssets,
    staleTime: REFETCH.FAST,
    refetchInterval: REFETCH.FAST,
  });
}

export function useFundingRates() {
  return useQuery({
    queryKey: ['markets', 'funding-rates'],
    queryFn: marketsAPI.getFundingRates,
    staleTime: REFETCH.SLOW,
    refetchInterval: REFETCH.SLOW,
  });
}

export function useOIDistribution() {
  return useQuery({
    queryKey: ['markets', 'oi-distribution'],
    queryFn: marketsAPI.getOIDistribution,
    staleTime: REFETCH.MEDIUM,
    refetchInterval: REFETCH.MEDIUM,
  });
}

export function useVolumeHistory() {
  return useQuery({
    queryKey: ['markets', 'volume-history'],
    queryFn: marketsAPI.getVolumeHistory,
    staleTime: REFETCH.SLOW,
    refetchInterval: REFETCH.PROTOCOL,
  });
}

export function useAssetCandles(
  asset: string,
  interval: string,
  enabled = true
) {
  return useQuery({
    queryKey: ['candles', asset, interval],
    queryFn: () => marketsAPI.getAssetCandles(asset, interval),
    staleTime: REFETCH.SLOW,
    refetchInterval: REFETCH.SLOW,
    enabled: enabled && Boolean(asset),
  });
}

export function useAssetOIHistory(asset: string, interval?: string) {
  return useQuery({
    queryKey: ['oi-history', asset, interval],
    queryFn: () => marketsAPI.getAssetOIHistory(asset, interval),
    staleTime: REFETCH.PROTOCOL,
    refetchInterval: REFETCH.PROTOCOL,
    enabled: Boolean(asset),
  });
}

export function useAssetFundingHistory(asset: string) {
  return useQuery({
    queryKey: ['funding-history', asset],
    queryFn: () => marketsAPI.getAssetFundingHistory(asset),
    staleTime: REFETCH.PROTOCOL,
    refetchInterval: REFETCH.PROTOCOL,
    enabled: Boolean(asset),
  });
}

export function useAssetLiquidations(asset: string) {
  return useQuery({
    queryKey: ['liquidations', asset],
    queryFn: () => marketsAPI.getAssetLiquidations(asset),
    staleTime: REFETCH.PROTOCOL,
    refetchInterval: REFETCH.PROTOCOL,
    enabled: Boolean(asset),
  });
}

export function useAssetTakerVolume(asset: string) {
  return useQuery({
    queryKey: ['taker-volume', asset],
    queryFn: () => marketsAPI.getAssetTakerVolume(asset),
    staleTime: REFETCH.PROTOCOL,
    refetchInterval: REFETCH.PROTOCOL,
    enabled: Boolean(asset),
  });
}

// ============================================================
// Orderbook Hooks
// ============================================================

export function useOrderbookSnapshot(pair: string, enabled = true) {
  return useQuery({
    queryKey: ['orderbook', pair, 'snapshot'],
    queryFn: () => orderbookAPI.getSnapshot(pair),
    staleTime: Infinity, // WS updates take over after initial load
    enabled: enabled && Boolean(pair),
  });
}

export function useSpreadHistory(pair: string, window?: string) {
  return useQuery({
    queryKey: ['orderbook', pair, 'spread-history', window],
    queryFn: () => orderbookAPI.getSpreadHistory(pair, window),
    staleTime: REFETCH.PROTOCOL,
    refetchInterval: REFETCH.PROTOCOL,
    enabled: Boolean(pair),
  });
}

export function useLargeOrders(pair: string) {
  return useQuery({
    queryKey: ['orderbook', pair, 'large-orders'],
    queryFn: () => orderbookAPI.getLargeOrders(pair),
    staleTime: REFETCH.MEDIUM,
    refetchInterval: REFETCH.MEDIUM,
    enabled: Boolean(pair),
  });
}

// ============================================================
// Traders Hooks
// ============================================================

export function useLeaderboard(sort?: string, limit?: number) {
  return useQuery({
    queryKey: ['traders', 'leaderboard', sort, limit],
    queryFn: () => tradersAPI.getLeaderboard({ sort, limit }),
    staleTime: REFETCH.PROTOCOL,
    refetchInterval: REFETCH.PROTOCOL,
  });
}

export function useTraderDistribution() {
  return useQuery({
    queryKey: ['traders', 'distribution'],
    queryFn: tradersAPI.getDistribution,
    staleTime: REFETCH.PROTOCOL,
    refetchInterval: REFETCH.PROTOCOL,
  });
}

export function useAccountSummary(address: string) {
  return useQuery({
    queryKey: ['trader', address, 'summary'],
    queryFn: () => tradersAPI.getAccountSummary(address),
    staleTime: REFETCH.MEDIUM,
    refetchInterval: REFETCH.MEDIUM,
    enabled: Boolean(address),
  });
}

export function usePositions(address: string) {
  return useQuery({
    queryKey: ['trader', address, 'positions'],
    queryFn: () => tradersAPI.getPositions(address),
    staleTime: REFETCH.MEDIUM,
    refetchInterval: REFETCH.MEDIUM,
    enabled: Boolean(address),
  });
}

export function useFills(address: string, page = 1, asset?: string) {
  return useQuery({
    queryKey: ['trader', address, 'fills', page, asset],
    queryFn: () => tradersAPI.getFills(address, { page, pageSize: 50, ...(asset ? { asset } : {}) }),
    staleTime: 120_000,
    enabled: Boolean(address),
  });
}

export function useUserFundingHistory(address: string) {
  return useQuery({
    queryKey: ['trader', address, 'funding'],
    queryFn: () => tradersAPI.getFundingHistory(address),
    staleTime: REFETCH.PROTOCOL,
    refetchInterval: REFETCH.PROTOCOL,
    enabled: Boolean(address),
  });
}

export function usePnLChart(address: string, period?: string) {
  return useQuery({
    queryKey: ['trader', address, 'pnl-chart', period],
    queryFn: () => tradersAPI.getPnLChart(address, period),
    staleTime: REFETCH.PROTOCOL,
    refetchInterval: REFETCH.PROTOCOL,
    enabled: Boolean(address),
  });
}

export function useOpenOrders(address: string) {
  return useQuery({
    queryKey: ['trader', address, 'orders'],
    queryFn: () => tradersAPI.getOpenOrders(address),
    staleTime: REFETCH.MEDIUM,
    refetchInterval: REFETCH.MEDIUM,
    enabled: Boolean(address),
  });
}

export function useSubAccounts(address: string) {
  return useQuery({
    queryKey: ['trader', address, 'subaccounts'],
    queryFn: () => tradersAPI.getSubAccounts(address),
    staleTime: REFETCH.PROTOCOL,
    enabled: Boolean(address),
  });
}

// ============================================================
// Protocol Hooks
// ============================================================

export function useFees(period?: string) {
  return useQuery({
    queryKey: ['protocol', 'fees', period],
    queryFn: () => protocolAPI.getFees(period),
    staleTime: REFETCH.LONG,
    refetchInterval: REFETCH.LONG,
  });
}

export function useRevenue() {
  return useQuery({
    queryKey: ['protocol', 'revenue'],
    queryFn: protocolAPI.getRevenue,
    staleTime: REFETCH.LONG,
    refetchInterval: REFETCH.LONG,
  });
}

export function useAF() {
  return useQuery({
    queryKey: ['protocol', 'af'],
    queryFn: protocolAPI.getAF,
    staleTime: REFETCH.PROTOCOL,
    refetchInterval: REFETCH.PROTOCOL,
  });
}

export function useHLP() {
  return useQuery({
    queryKey: ['protocol', 'hlp'],
    queryFn: protocolAPI.getHLP,
    staleTime: REFETCH.PROTOCOL,
    refetchInterval: REFETCH.PROTOCOL,
  });
}

export function useStaking() {
  return useQuery({
    queryKey: ['protocol', 'staking'],
    queryFn: protocolAPI.getStaking,
    staleTime: REFETCH.LONG,
    refetchInterval: REFETCH.LONG,
  });
}

export function useHypeToken() {
  return useQuery({
    queryKey: ['protocol', 'hype'],
    queryFn: protocolAPI.getHype,
    staleTime: REFETCH.MEDIUM,
    refetchInterval: REFETCH.MEDIUM,
  });
}

// ============================================================
// Compare DEX Hooks
// ============================================================

export function useDEXSnapshot() {
  return useQuery({
    queryKey: ['compare', 'dex', 'snapshot'],
    queryFn: compareDEXAPI.getSnapshot,
    staleTime: REFETCH.SLOW,
    refetchInterval: REFETCH.SLOW,
  });
}

export function useDEXVolumeHistory() {
  return useQuery({
    queryKey: ['compare', 'dex', 'volume-history'],
    queryFn: compareDEXAPI.getVolumeHistory,
    staleTime: REFETCH.PROTOCOL,
    refetchInterval: REFETCH.PROTOCOL,
  });
}

export function useDEXOIHistory() {
  return useQuery({
    queryKey: ['compare', 'dex', 'oi-history'],
    queryFn: compareDEXAPI.getOIHistory,
    staleTime: REFETCH.PROTOCOL,
    refetchInterval: REFETCH.PROTOCOL,
  });
}

export function useDEXFundingRates() {
  return useQuery({
    queryKey: ['compare', 'dex', 'funding-rates'],
    queryFn: compareDEXAPI.getFundingRates,
    staleTime: REFETCH.SLOW,
    refetchInterval: REFETCH.SLOW,
  });
}

// ============================================================
// Compare CEX Hooks
// ============================================================

export function useCEXSnapshot() {
  return useQuery({
    queryKey: ['compare', 'cex', 'snapshot'],
    queryFn: compareCEXAPI.getSnapshot,
    staleTime: REFETCH.MEDIUM,
    refetchInterval: REFETCH.MEDIUM,
  });
}

export function useCEXOIHistory() {
  return useQuery({
    queryKey: ['compare', 'cex', 'oi-history'],
    queryFn: compareCEXAPI.getOIHistory,
    staleTime: REFETCH.PROTOCOL,
    refetchInterval: REFETCH.PROTOCOL,
  });
}

export function useCEXVolumeHistory() {
  return useQuery({
    queryKey: ['compare', 'cex', 'volume-history'],
    queryFn: compareCEXAPI.getVolumeHistory,
    staleTime: REFETCH.PROTOCOL,
    refetchInterval: REFETCH.PROTOCOL,
  });
}

export function useCEXFundingHistory() {
  return useQuery({
    queryKey: ['compare', 'cex', 'funding-history'],
    queryFn: compareCEXAPI.getFundingHistory,
    staleTime: REFETCH.PROTOCOL,
    refetchInterval: REFETCH.PROTOCOL,
  });
}

export function useCEXLiquidations() {
  return useQuery({
    queryKey: ['compare', 'cex', 'liquidations'],
    queryFn: compareCEXAPI.getLiquidations,
    staleTime: REFETCH.PROTOCOL,
    refetchInterval: REFETCH.PROTOCOL,
  });
}

export function useLongShortRatio() {
  return useQuery({
    queryKey: ['compare', 'cex', 'long-short'],
    queryFn: compareCEXAPI.getLongShortRatio,
    staleTime: REFETCH.PROTOCOL,
    refetchInterval: REFETCH.PROTOCOL,
  });
}

// ============================================================
// Status Hook
// ============================================================

export function useStatus() {
  return useQuery({
    queryKey: ['status'],
    queryFn: statusAPI.getStatus,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

// ============================================================
// Invalidation helpers
// ============================================================

export function useInvalidateAll() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries();
}
