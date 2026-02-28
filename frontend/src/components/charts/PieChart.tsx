'use client';

import {
  PieChart as RePieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { CHART_COLORS } from '@/lib/constants';

const DEFAULT_COLORS = [
  CHART_COLORS.neon,
  CHART_COLORS.blue,
  CHART_COLORS.purple,
  CHART_COLORS.yellow,
  CHART_COLORS.orange,
  CHART_COLORS.cyan,
  CHART_COLORS.red,
];

interface PieDataItem {
  name: string;
  value: number;
  color?: string;
}

interface PieChartWidgetProps {
  data: PieDataItem[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  showLegend?: boolean;
  formatter?: (value: number, name: string) => [string, string];
  labelFormatter?: (name: string, percent: number) => string;
}

function PieTooltip({ active, payload, formatter }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const [formattedValue, formattedName] = formatter ? formatter(item.value, item.name) : [item.value.toLocaleString(), item.name];
  return (
    <div style={{ background: '#0a0a0a', border: '1px solid rgba(0,255,136,0.2)', borderRadius: '10px', padding: '0.625rem 0.875rem', fontFamily: 'JetBrains Mono, monospace' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.payload.color ?? item.fill }} />
        <span style={{ fontSize: '0.75rem', color: '#e8e8e8' }}>{formattedName}</span>
      </div>
      <div style={{ fontSize: '0.875rem', color: item.payload.color ?? item.fill, fontWeight: 600, marginTop: '4px' }}>{formattedValue}</div>
    </div>
  );
}

export function PieChartWidget({
  data,
  height = 240,
  innerRadius = 60,
  outerRadius = 100,
  showLegend = true,
  formatter,
}: PieChartWidgetProps) {
  const coloredData = data.map((item, i) => ({
    ...item,
    color: item.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length],
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RePieChart>
        <Pie data={coloredData} cx="50%" cy="50%" innerRadius={innerRadius} outerRadius={outerRadius} dataKey="value" strokeWidth={0}>
          {coloredData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.85} />
          ))}
        </Pie>
        <Tooltip content={<PieTooltip formatter={formatter} />} />
        {showLegend && (
          <Legend
            formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontFamily: 'Inter, sans-serif' }}>{value}</span>}
            wrapperStyle={{ fontSize: '0.75rem' }}
          />
        )}
      </RePieChart>
    </ResponsiveContainer>
  );
}
