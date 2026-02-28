'use client';

import { useState } from 'react';
import { PageContainer, SectionHeader } from '@/components/layout/PageContainer';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Tabs } from '@/components/ui/Tabs';
import { AreaChartComponent } from '@/components/charts/AreaChart';
import { ComparisonBar } from '@/components/charts/ComparisonBar';
import { Tooltip, InfoIcon } from '@/components/ui/Tooltip';
import {
  useCEXSnapshot,
  useCEXVolumeHistory,
  useCEXOIHistory,
  useCEXFundingHistory,
} from '@/hooks/useAPI';
import { formatUSD, formatFunding, fundingClass } from '@/lib/format';
import type { CEXSnapshot, CEXFundingHistory } from '@/lib/types';
import { CEX_EXCHANGES } from '@/lib/constants';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...classes: (string | undefined | null | boolean)[]) {
  return twMerge(clsx(classes));
}

const CEX_TABS = CEX_EXCHANGES.map((e) => ({ id: e.key, label: e.name }));

const SNAPSHOT_COLUMNS: Column<CEXSnapshot>[] = [
  {
    key: 'exchange',
    header: 'Exchange',
    render: (v) => {
      const exc = CEX_EXCHANGES.find((e) => e.name === String(v));
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
    key: 'fundingRate',
    header: 'BTC Funding',
    align: 'right',
    render: (v) => (
      <span className={cn('number', fundingClass(Number(v)))}>
        {formatFunding(Number(v))}
      </span>
    ),
  },
  {
    key: 'volume24h',
    header: 'Volume Share',
    render: (v, row) => {
      return <div className="w-32"><ComparisonBar value={Number(v)} max={Number((row as CEXSnapshot).volume24h) * 3} color="#7B5EA7" /></div>;
    },
  },
];

export default function CEXComparePage() {
  const [selectedExchange, setSelectedExchange] = useState(CEX_EXCHANGES[0].key);

  const { data: snapshot, isLoading: snapLoading } = useCEXSnapshot();
  const { data: volumeHistory, isLoading: volLoading } = useCEXVolumeHistory();
  const { data: oiHistory, isLoading: oiLoading } = useCEXOIHistory();
  const { data: fundingHistory, isLoading: fundLoading } = useCEXFundingHistory(
    selectedExchange,
    'BTC'
  );

  return (
    <PageContainer>
      <SectionHeader
        title="CEX Comparison"
        subtitle={<><span>Hyperliquid vs Binance, Bybit, OKX</span><Tooltip content="Volume and OI data sourced from CoinGlass and exchange public APIs."><InfoIcon /></Tooltip></>}
      />

      <DataTable
        columns={SNAPSHOT_COLUMNS}
        data={snapshot ?? []}
        isLoading={snapLoading}
        rowKey={(r) => r.exchange}
        skeletonRows={4}
      />

      <SectionHeader title="Volume History" subtitle="30-day volume comparison" />
      <AreaChartComponent
        data={volumeHistory ?? []}
        lines={CEX_EXCHANGES.map((e) => ({ key: e.key, color: e.color, label: e.name }))}
        xKey="time"
        isLoading={volLoading}
        formatY={(v) => formatUSD(v)}
        formatX={(v) => new Date(v).toLocaleDateString()}
        multiLine
      />

      <SectionHeader title="OI History" subtitle="30-day open interest comparison" />
      <AreaChartComponent
        data={oiHistory ?? []}
        lines={CEX_EXCHANGES.map((e) => ({ key: e.key, color: e.color, label: e.name }))}
        xKey="time"
        isLoading={oiLoading}
        formatY={(v) => formatUSD(v)}
        formatX={(v) => new Date(v).toLocaleDateString()}
        multiLine
      />

      <SectionHeader
        title="Funding Rate History"
        subtitle="Select exchange and asset"
      />
      <div className="flex items-center gap-3 mb-4">
        <Tabs tabs={CEX_TABS} activeTab={selectedExchange} onTabChange={setSelectedExchange} size="sm" />
      </div>
      <AreaChartComponent
        data={fundingHistory ?? []}
        dataKey="rate"
        xKey="time"
        color="#7B5EA7"
        isLoading={fundLoading}
        formatY={(v) => formatFunding(v)}
        formatX={(v) => new Date(v).toLocaleDateString()}
      />
    </PageContainer>
  );
}
