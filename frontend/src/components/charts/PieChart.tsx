'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const COLORS = [
  '#00ff88',
  '#00cc66',
  '#00ffcc',
  '#00ff44',
  '#33ffaa',
  '#66ffbb',
  '#99ffd4',
  '#ccffe8',
];

interface Props {
  data: { name: string; value: number }[];
}

export function PieChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[index % COLORS.length]}
              stroke="transparent"
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: '#111',
            border: '1px solid rgba(0,255,136,0.2)',
            borderRadius: 4,
            fontSize: 11,
            fontFamily: 'monospace',
            color: '#e0e0e0',
          }}
        />
        <Legend
          formatter={(value) => (
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontFamily: 'monospace' }}>
              {value}
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
