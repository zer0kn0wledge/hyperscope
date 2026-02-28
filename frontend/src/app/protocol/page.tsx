'use client';

import { useState } from 'react';
import { PageContainer, SectionHeader } from '@/components/layout/PageContainer';
import { KPICard } from '@/components/ui/KPICard';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Tabs } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { Tooltip, InfoIcon } from '@/components/ui/Tooltip';
import { AreaChartComponent } from '@/components/charts/AreaChart';
import { useFees, useRevenue, useAF, useHLP, useStaking, useHypeToken } from '@/hooks/useAPI';
import {
  formatUSD,
  formatPercent,
  formatAddress,
  formatDate,
  formatNumber,
  formatTokenAmount,
} from '@/lib/format';
import { AF_ADDRESS, HLP_ADDRESS, CHART_COLORS } from '@/lib/constants';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/Skeleton';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...classes: (string | undefined | null | boolean)[]) {
  return twMerge(clsx(classes));
}

const FEE_TABS = [
  { id: '7d', label: '7d' },
  { id: '30d', label: '30d' },
  { id: '90d', label: '90d' },
  { id: 'all', label: 'All' },
];

function AddressLink({ address }: { address: string }) {
  return (
    <Link
      href={`/traders/${address}`}
      className="number text-accent-cyan hover:underline text-xs flex items-center gap-1"
    >
      {formatAddress(address, 8)}
      <ExternalLink size={10} />
    </Link>
  );
}

type AnyRecord = Record<string, unknown>;

// Buyback table columns
const BUYBACK_COLUMNS: Column<AnyRecord>[] = [
  {
    key: 'time',
    header: 'Date',
    render: (v) => <span className="number text-text-secondary">{formatDate(Number(v))}</span>,
  },
  {
    key: 'type',
    header: 'Type',
    render: (v) => (
      <Badge variant={String(v) === 'send' ? 'buy' : 'neutral'}>
        {String(v) === 'send' ? 'Buyback' : String(v)}
      </Badge>
    ),
  },
  {
    key: 'amount',
    header: 'Amount (HYPE)',
    align: 'right',
    render: (v) => <span className="number font-medium">{formatNumber(Number(v), 2)} HYPE</span>,
  },
  {
    key: 'usd_value',
    header: 'Est. USD Value',
    align: 'right',
    render: (v, row) => {
      const amt = Number(row?.amount ?? 0);
      const hypePrice = Number(row?._hype_price ?? 0);
      const usd = hypePrice > 0 ? amt * hypePrice : 0;
      return <span className="number text-accent-cyan">{usd > 0 ? formatUSD(usd) : '-'}</span>;
    },
  },
];

export default function ProtocolPage() {
  const [feePeriod, setFeePeriod] = useState('30d');

  const { data: feesRaw, isLoading: feesLoading } = useFees(feePeriod);
  const { data: revenueRaw, isLoading: revLoading } = useRevenue();
  const { data: afRaw, isLoading: afLoading } = useAF();
  const { data: hlpRaw, isLoading: hlpLoading } = useHLP();
  const { data: stakingRaw, isLoading: stakingLoading } = useStaking();
  const { data: hypeRaw, isLoading: hypeLoading } = useHypeToken();

  // Cast to loose record type for snake_case field access
  const fees = feesRaw as AnyRecord | undefined;
  const revenue = revenueRaw as AnyRecord | undefined;
  const af = afRaw as AnyRecord | undefined;
  const hlp = hlpRaw as AnyRecord | undefined;
  const staking = stakingRaw as AnyRecord | undefined;
  const hype = hypeRaw as AnyRecord | undefined;

  const afShare = revenue?.af_share as AnyRecord | undefined;
  const hlpShare = revenue?.hlp_share as AnyRecord | undefined;

  // HYPE price for value calculations
  const hypePrice = Number(hype?.price ?? 0);

  // AF values
  const afHypeBalance = Number(af?.hype_balance ?? 0);
  const afUsdcBalance = Number(af?.usdc_balance ?? 0);
  const afHypeUsdValue = afHypeBalance * hypePrice;
  const afTotalUsd = afHypeUsdValue + afUsdcBalance;

  // HLP values
  const hlpTvl = Number(hlp?.tvl ?? 0);
  const hlpApr = Number(hlp?.apr ?? 0);

  // Buybacks - enrich with current price for USD estimation
  const buybacks = ((af?.recent_buybacks ?? []) as AnyRecord[])
    .map((b) => ({ ...b, _hype_price: hypePrice }))
    .sort((a, b) => Number(b.time ?? 0) - Number(a.time ?? 0));

  // Buyback chart data (cumulative)
  const buybackChartData = [...buybacks].reverse().reduce<{ time: number; cumulative: number }[]>((acc, b) => {
    const prev = acc[acc.length - 1]?.cumulative ?? 0;
    acc.push({ time: Number(b.time), cumulative: prev + Number(b.amount ?? 0) });
    return acc;
  }, []);

  // Staking validators
  const validators = (staking?.validators as AnyRecord[]) ?? [];

  const VALIDATOR_COLUMNS: Column<AnyRecord>[] = [
    {
      key: 'name',
      header: 'Validator',
      render: (v) => <span className="font-medium">{String(v ?? 'Unknown')}</span>,
    },
    {
      key: 'validator',
      header: 'Address',
      render: (v) => v ? <AddressLink address={String(v)} /> : <span className="text-text-muted">-</span>,
    },
    {
      key: 'stake',
      header: 'Stake',
      align: 'right',
      sortable: true,
      render: (v) => <span className="number">{formatTokenAmount(Number(v))} HYPE</span>,
    },
    {
      key: 'commission',
      header: 'Commission',
      align: 'right',
      render: (v) => <span className="number">{formatPercent(Number(v))}</span>,
    },
    {
      key: 'is_jailed',
      header: 'Status',
      render: (v) => (
        <Badge variant={!v ? 'buy' : 'sell'}>{!v ? 'Active' : 'Jailed'}</Badge>
      ),
    },
  ];

  return (
    <PageContainer>
      {/* HYPE Token KPIs */}
      <SectionHeader title="HYPE Token" subtitle="Native token metrics" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard label="HYPE Price" value={hype?.price ? formatUSD(Number(hype.price)) : undefined} isLoading={hypeLoading} />
        <KPICard label="Market Cap" value={hype?.market_cap ? formatUSD(Number(hype.market_cap)) : undefined} isLoading={hypeLoading} />
        <KPICard label="24h Volume" value={hype?.volume_24h ? formatUSD(Number(hype.volume_24h)) : undefined} isLoading={hypeLoading} />
        <KPICard label="Circulating Supply" value={hype?.circulating_supply ? formatNumber(Number(hype.circulating_supply)) : undefined} isLoading={hypeLoading} />
      </div>

      {/* Protocol Revenue */}
      <SectionHeader title="Protocol Revenue" subtitle="Cumulative and daily revenue" />
      {revLoading ? (
        <Skeleton className="h-40 rounded-lg" />
      ) : revenue ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPICard label="All-Time Revenue" value={formatUSD(Number(revenue.total_all_time ?? 0))} />
          <KPICard label="24h Revenue" value={formatUSD(Number(revenue.total_24h ?? 0))} />
          <KPICard label="7d Revenue" value={formatUSD(Number(revenue.total_7d ?? 0))} />
          <KPICard label="30d Revenue" value={formatUSD(Number(revenue.total_30d ?? 0))} />
        </div>
      ) : null}

      {/* Revenue Split - with explicit label for % of revenue */}
      {afShare && hlpShare && (
        <>
          <SectionHeader
            title="Revenue Allocation"
            subtitle="How protocol revenue is distributed"
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-4 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-accent-cyan" />
                <span className="font-semibold text-sm">Assistance Fund</span>
                <Tooltip content="97% of all trading fee revenue is allocated to the Assistance Fund">
                  <span className="text-2xs px-1.5 py-0.5 rounded bg-accent-cyan/10 text-accent-cyan font-mono">
                    {(Number(afShare.fraction ?? 0) * 100).toFixed(0)}% of revenue
                  </span>
                </Tooltip>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary text-sm">24h</span>
                <span className="number">{formatUSD(Number(afShare.revenue_24h ?? 0))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary text-sm">All-Time</span>
                <span className="number">{formatUSD(Number(afShare.revenue_all_time ?? 0))}</span>
              </div>
            </div>
            <div className="card p-4 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-accent-green" />
                <span className="font-semibold text-sm">HLP</span>
                <Tooltip content="3% of all trading fee revenue is allocated to HLP">
                  <span className="text-2xs px-1.5 py-0.5 rounded bg-accent-green/10 text-accent-green font-mono">
                    {(Number(hlpShare.fraction ?? 0) * 100).toFixed(0)}% of revenue
                  </span>
                </Tooltip>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary text-sm">24h</span>
                <span className="number">{formatUSD(Number(hlpShare.revenue_24h ?? 0))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary text-sm">All-Time</span>
                <span className="number">{formatUSD(Number(hlpShare.revenue_all_time ?? 0))}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Fee Info */}
      <SectionHeader title="Trading Fees" subtitle="Fee revenue breakdown" />
      <div className="flex justify-end mb-2">
        <Tabs tabs={FEE_TABS} activeTab={feePeriod} onTabChange={setFeePeriod} size="sm" />
      </div>
      {feesLoading ? (
        <Skeleton className="h-32 rounded-lg" />
      ) : fees ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPICard label="24h Fees" value={formatUSD(Number(fees.total_24h ?? 0))} />
          <KPICard label="7d Fees" value={formatUSD(Number(fees.total_7d ?? 0))} />
          <KPICard label="30d Fees" value={formatUSD(Number(fees.total_30d ?? 0))} />
          <KPICard label="All-Time Fees" value={formatUSD(Number(fees.total_all_time ?? 0))} />
        </div>
      ) : null}

      {/* AF + HLP side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Assistance Fund */}
        <div>
          <SectionHeader
            title="Assistance Fund"
            subtitle={
              <>
                <AddressLink address={AF_ADDRESS} />
                <Tooltip content="The AF absorbs losses from liquidations that exceed the liquidated position's margin. It receives 97% of trading fees.">
                  <InfoIcon />
                </Tooltip>
              </>
            }
          />
          {afLoading ? (
            <Skeleton className="h-40 rounded-lg" />
          ) : af ? (
            <div className="card p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary text-sm">Total Value (est.)</span>
                <span className="number font-bold text-lg text-accent-cyan">{formatUSD(afTotalUsd)}</span>
              </div>
              <div className="border-t border-border-subtle pt-2 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary text-sm">HYPE Balance</span>
                  <div className="text-right">
                    <span className="number font-semibold text-text-primary">{formatTokenAmount(afHypeBalance)} HYPE</span>
                    <span className="number text-xs text-text-muted ml-2">({formatUSD(afHypeUsdValue)})</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary text-sm">USDC Balance</span>
                  <span className="number text-accent-cyan">{formatUSD(afUsdcBalance)}</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* HLP */}
        <div>
          <SectionHeader
            title="HLP Vault"
            subtitle={
              <>
                <AddressLink address={HLP_ADDRESS} />
                <Tooltip content="The HLP is Hyperliquid's native market-making vault. It earns fees and takes on liquidation risk.">
                  <InfoIcon />
                </Tooltip>
              </>
            }
          />
          {hlpLoading ? (
            <Skeleton className="h-40 rounded-lg" />
          ) : hlp ? (
            <div className="card p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary text-sm">Total Value Locked</span>
                <span className="number font-bold text-lg text-accent-green">{formatUSD(hlpTvl)}</span>
              </div>
              <div className="border-t border-border-subtle pt-2 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary text-sm">APR</span>
                  <span className="number text-accent-green font-semibold">{formatPercent(hlpApr * 100)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary text-sm">Depositors</span>
                  <span className="number">{formatNumber(Number(hlp.depositor_count ?? 0))}</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Buyback History */}
      {buybacks.length > 0 && (
        <>
          <SectionHeader
            title="HYPE Buyback History"
            subtitle="Recent AF buyback transactions (cumulative HYPE acquired)"
          />
          {buybackChartData.length > 2 && (
            <div className="card p-4 mb-4">
              <AreaChartComponent
                data={buybackChartData}
                series={[{ key: 'cumulative', name: 'Cumulative Buybacks (HYPE)', color: CHART_COLORS.cyan }]}
                height={180}
                valueFormatter={(v) => `${formatNumber(v)} HYPE`}
              />
            </div>
          )}
          <DataTable
            columns={BUYBACK_COLUMNS}
            data={buybacks}
            rowKey={(r) => `${r.time}-${r.amount}`}
            skeletonRows={10}
          />
        </>
      )}

      {/* Staking / Validators */}
      <SectionHeader title="Validators" subtitle="Network validators and staking" />
      {stakingLoading ? (
        <Skeleton className="h-48 rounded-lg" />
      ) : staking ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <KPICard label="Total Staked" value={`${formatTokenAmount(Number(staking.total_staked ?? 0))} HYPE`} />
            <KPICard label="Validators" value={String(staking.validator_count ?? 0)} />
            <KPICard label="Active" value={String(staking.active_count ?? 0)} />
            <KPICard label="Est. APY" value={staking.staking_apy ? formatPercent(Number(staking.staking_apy)) : '-'} />
          </div>
          <DataTable
            columns={VALIDATOR_COLUMNS}
            data={validators}
            rowKey={(r) => String(r.validator ?? r.name ?? Math.random())}
            skeletonRows={10}
          />
        </>
      ) : null}
    </PageContainer>
  );
}
