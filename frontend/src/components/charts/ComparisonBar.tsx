'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { CHART_COLORS } from '@/lib/constants';
import { formatUSD } from '@/lib/format';
import { Skeleton } from '@/components/ui/Skeleton';

interface ComparisonBarProps {
  data: Array<{ name: string; value: number; color?: string }>;
  isLoading?: boolean;
  height?: number;
  valueFormatter?: (v: number) => string;
  label?: string;
  horizontal?: boolean;
}

function CustomTooltip({ active, payload, label, valueFormatter }: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
  valueFormatter?: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-xs font-mono shadow-card">
      <div className="text-text-secondary mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color }}>
          {valueFormatter ? valueFormatter(p.value) : formatUSD(p.value)}
        </div>
      ))}
    </div>
  );
}

export function ComparisonBar({
  data,
  isLoading,
  height = 220,
  valueFormatter = formatUSD,
  label,
  horizontal = false,
}: ComparisonBarProps) {
  if (isLoading) return <Skeleton className="rounded-xl" style={{ height }} />;
  if (!data?.length) {
    return (
      <div className="flex items-center justify-center text-text-muted text-sm" style={{ height }}>
        No comparison data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={horizontal ? 'vertical' : 'horizontal'}
        margin={{ top: 8, right: 16, bottom: 0, left: 4 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={CHART_COLORS.grid}
          strokeOpacity={0.5}
          horizontal={!horizontal}
          vertical={horizontal}
        />
        {horizontal ? (
          <>
            <XAxis
              type="number"
              tickFormatter={valueFormatter}
              tick={{ fill: CHART_COLORS.text, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: CHART_COLORS.text, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={80}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey="name"
              tick={{ fill: CHART_COLORS.text, fontSize: 11 }}
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
          </>
        )}
        <Tooltip content={<CustomTooltip valueFormatter={valueFormatter} />} />
        <Bar
          dataKey="value"
          name={label}
          radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
          isAnimationActive={false}
        >
          {data.map((entry, i) => (
            <Cell
              key={`cell-${i}`}
              fill={entry.color ?? CHART_COLORS.cyan}
              fillOpacity={0.85}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
