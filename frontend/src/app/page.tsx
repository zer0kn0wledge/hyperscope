'use client';

import { PageContainer, SectionHeader } from '@/components/layout/PageContainer';
import { KPICard } from '@/components/ui/KPICard';
import { HeatMap } from '@/components/charts/HeatMap';
import { Sparkline } from '@/components/charts/Sparkline';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import {
  useKPIs,
  useHeatmap,
  useSparklines,
  useLargeTrades,
} from '@/hooks/useAPI';
import { useLargeTradesWS } from '@/hooks/useWebSocket';
import { formatUSD, formatPercent, formatPrice, formatDate } from '@/lib/format';
import type { LargeTrade } from '@/lib/types';

const TRADE_COLUMNS: Column<LargeTrade>[] = [
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

export default function OverviewPage() {
  const { data: kpis, isLoading: kpisLoading } = useKPIs();
  const { data: heatmap, isLoading: heatmapLoading } = useHeatmap();
  const { data: sparklines } = useSparklines();
  const { data: initialTrades, isLoading: tradesLoading } = useLargeTrades();

  const trades = useLargeTradesWS(initialTrades ?? []);

  // Type the kpis response loosely since backend returns snake_case
  const k = kpis as Record<string, number> | undefined;

  return (
    <PageContainer>
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          label="Total Open Interest"
          value={k?.total_open_interest ? formatUSD(k.total_open_interest) : undefined}
          isLoading={kpisLoading}
          sparklineData={sparklines?.oi}
        />
        <KPICard
          label="24h Volume"
          value={k?.total_volume_24h ? formatUSD(k.total_volume_24h) : undefined}
          isLoading={kpisLoading}
          sparklineData={sparklines?.volume}
        />
        <KPICard
          label="HYPE Price"
          value={k?.hype_price ? formatUSD(k.hype_price) : '$-'}
          isLoading={kpisLoading}
          sparklineData={sparklines?.hype_price}
          change={k?.hype_change_24h}
        />
        <KPICard
          label="TVL"
          value={k?.tvl ? formatUSD(k.tvl) : undefined}
          isLoading={kpisLoading}
        />
      </div>

      {/* Heatmap */}
      <SectionHeader title="Market Heatmap" subtitle="24h price change" />
      <HeatMap data={heatmap ?? []} isLoading={heatmapLoading} />

      {/* Sparklines row */}
      {sparklines && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Sparkline
            data={sparklines.oi}
            label="Open Interest (7d)"
            color="#00D1FF"
          />
          <Sparkline
            data={sparklines.volume}
            label="Volume (7d)"
            color="#00E676"
          />
          <Sparkline
            data={sparklines.hype_price}
            label="HYPE Price (7d)"
            color="#7B5EA7"
          />
        </div>
      )}

      {/* Large Trades */}
      <SectionHeader
        title="Large Trades"
        subtitle="Real-time feed of trades > $100k"
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
