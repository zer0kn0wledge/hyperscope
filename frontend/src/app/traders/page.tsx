'use client';

import { useState } from 'react';
import { useLeaderboard } from '@/hooks/useHyperscope';
import { PageContainer, SectionHeader } from '@/components/ui/PageLayout';
import { fmt } from '@/lib/format';
import Link from 'next/link';

export default function TradersPage() {
  const { data, isLoading, error } = useLeaderboard();
  const [sort, setSort] = useState<'pnl' | 'volume' | 'win_rate'>('pnl');

  if (isLoading)
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <div className="text-neon-green animate-pulse font-mono text-sm">
            loading leaderboard...
          </div>
        </div>
      </PageContainer>
    );

  if (error || !data)
    return (
      <PageContainer>
        <div className="text-red-400 font-mono text-sm">
          error loading leaderboard
        </div>
      </PageContainer>
    );

  type Trader = {
    address: string;
    pnl: number;
    volume: number;
    win_rate: number;
    num_trades: number;
  };

  const traders: Trader[] = [...(data.traders ?? [])];
  traders.sort((a, b) => (b[sort] ?? 0) - (a[sort] ?? 0));

  return (
    <PageContainer>
      <SectionHeader
        title="Traders"
        subtitle="leaderboard · top performers"
      />

      {/* Sort controls */}
      <div className="flex gap-2 mb-4">
        {(['pnl', 'volume', 'win_rate'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSort(s)}
            className={`px-3 py-1.5 text-xs font-mono rounded border transition-colors ${
              sort === s
                ? 'border-neon-green text-neon-green bg-neon-green/5'
                : 'border-white/10 text-white/40 hover:border-white/20'
            }`}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm font-mono">
          <thead>
            <tr className="border-b border-white/5">
              {['#', 'Address', 'PnL', 'Volume', 'Win Rate', 'Trades'].map(
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
            {traders.map((trader, i) => (
              <tr
                key={trader.address}
                className="border-b border-white/5 hover:bg-white/2 cursor-pointer"
              >
                <td className="px-3 py-2 text-white/30">{i + 1}</td>
                <td className="px-3 py-2">
                  <Link
                    href={`/traders/${trader.address}`}
                    className="text-neon-green hover:underline"
                  >
                    {trader.address.slice(0, 8)}...{trader.address.slice(-6)}
                  </Link>
                </td>
                <td
                  className={`px-3 py-2 ${
                    (trader.pnl ?? 0) >= 0 ? 'text-neon-green' : 'text-red-400'
                  }`}
                >
                  {fmt.usd(trader.pnl)}
                </td>
                <td className="px-3 py-2 text-white/60">{fmt.usd(trader.volume)}</td>
                <td className="px-3 py-2 text-white/60">
                  {trader.win_rate != null
                    ? `${(trader.win_rate * 100).toFixed(1)}%`
                    : '—'}
                </td>
                <td className="px-3 py-2 text-white/40">{trader.num_trades}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageContainer>
  );
}
