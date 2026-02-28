'use client';

import { AreaChartComponent } from '@/components/charts/AreaChart';
import { useSpreadHistory } from '@/hooks/useHyperscope';

interface Props {
  pair: string;
}

export function SpreadTracker({ pair }: Props) {
  const { data = [], isLoading } = useSpreadHistory(pair);

  if (isLoading)
    return (
      <div className="card h-40 flex items-center justify-center">
        <span className="text-neon-green/40 font-mono text-xs">loading spread...</span>
      </div>
    );

  const chartData = data.map(
    (d: { ts: number; spread_pct: number }) => ({
      name: new Date(d.ts).toLocaleTimeString(),
      value: d.spread_pct,
    }),
  );

  return (
    <div className="card">
      <h3 className="text-xs font-mono text-white/40 mb-2">Spread History</h3>
      <AreaChartComponent data={chartData} />
    </div>
  );
}
