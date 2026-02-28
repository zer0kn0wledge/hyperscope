// ===========================================================================
// Number & currency formatters for the HyperScope UI
// ===========================================================================

/**
 * Format a USD value, auto-selecting compact or full notation.
 * Null / undefined / NaN → '\u2014'
 */
function usd(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '\u2014';
  const abs = Math.abs(value);
  if (abs >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

/**
 * Compact number (no $ prefix).
 */
function compact(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '\u2014';
  const abs = Math.abs(value);
  if (abs >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (abs >= 1e9)  return `${(value / 1e9).toFixed(2)}B`;
  if (abs >= 1e6)  return `${(value / 1e6).toFixed(2)}M`;
  if (abs >= 1e3)  return `${(value / 1e3).toFixed(2)}K`;
  return value.toFixed(2);
}

/**
 * Price: high-precision for small values.
 */
function price(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '\u2014';
  if (value >= 1000) return `$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  if (value >= 1)    return `$${value.toFixed(4)}`;
  if (value >= 0.01) return `$${value.toFixed(6)}`;
  return `$${value.toFixed(8)}`;
}

/**
 * Generic number with optional decimal places.
 */
function num(value: number | null | undefined, decimals = 2): string {
  if (value == null || isNaN(value)) return '\u2014';
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

/**
 * Smart formatter — picks the best display format.
 */
function smart(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '\u2014';
  const abs = Math.abs(value);
  // Looks like a price
  if (abs >= 0.01 && abs < 1e7) return price(value);
  return compact(value);
}

/**
 * Returns a colour string for a heat-map cell based on pct change.
 */
export function getHeatmapColor(pct: number): string {
  if (pct >= 5)   return 'rgba(0, 255, 136, 0.7)';
  if (pct >= 2)   return 'rgba(0, 255, 136, 0.45)';
  if (pct >= 0.5) return 'rgba(0, 255, 136, 0.22)';
  if (pct > 0)    return 'rgba(0, 255, 136, 0.10)';
  if (pct === 0)  return 'rgba(255, 255, 255, 0.05)';
  if (pct >= -0.5) return 'rgba(255, 77, 77, 0.10)';
  if (pct >= -2)   return 'rgba(255, 77, 77, 0.22)';
  if (pct >= -5)   return 'rgba(255, 77, 77, 0.45)';
  return 'rgba(255, 77, 77, 0.7)';
}

export const fmt = { usd, compact, price, num, smart };
