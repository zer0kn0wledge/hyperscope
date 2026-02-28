'use client';

import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

interface Props {
  data: number[];
  color?: string;
  height?: number;
}

export function Sparkline({ data, color = '#00ff88', height = 40 }: Props) {
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
        <Tooltip
          contentStyle={{
            background: '#111',
            border: '1px solid rgba(0,255,136,0.2)',
            borderRadius: 4,
            fontSize: 10,
            fontFamily: 'monospace',
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
