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
import { useProtocolStats, useVaultList, useStakingStats, useTVLData, useProtocolVolume, useProtocolFees } from '@/hooks/useAPI';
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
  const { data: hypeData, isLoading: statsLoading } = useProtocolStats();
  const { data: hlpData, isLoading: vaultsLoading } = useVaultList();
  const { data: staking, isLoading: stakingLoading } = useStakingStats();
  const { data: tvlData, isLoading: tvlLoading } = useTVLData();
  const { data: volumeData, isLoading: volumeLoading } = useProtocolVolume();
  const { data: feesData, isLoading: feesLoading } = useProtocolFees();

  const stats = hypeData as any;
  const hlp = hlpData as any;
  const stakingStats = staking as any;
  const tvlRaw = tvlData as any;
  const volRaw = volumeData as any;
  const feeRaw = feesData as any;

  // TVL history from /protocol/tvl -> { tvl_history: [{ date, totalLiquidityUSD }] }
  const tvlHistory = useMemo(() => {
    const history = tvlRaw?.tvl_history ?? [];
    if (!Array.isArray(history)) return [];
    return history.map((d: any) => ({
      time: new Date((d.date ?? d.time ?? 0) * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      tvl: d.totalLiquidityUSD ?? d.tvl ?? d.value ?? 0,
    }));
  }, [tvlRaw]);

  // Volume history from /protocol/volume -> { daily_chart: [{ date, volume_estimate }] }
  const volumeHistory = useMemo(() => {
    const history = volRaw?.daily_chart ?? [];
    if (!Array.isArray(history)) return [];
    return history.map((d: any) => ({
      time: new Date((d.date ?? d.time ?? 0) * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      volume: d.volume_estimate ?? d.volume ?? d.value ?? 0,
    }));
  }, [volRaw]);

  // Fee history from /protocol/fees -> { daily_chart: [{ date, fees }] }
  const feeHistory = useMemo(() => {
    const history = feeRaw?.daily_chart ?? [];
    if (!Array.isArray(history)) return [];
    return history.map((d: any) => ({
      time: new Date((d.date ?? d.time ?? 0) * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fees: d.fees ?? d.value ?? 0,
    }));
  }, [feeRaw]);

  const vaultColumns: Column[] = [
    { key: 'name', label: 'Vault', render: (val: string) => <span style={{ color: '#e8e8e8', fontWeight: 500 }}>{val}</span> },
    { key: 'tvl', label: 'TVL', align: 'right', sortable: true, render: (val: number) => fmt.usd(val) },
    { key: 'apy', label: 'APY / Return', align: 'right', sortable: true, render: (val: number) => val != null ? <span style={{ color: val >= 0 ? CHART_COLORS.neon : CHART_COLORS.red }}>{(val * 100).toFixed(2)}%</span> : '\u2014' },
    { key: 'followers', label: 'Depositors', align: 'right', sortable: true, render: (val: number) => val?.toLocaleString() ?? '\u2014' },
    { key: 'description', label: 'Info', render: (val: string) => val ? <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>{val}</span> : '\u2014' },
  ];

  const vaultRows: any[] = useMemo(() => {
    if (!hlp) return [];
    if (Array.isArray(hlp)) return hlp;
    if (Array.isArray(hlp.vaults)) return hlp.vaults;
    if (Array.isArray(hlp.positions)) return hlp.positions;
    return [{ name: hlp.name ?? 'HLP Vault', tvl: hlp.total_value ?? hlp.tvl ?? hlp.equity ?? hlp.value ?? null, apy: hlp.apy ?? hlp.apr ?? hlp.return_rate ?? null, followers: hlp.n_users ?? hlp.depositors ?? hlp.followers ?? null, description: hlp.description ?? hlp.type ?? null }];
  }, [hlp]);

  const hypePrice = stats?.price ?? stats?.mark_px ?? stats?.px ?? null;
  const hypeMarketCap = stats?.market_cap ?? stats?.marketCap ?? null;
  const hypeFDV = stats?.fdv ?? stats?.fully_diluted_valuation ?? stats?.fully_diluted_market_cap ?? null;
  const hypeCirculating = stats?.circulating_supply ?? stats?.circulatingSupply ?? null;
  const hypeChange24h = stats?.change_24h ?? stats?.price_change_24h ?? null;

  // Protocol-level KPIs from dedicated endpoints
  const currentTVL = tvlRaw?.current_tvl ?? null;
  const volume24h = volRaw?.total_24h ?? null;
  const fees24h = feeRaw?.total_24h ?? null;

  const totalStakedDisplay = stakingStats?.total_staked != null ? `${Number(stakingStats.total_staked).toLocaleString()} HYPE` : '\u2014';
  const aprDisplay = stakingStats?.average_apr != null ? `${(stakingStats.average_apr * 100).toFixed(2)}%` : stakingStats?.apr != null ? `${(stakingStats.apr * 100).toFixed(2)}%` : '\u2014';

  return (
    <PageContainer>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#e8e8e8', margin: '0 0 0.375rem', letterSpacing: '-0.02em', fontFamily: 'Inter, sans-serif' }}>Protocol Stats</h1>
        <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.35)', margin: 0, fontFamily: 'Inter, sans-serif' }}>Hyperliquid protocol metrics, vaults, and staking</p>
      </div>

      {/* HYPE Token KPIs */}
      {statsLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>{[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          <KPICard label="HYPE Price" value={hypePrice != null ? `$${fmt.price(hypePrice)}` : '\u2014'} sub="current price" change={hypeChange24h} />
          <KPICard label="Market Cap" value={hypeMarketCap != null ? fmt.usd(hypeMarketCap) : '\u2014'} sub={hypeFDV != null ? `FDV ${fmt.usd(hypeFDV)}` : 'fully diluted'} />
          <KPICard label="Circulating Supply" value={hypeCirculating != null ? Number(hypeCirculating).toLocaleString() : '\u2014'} sub="HYPE tokens" />
          <KPICard label="24h Change" value={hypeChange24h != null ? `${hypeChange24h >= 0 ? '+' : ''}${(hypeChange24h * 100).toFixed(2)}%` : '\u2014'} sub="price change" change={hypeChange24h} />
        </div>
      )}

      {/* Protocol KPIs: TVL, Volume, Fees */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <KPICard label="Total Value Locked" value={currentTVL != null ? fmt.usd(currentTVL) : tvlLoading ? '...' : '\u2014'} sub="protocol TVL" />
        <KPICard label="24h Volume" value={volume24h != null ? fmt.usd(volume24h) : volumeLoading ? '...' : '\u2014'} sub="trading volume" />
        <KPICard label="24h Fees" value={fees24h != null ? fmt.usd(fees24h) : feesLoading ? '...' : '\u2014'} sub="fee revenue" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <SectionHeader title="TVL History" subtitle="Protocol total value locked" />
          {tvlLoading ? <SkeletonChart height={200} /> : tvlHistory.length === 0 ? (
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
          {volumeLoading ? <SkeletonChart height={200} /> : volumeHistory.length === 0 ? (
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
        {feesLoading ? <SkeletonChart height={180} /> : feeHistory.length === 0 ? (
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

      {!stakingLoading && stakingStats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          <KPICard label="Total Staked" value={totalStakedDisplay} sub="HYPE staked" />
          <KPICard label="Staking APR" value={aprDisplay} sub="annualized yield" />
          <KPICard label="Validators" value={stakingStats.validator_count != null ? String(stakingStats.validator_count) : '\u2014'} sub="active validators" />
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.25rem 0' }}>
          <SectionHeader title="HLP Vault" subtitle="Hyperliquid liquidity provider vault" />
        </div>
        {vaultsLoading ? <SkeletonTable rows={3} cols={5} /> : <DataTable columns={vaultColumns} data={vaultRows} rowKey={(row) => row.name ?? row.address ?? 'hlp'} emptyMessage="No vault data available" />}
      </div>
    </PageContainer>
  );
}
