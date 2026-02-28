'use client';

import { AreaChartWidget } from '@/components/charts/AreaChart';
import { useSpreadHistory } from '@/hooks/useAPI';

interface Props {
  pair: string;
}

export function SpreadTracker({ pair }: Props) {
  const { data = [], isLoading } = useSpreadHistory(pair);

  if (isLoading)
    return (
      <div className="card h-40 flex items-center justify-center">
        <span className="text-neon/40 font-mono text-xs">loading spread...</span>
      </div>
    );

  const chartData = (data as any[]).map(
    (d: { ts: number; spread_pct: number }) => ({
      name: new Date(d.ts).toLocaleTimeString(),
      value: d.spread_pct,
    }),
  );

  return (
    <div className="card">
      <h3 className="text-xs font-mono text-white/40 mb-2">Spread History</h3>
      <AreaChartWidget data={chartData} dataKeys={['value']} height={120} />
    </div>
  );
}
