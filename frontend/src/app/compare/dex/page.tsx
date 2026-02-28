'use client';

import { PageContainer, SectionHeader } from '@/components/layout/PageContainer';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { ComparisonBar } from '@/components/charts/ComparisonBar';
import { AreaChartComponent } from '@/components/charts/AreaChart';
import { Tooltip, InfoIcon } from '@/components/ui/Tooltip';
import {
  useDEXSnapshot,
  useDEXVolumeHistory,
  useDEXOIHistory,
  useDEXFundingRates,
} from '@/hooks/useAPI';
import { formatUSD, formatFunding, fundingClass } from '@/lib/format';
import type { DEXSnapshot, FundingRateComparison } from '@/lib/types';
import { DEX_EXCHANGES } from '@/lib/constants';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...classes: (string | undefined | null | boolean)[]) {
  return twMerge(clsx(classes));
}

const SNAPSHOT_COLUMNS: Column<DEXSnapshot>[] = [
  {
    key: 'name',
    header: 'Exchange',
    render: (v) => {
      const exc = DEX_EXCHANGES.find((e) => e.name === String(v));
      return (
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ background: exc?.color ?? '#8B949E' }}
          />
          <span className="font-semibold">{String(v)}</span>
        </div>
      );
    },
  },
  {
    key: 'volume24h',
    header: '24h Volume',
    sortable: true,
    align: 'right',
    render: (v) => <span className="number">{formatUSD(Number(v))}</span>,
  },
  {
    key: 'openInterest',
    header: 'Open Interest',
    sortable: true,
    align: 'right',
    render: (v) => <span className="number text-text-secondary">{formatUSD(Number(v))}</span>,
  },
  {
    key: 'pairsCount',
    header: '# Pairs',
    sortable: true,
    align: 'right',
    render: (v) => <span className="number">{String(v)}</span>,
  },
  {
    key: 'volume24h',
    header: 'Volume Share',
    render: (v, row) => {
      return <div className="w-32"><ComparisonBar value={Number(v)} max={Number((row as DEXSnapshot).volume24h) * 2} color="#00D1FF" /></div>;
    },
  },
];

const FUNDING_COLUMNS: Column<FundingRateComparison>[] = [
  {
    key: 'coin',
    header: 'Asset',
    render: (v) => <span className="font-medium">{String(v)}-PERP</span>,
  },
  {
    key: 'hyperliquid',
    header: 'Hyperliquid',
    align: 'right',
    render: (v) => <span className={cn('number', fundingClass(Number(v)))}>{formatFunding(Number(v))}</span>,
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
  const { data: snapshot, isLoading: snapLoading } = useDEXSnapshot();
  const { data: volumeHistory, isLoading: volLoading } = useDEXVolumeHistory();
  const { data: oiHistory, isLoading: oiLoading } = useDEXOIHistory();
  const { data: funding, isLoading: fundLoading } = useDEXFundingRates();

  return (
    <PageContainer>
      <SectionHeader
        title="DEX Market Share"
        subtitle="Hyperliquid vs Paradex, Lighter, Aster, GRVT, EdgeX, Extended, Variational"
      />

      <DataTable
        columns={SNAPSHOT_COLUMNS}
        data={snapshot ?? []}
        isLoading={snapLoading}
        rowKey={(r) => r.name}
        skeletonRows={8}
      />

      <SectionHeader title="Volume History" subtitle="30-day volume comparison" />
      <AreaChartComponent
        data={volumeHistory ?? []}
        lines={DEX_EXCHANGES.map((e) => ({ key: e.key, color: e.color, label: e.name }))}
        xKey="time"
        isLoading={volLoading}
        formatY={(v) => formatUSD(v)}
        formatX={(v) => new Date(v).toLocaleDateString()}
        multiLine
      />

      <SectionHeader title="Open Interest History" subtitle="30-day OI comparison" />
      <AreaChartComponent
        data={oiHistory ?? []}
        lines={DEX_EXCHANGES.map((e) => ({ key: e.key, color: e.color, label: e.name }))}
        xKey="time"
        isLoading={oiLoading}
        formatY={(v) => formatUSD(v)}
        formatX={(v) => new Date(v).toLocaleDateString()}
        multiLine
      />

      <SectionHeader
        title="Funding Rate Comparison"
        subtitle={<><span>8h funding rates across DEXes</span><Tooltip content="Funding rates are updated every 8 hours. Positive = longs pay shorts."><InfoIcon /></Tooltip></>}
      />
      <DataTable
        columns={FUNDING_COLUMNS}
        data={funding ?? []}
        isLoading={fundLoading}
        rowKey={(r) => r.coin}
        skeletonRows={10}
      />
    </PageContainer>
  );
}
