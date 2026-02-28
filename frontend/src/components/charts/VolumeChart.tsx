'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { CHART_COLORS } from '@/lib/constants';
import { formatUSD, formatDate } from '@/lib/format';
import type { VolumeHistoryEntry, TakerVolumeEntry } from '@/lib/types';
import { Skeleton } from '@/components/ui/Skeleton';

// ---- Dual-bar (buy/sell taker) version ----
interface TakerVolumeChartProps {
  data: TakerVolumeEntry[];
  isLoading?: boolean;
  height?: number;
}

function TakerTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-xs font-mono shadow-card">
      <div className="text-text-secondary mb-1">{label ? formatDate(label, { short: true }) : ''}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color }}>
          {p.name}: {formatUSD(p.value)}
        </div>
      ))}
    </div>
  );
}

export function TakerVolumeChart({ data, isLoading, height = 220 }: TakerVolumeChartProps) {
  if (isLoading) return <Skeleton className="rounded-xl" style={{ height }} />;
  if (!data?.length) {
    return (
      <div className="flex items-center justify-center text-text-muted text-sm" style={{ height }}>
        No volume data
      </div>
    );
  }

  const chartData = data.map((d) => ({
    time: d.time,
    Buy: d.buyVolume,
    Sell: d.sellVolume,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} strokeOpacity={0.5} />
        <XAxis
          dataKey="time"
          tickFormatter={(v: number) => formatDate(v, { short: true })}
          tick={{ fill: CHART_COLORS.text, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v: number) => formatUSD(v)}
          tick={{ fill: CHART_COLORS.text, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={60}
        />
        <Tooltip content={<TakerTooltip />} />
        <Legend iconType="square" wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="Buy" fill={CHART_COLORS.cyan} fillOpacity={0.8} radius={[2, 2, 0, 0]} isAnimationActive={false} stackId="a" />
        <Bar dataKey="Sell" fill={CHART_COLORS.red} fillOpacity={0.8} radius={[2, 2, 0, 0]} isAnimationActive={false} stackId="a" />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ---- Standard volume bar chart ----
interface VolumeChartProps {
  data: VolumeHistoryEntry[];
  isLoading?: boolean;
  height?: number;
}

function VolumeTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-xs font-mono shadow-card">
      <div className="text-text-secondary mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color }}>
          {p.name}: {formatUSD(p.value)}
        </div>
      ))}
    </div>
  );
}

export function VolumeChart({ data, isLoading, height = 220 }: VolumeChartProps) {
  if (isLoading) return <Skeleton className="rounded-xl" style={{ height }} />;
  if (!data?.length) {
    return (
      <div className="flex items-center justify-center text-text-muted text-sm" style={{ height }}>
        No volume data
      </div>
    );
  }

  // Handle both candle data format and volume history format
  const chartData = data.map((d) => {
    const raw = d as unknown as Record<string, unknown>;
    return {
      date: raw.date ?? (raw.time ? formatDate(Number(raw.time), { short: true }) : ''),
      volume: Number(raw.volume ?? raw.perpVolume ?? raw.total ?? raw.total_volume ?? 0),
    };
  });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} strokeOpacity={0.5} />
        <XAxis
          dataKey="date"
          tick={{ fill: CHART_COLORS.text, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatUSD}
          tick={{ fill: CHART_COLORS.text, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={60}
        />
        <Tooltip content={<VolumeTooltip />} />
        <Bar dataKey="volume" name="Volume" fill={CHART_COLORS.cyan} fillOpacity={0.8} radius={[2, 2, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}
