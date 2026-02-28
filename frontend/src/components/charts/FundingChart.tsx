'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useFundingHistory } from '@/hooks/useHyperscope';

interface Props {
  asset: string;
  interval?: string;
}

const NEON = '#00ff88';
const RED = '#ff4d4d';

export function FundingChart({ asset, interval = '1d' }: Props) {
  const { data = [], isLoading } = useFundingHistory(asset, interval);

  if (isLoading)
    return (
      <div className="h-48 flex items-center justify-center text-neon-green/40 font-mono text-xs">
        loading...
      </div>
    );

  const chartData = data.map((d: { time: number; funding: number }) => ({
    name: new Date(d.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: d.funding * 100, // to pct
  }));

  return (
    <ResponsiveContainer width="100%" height={192}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
        <XAxis
          dataKey="name"
          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'monospace' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'monospace' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v.toFixed(3)}%`}
        />
        <Tooltip
          contentStyle={{
            background: '#111',
            border: '1px solid rgba(0,255,136,0.2)',
            borderRadius: 4,
            fontSize: 11,
            fontFamily: 'monospace',
            color: '#e0e0e0',
          }}
          formatter={(val: number) => [`${val.toFixed(4)}%`, 'Funding']}
        />
        <Bar dataKey="value" radius={[2, 2, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.value >= 0 ? NEON : RED}
              fillOpacity={0.8}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
