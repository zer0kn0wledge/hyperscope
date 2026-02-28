'use client';

import { CHART_COLORS } from '@/lib/constants';

interface ComparisonItem {
  name: string;
  value: number;
  color?: string;
  highlight?: boolean;
}

interface ComparisonBarProps {
  data: ComparisonItem[];
  formatter?: (v: number) => string;
  label?: string;
  showValues?: boolean;
  maxBarWidth?: number;
}

function Bar({ item, maxValue, formatter, maxBarWidth }: { item: ComparisonItem; maxValue: number; formatter?: (v: number) => string; maxBarWidth: number }) {
  const pct = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
  const barColor = item.color ?? (item.highlight ? CHART_COLORS.neon : 'rgba(255,255,255,0.2)');
  const formattedValue = formatter ? formatter(item.value) : item.value.toLocaleString();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.625rem' }}>
      <div style={{ width: 90, flexShrink: 0, fontSize: '0.8125rem', fontFamily: 'Inter, sans-serif', color: item.highlight ? CHART_COLORS.neon : '#e8e8e8', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {item.name}
      </div>
      <div style={{ flex: 1, height: 20, background: 'rgba(255,255,255,0.04)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, maxWidth: `${maxBarWidth}%`, background: barColor, borderRadius: '4px', opacity: item.highlight ? 0.9 : 0.6, transition: 'width 0.4s ease' }} />
      </div>
      <div style={{ width: 80, flexShrink: 0, fontSize: '0.8125rem', fontFamily: 'JetBrains Mono, monospace', color: item.highlight ? barColor : 'rgba(255,255,255,0.6)', textAlign: 'right' }}>
        {formattedValue}
      </div>
    </div>
  );
}

export function ComparisonBar({ data, formatter, label, showValues = true, maxBarWidth = 100 }: ComparisonBarProps) {
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div>
      {label && (
        <div style={{ fontSize: '0.6875rem', fontFamily: 'Inter, sans-serif', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
          {label}
        </div>
      )}
      {data.map((item) => (
        <Bar key={item.name} item={item} maxValue={maxValue} formatter={formatter} maxBarWidth={maxBarWidth} />
      ))}
    </div>
  );
}
