'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useTraderProfile } from '@/hooks/useHyperscope';
import { PageContainer, SectionHeader } from '@/components/ui/PageLayout';
import { KPICard } from '@/components/ui/KPICard';
import { PieChart } from '@/components/charts/PieChart';
import { VolumeChart } from '@/components/charts/VolumeChart';
import { fmt } from '@/lib/format';

export default function TraderPage() {
  const { address } = useParams<{ address: string }>();
  const { data, isLoading, error } = useTraderProfile(address);
  const [tab, setTab] = useState<'positions' | 'history'>('positions');

  if (isLoading)
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <div className="text-neon-green animate-pulse font-mono text-sm">
            loading trader...
          </div>
        </div>
      </PageContainer>
    );

  if (error || !data)
    return (
      <PageContainer>
        <div className="text-red-400 font-mono text-sm">
          error loading trader {address}
        </div>
      </PageContainer>
    );

  const summary = data.summary ?? {};
  const positions: Array<{
    asset: string;
    side: string;
    size: number;
    entry_px: number;
    pnl: number;
    leverage: number;
  }> = data.positions ?? [];
  const history: Array<{
    asset: string;
    side: string;
    size: number;
    pnl: number;
    closed_at: string;
  }> = data.history ?? [];

  const pnlByAsset = Object.entries(
    positions.reduce(
      (acc: Record<string, number>, p) => {
        acc[p.asset] = (acc[p.asset] ?? 0) + p.pnl;
        return acc;
      },
      {},
    ),
  ).map(([name, value]) => ({ name, value: Math.abs(value) }));

  return (
    <PageContainer>
      <SectionHeader
        title={`${address.slice(0, 6)}...${address.slice(-4)}`}
        subtitle="trader profile · positions · pnl history"
      />

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KPICard
          label="Account Value"
          value={fmt.usd(summary.account_value)}
        />
        <KPICard
          label="Total PnL"
          value={fmt.usd(summary.total_pnl)}
          highlight={(summary.total_pnl ?? 0) > 0}
        />
        <KPICard
          label="Open Positions"
          value={String(positions.length)}
        />
        <KPICard
          label="Win Rate"
          value={
            summary.win_rate != null
              ? `${(summary.win_rate * 100).toFixed(1)}%`
              : '—'
          }
        />
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-4">
        {(['positions', 'history'] as const).map((t) => (
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

      {tab === 'positions' && (
        <div className="card overflow-x-auto mb-4">
          <table className="w-full text-sm font-mono">
            <thead>
              <tr className="border-b border-white/5">
                {['Asset', 'Side', 'Size', 'Entry', 'PnL', 'Lev'].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-white/30 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {positions.map((pos, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/2">
                  <td className="px-3 py-2 text-neon-green font-semibold">{pos.asset}</td>
                  <td
                    className={`px-3 py-2 ${
                      pos.side === 'long' ? 'text-neon-green' : 'text-red-400'
                    }`}
                  >
                    {pos.side}
                  </td>
                  <td className="px-3 py-2 text-white/80">{fmt.num(pos.size)}</td>
                  <td className="px-3 py-2 text-white/60">{fmt.price(pos.entry_px)}</td>
                  <td
                    className={`px-3 py-2 ${
                      pos.pnl >= 0 ? 'text-neon-green' : 'text-red-400'
                    }`}
                  >
                    {fmt.usd(pos.pnl)}
                  </td>
                  <td className="px-3 py-2 text-white/40">{pos.leverage}x</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'history' && (
        <div className="card overflow-x-auto mb-4">
          <table className="w-full text-sm font-mono">
            <thead>
              <tr className="border-b border-white/5">
                {['Asset', 'Side', 'Size', 'PnL', 'Closed At'].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-white/30 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map((trade, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/2">
                  <td className="px-3 py-2 text-neon-green font-semibold">{trade.asset}</td>
                  <td
                    className={`px-3 py-2 ${
                      trade.side === 'long' ? 'text-neon-green' : 'text-red-400'
                    }`}
                  >
                    {trade.side}
                  </td>
                  <td className="px-3 py-2 text-white/80">{fmt.num(trade.size)}</td>
                  <td
                    className={`px-3 py-2 ${
                      trade.pnl >= 0 ? 'text-neon-green' : 'text-red-400'
                    }`}
                  >
                    {fmt.usd(trade.pnl)}
                  </td>
                  <td className="px-3 py-2 text-white/40 text-xs">
                    {new Date(trade.closed_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PnL by asset chart */}
      {pnlByAsset.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-mono text-white/40 mb-3">PnL by Asset</h3>
          <PieChart data={pnlByAsset} />
        </div>
      )}
    </PageContainer>
  );
}
