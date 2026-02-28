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

  return (
    <PageContainer>
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          label="Total Open Interest"
          value={kpis?.total_open_interest}
          format="usd"
          isLoading={kpisLoading}
          sparklineData={sparklines?.oi}
        />
        <KPICard
          label="24h Volume"
          value={kpis?.total_volume_24h}
          format="usd"
          isLoading={kpisLoading}
          sparklineData={sparklines?.volume}
        />
        <KPICard
          label="HYPE Price"
          value={kpis?.hype_price}
          format="usd"
          isLoading={kpisLoading}
          sparklineData={sparklines?.hype_price}
          trend={kpis?.hype_change_24h}
        />
        <KPICard
          label="TVL"
          value={kpis?.tvl}
          format="usd"
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
            label="Open Interest (24h)"
            color="#00D1FF"
          />
          <Sparkline
            data={sparklines.volume}
            label="Volume (24h)"
            color="#00E676"
          />
          <Sparkline
            data={sparklines.funding}
            label="Avg Funding Rate (24h)"
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
