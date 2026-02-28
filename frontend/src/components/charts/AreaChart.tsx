'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { CHART_COLORS } from '@/lib/constants';
import { formatUSD, formatDate } from '@/lib/format';
import { Skeleton } from '@/components/ui/Skeleton';

interface AreaChartDataPoint {
  time: number | string;
  [key: string]: number | string;
}

interface SeriesConfig {
  key: string;
  name: string;
  color: string;
}

interface AreaChartComponentProps {
  data: AreaChartDataPoint[];
  series: SeriesConfig[];
  isLoading?: boolean;
  height?: number;
  valueFormatter?: (value: number) => string;
  stacked?: boolean;
  gradient?: boolean;
}

function CustomTooltip({ active, payload, label, valueFormatter }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: number | string;
  valueFormatter?: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-xs font-mono shadow-card">
      <div className="text-text-secondary mb-2">
        {typeof label === 'number' ? formatDate(label, { short: true }) : label}
      </div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ background: p.color }} />
          <span className="text-text-secondary">{p.name}:</span>
          <span style={{ color: p.color }}>
            {valueFormatter ? valueFormatter(p.value) : p.value.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function AreaChartComponent({
  data,
  series,
  isLoading,
  height = 220,
  valueFormatter = formatUSD,
  stacked = false,
  gradient = true,
}: AreaChartComponentProps) {
  if (isLoading) return <Skeleton className="rounded-xl" style={{ height }} />;
  if (!data?.length) {
    return (
      <div className="flex items-center justify-center text-text-muted text-sm" style={{ height }}>
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={s.color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={s.color} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={CHART_COLORS.grid}
          vertical={false}
          strokeOpacity={0.5}
        />
        <XAxis
          dataKey="time"
          tickFormatter={(v: number | string) =>
            typeof v === 'number' ? formatDate(v, { short: true }) : String(v)
          }
          tick={{ fill: CHART_COLORS.text, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={valueFormatter}
          tick={{ fill: CHART_COLORS.text, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={65}
        />
        <Tooltip content={<CustomTooltip valueFormatter={valueFormatter} />} />
        {series.length > 1 && (
          <Legend iconType="square" wrapperStyle={{ fontSize: 11 }} />
        )}
        {series.map((s) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color}
            strokeWidth={1.5}
            fill={gradient ? `url(#grad-${s.key})` : 'transparent'}
            dot={false}
            isAnimationActive={false}
            stackId={stacked ? 'stack' : undefined}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
