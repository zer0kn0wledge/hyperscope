'use client';

import { PageContainer, SectionHeader } from '@/components/ui/PageLayout';
import { useDEXCompare } from '@/hooks/useHyperscope';
import { KPICard } from '@/components/ui/KPICard';
import { PieChart } from '@/components/charts/PieChart';
import { VolumeChart } from '@/components/charts/VolumeChart';
import { fmt } from '@/lib/format';

export default function DEXComparePage() {
  const { data, isLoading, error } = useDEXCompare();

  if (isLoading)
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <div className="text-neon-green animate-pulse font-mono text-sm">
            fetching DEX data...
          </div>
        </div>
      </PageContainer>
    );

  if (error || !data)
    return (
      <PageContainer>
        <div className="text-red-400 font-mono text-sm">
          error loading DEX compare data
        </div>
      </PageContainer>
    );

  type ExchangeData = {
    oi?: number;
    volume_24h?: number;
    num_markets?: number;
    num_traders?: number;
    funding_rate?: number;
  };

  const exchanges = data as Record<string, ExchangeData>;
  const rows = Object.entries(exchanges).map(([name, d]) => ({
    name,
    ...d,
  }));

  rows.sort((a, b) => (b.oi ?? 0) - (a.oi ?? 0));

  const oiPie = rows
    .filter((r) => r.oi)
    .map((r) => ({ name: r.name, value: r.oi as number }));

  const volPie = rows
    .filter((r) => r.volume_24h)
    .map((r) => ({ name: r.name, value: r.volume_24h as number }));

  // Totals
  const totalOI = rows.reduce((s, r) => s + (r.oi ?? 0), 0);
  const totalVol = rows.reduce((s, r) => s + (r.volume_24h ?? 0), 0);
  const totalMarkets = rows.reduce((s, r) => s + (r.num_markets ?? 0), 0);
  const totalTraders = rows.reduce((s, r) => s + (r.num_traders ?? 0), 0);

  const volHistory = rows
    .filter((r) => r.volume_24h != null)
    .map((r) => ({
      name: r.name.replace('_', ' '),
      value: r.volume_24h as number,
    }));

  return (
    <PageContainer>
      <SectionHeader
        title="DEX Compare"
        subtitle="On-chain perpetual exchanges — head-to-head metrics"
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KPICard label="Total OI" value={fmt.usd(totalOI)} />
        <KPICard label="24h Volume" value={fmt.usd(totalVol)} />
        <KPICard label="Total Markets" value={fmt.num(totalMarkets)} />
        <KPICard label="Total Traders" value={fmt.num(totalTraders)} />
      </div>

      {/* Table */}
      <div className="card mb-6 overflow-x-auto">
        <table className="w-full text-sm font-mono">
          <thead>
            <tr className="border-b border-white/5">
              {[
                'Exchange',
                'Open Interest',
                '24h Volume',
                'Markets',
                'Traders',
                'Funding',
              ].map((h) => (
                <th
                  key={h}
                  className="px-3 py-2 text-left text-white/40 font-normal"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.name}
                className="border-b border-white/5 hover:bg-white/2"
              >
                <td className="px-3 py-2 text-neon-green font-semibold capitalize">
                  {row.name.replace(/_/g, ' ')}
                </td>
                <td className="px-3 py-2 text-white/80">{fmt.usd(row.oi)}</td>
                <td className="px-3 py-2 text-white/80">
                  {fmt.usd(row.volume_24h)}
                </td>
                <td className="px-3 py-2 text-white/60">
                  {row.num_markets ?? '—'}
                </td>
                <td className="px-3 py-2 text-white/60">
                  {row.num_traders != null ? fmt.num(row.num_traders) : '—'}
                </td>
                <td className="px-3 py-2 text-white/60">
                  {row.funding_rate != null
                    ? `${(row.funding_rate * 100).toFixed(4)}%`
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        {oiPie.length > 0 && (
          <div className="card">
            <h3 className="text-sm font-mono text-white/40 mb-3">OI Distribution</h3>
            <PieChart data={oiPie} />
          </div>
        )}
        {volPie.length > 0 && (
          <div className="card">
            <h3 className="text-sm font-mono text-white/40 mb-3">Volume Distribution</h3>
            <PieChart data={volPie} />
          </div>
        )}
      </div>

      {volHistory.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-mono text-white/40 mb-3">24h Volume Comparison</h3>
          <VolumeChart data={volHistory} />
        </div>
      )}
    </PageContainer>
  );
}
