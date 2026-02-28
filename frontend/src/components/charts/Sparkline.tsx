'use client';

import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  strokeWidth?: number;
}

export function Sparkline({
  data,
  color = '#00D1FF',
  height = 48,
  strokeWidth = 1.5,
}: SparklineProps) {
  if (!data || data.length < 2) {
    return <div style={{ height }} className="bg-bg-tertiary/30 rounded" />;
  }

  const chartData = data.map((value, i) => ({ i, value }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={strokeWidth}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
