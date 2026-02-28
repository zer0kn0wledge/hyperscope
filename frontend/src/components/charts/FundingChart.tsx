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

interface FundingDataPoint {
  time: string;
  rate: number;
}

interface FundingChartProps {
  data: FundingDataPoint[];
  height?: number;
  showReferenceLine?: boolean;
}

function FundingTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const rate = payload[0]?.value;
  const positive = rate >= 0;
  return (
    <div style={{ background: '#0a0a0a', border: `1px solid ${positive ? 'rgba(0,255,136,0.2)' : 'rgba(255,77,77,0.2)'}`, borderRadius: '10px', padding: '0.625rem 0.875rem', fontFamily: 'JetBrains Mono, monospace' }}>
      <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '0.875rem', color: positive ? CHART_COLORS.neon : CHART_COLORS.red, fontWeight: 600 }}>
        {positive ? '+' : ''}{(rate * 100).toFixed(4)}%
      </div>
    </div>
  );
}

export function FundingChart({ data, height = 220, showReferenceLine = true }: FundingChartProps) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8125rem' }}>
        no funding data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis dataKey="time" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v * 100).toFixed(3)}%`} width={60} />
        <Tooltip content={<FundingTooltip />} />
        {showReferenceLine && <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 2" />}
        <Bar dataKey="rate" radius={[2, 2, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.rate >= 0 ? CHART_COLORS.neon : CHART_COLORS.red} fillOpacity={0.8} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
