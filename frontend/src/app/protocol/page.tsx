'use client';

import { useState, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { PageContainer, SectionHeader } from '@/components/layout/PageContainer';
import { KPICard } from '@/components/ui/KPICard';
import { DataTable, Column } from '@/components/ui/DataTable';
import { SkeletonCard, SkeletonChart, SkeletonTable } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { useProtocolStats, useVaultList, useStakingStats } from '@/hooks/useAPI';
import { fmt } from '@/lib/format';
import { CHART_COLORS } from '@/lib/constants';

function CustomTooltip({ active, payload, label, formatter }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0a0a0a', border: '1px solid rgba(0,255,136,0.2)', borderRadius: '10px', padding: '0.625rem 0.875rem', fontFamily: 'JetBrains Mono, monospace', minWidth: 140 }}>
      <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
          <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)' }}>{p.name}</span>
          <span style={{ fontSize: '0.75rem', color: p.color ?? p.fill ?? '#e8e8e8' }}>{formatter ? formatter(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function ProtocolPage() {
  const { data: stats, isLoading: statsLoading } = useProtocolStats();
  const { data: vaults, isLoading: vaultsLoading } = useVaultList();
  const { data: staking, isLoading: stakingLoading } = useStakingStats();

  const tvlHistory = useMemo(() => {
    if (!stats?.tvl_history) return [];
    return (stats.tvl_history as any[]).map((d) => ({ time: new Date((d.time ?? d.date) * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), tvl: d.tvl ?? d.value }));
  }, [stats]);

  const volumeHistory = useMemo(() => {
    if (!stats?.volume_history) return [];
    return (stats.volume_history as any[]).map((d) => ({ time: new Date((d.time ?? d.date) * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), volume: d.volume ?? d.value }));
  }, [stats]);

  const feeHistory = useMemo(() => {
    if (!stats?.fee_history) return [];
    return (stats.fee_history as any[]).map((d) => ({ time: new Date((d.time ?? d.date) * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), fees: d.fees ?? d.value }));
  }, [stats]);

  const vaultColumns: Column[] = [
    { key: 'name', label: 'Vault', render: (val: string) => <span style={{ color: '#e8e8e8', fontWeight: 500 }}>{val}</span> },
    { key: 'tvl', label: 'TVL', align: 'right', sortable: true, render: (val: number) => fmt.usd(val) },
    { key: 'apy', label: 'APY', align: 'right', sortable: true, render: (val: number) => val != null ? <span style={{ color: val >= 0 ? CHART_COLORS.neon : CHART_COLORS.red }}>{(val * 100).toFixed(2)}%</span> : '—' },
    { key: 'followers', label: 'Followers', align: 'right', sortable: true, render: (val: number) => val?.toLocaleString() ?? '—' },
    { key: 'leader', label: 'Leader', render: (val: string) => val ? <span style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' }}>{fmt.address(val)}</span> : '—' },
  ];

  return (
    <PageContainer>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#e8e8e8', margin: '0 0 0.375rem', letterSpacing: '-0.02em', fontFamily: 'Inter, sans-serif' }}>Protocol Stats</h1>
        <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.35)', margin: 0, fontFamily: 'Inter, sans-serif' }}>Hyperliquid protocol metrics, vaults, and staking</p>
      </div>

      {statsLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>{[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          <KPICard label="Total TVL" value={fmt.usd(stats?.tvl)} sub="protocol TVL" />
          <KPICard label="Total Volume" value={fmt.usd(stats?.total_volume)} sub="all-time" />
          <KPICard label="Total Fees" value={fmt.usd(stats?.total_fees)} sub="protocol fees" />
          <KPICard label="Unique Users" value={stats?.unique_users?.toLocaleString() ?? '—'} sub="all-time traders" />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <SectionHeader title="TVL History" subtitle="Protocol total value locked" />
          {statsLoading ? <SkeletonChart height={200} /> : tvlHistory.length === 0 ? <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.8125rem', fontFamily: 'JetBrains Mono, monospace' }}>no data</div> : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={tvlHistory} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs><linearGradient id="tvlGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={CHART_COLORS.neon} stopOpacity={0.15} /><stop offset="100%" stopColor={CHART_COLORS.neon} stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="time" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => fmt.usd(v)} width={72} />
                <Tooltip content={<CustomTooltip formatter={fmt.usd} />} />
                <Area type="monotone" dataKey="tvl" stroke={CHART_COLORS.neon} strokeWidth={1.5} fill="url(#tvlGrad)" dot={false} name="TVL" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="card" style={{ padding: '1.25rem' }}>
          <SectionHeader title="Daily Volume" subtitle="Protocol trading volume history" />
          {statsLoading ? <SkeletonChart height={200} /> : volumeHistory.length === 0 ? <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.8125rem', fontFamily: 'JetBrains Mono, monospace' }}>no data</div> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={volumeHistory} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="time" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => fmt.usd(v)} width={72} />
                <Tooltip content={<CustomTooltip formatter={fmt.usd} />} />
                <Bar dataKey="volume" fill={CHART_COLORS.blue} fillOpacity={0.8} radius={[2, 2, 0, 0]} name="Volume" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <SectionHeader title="Fee Revenue" subtitle="Daily protocol fees collected" />
        {statsLoading ? <SkeletonChart height={180} /> : feeHistory.length === 0 ? <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.8125rem', fontFamily: 'JetBrains Mono, monospace' }}>no data</div> : (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={feeHistory} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs><linearGradient id="feeGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={CHART_COLORS.purple} stopOpacity={0.15} /><stop offset="100%" stopColor={CHART_COLORS.purple} stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="time" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => fmt.usd(v)} width={72} />
              <Tooltip content={<CustomTooltip formatter={fmt.usd} />} />
              <Area type="monotone" dataKey="fees" stroke={CHART_COLORS.purple} strokeWidth={1.5} fill="url(#feeGrad)" dot={false} name="Fees" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {staking && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          <KPICard label="Total Staked" value={fmt.usd((staking as any).total_staked)} sub="HYPE staked" />
          <KPICard label="Staking APR" value={(staking as any).apr != null ? `${((staking as any).apr * 100).toFixed(2)}%` : '—'} sub="annualized yield" />
          <KPICard label="Validators" value={(staking as any).validator_count?.toString() ?? '—'} sub="active validators" />
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.25rem 0' }}><SectionHeader title="Vaults" subtitle="Active Hyperliquid vaults" /></div>
        {vaultsLoading ? <SkeletonTable rows={6} cols={5} /> : <DataTable columns={vaultColumns} data={(vaults as any[]) ?? []} rowKey={(row) => row.name ?? row.address} emptyMessage="No vaults available" />}
      </div>
    </PageContainer>
  );
}
