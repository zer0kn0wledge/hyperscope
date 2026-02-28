'use client';

import { PageContainer, SectionHeader } from '@/components/ui/PageLayout';
import { useCEXCompare } from '@/hooks/useHyperscope';
import { KPICard } from '@/components/ui/KPICard';
import { FundingChart } from '@/components/charts/FundingChart';
import { VolumeChart } from '@/components/charts/VolumeChart';
import { PieChart } from '@/components/charts/PieChart';
import { fmt } from '@/lib/format';

export default function CEXComparePage() {
  const { data, isLoading, error } = useCEXCompare();

  if (isLoading)
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <div className="text-neon-green animate-pulse font-mono text-sm">
            fetching CEX data...
          </div>
        </div>
      </PageContainer>
    );

  if (error || !data)
    return (
      <PageContainer>
        <div className="text-red-400 font-mono text-sm">
          error loading CEX compare data
        </div>
      </PageContainer>
    );

  const exchanges = data.exchanges ?? {};
  const cgList: Array<{
    name: string;
    open_interest_btc?: number;
    trade_volume_24h_btc?: number;
    number_of_perpetual_pairs?: number;
    perpetual_volume_24h_btc?: number;
  }> = data.coingecko?.exchanges ?? [];
  const fearGreed = data.coinglass?.fear_greed;
  const globalOI = data.coinglass?.global_oi;
  const liquidations = data.coinglass?.liquidations;

  // Build exchange rows from direct API sources
  const rows = [
    { name: 'Binance', ...exchanges.binance },
    { name: 'Bybit', ...exchanges.bybit },
    { name: 'OKX', ...exchanges.okx },
    { name: 'Kraken', ...exchanges.kraken },
    { name: 'KuCoin', ...exchanges.kucoin },
  ].filter((r) => r.oi !== undefined || r.volume_24h !== undefined);

  // Pie data from rows
  const oiPie = rows
    .filter((r) => r.oi)
    .map((r) => ({ name: r.name, value: r.oi as number }));

  const volPie = rows
    .filter((r) => r.volume_24h)
    .map((r) => ({ name: r.name, value: r.volume_24h as number }));

  return (
    <PageContainer>
      <SectionHeader
        title="CEX Compare"
        subtitle="Centralised exchange derivatives — OI, volume, funding"
      />

      {/* Global CoinGlass Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {fearGreed && (
          <KPICard
            label="Fear & Greed"
            value={String(fearGreed.value ?? '—')}
            sub={fearGreed.label}
          />
        )}
        {globalOI && (
          <KPICard
            label="Global OI"
            value={fmt.usd(globalOI.total_oi)}
          />
        )}
        {liquidations && (
          <KPICard
            label="24h Liq (Long)"
            value={fmt.usd(liquidations.long_24h)}
          />
        )}
        {liquidations && (
          <KPICard
            label="24h Liq (Short)"
            value={fmt.usd(liquidations.short_24h)}
          />
        )}
      </div>

      {/* Exchange Table */}
      <div className="card mb-6 overflow-x-auto">
        <table className="w-full text-sm font-mono">
          <thead>
            <tr className="border-b border-white/5">
              {['Exchange', 'Open Interest', '24h Volume', 'Funding Rate', 'Pairs'].map(
                (h) => (
                  <th
                    key={h}
                    className="px-3 py-2 text-left text-white/40 font-normal"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name} className="border-b border-white/5 hover:bg-white/2">
                <td className="px-3 py-2 text-neon-green font-semibold">{row.name}</td>
                <td className="px-3 py-2 text-white/80">{fmt.usd(row.oi)}</td>
                <td className="px-3 py-2 text-white/80">{fmt.usd(row.volume_24h)}</td>
                <td className="px-3 py-2 text-white/60">
                  {row.funding_rate != null
                    ? `${(row.funding_rate * 100).toFixed(4)}%`
                    : '—'}
                </td>
                <td className="px-3 py-2 text-white/60">{row.num_pairs ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CoinGecko exchange list */}
      {cgList.length > 0 && (
        <div className="card mb-6 overflow-x-auto">
          <h3 className="text-sm font-mono text-white/40 mb-3">CoinGecko Derivative Exchanges</h3>
          <table className="w-full text-sm font-mono">
            <thead>
              <tr className="border-b border-white/5">
                {['Exchange', 'OI (BTC)', '24h Vol (BTC)', 'Perp Pairs', 'Perp Vol (BTC)'].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-3 py-2 text-left text-white/40 font-normal"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {cgList.slice(0, 15).map((ex) => (
                <tr
                  key={ex.name}
                  className="border-b border-white/5 hover:bg-white/2"
                >
                  <td className="px-3 py-2 text-white/80">{ex.name}</td>
                  <td className="px-3 py-2 text-white/60">
                    {ex.open_interest_btc != null
                      ? fmt.compact(ex.open_interest_btc) + ' BTC'
                      : '—'}
                  </td>
                  <td className="px-3 py-2 text-white/60">
                    {ex.trade_volume_24h_btc != null
                      ? fmt.compact(ex.trade_volume_24h_btc) + ' BTC'
                      : '—'}
                  </td>
                  <td className="px-3 py-2 text-white/60">
                    {ex.number_of_perpetual_pairs ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-white/60">
                    {ex.perpetual_volume_24h_btc != null
                      ? fmt.compact(ex.perpetual_volume_24h_btc) + ' BTC'
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        {oiPie.length > 0 && (
          <div className="card">
            <h3 className="text-sm font-mono text-white/40 mb-3">OI Distribution</h3>
            <PieChart data={oiPie} />
          </div>
        )}
        {volPie.length > 0 && (
          <div className="card">
            <h3 className="text-sm font-mono text-white/40 mb-3">Volume Distribution</h3>
            <PieChart data={volPie} />
          </div>
        )}
      </div>
    </PageContainer>
  );
}
