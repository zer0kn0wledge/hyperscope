'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { PageContainer, SectionHeader } from '@/components/layout/PageContainer';
import { KPICard } from '@/components/ui/KPICard';
import { AreaChartWidget } from '@/components/charts/AreaChart';
import { SkeletonCard, SkeletonChart } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { useAssetCandles, useAllAssets, useAssetOIHistory, useAssetFundingHistory } from '@/hooks/useAPI';
import { fmt } from '@/lib/format';
import { CHART_COLORS, CANDLE_INTERVALS, CandleInterval } from '@/lib/constants';

function PriceTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: '#0a0a0a',
        border: '1px solid rgba(0,255,136,0.2)',
        borderRadius: '10px',
        padding: '0.625rem 0.875rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.9)',
        fontFamily: 'JetBrains Mono, monospace',
        minWidth: '160px',
      }}
    >
      <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
          <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)' }}>{p.name}</span>
          <span style={{ fontSize: '0.75rem', color: p.color ?? '#e8e8e8' }}>${fmt.price(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function AssetPage() {
  const params = useParams();
  const asset = (params?.asset as string ?? 'BTC').toUpperCase();
  const [interval, setInterval] = useState<CandleInterval>('1h');

  const { data: candles, isLoading: candlesLoading, error: candlesError } = useAssetCandles(asset, interval);
  const { data: assetsData, isLoading: assetsLoading } = useAllAssets();
  const { data: oiHistory, isLoading: oiLoading } = useAssetOIHistory(asset);
  const { data: fundingHistory, isLoading: fundingLoading } = useAssetFundingHistory(asset);

  // Find current asset info
  const assetInfo = useMemo(() => {
    if (!assetsData) return null;
    return (assetsData as any[]).find((a) => a.asset === asset) ?? null;
  }, [assetsData, asset]);

  // Prepare candlestick close-price chart data
  const priceChartData = useMemo(() => {
    if (!candles || !Array.isArray(candles)) return [];
    return (candles as any[]).map((c) => ({
      time: new Date(c.t ?? c.time ?? 0).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }),
      close: c.c ?? c.close,
      open: c.o ?? c.open,
      high: c.h ?? c.high,
      low: c.l ?? c.low,
    }));
  }, [candles]);

  // OI history chart data
  const oiChartData = useMemo(() => {
    if (!oiHistory || !Array.isArray(oiHistory)) return [];
    return (oiHistory as any[]).map((d) => ({
      time: new Date((d.time ?? d.date ?? 0) * (d.date ? 1000 : 1)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      oi: d.oi ?? d.open_interest ?? d.value,
    }));
  }, [oiHistory]);

  // Funding history chart data
  const fundingChartData = useMemo(() => {
    if (!fundingHistory || !Array.isArray(fundingHistory)) return [];
    return (fundingHistory as any[]).map((d) => ({
      time: new Date((d.time ?? d.date ?? 0) * (d.date ? 1000 : 1)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      rate: d.funding ?? d.rate ?? d.fundingRate,
    }));
  }, [fundingHistory]);

  const changePct = assetInfo?.change_pct ?? 0;
  const isPositiveChange = changePct >= 0;

  const intervalOptions = CANDLE_INTERVALS.map((i) => ({ value: i, label: i }));

  return (
    <PageContainer>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#e8e8e8',
                margin: 0,
                letterSpacing: '-0.02em',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {asset}
            </h1>
            <Badge variant="neon" dot>LIVE</Badge>
            {!assetsLoading && assetInfo && (
              <span
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: isPositiveChange ? '#00ff88' : '#ff4d4d',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                {isPositiveChange ? '+' : ''}{changePct.toFixed(2)}%
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.35)', margin: 0, fontFamily: 'Inter, sans-serif' }}>
            perpetual · {asset}-USD
          </p>
        </div>

        {/* Interval selector */}
        <Select
          options={intervalOptions}
          value={interval}
          onChange={(v) => setInterval(v as CandleInterval)}
        />
      </div>

      {/* KPI Cards */}
      {assetsLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          <KPICard label="Mark Price" value={fmt.price(assetInfo?.mark_px)} sub="current" />
          <KPICard label="Open Interest" value={fmt.usd(assetInfo?.oi_usd)} sub="notional" />
          <KPICard label="24h Volume" value={fmt.usd(assetInfo?.volume_24h)} sub="rolling" />
          <KPICard
            label="Funding Rate"
            value={fmt.funding(assetInfo?.funding)}
            sub="8h rate"
            change={assetInfo?.funding}
          />
        </div>
      )}

      {/* Price Chart */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <SectionHeader
          title="Price Chart"
          subtitle={`${asset} close price · ${interval} candles`}
        />
        {candlesLoading ? (
          <SkeletonChart height={300} />
        ) : candlesError ? (
          <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff4d4d', fontSize: '0.8125rem' }}>
            Failed to load price data
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={priceChartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00ff88" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#00ff88" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="time"
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => fmt.price(v)}
                width={72}
              />
              <Tooltip content={<PriceTooltip />} />
              <Area
                type="monotone"
                dataKey="close"
                stroke="#00ff88"
                strokeWidth={1.5}
                fill="url(#priceGrad)"
                dot={false}
                activeDot={{ r: 3, fill: '#00ff88', strokeWidth: 0 }}
                name="Close"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* OI + Funding row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* OI History */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <SectionHeader title="Open Interest History" subtitle="30-day OI trend" />
          {oiLoading ? (
            <SkeletonChart height={200} />
          ) : (
            <AreaChartWidget
              data={oiChartData}
              dataKey="oi"
              height={200}
              color={CHART_COLORS.neon}
              formatY={(v) => fmt.usd(v)}
            />
          )}
        </div>

        {/* Funding History */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <SectionHeader title="Funding Rate History" subtitle="Historical 8h funding rates" />
          {fundingLoading ? (
            <SkeletonChart height={200} />
          ) : (
            <AreaChartWidget
              data={fundingChartData}
              dataKey="rate"
              height={200}
              color={CHART_COLORS.purple}
              formatY={(v) => `${(v * 100).toFixed(4)}%`}
            />
          )}
        </div>
      </div>
    </PageContainer>
  );
}
