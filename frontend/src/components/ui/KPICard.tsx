'use client';

import { ReactNode } from 'react';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  Area,
  AreaChart,
  YAxis,
} from 'recharts';
import { CHART_COLORS } from '@/lib/constants';

interface KPICardProps {
  label: string;
  value: string | ReactNode;
  sub?: string;
  change?: number;
  sparklineData?: Array<{ value: number }>;
  onClick?: () => void;
}

function ChangeIndicator({ change }: { change: number }) {
  const positive = change >= 0;
  const absChange = Math.abs(change * 100).toFixed(2);
  return (
    <div
      className="flex items-center gap-1 text-xs font-mono"
      style={{ color: positive ? CHART_COLORS.neon : CHART_COLORS.red }}
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transform: positive ? 'rotate(0deg)' : 'rotate(180deg)' }}>
        <path d="M5 1L9 5L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 5H1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <span>{absChange}%</span>
    </div>
  );
}

function SparkTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number }> }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="text-xs font-mono px-2 py-1 rounded" style={{ background: '#0a0a0a', border: '1px solid rgba(0,255,136,0.2)', color: '#00ff88', boxShadow: '0 4px 12px rgba(0,0,0,0.8)' }}>
      {typeof payload[0].value === 'number' ? payload[0].value.toLocaleString() : payload[0].value}
    </div>
  );
}

export function KPICard({ label, value, sub, change, sparklineData, onClick }: KPICardProps) {
  return (
    <div className="card flex flex-col gap-2" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest font-mono" style={{ color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em' }}>
          {label}
        </span>
        {change !== undefined && <ChangeIndicator change={change} />}
      </div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <div className="text-xl font-semibold leading-none" style={{ color: '#e8e8e8', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '-0.02em' }}>
            {value}
          </div>
          {sub && <div className="text-xs mt-1.5 font-mono" style={{ color: 'rgba(255,255,255,0.35)' }}>{sub}</div>}
        </div>
        {sparklineData && sparklineData.length > 0 && (
          <div style={{ width: 80, height: 36, flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
                <defs>
                  <linearGradient id={`kpi-spark-grad-${label.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.neon} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.neon} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <YAxis domain={['dataMin', 'dataMax']} hide />
                <ReTooltip content={<SparkTooltip />} cursor={{ stroke: 'rgba(0,255,136,0.2)', strokeWidth: 1 }} />
                <Area type="monotone" dataKey="value" stroke={CHART_COLORS.neon} strokeWidth={1.5} fill={`url(#kpi-spark-grad-${label.replace(/\s/g, '')})`} dot={false} activeDot={{ r: 2, fill: CHART_COLORS.neon, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
