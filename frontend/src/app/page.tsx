'use client';

import { PageContainer, SectionHeader } from '@/components/layout/PageContainer';
import { KPICard } from '@/components/ui/KPICard';
import { HeatMap } from '@/components/charts/HeatMap';
import { Sparkline } from '@/components/charts/Sparkline';
import { AreaChartComponent } from '@/components/charts/AreaChart';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import {
  useKPIs,
  useHeatmap,
  useSparklines,
  useLargeTrades,
  useVolumeHistory,
  useOIDistribution,
  useFundingRates,
} from '@/hooks/useAPI';
import { useLargeTradesWS } from '@/hooks/useWebSocket';
import { formatUSD, formatPercent, formatPrice, formatDate, formatFunding, fundingClass } from '@/lib/format';
import { CHART_COLORS } from '@/lib/constants';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...classes: (string | undefined | null | boolean)[]) {
  return twMerge(clsx(classes));
}

type AnyRecord = Record<string, unknown>;

// Trade table columns
const TRADE_COLUMNS: Column<AnyRecord>[] = [
  {
    key: 'side',
    header: 'Side',
    render: (v) => (
      <Badge variant={String(v) === 'buy' ? 'buy' : 'sell'}>
        {String(v).toUpperCase()}
      </Badge>
    ),
  },
  {
    key: 'coin',
    header: 'Asset',
    render: (v) => <span className="font-medium text-text-primary">{String(v)}</span>,
  },
  {
    key: 'price',
    header: 'Price',
    align: 'right',
    render: (v) => <span className="number">${formatPrice(Number(v))}</span>,
  },
  {
    key: 'size',
    header: 'Size',
    align: 'right',
    render: (v) => <span className="number">{Number(v).toFixed(4)}</span>,
  },
  {
    key: 'notional',
    header: 'Notional',
    align: 'right',
    render: (v) => <span className="number">{formatUSD(Number(v))}</span>,
  },
  {
    key: 'time',
    header: 'Time',
    align: 'right',
    render: (v) => (
      <span className="number text-text-secondary">{formatDate(Number(v))}</span>
    ),
  },
];

// Funding rate columns for top assets
const FUNDING_COLUMNS: Column<AnyRecord>[] = [
  {
    key: 'asset',
    header: 'Asset',
    render: (v) => <span className="font-medium text-text-primary">{String(v ?? (v as AnyRecord)?.coin)}</span>,
  },
  {
    key: 'funding_rate',
    header: 'Funding Rate',
    align: 'right',
    render: (v) => {
      const val = Number(v);
      if (!isFinite(val)) return <span className="text-text-muted">-</span>;
      return <span className={cn('number', fundingClass(val))}>{formatFunding(val)}</span>;
    },
  },
  {
    key: 'mark_px',
    header: 'Mark Price',
    align: 'right',
    render: (v) => <span className="number">${formatPrice(Number(v))}</span>,
  },
  {
    key: 'oi_usd',
    header: 'Open Interest',
    align: 'right',
    render: (v) => <span className="number">{formatUSD(Number(v))}</span>,
  },
];

export default function OverviewPage() {
  const { data: kpis, isLoading: kpisLoading } = useKPIs();
  const { data: heatmap, isLoading: heatmapLoading } = useHeatmap();
  const { data: sparklines } = useSparklines();
  const { data: initialTrades, isLoading: tradesLoading } = useLargeTrades();
  const { data: volumeHistory, isLoading: volLoading } = useVolumeHistory();
  const { data: oiDist, isLoading: oiLoading } = useOIDistribution();
  const { data: fundingRates, isLoading: fundLoading } = useFundingRates();

  const trades = useLargeTradesWS((initialTrades ?? []) as AnyRecord[]);

  // Type the kpis response loosely since backend returns snake_case
  const k = kpis as AnyRecord | undefined;

  // Sparklines data
  const spark = sparklines as AnyRecord | undefined;
  const sparkOI = (spark?.oi ?? spark?.openInterest ?? []) as number[];
  const sparkVol = (spark?.volume ?? []) as number[];
  const sparkHype = (spark?.hype_price ?? spark?.hypePrice ?? []) as number[];

  // Volume history for chart (backend returns {timestamp, total_volume})
  const volChartData = ((volumeHistory ?? []) as AnyRecord[]).map((d) => ({
    time: Number(d.timestamp ?? d.date ?? 0),
    volume: Number(d.total_volume ?? d.total ?? d.perpVolume ?? 0),
  }));

  // OI distribution for chart (backend returns {assets: [{asset, oi_usd, oi_pct}], total_oi_usd})
  const oiDistData = oiDist as AnyRecord | undefined;
  const oiAssets = ((oiDistData?.assets ?? oiDist ?? []) as AnyRecord[]).slice(0, 10);

  // Funding rates (top 20)
  const fundingData = ((fundingRates ?? []) as AnyRecord[]).slice(0, 20);

  return (
    <PageContainer>
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          label="Total Open Interest"
          value={k?.total_open_interest ? formatUSD(Number(k.total_open_interest)) : undefined}
          isLoading={kpisLoading}
          sparklineData={sparkOI}
        />
        <KPICard
          label="24h Volume"
          value={k?.total_volume_24h ? formatUSD(Number(k.total_volume_24h)) : undefined}
          isLoading={kpisLoading}
          sparklineData={sparkVol}
        />
        <KPICard
          label="HYPE Price"
          value={k?.hype_price ? formatUSD(Number(k.hype_price)) : '$-'}
          isLoading={kpisLoading}
          sparklineData={sparkHype}
          change={k?.hype_change_24h ? Number(k.hype_change_24h) : undefined}
        />
        <KPICard
          label="TVL"
          value={k?.tvl ? formatUSD(Number(k.tvl)) : undefined}
          isLoading={kpisLoading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Volume Chart */}
        <div className="card p-4">
          <h3 className="text-text-primary font-semibold text-sm mb-1">24h Volume History</h3>
          <p className="text-text-tertiary text-xs mb-3">Total perp trading volume over time</p>
          <AreaChartComponent
            data={volChartData}
            series={[{ key: 'volume', name: 'Volume', color: CHART_COLORS.cyan }]}
            isLoading={volLoading}
            height={200}
            valueFormatter={(v) => formatUSD(v)}
          />
        </div>

        {/* OI Distribution */}
        <div className="card p-4">
          <h3 className="text-text-primary font-semibold text-sm mb-1">Open Interest Distribution</h3>
          <p className="text-text-tertiary text-xs mb-3">Top assets by OI</p>
          {oiLoading ? (
            <div className="h-[200px] animate-pulse bg-bg-card rounded-xl" />
          ) : oiAssets.length > 0 ? (
            <div className="space-y-2">
              {oiAssets.map((a, i) => {
                const pct = Number(a.oi_pct ?? a.percentage ?? 0);
                const val = Number(a.oi_usd ?? a.openInterestUsd ?? 0);
                return (
                  <div key={String(a.asset ?? a.coin ?? i)} className="flex items-center gap-3">
                    <span className="text-text-secondary text-xs w-12 shrink-0">{String(a.asset ?? a.coin ?? '')}</span>
                    <div className="flex-1 h-5 bg-bg-tertiary rounded-sm overflow-hidden relative">
                      <div
                        className="h-full rounded-sm"
                        style={{
                          width: `${Math.max(pct, 1)}%`,
                          background: `linear-gradient(90deg, ${CHART_COLORS.cyan}88, ${CHART_COLORS.cyan}44)`,
                        }}
                      />
                    </div>
                    <span className="number text-xs text-text-secondary w-20 text-right">{formatUSD(val)}</span>
                    <span className="number text-xs text-text-muted w-12 text-right">{pct.toFixed(1)}%</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-text-muted text-sm">No OI data available</div>
          )}
        </div>
      </div>

      {/* Funding Rates Table */}
      <SectionHeader title="Funding Rates" subtitle="Current 8h funding rates for top assets" />
      <DataTable
        columns={FUNDING_COLUMNS}
        data={fundingData}
        isLoading={fundLoading}
        rowKey={(r) => String(r.asset ?? r.coin ?? Math.random())}
        skeletonRows={10}
      />

      {/* Heatmap */}
      <SectionHeader title="Market Heatmap" subtitle="24h price change — sorted by volume" />
      <HeatMap data={heatmap ?? []} isLoading={heatmapLoading} />

      {/* Large Trades */}
      <SectionHeader
        title="Large Trades"
        subtitle="Real-time feed of trades > $10k"
      />
      <DataTable
        columns={TRADE_COLUMNS}
        data={trades}
        isLoading={tradesLoading}
        rowKey={(t) => `${t.time}-${t.coin}-${t.price}`}
        emptyMessage="Waiting for large trades..."
        skeletonRows={6}
      />
    </PageContainer>
  );
}
