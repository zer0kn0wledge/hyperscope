'use client';

import { useState } from 'react';
import { PageContainer, SectionHeader } from '@/components/layout/PageContainer';
import { KPICard } from '@/components/ui/KPICard';
import { AreaChartComponent } from '@/components/charts/AreaChart';
import { VolumeChart } from '@/components/charts/VolumeChart';
import { PieChartComponent } from '@/components/charts/PieChart';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Tabs } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { Tooltip, InfoIcon } from '@/components/ui/Tooltip';
import { useFees, useRevenue, useAF, useHLP, useStaking, useHypeToken } from '@/hooks/useAPI';
import {
  formatUSD,
  formatNumber,
  formatPercent,
  formatAddress,
  formatDate,
  formatTokenAmount,
  formatPrice,
} from '@/lib/format';
import { CHART_COLORS, AF_ADDRESS, HLP_ADDRESS } from '@/lib/constants';
import type { ValidatorEntry } from '@/lib/types';
import { ExternalLink, Shield, Zap, TrendingUp, Coins, Vote } from 'lucide-react';
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

export default function ProtocolPage() {
  const [feePeriod, setFeePeriod] = useState('30d');

  const { data: fees, isLoading: feesLoading } = useFees(feePeriod);
  const { data: revenue, isLoading: revLoading } = useRevenue();
  const { data: af, isLoading: afLoading } = useAF();
  const { data: hlp, isLoading: hlpLoading } = useHLP();
  const { data: staking, isLoading: stakingLoading } = useStaking();
  const { data: hype, isLoading: hypeLoading } = useHypeToken();

  const VALIDATOR_COLUMNS: Column<ValidatorEntry>[] = [
    {
      key: 'name',
      header: 'Validator',
      render: (v) => <span className="font-medium">{String(v)}</span>,
    },
    {
      key: 'validator',
      header: 'Address',
      render: (v) => <AddressLink address={String(v)} />,
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
      key: 'uptime',
      header: 'Uptime',
      align: 'right',
      render: (v) => (
        <span className={cn('number', Number(v) >= 99 ? 'text-accent-green' : Number(v) >= 95 ? 'text-accent-yellow' : 'text-accent-red')}>
          {formatPercent(Number(v))}
        </span>
      ),
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
            <KPICard label="HYPE Price" value={hype.price} format="usd" precision={4} isLoading={hypeLoading} />
            <KPICard label="Market Cap" value={hype.market_cap} format="usd" isLoading={hypeLoading} />
            <KPICard label="24h Volume" value={hype.volume_24h} format="usd" isLoading={hypeLoading} />
            <KPICard label="Circulating Supply" value={hype.circulating_supply} format="number" isLoading={hypeLoading} />
          </div>
        </>
      )}

      {/* Protocol Revenue */}
      <SectionHeader title="Protocol Revenue" subtitle="Cumulative and daily revenue" />
      {revLoading ? (
        <Skeleton className="h-40 rounded-lg" />
      ) : revenue ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPICard label="Total Revenue" value={revenue.total} format="usd" />
          <KPICard label="24h Revenue" value={revenue.daily} format="usd" trend={revenue.daily_change} />
          <KPICard label="7d Revenue" value={revenue.weekly} format="usd" />
          <KPICard label="30d Revenue" value={revenue.monthly} format="usd" />
        </div>
      ) : null}

      {/* Fee Breakdown Chart */}
      <SectionHeader title="Fee Revenue" subtitle="Trading fees over time" />
      <div className="flex justify-end mb-2">
        <Tabs tabs={FEE_TABS} activeTab={feePeriod} onTabChange={setFeePeriod} size="sm" />
      </div>
      <AreaChartComponent
        data={fees?.history ?? []}
        dataKey="fees"
        xKey="time"
        color="#00D1FF"
        isLoading={feesLoading}
        formatY={(v) => formatUSD(v)}
        formatX={(v) => formatDate(v, 'date')}
      />

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
                <span className="text-text-secondary text-sm">Total Value</span>
                <span className="number font-semibold text-text-primary">{formatUSD(af.total_value)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary text-sm">Liquidation Coverage</span>
                <span className="number text-accent-cyan">{formatUSD(af.liquidation_coverage)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary text-sm">30d P&L</span>
                <span className={cn('number', af.pnl_30d >= 0 ? 'text-accent-green' : 'text-accent-red')}>
                  {af.pnl_30d >= 0 ? '+' : ''}{formatUSD(af.pnl_30d)}
                </span>
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
                <span className="text-text-secondary text-sm">Total Value</span>
                <span className="number font-semibold text-text-primary">{formatUSD(hlp.total_value)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary text-sm">APY</span>
                <span className="number text-accent-green">{formatPercent(hlp.apy)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary text-sm">30d P&L</span>
                <span className={cn('number', hlp.pnl_30d >= 0 ? 'text-accent-green' : 'text-accent-red')}>
                  {hlp.pnl_30d >= 0 ? '+' : ''}{formatUSD(hlp.pnl_30d)}
                </span>
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
            <KPICard label="Total Staked" value={staking.total_staked} format="number" />
            <KPICard label="Validators" value={staking.validator_count} format="number" />
            <KPICard label="Active Validators" value={staking.active_count} format="number" />
            <KPICard label="Staking APY" value={staking.staking_apy} format="percent" />
          </div>
          <DataTable
            columns={VALIDATOR_COLUMNS}
            data={staking.validators}
            rowKey={(r) => r.validator}
            skeletonRows={10}
          />
        </>
      ) : null}
    </PageContainer>
  );
}
