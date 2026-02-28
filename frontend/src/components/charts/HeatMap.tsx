'use client';

import { getHeatmapColor } from '@/lib/constants';
import { formatUSD, formatPercent } from '@/lib/format';
import type { HeatmapAsset } from '@/lib/types';
import { Skeleton } from '@/components/ui/Skeleton';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Link from 'next/link';

function cn(...classes: (string | undefined | null | boolean)[]) {
  return twMerge(clsx(classes));
}

interface HeatMapProps {
  data: HeatmapAsset[];
  isLoading?: boolean;
}

function getTextColor(bgColor: string): string {
  // Use white text on dark backgrounds, darker text on light
  return '#FFFFFF';
}

function getOpacity(volume: number, maxVolume: number): number {
  if (maxVolume === 0) return 0.5;
  const ratio = volume / maxVolume;
  return Math.max(0.35, Math.min(1.0, 0.35 + ratio * 0.65));
}

export function HeatMap({ data, isLoading }: HeatMapProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 xl:grid-cols-10 gap-1.5">
        {Array.from({ length: 30 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="text-center text-text-muted text-sm py-10">
        No market data available
      </div>
    );
  }

  // Backend returns snake_case fields: change_pct, volume_24h, oi_usd
  const vol = (d: Record<string, unknown>) => Number(d.volume_24h ?? d.volume24h ?? 0);
  const chg = (d: Record<string, unknown>) => Number(d.change_pct ?? d.priceChange24h ?? 0);
  const oi = (d: Record<string, unknown>) => Number(d.oi_usd ?? d.openInterest ?? 0);

  const maxVolume = Math.max(...data.map((d) => vol(d as unknown as Record<string, unknown>)));
  const sorted = [...data].sort((a, b) =>
    vol(b as unknown as Record<string, unknown>) - vol(a as unknown as Record<string, unknown>)
  );

  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 xl:grid-cols-10 2xl:grid-cols-12 gap-1.5">
      {sorted.map((asset) => {
        const raw = asset as unknown as Record<string, unknown>;
        const change = chg(raw);
        const volume = vol(raw);
        const openInterest = oi(raw);
        const bgColor = getHeatmapColor(change);
        const opacity = getOpacity(volume, maxVolume);

        return (
          <Link
            key={asset.asset}
            href={`/markets/${asset.asset}`}
            className={cn(
              'relative rounded-lg p-2 flex flex-col justify-between',
              'border border-transparent hover:border-white/20 transition-all duration-200',
              'cursor-pointer min-h-[60px] overflow-hidden group'
            )}
            style={{ backgroundColor: bgColor, opacity }}
          >
            <div className="text-white text-xs font-bold tracking-wide">
              {asset.asset}
            </div>
            <div className="space-y-0.5">
              <div className="text-white text-xs font-bold number leading-tight">
                {formatPercent(change)}
              </div>
              <div className="text-white/70 text-[9px] number leading-tight">
                {formatUSD(volume)}
              </div>
            </div>
            {/* Hover tooltip */}
            <div className="absolute inset-0 bg-bg-elevated/90 opacity-0 group-hover:opacity-100 transition-opacity duration-150 rounded-lg flex flex-col justify-center p-2 z-10">
              <div className="text-text-primary text-xs font-bold">{asset.asset}</div>
              <div className={cn('text-xs number font-medium mt-0.5',
                change >= 0 ? 'text-accent-cyan' : 'text-accent-red'
              )}>
                {formatPercent(change)}
              </div>
              <div className="text-text-tertiary text-[10px] mt-0.5">
                Vol: {formatUSD(volume)}
              </div>
              <div className="text-text-tertiary text-[10px]">
                OI: {formatUSD(openInterest)}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
