'use client';

import { useState } from 'react';
import { useProtocol } from '@/hooks/useHyperscope';
import { PageContainer, SectionHeader } from '@/components/ui/PageLayout';
import { KPICard } from '@/components/ui/KPICard';
import { VolumeChart } from '@/components/charts/VolumeChart';
import { fmt } from '@/lib/format';

export default function ProtocolPage() {
  const { data, isLoading, error } = useProtocol();
  const [tab, setTab] = useState<'tvl' | 'fees' | 'hype' | 'staking'>('tvl');

  if (isLoading)
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <div className="text-neon-green animate-pulse font-mono text-sm">
            loading protocol data...
          </div>
        </div>
      </PageContainer>
    );

  if (error || !data)
    return (
      <PageContainer>
        <div className="text-red-400 font-mono text-sm">
          error loading protocol data
        </div>
      </PageContainer>
    );

  const tvl = data.tvl ?? {};
  const fees = data.fees ?? {};
  const hype = data.hype_price ?? {};
  const staking = data.staking ?? {};
  const tvlHistory: { date: string; totalLiquidityUSD: number }[] =
    data.tvl_history ?? [];
  const feesHistory: { date: string; dailyFees: number }[] =
    data.fees_history ?? [];
  const hypeChart: { date: string; price: number }[] = data.hype_chart ?? [];
  const stakingChart: { date: string; amount: number }[] =
    data.staking_chart ?? [];

  return (
    <PageContainer>
      <SectionHeader
        title="Protocol"
        subtitle="TVL · fees · HYPE token · staking"
      />

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KPICard
          label="TVL"
          value={fmt.usd(tvl.tvl)}
          sub={tvl.tvl_7d_change != null ? `7d ${tvl.tvl_7d_change > 0 ? '+' : ''}${tvl.tvl_7d_change.toFixed(1)}%` : undefined}
        />
        <KPICard
          label="24h Fees"
          value={fmt.usd(fees.fees_24h)}
          sub={fees.fees_7d != null ? `7d ${fmt.usd(fees.fees_7d)}` : undefined}
        />
        <KPICard
          label="HYPE Price"
          value={fmt.price(hype.price)}
          sub={hype.price_change_24h != null ? `24h ${hype.price_change_24h > 0 ? '+' : ''}${hype.price_change_24h.toFixed(2)}%` : undefined}
        />
        <KPICard
          label="Staked HYPE"
          value={fmt.compact(staking.total_staked)}
          sub={staking.staking_apy != null ? `APY ${staking.staking_apy.toFixed(1)}%` : undefined}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KPICard
          label="Mkt Cap"
          value={fmt.compact(hype.market_cap)}
        />
        <KPICard
          label="Circ Supply"
          value={fmt.compact(hype.circulating_supply)}
        />
        <KPICard
          label="30d Fees"
          value={fmt.usd(fees.fees_30d)}
        />
        <KPICard
          label="Total Revenue"
          value={fmt.usd(fees.total_revenue)}
        />
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-4">
        {(['tvl', 'fees', 'hype', 'staking'] as const).map((t) => (
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

      {/* Charts */}
      {tab === 'tvl' && tvlHistory.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-mono text-white/40 mb-3">TVL History</h3>
          <VolumeChart
            data={tvlHistory.map((d) => ({
              name: d.date,
              value: d.totalLiquidityUSD,
            }))}
          />
        </div>
      )}

      {tab === 'fees' && feesHistory.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-mono text-white/40 mb-3">Daily Fees</h3>
          <VolumeChart
            data={feesHistory.map((d) => ({
              name: d.date,
              value: d.dailyFees,
            }))}
          />
        </div>
      )}

      {tab === 'hype' && hypeChart.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-mono text-white/40 mb-3">HYPE Price (30d)</h3>
          <VolumeChart
            data={hypeChart.map((d) => ({
              name: d.date,
              value: d.price,
            }))}
          />
        </div>
      )}

      {tab === 'staking' && stakingChart.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-mono text-white/40 mb-3">Staked HYPE (30d)</h3>
          <VolumeChart
            data={stakingChart.map((d) => ({
              name: d.date,
              value: d.amount,
            }))}
          />
        </div>
      )}

      {/* Token holders */}
      {data.token_holders?.holders?.length > 0 && (
        <div className="card mt-4 overflow-x-auto">
          <h3 className="text-sm font-mono text-white/40 mb-3">Top HYPE Holders</h3>
          <table className="w-full text-sm font-mono">
            <thead>
              <tr className="border-b border-white/5">
                {['#', 'Address', 'Balance', '% Supply'].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-white/30 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.token_holders.holders.slice(0, 20).map(
                (
                  holder: { address: string; balance: number; pct: number },
                  i: number,
                ) => (
                  <tr key={holder.address} className="border-b border-white/5 hover:bg-white/2">
                    <td className="px-3 py-2 text-white/30">{i + 1}</td>
                    <td className="px-3 py-2 text-white/60 font-mono text-xs">
                      {holder.address.slice(0, 8)}...{holder.address.slice(-6)}
                    </td>
                    <td className="px-3 py-2 text-white/80">{fmt.compact(holder.balance)}</td>
                    <td className="px-3 py-2 text-neon-green">{holder.pct.toFixed(3)}%</td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  );
}
