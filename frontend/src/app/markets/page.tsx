'use client';

import Link from 'next/link';
import { PageContainer, SectionHeader } from '@/components/layout/PageContainer';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { useFundingRates, useOIDistribution } from '@/hooks/useAPI';
import { formatUSD, formatPercent, formatPrice } from '@/lib/format';
import type { FundingRate, OIDistribution } from '@/lib/types';

const FUNDING_COLUMNS: Column<FundingRate>[] = [
  {
    key: 'asset',
    header: 'Asset',
    render: (v) => (
      <Link
        href={`/markets/${String(v)}`}
        className="font-medium text-text-primary hover:text-accent-cyan transition-colors"
      >
        {String(v)}
      </Link>
    ),
  },
  {
    key: 'mark_px',
    header: 'Mark Price',
    align: 'right',
    sortable: true,
    render: (v) => <span className="number">${formatPrice(Number(v))}</span>,
  },
  {
    key: 'funding_rate',
    header: 'Funding Rate',
    align: 'right',
    sortable: true,
    render: (v) => {
      const n = Number(v);
      return (
        <span
          className={`number ${
            n > 0
              ? 'text-accent-green'
              : n < 0
              ? 'text-accent-red'
              : 'text-text-secondary'
          }`}
        >
          {formatPercent(n, 4)}
        </span>
      );
    },
  },
  {
    key: 'predicted_funding',
    header: 'Predicted',
    align: 'right',
    sortable: true,
    render: (v) => {
      const n = Number(v);
      return (
        <span
          className={`number ${
            n > 0
              ? 'text-accent-green'
              : n < 0
              ? 'text-accent-red'
              : 'text-text-secondary'
          }`}
        >
          {formatPercent(n, 4)}
        </span>
      );
    },
  },
  {
    key: 'oi_usd',
    header: 'Open Interest',
    align: 'right',
    sortable: true,
    render: (v) => <span className="number">{formatUSD(Number(v))}</span>,
  },
  {
    key: 'funding_rate_annual_pct',
    header: 'Annual Rate',
    align: 'right',
    sortable: true,
    render: (v) => {
      const n = Number(v);
      return (
        <Badge variant={n >= 0 ? 'buy' : 'sell'}>
          {n >= 0 ? '+' : ''}{formatPercent(n)}
        </Badge>
      );
    },
  },
];

const OI_COLUMNS: Column<OIDistribution>[] = [
  {
    key: 'asset',
    header: 'Asset',
    render: (v) => (
      <span className="font-medium text-text-primary">{String(v)}</span>
    ),
  },
  {
    key: 'oi_usd',
    header: 'OI (USD)',
    align: 'right',
    sortable: true,
    render: (v) => <span className="number">{formatUSD(Number(v))}</span>,
  },
  {
    key: 'oi_pct',
    header: 'Share',
    align: 'right',
    sortable: true,
    render: (v) => <span className="number">{formatPercent(Number(v))}</span>,
  },
];

export default function MarketsPage() {
  const { data: funding, isLoading: fundingLoading } = useFundingRates();
  const { data: oiRaw, isLoading: oiLoading } = useOIDistribution();

  // Backend returns {assets: [...], total_oi_usd} — extract assets array
  const oiData = Array.isArray(oiRaw) ? oiRaw : (oiRaw as Record<string, unknown>)?.assets as OIDistribution[] ?? [];

  return (
    <PageContainer>
      <SectionHeader
        title="Funding Rates"
        subtitle="Current and predicted funding rates across all perps"
      />
      <DataTable
        columns={FUNDING_COLUMNS}
        data={funding ?? []}
        isLoading={fundingLoading}
        rowKey={(r) => r.asset}
        skeletonRows={20}
      />

      <SectionHeader
        title="OI Distribution"
        subtitle="Open interest breakdown by asset"
        className="mt-6"
      />
      <DataTable
        columns={OI_COLUMNS}
        data={oiData}
        isLoading={oiLoading}
        rowKey={(r) => r.asset}
        skeletonRows={10}
      />
    </PageContainer>
  );
}
