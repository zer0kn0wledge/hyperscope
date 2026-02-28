'use client';

import { useMemo } from 'react';
import { fmt } from '@/lib/format';
import { DepthChart } from '@/components/charts/DepthChart';

interface OrderbookLevel {
  price: number;
  size: number;
  cumulative?: number;
}

interface OrderbookData {
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  spread?: number;
  spreadPct?: number;
  lastPrice?: number;
}

interface OrderbookViewProps {
  data: OrderbookData | null;
  showDepthChart?: boolean;
  levels?: number;
  className?: string;
}

function buildCumulatives(levels: OrderbookLevel[]): (OrderbookLevel & { cumulative: number })[] {
  let cum = 0;
  return levels.map((l) => {
    cum += l.size;
    return { ...l, cumulative: cum };
  });
}

function LevelRow({
  price,
  size,
  cumulative,
  maxCumulative,
  side,
}: {
  price: number;
  size: number;
  cumulative: number;
  maxCumulative: number;
  side: 'bid' | 'ask';
}) {
  const fillPct = maxCumulative > 0 ? (cumulative / maxCumulative) * 100 : 0;
  const isBid = side === 'bid';
  const fillColor = isBid ? 'rgba(0,255,136,0.1)' : 'rgba(255,77,77,0.1)';
  const priceColor = isBid ? '#00ff88' : '#ff4d4d';

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        position: 'relative',
        padding: '2px 8px',
        fontSize: '0.75rem',
        fontFamily: 'JetBrains Mono, monospace',
        lineHeight: '1.6',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = 'transparent';
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          [isBid ? 'right' : 'left']: 0,
          width: `${fillPct}%`,
          background: fillColor,
          pointerEvents: 'none',
          transition: 'width 0.3s ease',
        }}
      />
      <span style={{ color: priceColor, fontWeight: 500, position: 'relative', zIndex: 1 }}>
        {fmt.price(price)}
      </span>
      <span style={{ textAlign: 'right', color: 'rgba(255,255,255,0.7)', position: 'relative', zIndex: 1 }}>
        {size.toFixed(4)}
      </span>
      <span style={{ textAlign: 'right', color: 'rgba(255,255,255,0.35)', position: 'relative', zIndex: 1 }}>
        {cumulative.toFixed(2)}
      </span>
    </div>
  );
}

export function OrderbookView({ data, showDepthChart = true, levels = 20, className = '' }: OrderbookViewProps) {
  const processedBids = useMemo(() => {
    if (!data?.bids) return [];
    return buildCumulatives(data.bids.slice(0, levels));
  }, [data?.bids, levels]);

  const processedAsks = useMemo(() => {
    if (!data?.asks) return [];
    return buildCumulatives(data.asks.slice(0, levels));
  }, [data?.asks, levels]);

  const maxBidCum = processedBids[processedBids.length - 1]?.cumulative ?? 1;
  const maxAskCum = processedAsks[processedAsks.length - 1]?.cumulative ?? 1;

  const spread = data?.spread;
  const spreadPct = data?.spreadPct;

  if (!data) {
    return (
      <div
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 300,
          color: 'rgba(255,255,255,0.2)',
          fontSize: '0.8125rem',
          fontFamily: 'JetBrains Mono, monospace',
        }}
      >
        select a pair to view orderbook
      </div>
    );
  }

  return (
    <div className={className}>
      {showDepthChart && (
        <div style={{ marginBottom: '1rem' }}>
          <DepthChart
            bids={processedBids}
            asks={processedAsks}
            height={160}
          />
        </div>
      )}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          padding: '4px 8px 6px',
          borderBottom: '1px solid rgba(0,255,136,0.08)',
          marginBottom: '4px',
        }}
      >
        <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Price</span>
        <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'Inter, sans-serif', textAlign: 'right', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Size</span>
        <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'Inter, sans-serif', textAlign: 'right', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cum.</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column-reverse' }}>
        {processedAsks.map((ask, idx) => (
          <LevelRow
            key={`ask-${idx}`}
            price={ask.price}
            size={ask.size}
            cumulative={ask.cumulative}
            maxCumulative={maxAskCum}
            side="ask"
          />
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '6px 8px',
          background: 'rgba(255,255,255,0.02)',
          margin: '4px 0',
          borderRadius: '4px',
        }}
      >
        <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'Inter, sans-serif' }}>Spread</span>
        <span style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', color: 'rgba(255,255,255,0.65)' }}>
          {spread !== undefined ? fmt.price(spread) : '—'}
        </span>
        {spreadPct !== undefined && (
          <span style={{ fontSize: '0.6875rem', fontFamily: 'JetBrains Mono, monospace', color: 'rgba(255,255,255,0.35)' }}>
            ({(spreadPct * 100).toFixed(3)}%)
          </span>
        )}
      </div>
      <div>
        {processedBids.map((bid, idx) => (
          <LevelRow
            key={`bid-${idx}`}
            price={bid.price}
            size={bid.size}
            cumulative={bid.cumulative}
            maxCumulative={maxBidCum}
            side="bid"
          />
        ))}
      </div>
    </div>
  );
}
