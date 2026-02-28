'use client';

import { useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageContainer, SectionHeader } from '@/components/layout/PageContainer';
import { KPICard } from '@/components/ui/KPICard';
import { OrderbookView } from '@/components/orderbook/OrderbookView';
import { DepthChart } from '@/components/charts/DepthChart';
import { AreaChartWidget } from '@/components/charts/AreaChart';
import { SkeletonCard, SkeletonChart } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { useOrderbookSnapshot, useSpreadHistory } from '@/hooks/useAPI';
import { fmt } from '@/lib/format';
import { CHART_COLORS } from '@/lib/constants';

// Common trading pairs
const COMMON_PAIRS = [
  'BTC-PERP', 'ETH-PERP', 'SOL-PERP', 'ARB-PERP', 'AVAX-PERP',
  'BNB-PERP', 'DOGE-PERP', 'MATIC-PERP', 'LINK-PERP', 'OP-PERP',
  'INJ-PERP', 'TIA-PERP', 'SUI-PERP', 'APT-PERP', 'SEI-PERP',
];

function EmptyOrderbookState() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        minHeight: 280,
        border: '1px solid rgba(0,255,136,0.06)',
        borderRadius: '10px',
        background: 'rgba(0,255,136,0.01)',
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <rect x="2" y="5" width="18" height="2" rx="1" fill="rgba(255,255,255,0.2)" />
          <rect x="2" y="10" width="13" height="2" rx="1" fill="rgba(255,255,255,0.15)" />
          <rect x="2" y="15" width="16" height="2" rx="1" fill="rgba(255,255,255,0.1)" />
        </svg>
      </div>
      <p
        style={{
          fontSize: '0.8125rem',
          color: 'rgba(255,255,255,0.45)',
          fontFamily: 'Inter, sans-serif',
          textAlign: 'center',
          maxWidth: '340px',
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        Orderbook data temporarily unavailable — the Hyperliquid L2 endpoint returns data intermittently. Please check back shortly.
      </p>
      <Badge variant="yellow" size="sm">Intermittent data</Badge>
    </div>
  );
}

export default function OrderbookPairPage() {
  const params = useParams();
  const router = useRouter();
  const pair = (params?.pair as string ?? 'BTC-PERP').toUpperCase();

  const { data: snapshot, isLoading: snapshotLoading } = useOrderbookSnapshot(pair);
  const { data: spreadHistory, isLoading: spreadLoading } = useSpreadHistory(pair);

  const hasOrderbookData = useMemo(() => {
    return (snapshot?.bids?.length ?? 0) > 0 || (snapshot?.asks?.length ?? 0) > 0;
  }, [snapshot]);

  const spreadChartData = useMemo(() => {
    if (!spreadHistory || !Array.isArray(spreadHistory)) return [];
    return (spreadHistory as any[]).map((d) => ({
      time: new Date(d.time ?? d.timestamp ?? 0).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      spread_bps: d.spread_bps ?? d.spread ?? 0,
    }));
  }, [spreadHistory]);

  const handlePairChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      router.push(`/orderbook/${e.target.value}`);
    },
    [router]
  );

  const orderbookData = useMemo(() => {
    if (!snapshot) return null;
    return {
      bids: snapshot.bids ?? [],
      asks: snapshot.asks ?? [],
      spread: snapshot.spread_bps > 0 ? snapshot.mid_price * (snapshot.spread_bps / 10000) : undefined,
      spreadPct: snapshot.spread_bps > 0 ? snapshot.spread_bps / 10000 : undefined,
      lastPrice: snapshot.mid_price,
    };
  }, [snapshot]);

  const pairOptions = COMMON_PAIRS.map((p) => ({ value: p, label: p }));

  return (
    <PageContainer>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#e8e8e8', margin: 0, letterSpacing: '-0.02em', fontFamily: 'Inter, sans-serif' }}>Orderbook</h1>
            <Badge variant="neon" dot>LIVE</Badge>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.35)', margin: 0, fontFamily: 'Inter, sans-serif' }}>Level 2 order depth and spread tracker</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Select label="Pair" options={pairOptions} value={pair} onChange={handlePairChange} style={{ width: 160 }} />
        </div>
      </div>
      {snapshotLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          <KPICard label="Pair" value={pair} />
          <KPICard label="Mid Price" value={snapshot?.mid_price ? `$${fmt.price(snapshot.mid_price)}` : '—'} />
          <KPICard label="Spread (bps)" value={snapshot?.spread_bps != null ? snapshot.spread_bps.toFixed(4) : '—'} sub="basis points" />
          <KPICard label="Orderbook Status" value={hasOrderbookData ? <Badge variant="neon" dot>Live</Badge> : <Badge variant="yellow">Unavailable</Badge>} />
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <SectionHeader title={`${pair} Order Depth`} subtitle="Bids (green) / Asks (red)" />
          {snapshotLoading ? <SkeletonChart height={400} /> : !hasOrderbookData ? <EmptyOrderbookState /> : <OrderbookView data={orderbookData} showDepthChart={false} levels={20} />}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <SectionHeader title="Depth Chart" subtitle="Cumulative bid/ask volume by price level" />
            {snapshotLoading ? <SkeletonChart height={220} /> : !hasOrderbookData ? <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8125rem' }}>no orderbook data</div> : <DepthChart bids={(orderbookData?.bids ?? []).map((b: any, i: number) => { let cum = 0; (orderbookData?.bids ?? []).slice(0, i + 1).forEach((x: any) => { cum += x.size; }); return { price: b.price, size: b.size, cumulative: cum }; })} asks={(orderbookData?.asks ?? []).map((a: any, i: number) => { let cum = 0; (orderbookData?.asks ?? []).slice(0, i + 1).forEach((x: any) => { cum += x.size; }); return { price: a.price, size: a.size, cumulative: cum }; })} height={220} />}
          </div>
          <div className="card" style={{ padding: '1.25rem' }}>
            <SectionHeader title="Spread History" subtitle="Recent bid-ask spread in basis points" />
            {spreadLoading ? <SkeletonChart height={160} /> : spreadChartData.length === 0 ? <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8125rem' }}>no spread history available</div> : <AreaChartWidget data={spreadChartData} series={[{ key: 'spread_bps', label: 'Spread (bps)', color: CHART_COLORS.yellow }]} xKey="time" height={160} yFormatter={(v) => `${v.toFixed(2)} bps`} formatter={(v, name) => [`${v.toFixed(4)} bps`, name]} />}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
