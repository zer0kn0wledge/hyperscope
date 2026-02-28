'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { CHART_COLORS } from '@/lib/constants';
import { formatUSD, formatDate } from '@/lib/format';
import type { FundingHistoryEntry } from '@/lib/types';
import { Skeleton } from '@/components/ui/Skeleton';

interface FundingChartProps {
  data: FundingHistoryEntry[];
  isLoading?: boolean;
  height?: number;
  annualized?: boolean;
}

function CustomTooltip({ active, payload, label, annualized }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: number;
  annualized?: boolean;
}) {
  if (!active || !payload?.length) return null;
  const rate = payload[0].value;
  const displayRate = annualized ? rate * 3 * 365 * 100 : rate * 100;
  return (
    <div className="bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-xs font-mono shadow-card">
      <div className="text-text-secondary mb-1">
        {label ? formatDate(label) : ''}
      </div>
      <div className={rate >= 0 ? 'text-accent-orange' : 'text-accent-cyan'}>
        Rate: {rate >= 0 ? '+' : ''}{displayRate.toFixed(4)}%
        {annualized && ' (ann.)'}
      </div>
    </div>
  );
}

export function FundingChart({ data, isLoading, height = 220, annualized = false }: FundingChartProps) {
  if (isLoading) return <Skeleton className="rounded-xl" style={{ height }} />;
  if (!data?.length) {
    return (
      <div className="flex items-center justify-center text-text-muted text-sm" style={{ height }}>
        No funding data available
      </div>
    );
  }

  const chartData = data.map((d) => ({
    time: d.time,
    rate: d.fundingRate,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={CHART_COLORS.grid}
          vertical={false}
          strokeOpacity={0.5}
        />
        <XAxis
          dataKey="time"
          tickFormatter={(v: number) => formatDate(v, { short: true })}
          tick={{ fill: CHART_COLORS.text, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v: number) => {
            const pct = annualized ? v * 3 * 365 * 100 : v * 100;
            return `${pct.toFixed(3)}%`;
          }}
          tick={{ fill: CHART_COLORS.text, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={60}
        />
        <Tooltip content={<CustomTooltip annualized={annualized} />} />
        <ReferenceLine y={0} stroke={CHART_COLORS.grid} strokeWidth={1} />
        <Bar dataKey="rate" radius={[2, 2, 0, 0]} isAnimationActive={false}>
          {chartData.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.rate >= 0 ? CHART_COLORS.orange : CHART_COLORS.cyan}
              fillOpacity={0.85}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
