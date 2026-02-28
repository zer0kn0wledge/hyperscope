'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer, SectionHeader } from '@/components/layout/PageContainer';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { AddressSearch } from '@/components/traders/AddressSearch';
import { useLeaderboard, useTraderDistribution } from '@/hooks/useAPI';
import { formatUSD, formatAddress } from '@/lib/format';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Link from 'next/link';
import { ComparisonBar } from '@/components/charts/ComparisonBar';

function cn(...classes: (string | undefined | null | boolean)[]) {
  return twMerge(clsx(classes));
}

type AnyRecord = Record<string, unknown>;

export default function TradersPage() {
  const router = useRouter();
  const { data: leaderboardRaw, isLoading } = useLeaderboard(undefined, 100);
  const { data: distributionRaw, isLoading: distLoading } = useTraderDistribution();

  const leaderboard = (leaderboardRaw ?? []) as AnyRecord[];
  const distribution = (distributionRaw ?? []) as AnyRecord[];

  const columns: Column<AnyRecord>[] = [
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
      key: 'account_value',
      header: 'Account Value',
      align: 'right',
      sortable: true,
      render: (v) => <span className="number font-semibold">{formatUSD(Number(v))}</span>,
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
      key: 'total_margin_used',
      header: 'Margin Used',
      align: 'right',
      sortable: true,
      render: (v) => <span className="number">{formatUSD(Number(v))}</span>,
    },
    {
      key: 'position_count',
      header: 'Positions',
      align: 'right',
      render: (v) => <span className="number">{String(v)}</span>,
    },
  ];

  return (
    <PageContainer>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <SectionHeader
          title="Trader Leaderboard"
          subtitle="Top accounts by value"
        />
        <AddressSearch onSearch={(addr) => router.push(`/traders/${addr}`)} />
      </div>

      <DataTable
        columns={columns}
        data={leaderboard}
        isLoading={isLoading}
        onRowClick={(row) => router.push(`/traders/${String(row.address)}`)}
        rowKey={(r) => String(r.address)}
        skeletonRows={20}
      />

      {distribution.length > 0 && (
        <>
          <SectionHeader
            title="Account Distribution"
            subtitle="Account size brackets"
            className="mt-6"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {distribution.map((d, i) => (
              <div key={String(d.bracket ?? d.range ?? i)} className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-text-secondary text-sm">{String(d.bracket ?? d.range ?? `Tier ${i + 1}`)}</span>
                  <span className="number text-text-primary">{Number(d.count ?? 0).toLocaleString()} accounts</span>
                </div>
                <ComparisonBar
                  value={Number(d.count ?? 0)}
                  max={Math.max(...distribution.map((x) => Number(x.count ?? 0)), 1)}
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
