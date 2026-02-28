'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageContainer, SectionHeader } from '@/components/layout/PageContainer';
import { KPICard } from '@/components/ui/KPICard';
import { DataTable, Column } from '@/components/ui/DataTable';
import { AreaChartWidget } from '@/components/charts/AreaChart';
import { SkeletonCard, SkeletonChart, SkeletonTable } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { useTraderSummary, useTraderPositions, useTraderFills, useTraderPnL } from '@/hooks/useAPI';
import { fmt } from '@/lib/format';
import { CHART_COLORS } from '@/lib/constants';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); };
  return (
    <button onClick={handleCopy} title="Copy address" style={{ background: 'none', border: '1px solid rgba(0,255,136,0.15)', borderRadius: '6px', color: copied ? CHART_COLORS.neon : 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6875rem', padding: '0.2rem 0.5rem', cursor: 'pointer', transition: 'all 0.15s ease' }}>
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

export default function TraderPage() {
  const params = useParams();
  const router = useRouter();
  const address = (params?.address as string ?? '').toLowerCase();

  const { data: summary, isLoading: summaryLoading, error: summaryError } = useTraderSummary(address);
  const { data: positions, isLoading: positionsLoading } = useTraderPositions(address);
  const { data: fills, isLoading: fillsLoading } = useTraderFills(address, { limit: 50 });
  const { data: pnlData, isLoading: pnlLoading } = useTraderPnL(address);

  const pnlChartData = useMemo(() => {
    if (!pnlData || !Array.isArray(pnlData)) return [];
    return (pnlData as any[]).map((d) => ({ time: new Date((d.time ?? d.date ?? 0) * (d.date ? 1000 : 1)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), pnl: d.pnl ?? d.cumPnl ?? d.value ?? 0 }));
  }, [pnlData]);

  const positionColumns: Column[] = [
    { key: 'coin', label: 'Asset', render: (val: string) => <span style={{ color: CHART_COLORS.neon, fontWeight: 500 }}>{val}</span> },
    { key: 'szi', label: 'Size', align: 'right', render: (val: number) => { const isLong = val > 0; return <span style={{ color: isLong ? CHART_COLORS.neon : CHART_COLORS.red }}>{isLong ? '+' : ''}{fmt.num(val, 4)}</span>; } },
    { key: 'entryPx', label: 'Entry Price', align: 'right', render: (val: number) => `$${fmt.price(val)}` },
    { key: 'markPx', label: 'Mark Price', align: 'right', render: (val: number) => val ? `$${fmt.price(val)}` : '—' },
    { key: 'unrealizedPnl', label: 'Unrealized PnL', align: 'right', render: (val: number) => { const positive = val >= 0; return <span style={{ color: positive ? CHART_COLORS.neon : CHART_COLORS.red }}>{positive ? '+' : ''}{fmt.usd(val)}</span>; } },
    { key: 'returnOnEquity', label: 'ROE', align: 'right', render: (val: number) => val != null ? <span style={{ color: val >= 0 ? CHART_COLORS.neon : CHART_COLORS.red }}>{(val * 100).toFixed(2)}%</span> : '—' },
    { key: 'leverage', label: 'Leverage', align: 'right', render: (_val: any, row: any) => { const lev = row.leverage?.value ?? row.leverage; return lev ? `${lev}x` : '—'; } },
  ];

  const fillColumns: Column[] = [
    { key: 'time', label: 'Time', render: (val: number) => fmt.timestamp(val) },
    { key: 'coin', label: 'Asset', render: (val: string) => <span style={{ color: CHART_COLORS.neon }}>{val}</span> },
    { key: 'side', label: 'Side', render: (val: string) => <Badge variant={val === 'B' || val === 'buy' ? 'neon' : 'red'} size="xs">{val === 'B' ? 'BUY' : val === 'A' ? 'SELL' : val?.toUpperCase()}</Badge> },
    { key: 'px', label: 'Price', align: 'right', render: (val: number) => `$${fmt.price(val)}` },
    { key: 'sz', label: 'Size', align: 'right', render: (val: number) => fmt.num(val, 4) },
    { key: 'closedPnl', label: 'Closed PnL', align: 'right', render: (val: number) => { if (val == null || val === 0) return <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>; return <span style={{ color: val >= 0 ? CHART_COLORS.neon : CHART_COLORS.red }}>{val >= 0 ? '+' : ''}{fmt.usd(val)}</span>; } },
    { key: 'fee', label: 'Fee', align: 'right', render: (val: number) => val != null ? fmt.usd(Math.abs(val)) : '—' },
  ];

  const isValidAddress = /^0x[0-9a-fA-F]{40}$/i.test(address);
  if (!isValidAddress) {
    return (
      <PageContainer>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
          <div style={{ fontSize: '2rem' }}>⚠️</div>
          <h2 style={{ color: '#e8e8e8', fontFamily: 'Inter, sans-serif', margin: 0 }}>Invalid address</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>{address}</p>
          <button onClick={() => router.push('/traders')} style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.25)', borderRadius: '8px', color: '#00ff88', fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', padding: '0.5rem 1.25rem', cursor: 'pointer' }}>Back to traders</button>
        </div>
      </PageContainer>
    );
  }

  const acctValue = summary?.marginSummary?.accountValue ?? summary?.account_value ?? 0;
  const unrealizedPnl = summary?.marginSummary?.totalUnrealizedPnl ?? summary?.unrealized_pnl ?? 0;
  const marginUsed = summary?.marginSummary?.totalMarginUsed ?? summary?.total_margin_used ?? 0;
  const withdrawable = summary?.withdrawable ?? 0;

  return (
    <PageContainer>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#e8e8e8', margin: 0, letterSpacing: '-0.01em', fontFamily: 'JetBrains Mono, monospace' }}>{fmt.address(address)}</h1>
            <CopyButton text={address} />
          </div>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)', margin: 0, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.02em' }}>{address}</p>
        </div>
        <button onClick={() => router.push('/traders')} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>← Back</button>
      </div>
      {summaryLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>{[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : summaryError ? (
        <div style={{ padding: '1.25rem', color: CHART_COLORS.red, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8125rem', marginBottom: '1.5rem' }}>Could not load account summary. This address may not have traded on Hyperliquid.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          <KPICard label="Account Value" value={fmt.usd(acctValue)} />
          <KPICard label="Unrealized PnL" value={<span style={{ color: unrealizedPnl >= 0 ? CHART_COLORS.neon : CHART_COLORS.red }}>{unrealizedPnl >= 0 ? '+' : ''}{fmt.usd(unrealizedPnl)}</span>} />
          <KPICard label="Total Margin" value={fmt.usd(marginUsed)} />
          <KPICard label="Withdrawable" value={fmt.usd(withdrawable)} />
        </div>
      )}
      {pnlChartData.length > 0 && (
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
          <SectionHeader title="Cumulative PnL" subtitle="Historical profit & loss" />
          <AreaChartWidget data={pnlChartData} series={[{ key: 'pnl', label: 'PnL', color: CHART_COLORS.neon }]} xKey="time" height={220} yFormatter={(v) => fmt.usd(v)} formatter={(v, name) => [fmt.usd(v), name]} />
        </div>
      )}
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1.25rem 1.25rem 0' }}><SectionHeader title="Open Positions" subtitle="Active perpetual positions" /></div>
        {positionsLoading ? <SkeletonTable rows={5} cols={7} /> : <DataTable columns={positionColumns} data={(positions as any)?.assetPositions ? (positions as any).assetPositions.map((p: any) => ({ coin: p.position?.coin, szi: parseFloat(p.position?.szi ?? '0'), entryPx: parseFloat(p.position?.entryPx ?? '0'), markPx: 0, unrealizedPnl: parseFloat(p.position?.unrealizedPnl ?? '0'), returnOnEquity: p.position?.returnOnEquity ? parseFloat(p.position.returnOnEquity) : null, leverage: p.position?.leverage })) : (positions as any[]) ?? []} rowKey={(row) => row.coin ?? Math.random().toString()} emptyMessage="No open positions" />}
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.25rem 0' }}><SectionHeader title="Recent Fills" subtitle="Last 50 trades" /></div>
        {fillsLoading ? <SkeletonTable rows={10} cols={7} /> : <DataTable columns={fillColumns} data={(fills as any[]) ?? []} rowKey={(row) => `${row.time}-${row.coin}-${row.px}`} emptyMessage="No fills found" />}
      </div>
    </PageContainer>
  );
}
