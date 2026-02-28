/**
 * Formatting utilities for HyperScope analytics dashboard.
 */

const NULL_DISPLAY = '—';

function safeNum(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

export const fmt = {
  /**
   * Format a USD value with appropriate suffix (B, M, K).
   */
  usd(v: unknown, decimals = 2): string {
    const n = safeNum(v);
    if (n === null) return NULL_DISPLAY;
    const abs = Math.abs(n);
    const sign = n < 0 ? '-' : '';
    if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(decimals)}B`;
    if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(decimals)}M`;
    if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(decimals)}K`;
    return `${sign}$${abs.toFixed(decimals)}`;
  },

  /**
   * Format a price with adaptive decimal places.
   */
  price(v: unknown): string {
    const n = safeNum(v);
    if (n === null) return NULL_DISPLAY;
    if (n >= 1000) return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (n >= 1) return n.toFixed(4);
    if (n >= 0.01) return n.toFixed(6);
    return n.toFixed(8);
  },

  /**
   * Format a generic number.
   */
  num(v: unknown, decimals = 2): string {
    const n = safeNum(v);
    if (n === null) return NULL_DISPLAY;
    return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  },

  /**
   * Format a funding rate as a percentage.
   */
  funding(v: unknown): string {
    const n = safeNum(v);
    if (n === null) return NULL_DISPLAY;
    const pct = n * 100;
    return `${pct >= 0 ? '+' : ''}${pct.toFixed(4)}%`;
  },

  /**
   * Format a percentage change.
   */
  pct(v: unknown, decimals = 2): string {
    const n = safeNum(v);
    if (n === null) return NULL_DISPLAY;
    return `${n >= 0 ? '+' : ''}${n.toFixed(decimals)}%`;
  },

  /**
   * Shorten an address for display.
   */
  address(addr: string): string {
    if (!addr) return NULL_DISPLAY;
    if (addr.length <= 12) return addr;
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
  },

  /**
   * Format a unix timestamp (ms or s) to a readable string.
   */
  timestamp(v: unknown): string {
    const n = safeNum(v);
    if (n === null) return NULL_DISPLAY;
    const ms = n > 1e12 ? n : n * 1000;
    return new Date(ms).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
  },
};
