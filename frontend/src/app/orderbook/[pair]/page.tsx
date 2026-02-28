'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { PageContainer, SectionHeader } from '@/components/layout/PageContainer';
import { OrderbookView } from '@/components/orderbook/OrderbookView';
import { SpreadTracker } from '@/components/orderbook/SpreadTracker';
import { DepthChart } from '@/components/charts/DepthChart';
import { Select } from '@/components/ui/Select';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { useOrderbookSnapshot, useLargeOrders } from '@/hooks/useAPI';
import { useOrderbookWS } from '@/hooks/useWebSocket';
import { useQueryClient } from '@tanstack/react-query';
import { formatUSD, formatPrice, formatDate } from '@/lib/format';
import { TOP_PAIRS } from '@/lib/constants';
import type { OrderbookSnapshot, LargeOrder } from '@/lib/types';

const PAIR_OPTIONS = TOP_PAIRS.map((p) => ({ value: p, label: `${p}-PERP` }));
const LEVEL_OPTIONS = [
  { value: '10', label: '10 levels' },
  { value: '20', label: '20 levels' },
  { value: '50', label: '50 levels' },
];

const LARGE_ORDER_COLUMNS: Column<LargeOrder>[] = [
  {
    key: 'side',
    header: 'Side',
    render: (v) => (
      <Badge variant={String(v) === 'bid' ? 'buy' : 'sell'}>
        {String(v).toUpperCase()}
      </Badge>
    ),
  },
  {
    key: 'price',
    header: 'Price',
    align: 'right',
    render: (v) => <span className="number">${formatPrice(Number(v))}</span>,
  },
  {
    key: 'size',
    header: 'Size',
    align: 'right',
    render: (v) => <span className="number">{Number(v).toFixed(4)}</span>,
  },
  {
    key: 'notional',
    header: 'Notional',
    align: 'right',
    render: (v) => <span className="number">{formatUSD(Number(v))}</span>,
  },
  {
    key: 'time',
    header: 'Time',
    align: 'right',
    render: (v) => (
      <span className="number text-text-secondary">{formatDate(Number(v))}</span>
    ),
  },
];

export default function OrderbookPage() {
  const params = useParams();
  const router = useRouter();
  const pair = String(params.pair ?? 'BTC');
  const [levels, setLevels] = useState('20');

  const { data: snapshot, isLoading } = useOrderbookSnapshot(pair, Number(levels));
  const { data: largeOrders, isLoading: ordersLoading } = useLargeOrders(pair);
  const queryClient = useQueryClient();

  useOrderbookWS(pair, (data) => {
    queryClient.setQueryData(['orderbook', pair, levels], (old: OrderbookSnapshot | undefined) => {
      if (!old) return old;
      return { ...old, ...(data as Partial<OrderbookSnapshot>) };
    });
  });

  return (
    <PageContainer>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/orderbook"
            className="p-1.5 rounded-md hover:bg-bg-hover transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-text-primary">{pair}-PERP</h1>
            <p className="text-sm text-text-secondary">Live orderbook</p>
          </div>
        </div>
        <Select
          options={PAIR_OPTIONS}
          value={pair}
          onChange={(v) => router.push(`/orderbook/${v}`)}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="space-y-4">
          <SpreadTracker pair={pair} snapshot={snapshot} isLoading={isLoading} />
          <OrderbookView
            snapshot={snapshot}
            isLoading={isLoading}
            levels={Number(levels)}
            onLevelsChange={setLevels}
            levelOptions={LEVEL_OPTIONS}
          />
        </div>
        <div>
          <DepthChart snapshot={snapshot} isLoading={isLoading} />
        </div>
      </div>

      <SectionHeader title="Large Orders" subtitle={`Active orders > $50k on ${pair}-PERP`} />
      <DataTable
        columns={LARGE_ORDER_COLUMNS}
        data={largeOrders ?? []}
        isLoading={ordersLoading}
        rowKey={(o) => `${o.side}-${o.price}-${o.size}`}
        skeletonRows={8}
      />
    </PageContainer>
  );
}
