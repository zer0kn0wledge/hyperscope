'use client';

import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';
import { CHART_COLORS } from '@/lib/constants';

interface BarSeriesConfig {
  key: string;
  label: string;
  color?: string;
}

interface BarChartWidgetProps {
  data: any[];
  series?: BarSeriesConfig[];
  dataKey?: string;
  xKey?: string;
  height?: number;
  color?: string;
  formatY?: (v: number) => string;
  formatter?: (v: number, name: string) => [string, string];
  showLegend?: boolean;
  showGrid?: boolean;
  colorByValue?: boolean;
  positiveColor?: string;
  negativeColor?: string;
  radius?: [number, number, number, number];
}

function BarTooltip({ active, payload, label, formatter }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0a0a0a', border: '1px solid rgba(0,255,136,0.2)', borderRadius: '10px', padding: '0.625rem 0.875rem', fontFamily: 'JetBrains Mono, monospace', minWidth: 140 }}>
      <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
          <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)' }}>{p.name}</span>
          <span style={{ fontSize: '0.75rem', color: p.fill ?? p.color ?? '#e8e8e8' }}>{formatter ? formatter(p.value, p.name)[0] : p.value}</span>
        </div>
      ))}
    </div>
  );
}

export function BarChartWidget({
  data,
  series,
  dataKey,
  xKey = 'time',
  height = 240,
  color = CHART_COLORS.neon,
  formatY,
  formatter,
  showLegend = false,
  showGrid = true,
  colorByValue = false,
  positiveColor = CHART_COLORS.neon,
  negativeColor = CHART_COLORS.red,
  radius = [2, 2, 0, 0],
}: BarChartWidgetProps) {
  const resolvedSeries: BarSeriesConfig[] = series ?? (dataKey ? [{ key: dataKey, label: dataKey, color }] : []);
  const colors = [CHART_COLORS.neon, CHART_COLORS.blue, CHART_COLORS.purple, CHART_COLORS.yellow];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ReBarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />}
        <XAxis dataKey={xKey} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={formatY} width={72} />
        <Tooltip content={<BarTooltip formatter={formatter} />} />
        {showLegend && <Legend wrapperStyle={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }} />}
        {resolvedSeries.map((s, i) => {
          const c = s.color ?? colors[i % colors.length];
          return (
            <Bar key={s.key} dataKey={s.key} name={s.label} fill={c} fillOpacity={0.85} radius={radius}>
              {colorByValue && data.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={entry[s.key] >= 0 ? positiveColor : negativeColor} fillOpacity={0.85} />
              ))}
            </Bar>
          );
        })}
      </ReBarChart>
    </ResponsiveContainer>
  );
}
