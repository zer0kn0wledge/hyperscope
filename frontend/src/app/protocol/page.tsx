'use client';

import { useMemo } from 'react';
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
  // protocolAPI.stats calls /protocol/hype — returns a single HYPE token object
  // protocolAPI.vaults calls /protocol/hlp  — returns a single HLP vault object
  // protocolAPI.staking calls /protocol/staking — returns a single staking object
  const { data: hypeData, isLoading: statsLoading } = useProtocolStats();
  const { data: hlpData, isLoading: vaultsLoading } = useVaultList();
  const { data: staking, isLoading: stakingLoading } = useStakingStats();

  // Safely cast to any objects (never iterate directly)
  const stats = hypeData as any;
  const hlp = hlpData as any;
  const stakingStats = staking as any;

  // TVL history — may come as an array field on the stats object, or be absent
  const tvlHistory = useMemo(() => {
    const history = stats?.tvl_history ?? stats?.history ?? [];
    if (!Array.isArray(history)) return [];
    return history.map((d: any) => ({
      time: new Date((d.time ?? d.date ?? 0) * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      tvl: d.tvl ?? d.value ?? 0,
    }));
  }, [stats]);

  const volumeHistory = useMemo(() => {
    const history = stats?.volume_history ?? [];
    if (!Array.isArray(history)) return [];
    return history.map((d: any) => ({
      time: new Date((d.time ?? d.date ?? 0) * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      volume: d.volume ?? d.value ?? 0,
    }));
  }, [stats]);

  const feeHistory = useMemo(() => {
    const history = stats?.fee_history ?? [];
    if (!Array.isArray(history)) return [];
    return history.map((d: any) => ({
      time: new Date((d.time ?? d.date ?? 0) * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fees: d.fees ?? d.value ?? 0,
    }));
  }, [stats]);

  // HLP vault: the API returns a single object, not an array
  // Build a single-row table from the object fields
  const vaultColumns: Column[] = [
    { key: 'name', label: 'Vault', render: (val: string) => <span style={{ color: '#e8e8e8', fontWeight: 500 }}>{val}</span> },
    { key: 'tvl', label: 'TVL', align: 'right', sortable: true, render: (val: number) => fmt.usd(val) },
    { key: 'apy', label: 'APY / Return', align: 'right', sortable: true, render: (val: number) => val != null ? <span style={{ color: val >= 0 ? CHART_COLORS.neon : CHART_COLORS.red }}>{(val * 100).toFixed(2)}%</span> : '—' },
    { key: 'followers', label: 'Depositors', align: 'right', sortable: true, render: (val: number) => val?.toLocaleString() ?? '—' },
    { key: 'description', label: 'Info', render: (val: string) => val ? <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>{val}</span> : '—' },
  ];

  // Normalise HLP object into a single table row (or multiple rows if it contains a nested list)
  const vaultRows: any[] = useMemo(() => {
    if (!hlp) return [];
    // If the API returns an array directly, use it as-is
    if (Array.isArray(hlp)) return hlp;
    // If it has a vaults/positions sub-array, use that
    if (Array.isArray(hlp.vaults)) return hlp.vaults;
    if (Array.isArray(hlp.positions)) return hlp.positions;
    // Otherwise wrap the single HLP object as one row
    return [{
      name: hlp.name ?? 'HLP Vault',
      tvl: hlp.total_value ?? hlp.tvl ?? hlp.equity ?? hlp.value ?? null,
      apy: hlp.apy ?? hlp.apr ?? hlp.return_rate ?? null,
      followers: hlp.n_users ?? hlp.depositors ?? hlp.followers ?? null,
      description: hlp.description ?? hlp.type ?? null,
    }];
  }, [hlp]);

  // Key HYPE metrics
  const hypePrice = stats?.price ?? stats?.mark_px ?? stats?.px ?? null;
  const hypeMarketCap = stats?.market_cap ?? stats?.marketCap ?? null;
  const hypeCirculating = stats?.circulating_supply ?? stats?.circulatingSupply ?? null;
  const hypeChange24h = stats?.change_24h ?? stats?.price_change_24h ?? null;

  return (
    <PageContainer>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#e8e8e8', margin: '0 0 0.375rem', letterSpacing: '-0.02em', fontFamily: 'Inter, sans-serif' }}>Protocol Stats</h1>
        <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.35)', margin: 0, fontFamily: 'Inter, sans-serif' }}>Hyperliquid protocol metrics, vaults, and staking</p>
      </div>

      {/* HYPE Token KPIs */}
      {statsLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          <KPICard
            label="HYPE Price"
            value={hypePrice != null ? `$${fmt.price(hypePrice)}` : '—'}
            sub="current price"
            change={hypeChange24h}
          />
          <KPICard
            label="Market Cap"
            value={hypeMarketCap != null ? fmt.usd(hypeMarketCap) : '—'}
            sub="fully diluted"
          />
          <KPICard
            label="Circulating Supply"
            value={hypeCirculating != null ? Number(hypeCirculating).toLocaleString() : '—'}
            sub="HYPE tokens"
          />
          <KPICard
            label="24h Change"
            value={hypeChange24h != null ? `${hypeChange24h >= 0 ? '+' : ''}${(hypeChange24h * 100).toFixed(2)}%` : '—'}
            sub="price change"
            change={hypeChange24h}
          />
        </div>
      )}

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <SectionHeader title="TVL History" subtitle="Protocol total value locked" />
          {statsLoading ? <SkeletonChart height={200} /> : tvlHistory.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.8125rem', fontFamily: 'JetBrains Mono, monospace' }}>no data</div>
          ) : (
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
          {statsLoading ? <SkeletonChart height={200} /> : volumeHistory.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.8125rem', fontFamily: 'JetBrains Mono, monospace' }}>no data</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={volumeHistory} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="time" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => fmt.usd(v)} width={72} />
                <Tooltip content={<CustomTooltip formatter={fmt.usd} />} />
                <Bar dataKey="volume" fill={CHART_COLORS.neon} fillOpacity={0.6} radius={[2, 2, 0, 0]} name="Volume" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <SectionHeader title="Fee Revenue" subtitle="Daily protocol fees collected" />
        {statsLoading ? <SkeletonChart height={180} /> : feeHistory.length === 0 ? (
          <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.8125rem', fontFamily: 'JetBrains Mono, monospace' }}>no data</div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={feeHistory} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs><linearGradient id="feeGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={CHART_COLORS.neon} stopOpacity={0.15} /><stop offset="100%" stopColor={CHART_COLORS.neon} stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="time" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => fmt.usd(v)} width={72} />
              <Tooltip content={<CustomTooltip formatter={fmt.usd} />} />
              <Area type="monotone" dataKey="fees" stroke={CHART_COLORS.neon} strokeWidth={1.5} fill="url(#feeGrad)" dot={false} name="Fees" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Staking stats (single object, never iterated) */}
      {!stakingLoading && stakingStats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          <KPICard
            label="Total Staked"
            value={stakingStats.total_staked != null ? fmt.usd(stakingStats.total_staked) : '—'}
            sub="HYPE staked"
          />
          <KPICard
            label="Staking APR"
            value={stakingStats.apr != null ? `${(stakingStats.apr * 100).toFixed(2)}%` : '—'}
            sub="annualized yield"
          />
          <KPICard
            label="Validators"
            value={stakingStats.validator_count != null ? String(stakingStats.validator_count) : '—'}
            sub="active validators"
          />
        </div>
      )}

      {/* HLP Vault table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.25rem 0' }}>
          <SectionHeader title="HLP Vault" subtitle="Hyperliquid liquidity provider vault" />
        </div>
        {vaultsLoading ? (
          <SkeletonTable rows={3} cols={5} />
        ) : (
          <DataTable
            columns={vaultColumns}
            data={vaultRows}
            rowKey={(row) => row.name ?? row.address ?? 'hlp'}
            emptyMessage="No vault data available"
          />
        )}
      </div>
    </PageContainer>
  );
}
