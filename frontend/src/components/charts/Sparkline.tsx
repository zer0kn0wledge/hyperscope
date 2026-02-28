'use client';

import {
  AreaChart,
  Area,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { CHART_COLORS } from '@/lib/constants';

interface SparklineProps {
  data: Array<{ value: number }>;
  color?: string;
  height?: number;
  width?: number | string;
  showTooltip?: boolean;
  positiveColor?: string;
  negativeColor?: string;
  baselineZero?: boolean;
}

function SparkTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0a0a0a', border: '1px solid rgba(0,255,136,0.15)', borderRadius: '6px', padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#00ff88', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap' }}>
      {typeof payload[0].value === 'number' ? payload[0].value.toLocaleString(undefined, { maximumFractionDigits: 4 }) : payload[0].value}
    </div>
  );
}

export function Sparkline({
  data,
  color = CHART_COLORS.neon,
  height = 40,
  width = '100%',
  showTooltip = false,
  baselineZero = false,
}: SparklineProps) {
  if (!data || data.length === 0) return null;

  const gradId = `spark-grad-${Math.random().toString(36).slice(2, 7)}`;
  const domain: [number | string, number | string] = baselineZero ? [0, 'dataMax'] : ['dataMin', 'dataMax'];

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis domain={domain} hide />
          {showTooltip && <Tooltip content={<SparkTooltip />} cursor={{ stroke: `${color}44`, strokeWidth: 1 }} />}
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} fill={`url(#${gradId})`} dot={false} activeDot={showTooltip ? { r: 2, fill: color, strokeWidth: 0 } : false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
