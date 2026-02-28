'use client';

import { getHeatmapColor } from '@/lib/format';

interface HeatMapItem {
  name: string;
  value: number; // price_change_pct
  size: number;  // oi usd
}

interface Props {
  data: HeatMapItem[];
}

export function HeatMap({ data }: Props) {
  if (!data.length) return null;

  const maxSize = Math.max(...data.map((d) => d.size), 1);

  return (
    <div className="flex flex-wrap gap-1.5">
      {data.map((item) => {
        const bgColor = getHeatmapColor(item.value);
        // Scale tile size based on OI (min 60px, max 140px)
        const w = 60 + (item.size / maxSize) * 80;
        return (
          <div
            key={item.name}
            style={{
              backgroundColor: bgColor,
              width: `${w}px`,
              minHeight: '56px',
            }}
            className="rounded flex flex-col items-center justify-center p-1 cursor-pointer hover:opacity-90 transition-opacity"
          >
            <span className="text-xs font-mono font-semibold text-white">
              {item.name}
            </span>
            <span
              className="text-xs font-mono"
              style={{
                color: item.value >= 0 ? '#00ff88' : '#ff4d4d',
              }}
            >
              {item.value >= 0 ? '+' : ''}
              {item.value.toFixed(2)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
