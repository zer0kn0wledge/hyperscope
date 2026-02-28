'use client';

import { useState } from 'react';
import { PageContainer, SectionHeader } from '@/components/layout/PageContainer';
import { KPICard } from '@/components/ui/KPICard';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Tabs } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { Tooltip, InfoIcon } from '@/components/ui/Tooltip';
import { useFees, useRevenue, useAF, useHLP, useStaking, useHypeToken } from '@/hooks/useAPI';
import {
  formatUSD,
  formatPercent,
  formatAddress,
  formatDate,
  formatNumber,
  formatTokenAmount,
} from '@/lib/format';
import { AF_ADDRESS, HLP_ADDRESS } from '@/lib/constants';
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
      render: (v) => v ? <AddressLink address={String(v)} /> : <span className="text-text-muted">—</span>,
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
      {hype && (
        <>
          <SectionHeader title="HYPE Token" subtitle="Native token metrics" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard label="HYPE Price" value={hype.price ? formatUSD(Number(hype.price)) : undefined} isLoading={hypeLoading} />
            <KPICard label="Market Cap" value={hype.market_cap ? formatUSD(Number(hype.market_cap)) : undefined} isLoading={hypeLoading} />
            <KPICard label="24h Volume" value={hype.volume_24h ? formatUSD(Number(hype.volume_24h)) : undefined} isLoading={hypeLoading} />
            <KPICard label="Circulating Supply" value={hype.circulating_supply ? formatNumber(Number(hype.circulating_supply)) : undefined} isLoading={hypeLoading} />
          </div>
        </>
      )}

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

      {/* Revenue Split */}
      {afShare && hlpShare && (
        <>
          <SectionHeader title="Revenue Split" subtitle="Assistance Fund vs HLP" />
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-4 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-accent-cyan" />
                <span className="font-semibold text-sm">Assistance Fund ({formatPercent(Number(afShare.fraction ?? 0) * 100)})</span>
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
                <span className="font-semibold text-sm">HLP ({formatPercent(Number(hlpShare.fraction ?? 0) * 100)})</span>
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

      {/* AF + HLP */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Assistance Fund */}
        <div>
          <SectionHeader
            title="Assistance Fund"
            subtitle={
              <>
                <AddressLink address={AF_ADDRESS} />
                <Tooltip content="The AF absorbs losses from liquidations that exceed the liquidated position's margin.">
                  <InfoIcon />
                </Tooltip>
              </>
            }
          />
          {afLoading ? (
            <Skeleton className="h-32 rounded-lg" />
          ) : af ? (
            <div className="card p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary text-sm">HYPE Balance</span>
                <span className="number font-semibold text-text-primary">{formatTokenAmount(Number(af.hype_balance ?? 0))} HYPE</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary text-sm">USDC Balance</span>
                <span className="number text-accent-cyan">{formatUSD(Number(af.usdc_balance ?? 0))}</span>
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
            <Skeleton className="h-32 rounded-lg" />
          ) : hlp ? (
            <div className="card p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary text-sm">TVL</span>
                <span className="number font-semibold text-text-primary">{formatUSD(Number(hlp.tvl ?? 0))}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary text-sm">APR</span>
                <span className="number text-accent-green">{formatPercent(Number(hlp.apr ?? 0) * 100)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary text-sm">Depositors</span>
                <span className="number">{formatNumber(Number(hlp.depositor_count ?? 0))}</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Staking / Validators */}
      <SectionHeader title="Validators" subtitle="Network validators and staking" />
      {stakingLoading ? (
        <Skeleton className="h-48 rounded-lg" />
      ) : staking ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <KPICard label="Total Staked" value={formatTokenAmount(Number(staking.total_staked ?? 0))} />
            <KPICard label="Validators" value={String(staking.validator_count ?? 0)} />
            <KPICard label="Active" value={String(staking.active_count ?? 0)} />
            <KPICard label="Est. APY" value={staking.staking_apy ? formatPercent(Number(staking.staking_apy)) : '—'} />
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
