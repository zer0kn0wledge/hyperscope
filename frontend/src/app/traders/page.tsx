'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer, SectionHeader } from '@/components/layout/PageContainer';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { AddressSearch } from '@/components/traders/AddressSearch';
import { useLeaderboard, useTraderDistribution } from '@/hooks/useAPI';
import { formatUSD, formatAddress, formatPercent } from '@/lib/format';
import type { TraderLeaderboardEntry } from '@/lib/types';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Link from 'next/link';
import { Trophy, TrendingUp, BarChart2 } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { ComparisonBar } from '@/components/charts/ComparisonBar';

function cn(...classes: (string | undefined | null | boolean)[]) {
  return twMerge(clsx(classes));
}

const SORT_OPTIONS = [
  { value: 'pnl', label: 'Realized PnL' },
  { value: 'volume', label: 'Volume' },
  { value: 'unrealized_pnl', label: 'Unrealized PnL' },
];

export default function TradersPage() {
  const router = useRouter();
  const [sort, setSort] = useState('pnl');
  const { data: leaderboard, isLoading } = useLeaderboard(sort, 100);
  const { data: distribution, isLoading: distLoading } = useTraderDistribution();

  const columns: Column<TraderLeaderboardEntry>[] = [
    {
      key: 'rank',
      header: '#',
      render: (v) => (
        <span className={cn(
          'number font-bold text-sm',
          Number(v) === 1 ? 'text-accent-yellow' : Number(v) <= 3 ? 'text-accent-cyan' : 'text-text-muted'
        )}>
          {Number(v) === 1 ? '🥇' : Number(v) === 2 ? '🥈' : Number(v) === 3 ? '🥉' : `#${v}`}
        </span>
      ),
    },
    {
      key: 'address',
      header: 'Address',
      render: (v) => (
        <Link
          href={`/traders/${String(v)}`}
          className="number text-accent-cyan hover:underline"
        >
          {formatAddress(String(v))}
        </Link>
      ),
    },
    {
      key: 'realized_pnl',
      header: 'Realized PnL',
      align: 'right',
      sortable: true,
      render: (v) => {
        const n = Number(v);
        return (
          <span className={cn('number font-semibold', n >= 0 ? 'text-accent-green' : 'text-accent-red')}>
            {n >= 0 ? '+' : ''}{formatUSD(n)}
          </span>
        );
      },
    },
    {
      key: 'unrealized_pnl',
      header: 'Unrealized PnL',
      align: 'right',
      sortable: true,
      render: (v) => {
        const n = Number(v);
        return (
          <span className={cn('number', n >= 0 ? 'text-accent-green' : 'text-accent-red')}>
            {n >= 0 ? '+' : ''}{formatUSD(n)}
          </span>
        );
      },
    },
    {
      key: 'volume',
      header: 'Volume',
      align: 'right',
      sortable: true,
      render: (v) => <span className="number">{formatUSD(Number(v))}</span>,
    },
    {
      key: 'win_rate',
      header: 'Win Rate',
      align: 'right',
      sortable: true,
      render: (v) => <span className="number">{formatPercent(Number(v))}</span>,
    },
  ];

  return (
    <PageContainer>
      <div className="flex items-center justify-between">
        <SectionHeader
          title="Trader Leaderboard"
          subtitle="Top traders ranked by realized PnL"
        />
        <div className="flex items-center gap-3">
          <AddressSearch onSearch={(addr) => router.push(`/traders/${addr}`)} />
          <Select options={SORT_OPTIONS} value={sort} onChange={setSort} />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={leaderboard ?? []}
        isLoading={isLoading}
        onRowClick={(row) => router.push(`/traders/${row.address}`)}
        rowKey={(r) => r.address}
        skeletonRows={20}
      />

      {distribution && (
        <>
          <SectionHeader
            title="Trader Distribution"
            subtitle="PnL brackets across all traders"
            className="mt-6"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {distribution.map((d) => (
              <div key={d.bracket} className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-text-secondary text-sm">{d.bracket}</span>
                  <span className="number text-text-primary">{d.count.toLocaleString()} traders</span>
                </div>
                <ComparisonBar
                  value={d.count}
                  max={Math.max(...distribution.map((x) => x.count))}
                  color="#00D1FF"
                />
              </div>
            ))}
          </div>
        </>
      )}
    </PageContainer>
  );
}
