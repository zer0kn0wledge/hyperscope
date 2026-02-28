'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer, SectionHeader } from '@/components/layout/PageContainer';
import { DataTable, Column } from '@/components/ui/DataTable';
import { AddressSearch } from '@/components/traders/AddressSearch';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { useLeaderboard } from '@/hooks/useAPI';
import { fmt } from '@/lib/format';
import { CHART_COLORS } from '@/lib/constants';

type SortField = 'account_value' | 'position_count' | 'unrealized_pnl';

interface LeaderboardEntry {
  address: string;
  account_value: number;
  unrealized_pnl: number;
  total_margin_used: number;
  withdrawable: number;
  position_count: number;
  rank: number;
}

export default function TradersPage() {
  const router = useRouter();
  const [sortField, setSortField] = useState<SortField>('account_value');

  const { data, isLoading, error, refetch } = useLeaderboard({ sort: sortField });

  const entries: LeaderboardEntry[] = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    return data as LeaderboardEntry[];
  }, [data]);

  const columns: Column<LeaderboardEntry>[] = [
    {
      key: 'rank',
      label: 'Rank',
      align: 'center',
      width: '60px',
      render: (val: number) => (
        <span style={{ color: val <= 3 ? CHART_COLORS.neon : 'rgba(255,255,255,0.4)', fontWeight: val <= 3 ? 600 : 400 }}>#{val}</span>
      ),
    },
    {
      key: 'address',
      label: 'Address',
      render: (val: string) => (
        <button
          onClick={() => router.push(`/traders/${val}`)}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: CHART_COLORS.neon, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8125rem', textDecoration: 'none' }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.textDecoration = 'underline')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.textDecoration = 'none')}
          title={val}
        >
          {fmt.address(val)}
        </button>
      ),
    },
    { key: 'account_value', label: 'Account Value', align: 'right', sortable: true, render: (val: number) => <span style={{ color: '#e8e8e8', fontWeight: 500 }}>{fmt.usd(val)}</span> },
    { key: 'unrealized_pnl', label: 'Unrealized PnL', align: 'right', sortable: true, render: (val: number) => { if (!val) return <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>; return <span style={{ color: val >= 0 ? CHART_COLORS.neon : CHART_COLORS.red }}>{val >= 0 ? '+' : ''}{fmt.usd(val)}</span>; } },
    { key: 'total_margin_used', label: 'Margin Used', align: 'right', sortable: true, render: (val: number) => val > 0 ? fmt.usd(val) : <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span> },
    { key: 'withdrawable', label: 'Withdrawable', align: 'right', sortable: true, render: (val: number) => fmt.usd(val) },
    { key: 'position_count', label: 'Positions', align: 'right', sortable: true, render: (val: number) => <span style={{ color: val > 0 ? '#e8e8e8' : 'rgba(255,255,255,0.3)' }}>{val > 0 ? val : '—'}</span> },
  ];

  const handleSearch = (address: string) => { router.push(`/traders/${address}`); };
  const isLimitedData = entries.length <= 3;

  return (
    <PageContainer>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#e8e8e8', margin: '0 0 0.375rem', letterSpacing: '-0.02em', fontFamily: 'Inter, sans-serif' }}>Traders</h1>
        <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.35)', margin: 0, fontFamily: 'Inter, sans-serif' }}>Leaderboard and trader lookup by address</p>
      </div>
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <SectionHeader title="Lookup Trader" subtitle="Enter any Hyperliquid address to view positions, fills, and PnL" />
        <AddressSearch onSearch={handleSearch} label="Trader Address" placeholder="0x... Hyperliquid address" />
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.25rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div><SectionHeader title="Top Accounts by Value" subtitle={isLimitedData ? 'Showing top accounts — full leaderboard coming soon' : 'Top traders ranked by account value'} /></div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
            {(['account_value', 'position_count', 'unrealized_pnl'] as SortField[]).map((field) => {
              const labels: Record<SortField, string> = { account_value: 'By Value', position_count: 'By Positions', unrealized_pnl: 'By PnL' };
              return <button key={field} onClick={() => setSortField(field)} style={{ background: sortField === field ? 'rgba(0,255,136,0.12)' : 'rgba(255,255,255,0.04)', border: sortField === field ? '1px solid rgba(0,255,136,0.3)' : '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: sortField === field ? '#00ff88' : 'rgba(255,255,255,0.45)', fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', fontWeight: 500, padding: '0.375rem 0.75rem', cursor: 'pointer', transition: 'all 0.15s ease' }}>{labels[field]}</button>;
            })}
          </div>
        </div>
        {isLimitedData && entries.length > 0 && !isLoading && (
          <div style={{ margin: '0 1.25rem', padding: '0.625rem 1rem', background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.15)', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Badge variant="yellow" size="xs">Note</Badge>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif' }}>Showing top accounts by value — full leaderboard coming soon</span>
          </div>
        )}
        {isLoading ? <SkeletonTable rows={8} cols={7} /> : error ? <div style={{ padding: '3rem', textAlign: 'center', color: CHART_COLORS.red, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8125rem' }}>Failed to load leaderboard<button onClick={() => refetch()} style={{ display: 'block', margin: '1rem auto 0', background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: '6px', color: '#00ff88', fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', padding: '0.375rem 1rem', cursor: 'pointer' }}>Retry</button></div> : <DataTable columns={columns} data={entries} rowKey={(row) => row.address} onRowClick={(row) => router.push(`/traders/${row.address}`)} emptyMessage="No leaderboard data available" />}
      </div>
    </PageContainer>
  );
}
