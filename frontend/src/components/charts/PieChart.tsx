'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { CHART_COLORS } from '@/lib/constants';
import { formatUSD, formatPercent } from '@/lib/format';
import { Skeleton } from '@/components/ui/Skeleton';

const DEFAULT_COLORS = [
  CHART_COLORS.cyan,
  CHART_COLORS.green,
  CHART_COLORS.orange,
  CHART_COLORS.blue,
  '#A78BFA',
  '#F59E0B',
  '#6EE7B7',
  '#EC4899',
  '#F97316',
  '#14B8A6',
];

interface PieDataItem {
  name: string;
  value: number;
  color?: string;
}

interface PieChartComponentProps {
  data: PieDataItem[];
  isLoading?: boolean;
  height?: number;
  donut?: boolean;
  valueFormatter?: (v: number) => string;
  showLegend?: boolean;
}

function CustomTooltip({ active, payload, valueFormatter }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { percentage?: number } }>;
  valueFormatter?: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-xs font-mono shadow-card">
      <div className="text-text-primary font-medium mb-1">{p.name}</div>
      <div className="text-accent-cyan">
        {valueFormatter ? valueFormatter(p.value) : formatUSD(p.value)}
      </div>
      {p.payload.percentage !== undefined && (
        <div className="text-text-secondary">
          {p.payload.percentage.toFixed(1)}%
        </div>
      )}
    </div>
  );
}

export function PieChartComponent({
  data,
  isLoading,
  height = 280,
  donut = false,
  valueFormatter = formatUSD,
  showLegend = true,
}: PieChartComponentProps) {
  if (isLoading) return <Skeleton className="rounded-xl" style={{ height }} />;
  if (!data?.length) {
    return (
      <div className="flex items-center justify-center text-text-muted text-sm" style={{ height }}>
        No data available
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const chartData = data.map((d) => ({
    ...d,
    percentage: total > 0 ? (d.value / total) * 100 : 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={donut ? '55%' : 0}
          outerRadius="75%"
          dataKey="value"
          nameKey="name"
          strokeWidth={2}
          stroke="#0A0E14"
          isAnimationActive={false}
        >
          {chartData.map((entry, i) => (
            <Cell
              key={entry.name}
              fill={entry.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
              fillOpacity={0.85}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip valueFormatter={valueFormatter} />} />
        {showLegend && (
          <Legend
            iconType="square"
            iconSize={10}
            wrapperStyle={{ fontSize: 11 }}
          />
        )}
      </PieChart>
    </ResponsiveContainer>
  );
}
