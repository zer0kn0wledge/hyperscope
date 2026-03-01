'use client';

import { useMemo } from 'react';
import { PageContainer, SectionHeader } from '@/components/layout/PageContainer';
import { DataTable, Column } from '@/components/ui/DataTable';
import { SkeletonTable, SkeletonCard } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { useDEXComparison } from '@/hooks/useAPI';
import { fmt } from '@/lib/format';
import { CHART_COLORS } from '@/lib/constants';

const DEX_META: Record<string, { color: string; label: string }> = {
  hyperliquid: { color: '#00ff88', label: 'Hyperliquid' },
  dydx: { color: '#6c63ff', label: 'dYdX' },
  gmx: { color: '#2d9cdb', label: 'GMX' },
  vertex: { color: '#f7931a', label: 'Vertex' },
  drift: { color: '#e84393', label: 'Drift' },
  aevo: { color: '#00bcd4', label: 'Aevo' },
  paradex: { color: '#9c27b0', label: 'Paradex' },
};

function DEXCard({
  name,
  volume_24h,
  open_interest,
  market_share,
  btc_funding_rate,
}: {
  name: string;
  volume_24h: number;
  open_interest: number;
  market_share: number;
  btc_funding_rate: number;
}) {
  const meta = DEX_META[name.toLowerCase()] ?? { color: '#e8e8e8', label: name };
  return (
    <div
      className="card"
      style={{
        padding: '1.25rem',
        borderColor: `${meta.color}22`,
        transition: 'border-color 0.2s',
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = `${meta.color}44`)}
      onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = `${meta.color}22`)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: meta.color,
            boxShadow: `0 0 8px ${meta.color}88`,
          }}
        />
        <span
          style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: meta.color,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {meta.label}
        </span>
        {name.toLowerCase() === 'hyperliquid' && (
          <Badge variant="neon" size="xs">HL</Badge>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div>
          <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.3)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>24h Vol</div>
          <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#e8e8e8', fontFamily: 'JetBrains Mono, monospace' }}>{fmt.usd(volume_24h)}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.3)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Open Int.</div>
          <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#e8e8e8', fontFamily: 'JetBrains Mono, monospace' }}>{fmt.usd(open_interest)}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.3)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Mkt Share</div>
          <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: meta.color, fontFamily: 'JetBrains Mono, monospace' }}>{(market_share * 100).toFixed(1)}%</div>
        </div>
        <div>
          <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.3)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>BTC Fund.</div>
          <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#e8e8e8', fontFamily: 'JetBrains Mono, monospace' }}>
            {btc_funding_rate != null ? `${(btc_funding_rate * 100).toFixed(4)}%` : '—'}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DEXComparePage() {
  const { data: rawData, isLoading, error } = useDEXComparison();

  // API returns { exchanges: [...], timestamp: ... }
  // Extract the exchanges array
  const exchanges: any[] = useMemo(() => {
    if (!rawData) return [];
    const list = (rawData as any)?.exchanges ?? [];
    // Compute total volume for market share calculation
    const totalVol = list.reduce((sum: number, e: any) => sum + (e.volume_24h ?? 0), 0);
    return list.map((e: any) => ({
      ...e,
      // Normalise field names for the table/card components
      open_interest: e.open_interest ?? e.oi ?? 0,
      market_share: totalVol > 0 ? (e.volume_24h ?? 0) / totalVol : 0,
    }));
  }, [rawData]);

  const tableColumns: Column[] = [
    {
      key: 'exchange',
      label: 'Exchange',
      sortable: true,
      render: (val: string) => {
        const meta = DEX_META[val.toLowerCase()] ?? { color: '#e8e8e8', label: val };
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
      key: 'open_interest',
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <div
            style={{
              width: `${Math.max((val ?? 0) * 100 * 1.5, 4)}px`,
              height: '4px',
              background: CHART_COLORS.neon,
              borderRadius: '2px',
              opacity: 0.7,
            }}
          />
          <span style={{ color: CHART_COLORS.neon, fontFamily: 'JetBrains Mono, monospace' }}>
            {((val ?? 0) * 100).toFixed(1)}%
          </span>
        </div>
      ),
    },
    {
      key: 'pairs_count',
      label: 'Pairs',
      align: 'right',
      sortable: true,
      render: (val: number) => (
        <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{val ?? '—'}</span>
      ),
    },
    {
      key: 'btc_funding_rate',
      label: 'BTC Funding',
      align: 'right',
      sortable: true,
      render: (val: number) => (
        <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          {val != null ? `${(val * 100).toFixed(4)}%` : '—'}
        </span>
      ),
    },
  ];

  const cards = exchanges.slice(0, 6);

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
          DEX Comparison
        </h1>
        <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.35)', margin: 0, fontFamily: 'Inter, sans-serif' }}>
          Hyperliquid vs. competing decentralized perpetual exchanges
        </p>
      </div>

      {/* Cards */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {cards.map((d: any) => (
            <DEXCard
              key={d.exchange}
              name={d.exchange}
              volume_24h={d.volume_24h}
              open_interest={d.open_interest}
              market_share={d.market_share}
              btc_funding_rate={d.btc_funding_rate}
            />
          ))}
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.25rem 0' }}>
          <SectionHeader title="Full Comparison Table" subtitle="All tracked DEX perpetual platforms" />
        </div>
        {isLoading ? (
          <SkeletonTable rows={7} cols={6} />
        ) : error ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#ff4d4d', fontSize: '0.8125rem' }}>
            Failed to load DEX data
          </div>
        ) : (
          <DataTable
            columns={tableColumns}
            data={exchanges}
            rowKey={(row) => row.exchange}
            emptyMessage="No DEX data available"
          />
        )}
      </div>
    </PageContainer>
  );
}
