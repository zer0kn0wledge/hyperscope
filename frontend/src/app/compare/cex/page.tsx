'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { PageContainer, SectionHeader } from '@/components/layout/PageContainer';
import { DataTable, Column } from '@/components/ui/DataTable';
import { SkeletonTable, SkeletonChart } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { useCEXComparison } from '@/hooks/useAPI';
import { fmt } from '@/lib/format';
import { CHART_COLORS } from '@/lib/constants';

const CEX_META: Record<string, { color: string; label: string }> = {
  hyperliquid: { color: '#00ff88', label: 'Hyperliquid' },
  binance: { color: '#f0b90b', label: 'Binance' },
  bybit: { color: '#f7a600', label: 'Bybit' },
  okx: { color: '#3d9fdf', label: 'OKX' },
  coinbase: { color: '#0052ff', label: 'Coinbase' },
  kraken: { color: '#5741d9', label: 'Kraken' },
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: '#0a0a0a',
        border: '1px solid rgba(0,255,136,0.2)',
        borderRadius: '10px',
        padding: '0.625rem 0.875rem',
        fontFamily: 'JetBrains Mono, monospace',
      }}
    >
      <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ fontSize: '0.8125rem', color: p.fill }}>
          {fmt.usd(p.value)}
        </div>
      ))}
    </div>
  );
}

export default function CEXComparePage() {
  const { data, isLoading, error } = useCEXComparison();

  const chartData = useMemo(() => {
    if (!data) return [];
    return (data as any[])
      .sort((a, b) => (b.volume_24h ?? 0) - (a.volume_24h ?? 0))
      .map((d) => ({
        name: CEX_META[d.exchange?.toLowerCase()]?.label ?? d.exchange,
        volume: d.volume_24h ?? 0,
        oi: d.oi ?? 0,
        color: CEX_META[d.exchange?.toLowerCase()]?.color ?? '#888',
      }));
  }, [data]);

  const tableColumns: Column[] = [
    {
      key: 'exchange',
      label: 'Exchange',
      sortable: true,
      render: (val: string) => {
        const meta = CEX_META[val.toLowerCase()] ?? { color: '#e8e8e8', label: val };
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: meta.color }} />
            <span style={{ color: '#e8e8e8' }}>{meta.label}</span>
            {val.toLowerCase() === 'hyperliquid' && <Badge variant="neon" size="xs">HL</Badge>}
          </div>
        );
      },
    },
    {
      key: 'volume_24h',
      label: '24h Volume',
      align: 'right',
      sortable: true,
      render: (val: number) => fmt.usd(val),
    },
    {
      key: 'oi',
      label: 'Open Interest',
      align: 'right',
      sortable: true,
      render: (val: number) => fmt.usd(val),
    },
    {
      key: 'market_share',
      label: 'Market Share',
      align: 'right',
      sortable: true,
      render: (val: number) => (
        <span style={{ color: CHART_COLORS.neon, fontFamily: 'JetBrains Mono, monospace' }}>
          {(val * 100).toFixed(1)}%
        </span>
      ),
    },
    {
      key: 'perp_pairs',
      label: 'Perp Pairs',
      align: 'right',
      sortable: true,
      render: (val: number) => (
        <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{val ?? '—'}</span>
      ),
    },
    {
      key: 'maker_fee',
      label: 'Maker Fee',
      align: 'right',
      render: (val: number) => (
        <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{val != null ? `${(val * 100).toFixed(3)}%` : '—'}</span>
      ),
    },
    {
      key: 'taker_fee',
      label: 'Taker Fee',
      align: 'right',
      render: (val: number) => (
        <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{val != null ? `${(val * 100).toFixed(3)}%` : '—'}</span>
      ),
    },
  ];

  return (
    <PageContainer>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: '#e8e8e8',
            margin: '0 0 0.375rem',
            letterSpacing: '-0.02em',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          CEX Comparison
        </h1>
        <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.35)', margin: 0, fontFamily: 'Inter, sans-serif' }}>
          Hyperliquid vs. top centralized exchanges by perpetuals volume
        </p>
      </div>

      {/* Volume Bar Chart */}
      <div className="card" style={{ marginBottom: '2rem', padding: '1.25rem' }}>
        <SectionHeader title="24h Volume Comparison" subtitle="Perpetuals volume across major venues" />
        {isLoading ? (
          <SkeletonChart height={260} />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => fmt.usd(v)}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="volume" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.25rem 0' }}>
          <SectionHeader title="Full CEX Comparison" subtitle="Centralized exchange perpetuals data" />
        </div>
        {isLoading ? (
          <SkeletonTable rows={6} cols={7} />
        ) : error ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#ff4d4d', fontSize: '0.8125rem' }}>
            Failed to load CEX data
          </div>
        ) : (
          <DataTable
            columns={tableColumns}
            data={(data as any[]) ?? []}
            rowKey={(row) => row.exchange}
            emptyMessage="No CEX data available"
          />
        )}
      </div>
    </PageContainer>
  );
}
