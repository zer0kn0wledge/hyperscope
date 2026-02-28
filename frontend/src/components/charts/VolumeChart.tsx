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
import { fmt } from '@/lib/format';

interface DataPoint {
  name: string;
  value: number;
}

interface Props {
  data: DataPoint[];
  height?: number;
}

const NEON = '#00ff88';

export function VolumeChart({ data, height = 220 }: Props) {
  if (!data || !data.length)
    return (
      <div
        className="flex items-center justify-center text-white/20 font-mono text-xs"
        style={{ height }}
      >
        no data
      </div>
    );

  const maxVal = Math.max(...data.map((d) => d.value), 1);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
        <XAxis
          dataKey="name"
          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'monospace' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'monospace' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => fmt.compact(v)}
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
          formatter={(val: number) => [fmt.usd(val), 'Volume']}
        />
        <Bar dataKey="value" radius={[2, 2, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={NEON}
              fillOpacity={0.5 + (entry.value / maxVal) * 0.5}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
