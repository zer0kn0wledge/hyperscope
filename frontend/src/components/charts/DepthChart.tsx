'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { CHART_COLORS } from '@/lib/constants';
import { formatUSD, formatPrice } from '@/lib/format';
import type { OrderbookLevel } from '@/lib/types';
import { Skeleton } from '@/components/ui/Skeleton';

interface DepthChartProps {
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  midPrice?: number;
  isLoading?: boolean;
  height?: number;
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ payload: { side: string; price: number; cumSize: number } }>;
  label?: number;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-xs font-mono shadow-card">
      <div className="text-text-secondary">Price: ${formatPrice(d.price)}</div>
      <div className={d.side === 'bid' ? 'text-accent-green' : 'text-accent-red'}>
        Cumulative: {formatUSD(d.cumSize)}
      </div>
    </div>
  );
}

export function DepthChart({ bids, asks, midPrice, isLoading, height = 200 }: DepthChartProps) {
  if (isLoading) return <Skeleton className="rounded-xl" style={{ height }} />;

  // Build cumulative bid/ask data
  const bidData = [...bids]
    .sort((a, b) => b.price - a.price)
    .reduce<Array<{ price: number; cumSize: number; side: string }>>((acc, level) => {
      const prev = acc[acc.length - 1];
      return [...acc, {
        price: level.price,
        cumSize: (prev?.cumSize ?? 0) + level.size * level.price,
        side: 'bid',
      }];
    }, []);

  const askData = [...asks]
    .sort((a, b) => a.price - b.price)
    .reduce<Array<{ price: number; cumSize: number; side: string }>>((acc, level) => {
      const prev = acc[acc.length - 1];
      return [...acc, {
        price: level.price,
        cumSize: (prev?.cumSize ?? 0) + level.size * level.price,
        side: 'ask',
      }];
    }, []);

  const allData = [
    ...bidData.reverse().slice(0, 50),
    ...askData.slice(0, 50),
  ];

  if (!allData.length) {
    return (
      <div className="flex items-center justify-center text-text-muted text-sm" style={{ height }}>
        No orderbook data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={allData} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
        <defs>
          <linearGradient id="bidGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.green} stopOpacity={0.4} />
            <stop offset="95%" stopColor={CHART_COLORS.green} stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="askGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.red} stopOpacity={0.4} />
            <stop offset="95%" stopColor={CHART_COLORS.red} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="price"
          tickFormatter={(v: number) => `$${formatPrice(v)}`}
          tick={{ fill: CHART_COLORS.text, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v: number) => formatUSD(v)}
          tick={{ fill: CHART_COLORS.text, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={65}
        />
        <Tooltip content={<CustomTooltip />} />
        {midPrice && (
          <ReferenceLine
            x={midPrice}
            stroke="rgba(0, 209, 255, 0.6)"
            strokeDasharray="4 4"
            strokeWidth={1}
          />
        )}
        <Area
          type="stepAfter"
          dataKey="cumSize"
          data={bidData.reverse()}
          stroke={CHART_COLORS.green}
          strokeWidth={1.5}
          fill="url(#bidGrad)"
          dot={false}
          isAnimationActive={false}
        />
        <Area
          type="stepBefore"
          dataKey="cumSize"
          data={askData}
          stroke={CHART_COLORS.red}
          strokeWidth={1.5}
          fill="url(#askGrad)"
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
