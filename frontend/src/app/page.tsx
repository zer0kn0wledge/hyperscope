'use client';

import { PageContainer, SectionHeader } from '@/components/ui/PageLayout';
import { useMarketOverview } from '@/hooks/useHyperscope';
import { KPICard } from '@/components/ui/KPICard';
import { Sparkline } from '@/components/charts/Sparkline';
import { HeatMap } from '@/components/charts/HeatMap';
import { fmt } from '@/lib/format';
import Link from 'next/link';

export default function HomePage() {
  const { data, isLoading, error } = useMarketOverview();

  if (isLoading)
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <div className="text-neon-green animate-pulse font-mono text-sm">
            initializing hyperscope...
          </div>
          <div className="w-32 h-px bg-gradient-to-r from-transparent via-neon-green/50 to-transparent animate-pulse" />
        </div>
      </PageContainer>
    );

  if (error || !data)
    return (
      <PageContainer>
        <div className="text-red-400 font-mono text-sm">error loading market data</div>
      </PageContainer>
    );

  const snapshot = data.snapshot ?? {};
  const fearGreed = data.fear_greed;
  const globalOI = data.global_oi;
  const liquidations = data.liquidations;
  const hypePrice = data.hype_price;
  const tvl = data.tvl;
  const fees = data.fees;

  // Top assets
  const assets: Array<{
    name: string;
    mark_price?: number;
    open_interest_usd?: number;
    day_volume?: number;
    funding?: number;
    price_change_pct?: number;
  }> = snapshot.assets ?? [];

  const topAssets = assets
    .sort((a, b) => (b.open_interest_usd ?? 0) - (a.open_interest_usd ?? 0))
    .slice(0, 20);

  const heatmapData = topAssets.map((a) => ({
    name: a.name,
    value: a.price_change_pct ?? 0,
    size: a.open_interest_usd ?? 0,
  }));

  return (
    <PageContainer>
      <SectionHeader
        title="Overview"
        subtitle="hyperliquid · live market intelligence"
      />

      {/* Global KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {snapshot.total_oi != null && (
          <KPICard
            label="Total OI"
            value={fmt.usd(snapshot.total_oi)}
            sub={`${fmt.num(snapshot.num_assets ?? 0)} assets`}
          />
        )}
        {snapshot.total_volume_24h != null && (
          <KPICard
            label="24h Volume"
            value={fmt.usd(snapshot.total_volume_24h)}
          />
        )}
        {fearGreed && (
          <KPICard
            label="Fear & Greed"
            value={String(fearGreed.value ?? '—')}
            sub={fearGreed.label}
          />
        )}
        {hypePrice && (
          <KPICard
            label="HYPE"
            value={fmt.price(hypePrice.price)}
            sub={`mkt cap ${fmt.compact(hypePrice.market_cap ?? 0)}`}
          />
        )}
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {tvl && (
          <KPICard label="TVL" value={fmt.usd(tvl.tvl)} />
        )}
        {fees && (
          <KPICard label="24h Fees" value={fmt.usd(fees.fees_24h)} />
        )}
        {globalOI && (
          <KPICard label="Global OI" value={fmt.usd(globalOI.total_oi)} />
        )}
        {liquidations && (
          <KPICard
            label="24h Liquidations"
            value={fmt.usd((liquidations.long_24h ?? 0) + (liquidations.short_24h ?? 0))}
          />
        )}
      </div>

      {/* Heat Map */}
      {heatmapData.length > 0 && (
        <div className="card mb-6">
          <h3 className="text-xs font-mono text-white/40 mb-3">price change heatmap (24h)</h3>
          <HeatMap data={heatmapData} />
        </div>
      )}

      {/* Asset Table */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm font-mono">
          <thead>
            <tr className="border-b border-white/5">
              {['Asset', 'Mark Price', 'OI', '24h Vol', 'Funding', '24h %'].map(
                (h) => (
                  <th
                    key={h}
                    className="px-3 py-2 text-left text-white/30 font-normal"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {topAssets.map((asset) => (
              <tr
                key={asset.name}
                className="border-b border-white/5 hover:bg-white/2 cursor-pointer"
              >
                <td className="px-3 py-2">
                  <Link
                    href={`/markets/${asset.name}`}
                    className="text-neon-green font-semibold hover:underline"
                  >
                    {asset.name}
                  </Link>
                </td>
                <td className="px-3 py-2 text-white/80">
                  {fmt.price(asset.mark_price)}
                </td>
                <td className="px-3 py-2 text-white/60">
                  {fmt.usd(asset.open_interest_usd)}
                </td>
                <td className="px-3 py-2 text-white/60">
                  {fmt.usd(asset.day_volume)}
                </td>
                <td className="px-3 py-2 text-white/40 text-xs">
                  {asset.funding != null
                    ? `${(asset.funding * 100).toFixed(4)}%`
                    : '—'}
                </td>
                <td
                  className={`px-3 py-2 text-xs ${
                    (asset.price_change_pct ?? 0) >= 0
                      ? 'text-neon-green'
                      : 'text-red-400'
                  }`}
                >
                  {asset.price_change_pct != null
                    ? `${asset.price_change_pct >= 0 ? '+' : ''}${asset.price_change_pct.toFixed(2)}%`
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageContainer>
  );
}
