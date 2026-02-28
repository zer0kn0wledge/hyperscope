'use client';
import { useQuery } from '@tanstack/react-query';
import {
  overviewAPI,
  marketsAPI,
  orderbookAPI,
  tradersAPI,
  compareAPI,
  protocolAPI,
  healthAPI,
} from '@/lib/api';
import { REFRESH_INTERVAL } from '@/lib/constants';

const STALE_TIME = 20_000;
const RETRY = 2;

// ─── Overview ───────────────────────────────────────────────────────────────────

export function useKPIs() {
  return useQuery({
    queryKey: ['kpis'],
    queryFn: overviewAPI.kpis,
    staleTime: STALE_TIME,
    refetchInterval: REFRESH_INTERVAL,
    retry: RETRY,
  });
}

export function useHeatmap() {
  return useQuery({
    queryKey: ['heatmap'],
    queryFn: overviewAPI.heatmap,
    staleTime: STALE_TIME,
    refetchInterval: REFRESH_INTERVAL,
    retry: RETRY,
  });
}

export function useSparklines() {
  return useQuery({
    queryKey: ['sparklines'],
    queryFn: overviewAPI.sparklines,
    staleTime: STALE_TIME,
    refetchInterval: REFRESH_INTERVAL,
    retry: RETRY,
  });
}

// ─── Markets ─────────────────────────────────────────────────────────────────

export function useAllAssets() {
  return useQuery({
    queryKey: ['markets', 'all'],
    queryFn: marketsAPI.all,
    staleTime: STALE_TIME,
    refetchInterval: REFRESH_INTERVAL,
    retry: RETRY,
  });
}

export function useAssetCandles(asset: string, interval = '1h') {
  return useQuery({
    queryKey: ['candles', asset, interval],
    queryFn: () => marketsAPI.candles(asset, interval),
    staleTime: STALE_TIME,
    refetchInterval: REFRESH_INTERVAL,
    retry: RETRY,
    enabled: !!asset,
  });
}

export function useAssetOIHistory(asset: string, days = 30) {
  return useQuery({
    queryKey: ['oi-history', asset, days],
    queryFn: () => marketsAPI.oiHistory(asset, days),
    staleTime: 60_000,
    retry: RETRY,
    enabled: !!asset,
  });
}

export function useAssetFundingHistory(asset: string, days = 30) {
  return useQuery({
    queryKey: ['funding-history', asset, days],
    queryFn: () => marketsAPI.fundingHistory(asset, days),
    staleTime: 60_000,
    retry: RETRY,
    enabled: !!asset,
  });
}

// ─── Orderbook ──────────────────────────────────────────────────────────────

export function useOrderbookSnapshot(pair: string) {
  return useQuery({
    queryKey: ['orderbook', pair],
    queryFn: () => orderbookAPI.snapshot(pair),
    staleTime: 5_000,
    refetchInterval: 10_000,
    retry: 1,
    enabled: !!pair,
  });
}

export function useSpreadHistory(pair: string) {
  return useQuery({
    queryKey: ['spread-history', pair],
    queryFn: () => orderbookAPI.spreadHistory(pair),
    staleTime: 30_000,
    retry: RETRY,
    enabled: !!pair,
  });
}

// ─── Traders ─────────────────────────────────────────────────────────────────

export function useLeaderboard(params?: { sort?: string; limit?: number }) {
  return useQuery({
    queryKey: ['leaderboard', params],
    queryFn: () => tradersAPI.leaderboard(params),
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: RETRY,
  });
}

export function useTraderSummary(address: string) {
  return useQuery({
    queryKey: ['trader-summary', address],
    queryFn: () => tradersAPI.summary(address),
    staleTime: STALE_TIME,
    refetchInterval: REFRESH_INTERVAL,
    retry: RETRY,
    enabled: !!address,
  });
}

export function useTraderPositions(address: string) {
  return useQuery({
    queryKey: ['trader-positions', address],
    queryFn: () => tradersAPI.positions(address),
    staleTime: STALE_TIME,
    refetchInterval: REFRESH_INTERVAL,
    retry: RETRY,
    enabled: !!address,
  });
}

export function useTraderFills(address: string, params?: { limit?: number }) {
  return useQuery({
    queryKey: ['trader-fills', address, params],
    queryFn: () => tradersAPI.fills(address, params),
    staleTime: STALE_TIME,
    retry: RETRY,
    enabled: !!address,
  });
}

export function useTraderPnL(address: string) {
  return useQuery({
    queryKey: ['trader-pnl', address],
    queryFn: () => tradersAPI.pnl(address),
    staleTime: 60_000,
    retry: RETRY,
    enabled: !!address,
  });
}

// ─── Compare ─────────────────────────────────────────────────────────────────

export function useDEXComparison() {
  return useQuery({
    queryKey: ['dex-compare'],
    queryFn: compareAPI.dex,
    staleTime: 60_000,
    refetchInterval: 120_000,
    retry: RETRY,
  });
}

export function useCEXComparison() {
  return useQuery({
    queryKey: ['cex-compare'],
    queryFn: compareAPI.cex,
    staleTime: 60_000,
    refetchInterval: 120_000,
    retry: RETRY,
  });
}

// ─── Protocol ────────────────────────────────────────────────────────────────

export function useProtocolStats() {
  return useQuery({
    queryKey: ['protocol-stats'],
    queryFn: protocolAPI.stats,
    staleTime: 60_000,
    refetchInterval: 120_000,
    retry: RETRY,
  });
}

export function useVaultList() {
  return useQuery({
    queryKey: ['vaults'],
    queryFn: protocolAPI.vaults,
    staleTime: 60_000,
    retry: RETRY,
  });
}

export function useStakingStats() {
  return useQuery({
    queryKey: ['staking'],
    queryFn: protocolAPI.staking,
    staleTime: 60_000,
    retry: RETRY,
  });
}

// ─── Health ────────────────────────────────────────────────────────────────────

export function useAPIHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: healthAPI.check,
    staleTime: 10_000,
    refetchInterval: 30_000,
    retry: 1,
  });
}
