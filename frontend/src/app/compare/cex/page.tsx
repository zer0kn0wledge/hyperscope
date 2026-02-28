'use client';

import { PageContainer, SectionHeader } from '@/components/layout/PageContainer';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { ComparisonBar } from '@/components/charts/ComparisonBar';
import { Badge } from '@/components/ui/Badge';
import { Tooltip, InfoIcon } from '@/components/ui/Tooltip';
import {
  useCEXSnapshot,
} from '@/hooks/useAPI';
import { formatUSD, formatFunding, fundingClass } from '@/lib/format';
import { CEX_EXCHANGES } from '@/lib/constants';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...classes: (string | undefined | null | boolean)[]) {
  return twMerge(clsx(classes));
}

// Backend returns snake_case: { exchange, volume_24h, open_interest, btc_funding_rate, source, rank }
type CEXRow = Record<string, unknown>;

const SNAPSHOT_COLUMNS: Column<CEXRow>[] = [
  {
    key: 'exchange',
    header: 'Exchange',
    render: (v) => {
      const name = String(v);
      const exc = CEX_EXCHANGES.find((e) => e.name === name);
      return (
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ background: exc?.color ?? '#8B949E' }}
          />
          <span className="font-semibold">{name}</span>
          {exc?.isDex && <Badge variant="neutral">DEX</Badge>}
        </div>
      );
    },
  },
  {
    key: 'total_volume_24h_usd',
    header: '24h Volume',
    sortable: true,
    align: 'right',
    render: (v) => <span className="number">{formatUSD(Number(v))}</span>,
  },
  {
    key: 'total_oi_usd',
    header: 'Open Interest',
    sortable: true,
    align: 'right',
    render: (v) => <span className="number text-text-secondary">{formatUSD(Number(v))}</span>,
  },
  {
    key: 'btc_funding_rate',
    header: 'BTC Funding',
    align: 'right',
    render: (v) => {
      const val = Number(v);
      if (!val && val !== 0) return <span className="text-text-muted">—</span>;
      return <span className={cn('number', fundingClass(val))}>{formatFunding(val)}</span>;
    },
  },
  {
    key: 'oi_share_pct',
    header: 'OI Share',
    align: 'right',
    render: (v) => {
      const pct = Number(v);
      return <div className="flex items-center gap-2"><div className="w-24"><ComparisonBar value={pct} max={100} color="#7B5EA7" /></div><span className="number text-xs">{pct.toFixed(1)}%</span></div>;
    },
  },
];

export default function CEXComparePage() {
  const { data: rawSnapshot, isLoading: snapLoading } = useCEXSnapshot();

  // Backend returns { exchanges: [...] }
  const snapshot = (rawSnapshot as unknown as { exchanges?: CEXRow[] })?.exchanges ?? (rawSnapshot as CEXRow[] | undefined) ?? [];

  return (
    <PageContainer>
      <SectionHeader
        title="CEX Comparison"
        subtitle={<><span>Hyperliquid vs Binance, Bybit, OKX</span><Tooltip content="Volume and OI data sourced from CoinGlass and exchange public APIs."><InfoIcon /></Tooltip></>}
      />

      <DataTable
        columns={SNAPSHOT_COLUMNS}
        data={snapshot}
        isLoading={snapLoading}
        rowKey={(r) => String(r.exchange)}
        skeletonRows={4}
      />
    </PageContainer>
  );
}
