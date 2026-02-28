'use client';

import { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { OrderbookSnapshot, OrderbookLevel } from '@/lib/types';
import { formatPrice, formatUSD } from '@/lib/format';
import { Skeleton } from '@/components/ui/Skeleton';

function cn(...classes: (string | undefined | null | boolean)[]) {
  return twMerge(clsx(classes));
}

interface OrderbookRowProps {
  level: OrderbookLevel;
  side: 'bid' | 'ask';
  maxSize: number;
  highlight: boolean;
}

function OrderbookRow({ level, side, maxSize, highlight }: OrderbookRowProps) {
  const barWidth = maxSize > 0 ? (level.size / maxSize) * 100 : 0;
  const isBid = side === 'bid';

  return (
    <tr
      className={cn(
        'relative text-xs number transition-all duration-75',
        highlight && (isBid ? 'animate-flash-green' : 'animate-flash-red')
      )}
    >
      {/* Bar background */}
      <td colSpan={3} className="absolute inset-0 pointer-events-none">
        <div
          className={cn(
            'absolute top-0 h-full opacity-10',
            isBid ? 'right-0 bg-accent-green' : 'left-0 bg-accent-red'
          )}
          style={{ width: `${barWidth}%` }}
        />
      </td>

      {/* Price */}
      <td className={cn(
        'py-0.5 px-3 text-right font-medium',
        isBid ? 'text-accent-green' : 'text-accent-red'
      )}>
        {formatPrice(level.price)}
      </td>

      {/* Size */}
      <td className="py-0.5 px-3 text-right text-text-secondary">
        {level.size.toFixed(4)}
      </td>

      {/* Total */}
      <td className="py-0.5 px-3 text-right text-text-tertiary">
        {formatUSD(level.total)}
      </td>
    </tr>
  );
}

interface OrderbookViewProps {
  data: OrderbookSnapshot | null;
  isLoading?: boolean;
  levels?: number;
  onLevelsChange?: (v: string) => void;
  levelOptions?: { value: string; label: string }[];
}

export function OrderbookView({ data, isLoading, levels = 20 }: OrderbookViewProps) {
  const [prevData, setPrevData] = useState<OrderbookSnapshot | null>(null);
  const [updatedPrices, setUpdatedPrices] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!data || !prevData) {
      setPrevData(data);
      return;
    }

    const changed = new Set<number>();
    const prevBids = new Map(prevData.bids.map((b) => [b.price, b.size]));
    const prevAsks = new Map(prevData.asks.map((a) => [a.price, a.size]));

    data.bids.forEach((b) => {
      if (prevBids.get(b.price) !== b.size) changed.add(b.price);
    });
    data.asks.forEach((a) => {
      if (prevAsks.get(a.price) !== a.size) changed.add(a.price);
    });

    if (changed.size > 0) {
      setUpdatedPrices(changed);
      setTimeout(() => setUpdatedPrices(new Set()), 300);
    }

    setPrevData(data);
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-1">
        {Array.from({ length: levels }).map((_, i) => (
          <div key={i} className="flex justify-between px-3 py-0.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-40 text-text-muted text-sm">
        No orderbook data
      </div>
    );
  }

  const bids = data.bids.slice(0, levels);
  const asks = data.asks.slice(0, levels).reverse();
  const maxBidSize = Math.max(...bids.map((b) => b.size), 1);
  const maxAskSize = Math.max(...asks.map((a) => a.size), 1);

  return (
    <div className="font-mono text-xs">
      {/* Header */}
      <div className="grid grid-cols-3 text-text-muted text-[10px] uppercase tracking-wider px-3 py-2 border-b border-border-subtle">
        <span className="text-right">Price (USD)</span>
        <span className="text-right">Size</span>
        <span className="text-right">Total</span>
      </div>

      {/* Asks (top, reversed) */}
      <table className="w-full">
        <tbody>
          {asks.map((ask) => (
            <OrderbookRow
              key={ask.price}
              level={ask}
              side="ask"
              maxSize={maxAskSize}
              highlight={updatedPrices.has(ask.price)}
            />
          ))}
        </tbody>
      </table>

      {/* Mid price spread */}
      <div className="flex items-center justify-between px-3 py-2 bg-bg-tertiary border-y border-border-subtle">
        <span className="number text-sm font-bold text-text-primary">
          ${formatPrice(data.midPrice)}
        </span>
        <span className="text-text-tertiary text-xs">
          Spread: ${formatPrice(data.spread)} ({data.spreadBps.toFixed(1)} bps)
        </span>
      </div>

      {/* Bids (bottom) */}
      <table className="w-full">
        <tbody>
          {bids.map((bid) => (
            <OrderbookRow
              key={bid.price}
              level={bid}
              side="bid"
              maxSize={maxBidSize}
              highlight={updatedPrices.has(bid.price)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
