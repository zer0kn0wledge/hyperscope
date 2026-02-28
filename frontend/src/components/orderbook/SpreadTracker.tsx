'use client';

import { AreaChartComponent } from '@/components/charts/AreaChart';
import { PillTabs } from '@/components/ui/Tabs';
import { useSpreadHistory } from '@/hooks/useAPI';
import { useState } from 'react';
import { CHART_COLORS } from '@/lib/constants';

interface SpreadTrackerProps {
  pair: string;
}

type AnyRecord = Record<string, unknown>;

export function SpreadTracker({ pair }: SpreadTrackerProps) {
  const [window, setWindow] = useState('1h');
  const { data: rawData, isLoading } = useSpreadHistory(pair, window);

  // Backend returns snake_case: spread_bps, spread_usd, timestamp
  const chartData = ((rawData ?? []) as AnyRecord[]).map((d) => ({
    time: Number(d.timestamp ?? d.time ?? 0),
    spreadBps: Number(d.spread_bps ?? d.spreadBps ?? 0),
    spread: Number(d.spread_usd ?? d.spread ?? 0),
  }));

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-text-primary font-semibold text-sm">Bid-Ask Spread</h3>
          <p className="text-text-tertiary text-xs">Historical spread in USD and bps</p>
        </div>
        <PillTabs
          tabs={[
            { id: '1h', label: '1h' },
            { id: '4h', label: '4h' },
            { id: '24h', label: '24h' },
          ]}
          activeTab={window}
          onTabChange={setWindow}
        />
      </div>
      <AreaChartComponent
        data={chartData}
        series={[{ key: 'spreadBps', name: 'Spread (bps)', color: CHART_COLORS.yellow }]}
        isLoading={isLoading}
        height={180}
        valueFormatter={(v) => `${v.toFixed(2)} bps`}
      />
    </div>
  );
}
