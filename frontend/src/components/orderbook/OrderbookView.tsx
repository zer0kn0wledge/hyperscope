'use client';

import { useEffect, useRef, useState } from 'react';
import { fmt } from '@/lib/format';

interface Props {
  bids: [number, number][];
  asks: [number, number][];
}

function getCumulative(levels: [number, number][]) {
  let cum = 0;
  return levels.map(([price, size]) => {
    cum += size;
    return { price, size, cum };
  });
}

export function OrderbookView({ bids, asks }: Props) {
  const bidsWithCum = getCumulative(bids);
  const asksWithCum = getCumulative(asks);
  const maxBidCum = bidsWithCum.at(-1)?.cum ?? 1;
  const maxAskCum = asksWithCum.at(-1)?.cum ?? 1;

  const Row = ({
    price,
    size,
    cum,
    maxCum,
    side,
  }: {
    price: number;
    size: number;
    cum: number;
    maxCum: number;
    side: 'bid' | 'ask';
  }) => {
    const pct = (cum / maxCum) * 100;
    const bg = side === 'bid' ? 'rgba(0,255,136,0.06)' : 'rgba(255,77,77,0.06)';
    const text = side === 'bid' ? 'text-neon-green' : 'text-red-400';

    return (
      <div
        className="relative flex justify-between text-xs font-mono py-0.5 px-3"
        style={{
          background: `linear-gradient(to ${side === 'bid' ? 'right' : 'left'}, ${bg} ${pct}%, transparent ${pct}%)`,
        }}
      >
        <span className={text}>{fmt.price(price)}</span>
        <span className="text-white/60">{fmt.num(size, 4)}</span>
        <span className="text-white/30">{fmt.num(cum, 2)}</span>
      </div>
    );
  };

  return (
    <div className="card">
      <div className="grid grid-cols-3 text-xs font-mono text-white/30 px-3 py-1 border-b border-white/5 mb-1">
        <span>Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Cumulative</span>
      </div>

      {/* Asks (reversed, so lowest ask is closest to mid) */}
      <div className="flex flex-col-reverse">
        {asksWithCum.map((row, i) => (
          <Row key={i} {...row} maxCum={maxAskCum} side="ask" />
        ))}
      </div>

      {/* Spread row */}
      <div className="py-1 px-3 text-center text-xs font-mono text-white/20 border-y border-white/5">
        spread
      </div>

      {/* Bids */}
      <div className="flex flex-col">
        {bidsWithCum.map((row, i) => (
          <Row key={i} {...row} maxCum={maxBidCum} side="bid" />
        ))}
      </div>
    </div>
  );
}
