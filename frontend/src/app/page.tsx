'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { PageContainer, SectionHeader } from '@/components/layout/PageContainer';
import { KPICard } from '@/components/ui/KPICard';
import { HeatMap } from '@/components/charts/HeatMap';
import { DataTable, Column } from '@/components/ui/DataTable';
import { SkeletonCard, SkeletonChart, SkeletonTable } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { useKPIs, useHeatmap, useSparklines, useAllAssets } from '@/hooks/useAPI';
import { fmt } from '@/lib/format';
import { CHART_COLORS } from '@/lib/constants';

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        minHeight: 200,
        color: 'rgba(255,255,255,0.4)',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '0.8125rem',
      }}
    >
      <span style={{ color: CHART_COLORS.red }}>{message}</span>
      <button
        onClick={onRetry}
        style={{
          background: 'rgba(0,255,136,0.08)',
          border: '1px solid rgba(0,255,136,0.2)',
          borderRadius: '8px',
          color: '#00ff88',
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.8125rem',
          padding: '0.5rem 1.25rem',
          cursor: 'pointer',
        }}
      >
        Retry
      </button>
    </div>
  );
}

export default function OverviewPage() {
  const { data: kpis, isLoading: kpisLoading, error: kpisError, refetch: refetchKPIs } = useKPIs();
  const { data: heatmapData, isLoading: heatmapLoading, error: heatmapError, refetch: refetchHeatmap } = useHeatmap();
  const { data: sparklines, isLoading: sparklinesLoading } = useSparklines();
  const { data: assetsData, isLoading: assetsLoading, error: assetsError, refetch: refetchAssets } = useAllAssets();

  // Prepare sparkline data (array<{value}>)
  const oiSparkline = useMemo(
    () => (sparklines?.oi ?? []).map((v: number) => ({ value: v })),
    [sparklines]
  );
  const volumeSparkline = useMemo(
    () => (sparklines?.volume ?? []).map((v: number) => ({ value: v })),
    [sparklines]
  );
  const hypeSparkline = useMemo(
    () => (sparklines?.hype_price ?? []).map((v: number) => ({ value: v })),
    [sparklines]
  );

  // Prepare heatmap data
  const heatmapItems = useMemo(() => {
    if (!heatmapData) return [];
    return (heatmapData as any[]).map((item) => ({
      asset: item.asset,
      change: item.change_pct,
      oi: item.oi_usd,
      volume: item.volume_24h,
      price: item.mark_px,
    }));
  }, [heatmapData]);

  // Top 20 assets by OI
  const top20Assets = useMemo(() => {
    if (!assetsData) return [];
    const sorted = [...(assetsData as any[])].sort((a, b) => (b.oi_usd ?? 0) - (a.oi_usd ?? 0));
    return sorted.slice(0, 20);
  }, [assetsData]);

  const assetColumns: Column[] = [
    {
      key: 'asset',
      label: 'Asset',
      sortable: true,
      render: (val: string) => (
        <Link
          href={`/markets/${val}`}
          style={{ color: '#00ff88', textDecoration: 'none', fontWeight: 500 }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none')}
        >
          {val}
        </Link>
      ),
    },
    {
      key: 'mark_px',
      label: 'Price',
      align: 'right',
      sortable: true,
      render: (val: number) => (
        <span style={{ color: '#e8e8e8' }}>{fmt.price(val)}</span>
      ),
    },
    {
      key: 'oi_usd',
      label: 'Open Interest',
      align: 'right',
      sortable: true,
      render: (val: number) => fmt.usd(val),
    },
    {
      key: 'volume_24h',
      label: '24h Volume',
      align: 'right',
      sortable: true,
      render: (val: number) => fmt.usd(val),
    },
    {
      key: 'funding',
      label: 'Funding',
      align: 'right',
      sortable: true,
      render: (val: number) => (
        <span style={{ color: val >= 0 ? CHART_COLORS.neon : CHART_COLORS.red }}>
          {fmt.funding(val)}
        </span>
      ),
    },
    {
      key: 'change_pct',
      label: '24h %',
      align: 'right',
      sortable: true,
      render: (val: number) => {
        const positive = val >= 0;
        return (
          <span style={{ color: positive ? CHART_COLORS.neon : CHART_COLORS.red, fontWeight: 500 }}>
            {positive ? '+' : ''}{(val ?? 0).toFixed(2)}%
          </span>
        );
      },
    },
  ];

  const isLoading = kpisLoading || sparklinesLoading;

  return (
    <PageContainer>
      {/* Page Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.375rem' }}>
          <h1
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#e8e8e8',
              margin: 0,
              letterSpacing: '-0.02em',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Hyperliquid Markets Overview
          </h1>
          <Badge variant="neon" dot>LIVE</Badge>
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.35)', margin: 0, fontFamily: 'Inter, sans-serif' }}>
          live market intelligence
        </p>
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : kpisError ? (
        <ErrorState message="Failed to load KPIs" onRetry={refetchKPIs} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          <KPICard
            label="Total Open Interest"
            value={fmt.usd(kpis?.total_open_interest)}
            sub="across all perpetuals"
            sparklineData={oiSparkline}
          />
          <KPICard
            label="24h Volume"
            value={fmt.usd(kpis?.total_volume_24h)}
            sub="rolling 24h total"
            sparklineData={volumeSparkline}
          />
          <KPICard
            label="HYPE Price"
            value={`$${fmt.price(kpis?.hype_price)}`}
            sub="native token"
            change={kpis?.hype_change_24h != null ? kpis.hype_change_24h / 100 : undefined}
            sparklineData={hypeSparkline}
          />
          <KPICard
            label="TVL"
            value={fmt.usd(kpis?.tvl)}
            sub="total value locked"
          />
        </div>
      )}

      {/* Heatmap */}
      <div className="card" style={{ marginBottom: '2rem', padding: '1.25rem' }}>
        <SectionHeader
          title="Market Heatmap"
          subtitle="Tile size = open interest · Color = 24h % change"
        />
        {heatmapLoading ? (
          <SkeletonChart height={220} />
        ) : heatmapError ? (
          <ErrorState message="Failed to load heatmap" onRetry={refetchHeatmap} />
        ) : (
          <HeatMap data={heatmapItems} minTileSize={44} maxTileSize={110} />
        )}
      </div>

      {/* Top 20 Assets Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.25rem 0' }}>
          <SectionHeader
            title="Top 20 Markets by Open Interest"
            subtitle="Click any asset to view detailed charts"
          />
        </div>
        {assetsLoading ? (
          <SkeletonTable rows={10} cols={6} />
        ) : assetsError ? (
          <div style={{ padding: '1.25rem' }}>
            <ErrorState message="Failed to load assets" onRetry={refetchAssets} />
          </div>
        ) : (
          <DataTable
            columns={assetColumns}
            data={top20Assets}
            rowKey={(row) => row.asset}
            emptyMessage="No assets available"
          />
        )}
      </div>
    </PageContainer>
  );
}
