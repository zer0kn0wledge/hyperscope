'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useMarketAsset } from '@/hooks/useHyperscope';
import { PageContainer, SectionHeader } from '@/components/ui/PageLayout';
import { KPICard } from '@/components/ui/KPICard';
import { PriceChart } from '@/components/charts/PriceChart';
import { VolumeChart } from '@/components/charts/VolumeChart';
import { FundingChart } from '@/components/charts/FundingChart';
import { fmt } from '@/lib/format';

export default function AssetPage() {
  const { asset } = useParams<{ asset: string }>();
  const { data, isLoading, error } = useMarketAsset(asset);
  const [tab, setTab] = useState<'price' | 'volume' | 'funding'>('price');

  if (isLoading)
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <div className="text-neon-green animate-pulse font-mono text-sm">
            loading {asset}...
          </div>
        </div>
      </PageContainer>
    );

  if (error || !data)
    return (
      <PageContainer>
        <div className="text-red-400 font-mono text-sm">error loading {asset}</div>
      </PageContainer>
    );

  const asset_data = data.asset ?? {};
  const candles = data.candles ?? [];

  return (
    <PageContainer>
      <SectionHeader
        title={asset}
        subtitle={`market data · open interest · funding · volume`}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KPICard
          label="Mark Price"
          value={fmt.price(asset_data.mark_price)}
        />
        <KPICard
          label="Open Interest"
          value={fmt.usd(asset_data.open_interest_usd)}
        />
        <KPICard
          label="24h Volume"
          value={fmt.usd(asset_data.day_volume)}
        />
        <KPICard
          label="Funding Rate"
          value={
            asset_data.funding != null
              ? `${(asset_data.funding * 100).toFixed(4)}%`
              : '—'
          }
          highlight={asset_data.funding != null && Math.abs(asset_data.funding) > 0.0005}
        />
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-4">
        {(['price', 'volume', 'funding'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-xs font-mono rounded border transition-colors ${
              tab === t
                ? 'border-neon-green text-neon-green bg-neon-green/5'
                : 'border-white/10 text-white/40 hover:border-white/20'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="card">
        {tab === 'price' && <PriceChart candles={candles} />}
        {tab === 'volume' && (
          <VolumeChart
            data={candles.map((c: { t: number; v: number }) => ({
              name: new Date(c.t).toLocaleDateString(),
              value: c.v,
            }))}
          />
        )}
        {tab === 'funding' && <FundingChart asset={asset} />}
      </div>
    </PageContainer>
  );
}
