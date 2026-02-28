'use client';

import { PageContainer, SectionHeader } from '@/components/layout/PageContainer';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { ComparisonBar } from '@/components/charts/ComparisonBar';
import { Badge } from '@/components/ui/Badge';
import { Tooltip, InfoIcon } from '@/components/ui/Tooltip';
import {
  useDEXSnapshot,
  useDEXFundingRates,
} from '@/hooks/useAPI';
import { formatUSD, formatFunding, fundingClass } from '@/lib/format';
import { DEX_EXCHANGES } from '@/lib/constants';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...classes: (string | undefined | null | boolean)[]) {
  return twMerge(clsx(classes));
}

// Backend returns snake_case: { exchange, volume_24h, open_interest, pairs_count, btc_funding_rate, source, rank }
type DEXRow = Record<string, unknown>;

const SNAPSHOT_COLUMNS: Column<DEXRow>[] = [
  {
    key: 'exchange',
    header: 'Exchange',
    render: (v) => {
      const name = String(v);
      const exc = DEX_EXCHANGES.find((e) => e.name === name);
      return (
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ background: exc?.color ?? '#8B949E' }}
          />
          <span className="font-semibold">{name}</span>
        </div>
      );
    },
  },
  {
    key: 'volume_24h',
    header: '24h Volume',
    sortable: true,
    align: 'right',
    render: (v) => <span className="number">{formatUSD(Number(v))}</span>,
  },
  {
    key: 'open_interest',
    header: 'Open Interest',
    sortable: true,
    align: 'right',
    render: (v) => <span className="number text-text-secondary">{formatUSD(Number(v))}</span>,
  },
  {
    key: 'pairs_count',
    header: '# Pairs',
    sortable: true,
    align: 'right',
    render: (v) => <span className="number">{String(v)}</span>,
  },
  {
    key: 'btc_funding_rate',
    header: 'BTC Funding',
    align: 'right',
    render: (v) => {
      const val = Number(v);
      if (!val) return <span className="text-text-muted">—</span>;
      return <span className={cn('number', fundingClass(val))}>{formatFunding(val)}</span>;
    },
  },
  {
    key: 'source',
    header: 'Source',
    render: (v) => (
      <Badge variant={String(v) === 'direct' ? 'buy' : 'neutral'}>
        {String(v).toUpperCase()}
      </Badge>
    ),
  },
];

type FundingRow = Record<string, unknown>;

const FUNDING_COLUMNS: Column<FundingRow>[] = [
  {
    key: 'coin',
    header: 'Asset',
    render: (v) => <span className="font-medium">{String(v)}-PERP</span>,
  },
  {
    key: 'hyperliquid',
    header: 'Hyperliquid',
    align: 'right',
    render: (v) => v != null ? <span className={cn('number', fundingClass(Number(v)))}>{formatFunding(Number(v))}</span> : <span className="text-text-muted">—</span>,
  },
  {
    key: 'paradex',
    header: 'Paradex',
    align: 'right',
    render: (v) => v != null ? <span className={cn('number', fundingClass(Number(v)))}>{formatFunding(Number(v))}</span> : <span className="text-text-muted">—</span>,
  },
  {
    key: 'lighter',
    header: 'Lighter',
    align: 'right',
    render: (v) => v != null ? <span className={cn('number', fundingClass(Number(v)))}>{formatFunding(Number(v))}</span> : <span className="text-text-muted">—</span>,
  },
  {
    key: 'aster',
    header: 'Aster',
    align: 'right',
    render: (v) => v != null ? <span className={cn('number', fundingClass(Number(v)))}>{formatFunding(Number(v))}</span> : <span className="text-text-muted">—</span>,
  },
  {
    key: 'grvt',
    header: 'GRVT',
    align: 'right',
    render: (v) => v != null ? <span className={cn('number', fundingClass(Number(v)))}>{formatFunding(Number(v))}</span> : <span className="text-text-muted">—</span>,
  },
];

export default function DEXComparePage() {
  const { data: rawSnapshot, isLoading: snapLoading } = useDEXSnapshot();
  const { data: rawFunding, isLoading: fundLoading } = useDEXFundingRates();

  // Backend returns { exchanges: [...] }
  const snapshot = (rawSnapshot as unknown as { exchanges?: DEXRow[] })?.exchanges ?? (rawSnapshot as DEXRow[] | undefined) ?? [];

  // Backend returns { symbol, rates: [{exchange, funding_rate, ...}], timestamp }
  // Transform into a table: one row per exchange with the funding rate
  const fundingRows: FundingRow[] = (() => {
    if (!rawFunding) return [];
    const raw = rawFunding as unknown as { rates?: Array<Record<string, unknown>>; symbol?: string };
    if (Array.isArray(rawFunding)) return rawFunding as FundingRow[];
    if (raw.rates && Array.isArray(raw.rates)) {
      return raw.rates.map((r) => ({
        exchange: r.exchange ?? '',
        funding_rate: r.funding_rate ?? 0,
        funding_rate_annual_pct: r.funding_rate_annual_pct ?? 0,
        interval_hours: r.interval_hours ?? 8,
      } as FundingRow));
    }
    return [];
  })();

  // Funding rate columns for per-exchange table
  const EXCHANGE_FUNDING_COLS: Column<FundingRow>[] = [
    {
      key: 'exchange',
      header: 'Exchange',
      render: (v) => {
        const name = String(v);
        const exc = DEX_EXCHANGES.find((e) => e.name.toLowerCase() === name.toLowerCase());
        return (
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: exc?.color ?? '#8B949E' }} />
            <span className="font-semibold">{name}</span>
          </div>
        );
      },
    },
    {
      key: 'funding_rate',
      header: 'Funding Rate (8h)',
      align: 'right',
      sortable: true,
      render: (v) => {
        const val = Number(v);
        if (!isFinite(val)) return <span className="text-text-muted">—</span>;
        return <span className={cn('number', fundingClass(val))}>{formatFunding(val)}</span>;
      },
    },
    {
      key: 'funding_rate_annual_pct',
      header: 'Annualized',
      align: 'right',
      render: (v) => {
        const val = Number(v);
        if (!isFinite(val)) return <span className="text-text-muted">—</span>;
        const sign = val > 0 ? '+' : '';
        return <span className={cn('number', val > 0 ? 'text-accent-orange' : val < 0 ? 'text-accent-cyan' : 'text-text-secondary')}>{sign}{val.toFixed(2)}%</span>;
      },
    },
  ];

  return (
    <PageContainer>
      <SectionHeader
        title="DEX Market Share"
        subtitle="Hyperliquid vs Paradex, Lighter, Aster, GRVT, EdgeX, Extended, Variational"
      />

      <DataTable
        columns={SNAPSHOT_COLUMNS}
        data={snapshot}
        isLoading={snapLoading}
        rowKey={(r) => String(r.exchange)}
        skeletonRows={8}
      />

      <SectionHeader
        title="Funding Rate Comparison"
        subtitle={<><span>BTC funding rates across exchanges</span><Tooltip content="Funding rates are updated every 8 hours. Positive = longs pay shorts."><InfoIcon /></Tooltip></>}
      />
      {fundingRows.length > 0 ? (
        <DataTable
          columns={EXCHANGE_FUNDING_COLS}
          data={fundingRows}
          isLoading={fundLoading}
          rowKey={(r) => String(r.exchange)}
          skeletonRows={8}
        />
      ) : !fundLoading ? (
        <div className="card p-6 text-center text-text-muted text-sm">
          No funding rate data available for this symbol. CoinGlass may not track all DEXes.
        </div>
      ) : null}
    </PageContainer>
  );
}
