'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useOrderbook } from '@/hooks/useHyperscope';
import { PageContainer, SectionHeader } from '@/components/ui/PageLayout';
import { KPICard } from '@/components/ui/KPICard';
import { OrderbookView } from '@/components/orderbook/OrderbookView';
import { SpreadTracker } from '@/components/orderbook/SpreadTracker';
import { fmt } from '@/lib/format';

export default function OrderbookPage() {
  const { pair } = useParams<{ pair: string }>(); // e.g. "BTC-PERP"
  const { data, isLoading, error } = useOrderbook(pair);
  const [depth, setDepth] = useState(20);

  const { bids, asks, spreadPct, midPrice } = useMemo(() => {
    if (!data) return { bids: [], asks: [], spreadPct: 0, midPrice: 0 };
    const bids: [number, number][] = (data.bids ?? []).slice(0, depth);
    const asks: [number, number][] = (data.asks ?? []).slice(0, depth);
    const bestBid = bids[0]?.[0] ?? 0;
    const bestAsk = asks[0]?.[0] ?? 0;
    const midPrice = (bestBid + bestAsk) / 2;
    const spreadPct = midPrice > 0 ? ((bestAsk - bestBid) / midPrice) * 100 : 0;
    return { bids, asks, spreadPct, midPrice };
  }, [data, depth]);

  if (isLoading)
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <div className="text-neon-green animate-pulse font-mono text-sm">
            connecting to orderbook...
          </div>
        </div>
      </PageContainer>
    );

  if (error || !data)
    return (
      <PageContainer>
        <div className="text-red-400 font-mono text-sm">
          error loading orderbook for {pair}
        </div>
      </PageContainer>
    );

  return (
    <PageContainer>
      <SectionHeader
        title={decodeURIComponent(pair)}
        subtitle="real-time order book depth"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KPICard label="Mid Price" value={fmt.price(midPrice)} />
        <KPICard label="Spread" value={`${spreadPct.toFixed(4)}%`} />
        <KPICard
          label="Best Bid"
          value={fmt.price(bids[0]?.[0])}
        />
        <KPICard
          label="Best Ask"
          value={fmt.price(asks[0]?.[0])}
        />
      </div>

      {/* Depth selector */}
      <div className="flex gap-2 mb-4">
        {[10, 20, 50].map((d) => (
          <button
            key={d}
            onClick={() => setDepth(d)}
            className={`px-3 py-1.5 text-xs font-mono rounded border transition-colors ${
              depth === d
                ? 'border-neon-green text-neon-green bg-neon-green/5'
                : 'border-white/10 text-white/40 hover:border-white/20'
            }`}
          >
            {d} levels
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <OrderbookView bids={bids} asks={asks} />
        <SpreadTracker pair={pair} />
      </div>
    </PageContainer>
  );
}
