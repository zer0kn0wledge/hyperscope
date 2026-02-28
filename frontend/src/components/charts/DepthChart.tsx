'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { CHART_COLORS } from '@/lib/constants';

interface DepthLevel {
  price: number;
  size: number;
  cumulative: number;
}

interface DepthChartProps {
  bids: DepthLevel[];
  asks: DepthLevel[];
  height?: number;
}

function DepthTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0a0a0a', border: '1px solid rgba(0,255,136,0.2)', borderRadius: '10px', padding: '0.5rem 0.75rem', fontFamily: 'JetBrains Mono, monospace' }}>
      <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>${Number(label).toLocaleString()}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
          <span style={{ fontSize: '0.6875rem', color: p.color }}>{p.name}</span>
          <span style={{ fontSize: '0.75rem', color: p.color }}>{p.value?.toFixed(4)}</span>
        </div>
      ))}
    </div>
  );
}

export function DepthChart({ bids, asks, height = 260 }: DepthChartProps) {
  // Combine and sort all levels by price
  const bidData = [...bids].sort((a, b) => b.price - a.price).map((b) => ({ price: b.price, bidCumulative: b.cumulative, askCumulative: null }));
  const askData = [...asks].sort((a, b) => a.price - b.price).map((a) => ({ price: a.price, bidCumulative: null, askCumulative: a.cumulative }));

  const combined = [...bidData, ...askData].sort((a, b) => a.price - b.price);

  if (combined.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8125rem' }}>
        no depth data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={combined} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="bidDepthGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.neon} stopOpacity={0.15} />
            <stop offset="95%" stopColor={CHART_COLORS.neon} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="askDepthGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.red} stopOpacity={0.15} />
            <stop offset="95%" stopColor={CHART_COLORS.red} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="price" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${Number(v).toLocaleString()}`} interval="preserveStartEnd" />
        <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} tickLine={false} axisLine={false} width={48} />
        <Tooltip content={<DepthTooltip />} />
        <Area type="stepAfter" dataKey="bidCumulative" name="Bid" stroke={CHART_COLORS.neon} strokeWidth={1.5} fill="url(#bidDepthGrad)" dot={false} connectNulls={false} />
        <Area type="stepBefore" dataKey="askCumulative" name="Ask" stroke={CHART_COLORS.red} strokeWidth={1.5} fill="url(#askDepthGrad)" dot={false} connectNulls={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
