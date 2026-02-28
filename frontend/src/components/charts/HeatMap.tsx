'use client';

import { useState } from 'react';
import { getHeatmapColor } from '@/lib/utils';

interface HeatmapItem {
  asset: string;
  change: number;
  oi: number;
  volume?: number;
  price?: number;
}

interface HeatMapProps {
  data: HeatmapItem[];
  minTileSize?: number;
  maxTileSize?: number;
}

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

function getTileSize(oi: number, minOI: number, maxOI: number, minSize: number, maxSize: number) {
  if (maxOI === minOI) return (minSize + maxSize) / 2;
  const ratio = (oi - minOI) / (maxOI - minOI);
  return minSize + ratio * (maxSize - minSize);
}

function HeatmapTile({ item, size }: { item: HeatmapItem; size: number }) {
  const [hovered, setHovered] = useState(false);
  const color = getHeatmapColor(item.change);
  const positive = item.change >= 0;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: size,
        height: size,
        background: color.bg,
        border: `1px solid ${hovered ? color.border + 'cc' : color.border}`,
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'default',
        transition: 'all 0.15s ease',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
        transform: hovered ? 'scale(1.04)' : 'scale(1)',
        boxShadow: hovered ? `0 4px 20px ${color.border}44` : 'none',
        zIndex: hovered ? 2 : 1,
      }}
    >
      <span style={{ fontSize: clamp(size * 0.18, 8, 14), fontWeight: 600, color: '#e8e8e8', fontFamily: 'Inter, sans-serif', lineHeight: 1 }}>
        {item.asset}
      </span>
      <span style={{ fontSize: clamp(size * 0.15, 7, 12), color: positive ? '#00ff88' : '#ff4d4d', fontFamily: 'JetBrains Mono, monospace', marginTop: 2, lineHeight: 1 }}>
        {positive ? '+' : ''}{item.change.toFixed(2)}%
      </span>
      {hovered && (
        <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: '#0a0a0a', border: '1px solid rgba(0,255,136,0.2)', borderRadius: '8px', padding: '0.5rem 0.75rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6875rem', color: '#e8e8e8', whiteSpace: 'nowrap', pointerEvents: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.8)', marginBottom: '4px' }}>
          <div style={{ fontWeight: 600, color: '#00ff88', marginBottom: '4px' }}>{item.asset}</div>
          <div style={{ color: positive ? '#00ff88' : '#ff4d4d' }}>{positive ? '+' : ''}{item.change.toFixed(4)}%</div>
          {item.oi > 0 && <div style={{ color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>OI: ${(item.oi / 1e6).toFixed(1)}M</div>}
          {item.price != null && <div style={{ color: 'rgba(255,255,255,0.5)' }}>Price: ${item.price.toLocaleString()}</div>}
        </div>
      )}
    </div>
  );
}

export function HeatMap({ data, minTileSize = 48, maxTileSize = 120 }: HeatMapProps) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8125rem' }}>
        no heatmap data
      </div>
    );
  }

  const ois = data.map((d) => d.oi ?? 0);
  const minOI = Math.min(...ois);
  const maxOI = Math.max(...ois);

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignContent: 'flex-start' }}>
      {data.map((item) => {
        const size = getTileSize(item.oi ?? 0, minOI, maxOI, minTileSize, maxTileSize);
        return <HeatmapTile key={item.asset} item={item} size={Math.round(size)} />;
      })}
    </div>
  );
}
