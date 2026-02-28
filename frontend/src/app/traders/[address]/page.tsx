'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Copy, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { PageContainer, SectionHeader } from '@/components/layout/PageContainer';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { AreaChartComponent } from '@/components/charts/AreaChart';
import { FundingChart } from '@/components/charts/FundingChart';
import {
  useAccountSummary,
  usePositions,
  useFills,
  useUserFundingHistory,
  usePnLChart,
  useOpenOrders,
  useSubAccounts,
} from '@/hooks/useAPI';
import { formatUSD, formatAddress, formatDate, formatPrice, formatPercent, formatFunding, fundingClass } from '@/lib/format';
import type { Position, TradeHistoryEntry, FundingHistoryUserEntry, OpenOrder } from '@/lib/types';
import { CHART_COLORS } from '@/lib/constants';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Skeleton } from '@/components/ui/Skeleton';

function cn(...classes: (string | undefined | null | boolean)[]) {
  return twMerge(clsx(classes));
}

const ACCOUNT_TABS = [
  { id: 'positions', label: 'Positions' },
  { id: 'fills', label: 'Trade History' },
  { id: 'pnl', label: 'PnL Chart' },
  { id: 'funding', label: 'Funding' },
  { id: 'orders', label: 'Open Orders' },
];

const PNL_PERIODS = [
  { id: '7d', label: '7d' },
  { id: '30d', label: '30d' },
  { id: '90d', label: '90d' },
  { id: 'all', label: 'All' },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };
  return (
    <button onClick={copy} className="p-1 hover:text-accent-cyan transition-colors" title="Copy">
      <Copy size={14} className={copied ? 'text-accent-green' : 'text-text-secondary'} />
    </button>
  );
}

export default function AddressPage() {
  const { address } = useParams<{ address: string }>();
  const [tab, setTab] = useState('positions');
  const [pnlPeriod, setPnlPeriod] = useState('30d');

  const { data: summary, isLoading: summaryLoading } = useAccountSummary(address);
  const { data: positions, isLoading: posLoading } = usePositions(address);
  const { data: fills, isLoading: fillsLoading } = useFills(address);
  const { data: fundingHistory, isLoading: fundingLoading } = useUserFundingHistory(address);
  const { data: pnlChart, isLoading: pnlLoading } = usePnLChart(address, pnlPeriod);
  const { data: openOrders, isLoading: ordersLoading } = useOpenOrders(address);
  const { data: subAccounts } = useSubAccounts(address);

  const POSITION_COLUMNS: Column<Position>[] = [
    {
      key: 'coin',
      header: 'Asset',
      render: (v) => <span className="font-medium">{String(v)}-PERP</span>,
    },
    {
      key: 'side',
      header: 'Side',
      render: (v) => (
        <Badge variant={String(v) === 'long' ? 'buy' : 'sell'}>{String(v).toUpperCase()}</Badge>
      ),
    },
    {
      key: 'size',
      header: 'Size',
      align: 'right',
      render: (v) => <span className="number">{Number(v).toFixed(4)}</span>,
    },
    {
      key: 'entry_price',
      header: 'Entry',
      align: 'right',
      render: (v) => <span className="number">${formatPrice(Number(v))}</span>,
    },
    {
      key: 'mark_price',
      header: 'Mark',
      align: 'right',
      render: (v) => <span className="number">${formatPrice(Number(v))}</span>,
    },
    {
      key: 'unrealized_pnl',
      header: 'Unrealized PnL',
      align: 'right',
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
      key: 'leverage',
      header: 'Lev',
      align: 'right',
      render: (v) => <span className="number text-accent-yellow">{Number(v).toFixed(1)}x</span>,
    },
    {
      key: 'liquidation_price',
      header: 'Liq Price',
      align: 'right',
      render: (v) => (
        <span className="number text-accent-red">
          {v != null ? `$${formatPrice(Number(v))}` : '—'}
        </span>
      ),
    },
  ];

  const FILL_COLUMNS: Column<TradeHistoryEntry>[] = [
    {
      key: 'coin',
      header: 'Asset',
      render: (v) => <span className="font-medium">{String(v)}-PERP</span>,
    },
    {
      key: 'side',
      header: 'Side',
      render: (v) => (
        <Badge variant={String(v) === 'buy' ? 'buy' : 'sell'}>{String(v).toUpperCase()}</Badge>
      ),
    },
    {
      key: 'px',
      header: 'Price',
      align: 'right',
      render: (v) => <span className="number">${formatPrice(Number(v))}</span>,
    },
    {
      key: 'sz',
      header: 'Size',
      align: 'right',
      render: (v) => <span className="number">{Number(v).toFixed(4)}</span>,
    },
    {
      key: 'closedPnl',
      header: 'Closed PnL',
      align: 'right',
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
      key: 'time',
      header: 'Time',
      align: 'right',
      render: (v) => <span className="number text-text-secondary">{formatDate(Number(v))}</span>,
    },
  ];

  const FUNDING_COLUMNS: Column<FundingHistoryUserEntry>[] = [
    {
      key: 'coin',
      header: 'Asset',
      render: (v) => <span className="font-medium">{String(v)}-PERP</span>,
    },
    {
      key: 'usdc',
      header: 'Payment',
      align: 'right',
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
      key: 'time',
      header: 'Time',
      align: 'right',
      render: (v) => <span className="number text-text-secondary">{formatDate(Number(v))}</span>,
    },
  ];

  const ORDER_COLUMNS: Column<OpenOrder>[] = [
    {
      key: 'coin',
      header: 'Asset',
      render: (v) => <span className="font-medium">{String(v)}-PERP</span>,
    },
    {
      key: 'side',
      header: 'Side',
      render: (v) => (
        <Badge variant={String(v) === 'buy' ? 'buy' : 'sell'}>{String(v).toUpperCase()}</Badge>
      ),
    },
    {
      key: 'limitPx',
      header: 'Limit Price',
      align: 'right',
      render: (v) => <span className="number">${formatPrice(Number(v))}</span>,
    },
    {
      key: 'sz',
      header: 'Size',
      align: 'right',
      render: (v) => <span className="number">{Number(v).toFixed(4)}</span>,
    },
    {
      key: 'timestamp',
      header: 'Placed',
      align: 'right',
      render: (v) => <span className="number text-text-secondary">{formatDate(Number(v))}</span>,
    },
  ];

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/traders" className="p-1.5 rounded-md hover:bg-bg-hover transition-colors">
          <ArrowLeft className="w-4 h-4 text-text-secondary" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-text-primary font-mono">
              {formatAddress(address, 8)}
            </h1>
            <CopyButton text={address} />
            <a
              href={`https://app.hyperliquid.xyz/explorer/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 hover:text-accent-cyan transition-colors"
            >
              <ExternalLink size={14} className="text-text-secondary" />
            </a>
          </div>
          {subAccounts && subAccounts.length > 0 && (
            <p className="text-xs text-text-muted mt-0.5">
              {subAccounts.length} sub-account{subAccounts.length > 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Summary KPIs */}
      {summaryLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="card p-4">
            <p className="text-xs text-text-secondary mb-1">Account Value</p>
            <p className={cn('number text-lg font-semibold', summary.account_value >= 0 ? 'text-accent-green' : 'text-accent-red')}>
              {formatUSD(summary.account_value)}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-text-secondary mb-1">Realized PnL</p>
            <p className={cn('number text-lg font-semibold', summary.realized_pnl >= 0 ? 'text-accent-green' : 'text-accent-red')}>
              {summary.realized_pnl >= 0 ? '+' : ''}{formatUSD(summary.realized_pnl)}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-text-secondary mb-1">Unrealized PnL</p>
            <p className={cn('number text-lg font-semibold', summary.unrealized_pnl >= 0 ? 'text-accent-green' : 'text-accent-red')}>
              {summary.unrealized_pnl >= 0 ? '+' : ''}{formatUSD(summary.unrealized_pnl)}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-text-secondary mb-1">30d Volume</p>
            <p className="number text-lg font-semibold text-text-primary">
              {formatUSD(summary.volume_30d)}
            </p>
          </div>
        </div>
      ) : null}

      {/* Tabs */}
      <Tabs tabs={ACCOUNT_TABS} activeTab={tab} onTabChange={setTab} />

      {tab === 'positions' && (
        <DataTable
          columns={POSITION_COLUMNS}
          data={positions ?? []}
          isLoading={posLoading}
          rowKey={(r) => r.coin}
          emptyMessage="No open positions"
          skeletonRows={6}
        />
      )}

      {tab === 'fills' && (
        <DataTable
          columns={FILL_COLUMNS}
          data={fills ?? []}
          isLoading={fillsLoading}
          rowKey={(r) => `${r.time}-${r.coin}-${r.px}`}
          emptyMessage="No trade history"
          skeletonRows={10}
        />
      )}

      {tab === 'pnl' && (
        <div>
          <div className="flex justify-end mb-3">
            <Tabs tabs={PNL_PERIODS} activeTab={pnlPeriod} onTabChange={setPnlPeriod} size="sm" />
          </div>
          <AreaChartComponent
            data={pnlChart ?? []}
            dataKey="cumulative_pnl"
            xKey="time"
            color="#00E676"
            isLoading={pnlLoading}
            formatY={(v) => formatUSD(v)}
            formatX={(v) => formatDate(v, 'date')}
          />
        </div>
      )}

      {tab === 'funding' && (
        <DataTable
          columns={FUNDING_COLUMNS}
          data={fundingHistory ?? []}
          isLoading={fundingLoading}
          rowKey={(r) => `${r.time}-${r.coin}`}
          emptyMessage="No funding history"
          skeletonRows={10}
        />
      )}

      {tab === 'orders' && (
        <DataTable
          columns={ORDER_COLUMNS}
          data={openOrders ?? []}
          isLoading={ordersLoading}
          rowKey={(r) => `${r.coin}-${r.limitPx}-${r.sz}`}
          emptyMessage="No open orders"
          skeletonRows={6}
        />
      )}
    </PageContainer>
  );
}
