// ============================================================
// Formatting Utilities
// ============================================================

/**
 * Format a number as USD with compact notation.
 */
export function formatUSD(value: number, decimals = 2): string {
  if (!isFinite(value)) return '$-';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(decimals)}T`;
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(decimals)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(decimals)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(decimals)}K`;
  return `${sign}$${abs.toFixed(2)}`;
}

/**
 * Format a number with compact notation (no $ sign).
 */
export function formatNumber(value: number, decimals = 2): string {
  if (!isFinite(value)) return '-';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(decimals)}T`;
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(decimals)}B`;
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(decimals)}M`;
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(decimals)}K`;
  return `${sign}${abs.toFixed(decimals)}`;
}

/**
 * Format as percentage with sign.
 */
export function formatPercent(value: number, decimals = 2): string {
  if (!isFinite(value)) return '-%';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format a funding rate.
 */
export function formatFunding(rate: number, annualize = false): string {
  if (!isFinite(rate)) return '-%';
  const display = annualize ? rate * 3 * 365 * 100 : rate * 100;
  const sign = display > 0 ? '+' : '';
  return `${sign}${display.toFixed(4)}%`;
}

/**
 * Get CSS class for a funding rate value.
 */
export function fundingClass(rate: number): string {
  if (rate > 0) return 'text-accent-orange';
  if (rate < 0) return 'text-accent-cyan';
  return 'text-text-secondary';
}

/**
 * Format a wallet address as truncated form.
 */
export function formatAddress(address: string, chars = 4): string {
  if (!address || address.length < 10) return address ?? '-';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Format a date/timestamp.
 */
export function formatDate(
  timestamp: number | string,
  options?: { relative?: boolean; short?: boolean }
): string {
  const date =
    typeof timestamp === 'number'
      ? new Date(timestamp > 1e12 ? timestamp : timestamp * 1000)
      : new Date(timestamp);

  if (isNaN(date.getTime())) return '-';

  if (options?.relative) {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  if (options?.short) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Format price with appropriate decimal places.
 */
export function formatPrice(price: number): string {
  if (!isFinite(price)) return '-';
  if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 10) return price.toFixed(4);
  if (price >= 1) return price.toFixed(5);
  return price.toFixed(6);
}

/**
 * Format PnL as USD with sign and color class info.
 */
export function formatPnL(value: number): { text: string; colorClass: string } {
  const text = (value >= 0 ? '+' : '') + formatUSD(value);
  const colorClass = value > 0 ? 'price-positive' : value < 0 ? 'price-negative' : 'price-neutral';
  return { text, colorClass };
}

/**
 * Clamp a value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Format large number with commas.
 */
export function formatWithCommas(value: number, decimals = 2): string {
  if (!isFinite(value)) return '-';
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Get color class for percent change.
 */
export function pctChangeClass(value: number): string {
  if (value > 0) return 'text-accent-green';
  if (value < 0) return 'text-accent-red';
  return 'text-text-secondary';
}

/**
 * Format a token amount.
 */
export function formatTokenAmount(value: number, symbol?: string, decimals = 2): string {
  const formatted = formatNumber(value, decimals);
  return symbol ? `${formatted} ${symbol}` : formatted;
}
