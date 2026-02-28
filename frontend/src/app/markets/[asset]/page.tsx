'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { PageContainer, SectionHeader } from '@/components/layout/PageContainer';
import { PriceChart } from '@/components/charts/PriceChart';
import { FundingChart } from '@/components/charts/FundingChart';
import { VolumeChart } from '@/components/charts/VolumeChart';
import { AreaChart } from '@/components/charts/AreaChart';
import { Select } from '@/components/ui/Select';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { KPICard } from '@/components/ui/KPICard';
import {
  useAssetCandles,
  useAssetFundingHistory,
  useAssetLiquidations,
  useFundingRates,
} from '@/hooks/useAPI';
import { useAssetTradesWS } from '@/hooks/useWebSocket';
import { formatUSD, formatPrice, formatPercent, formatDate } from '@/lib/format';
import { TOP_PAIRS, TIMEFRAME_OPTIONS } from '@/lib/constants';
import type { Liquidation, Trade } from '@/lib/types';

const ASSET_OPTIONS = TOP_PAIRS.map((p) => ({ value: p, label: p }));

const LIQ_COLUMNS: Column<Liquidation>[] = [
  {
    key: 'side',
    header: 'Side',
    render: (v) => (
      <Badge variant={String(v) === 'long' ? 'buy' : 'sell'}>
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

export default function AssetPage() {
  const params = useParams();
  const router = useRouter();
  const asset = String(params.asset ?? 'BTC');
  const [timeframe, setTimeframe] = useState('1h');

  const { data: candles, isLoading: candlesLoading } = useAssetCandles(
    asset,
    timeframe
  );
  const { data: funding, isLoading: fundingLoading } =
    useAssetFundingHistory(asset);
  const { data: liquidations, isLoading: liqLoading } =
    useAssetLiquidations(asset);
  const { data: allRates } = useFundingRates();

  const currentRate = allRates?.find((r) => r.coin === asset);
  const trades = useAssetTradesWS(asset);

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/markets"
            className="p-1.5 rounded-md hover:bg-bg-hover transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-text-primary">
              {asset}-PERP
            </h1>
            {currentRate && (
              <p className="text-sm text-text-secondary">
                Mark: ${formatPrice(currentRate.mark_price)} &nbsp;·&nbsp;
                FR:{' '}
                <span
                  className={
                    currentRate.funding_rate >= 0
                      ? 'text-accent-green'
                      : 'text-accent-red'
                  }
                >
                  {formatPercent(currentRate.funding_rate, 4)}
                </span>
              </p>
            )}
          </div>
        </div>
        <Select
          options={TIMEFRAME_OPTIONS}
          value={timeframe}
          onChange={setTimeframe}
        />
      </div>

      {/* KPI Row */}
      {currentRate && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPICard
            label="Open Interest"
            value={currentRate.open_interest}
            format="usd"
          />
          <KPICard
            label="24h Volume"
            value={currentRate.volume_24h}
            format="usd"
          />
          <KPICard
            label="Funding Rate"
            value={currentRate.funding_rate}
            format="percent"
            precision={4}
          />
          <KPICard
            label="24h Change"
            value={currentRate.price_change_24h}
            format="percent"
          />
        </div>
      )}

      {/* Price Chart */}
      <SectionHeader title="Price" subtitle={`${asset} OHLCV — ${timeframe}`} />
      <PriceChart data={candles ?? []} isLoading={candlesLoading} />

      {/* Funding History */}
      <SectionHeader
        title="Funding Rate History"
        subtitle="8-hour funding payments"
      />
      <FundingChart data={funding ?? []} isLoading={fundingLoading} />

      {/* Volume */}
      <SectionHeader title="Volume" subtitle="Per-candle trading volume" />
      <VolumeChart data={candles ?? []} isLoading={candlesLoading} />

      {/* Liquidations */}
      <SectionHeader
        title="Recent Liquidations"
        subtitle="Forced liquidations for this asset"
      />
      <DataTable
        columns={LIQ_COLUMNS}
        data={liquidations ?? []}
        isLoading={liqLoading}
        rowKey={(l) => `${l.time}-${l.price}`}
        skeletonRows={8}
      />
    </PageContainer>
  );
}
