'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useWSStatus } from '@/hooks/useWebSocket';

function cn(...classes: (string | undefined | null | boolean)[]) {
  return twMerge(clsx(classes));
}

const PAGE_TITLES: Record<string, string> = {
  '/': 'Market Overview',
  '/markets': 'Market Analytics',
  '/orderbook': 'Orderbook Depth',
  '/traders': 'Trader Analytics',
  '/protocol': 'Protocol Health',
  '/compare/dex': 'DEX Comparison',
  '/compare/cex': 'CEX Comparison',
  '/settings': 'Settings',
};

function getTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith('/markets/')) return `${pathname.split('/')[2]} Analytics`;
  if (pathname.startsWith('/orderbook/')) return `${pathname.split('/')[2]}-PERP Orderbook`;
  if (pathname.startsWith('/traders/')) return 'Trader Profile';
  return 'HyperScope';
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const wsStatus = useWSStatus();
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    if (q.startsWith('0x') && q.length === 42) {
      router.push(`/traders/${q}`);
    } else {
      router.push(`/markets/${q.toUpperCase()}`);
    }
    setQuery('');
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries();
  };

  return (
    <header className="h-12 flex items-center justify-between px-4 border-b border-bg-border bg-bg-secondary shrink-0">
      {/* Page title */}
      <h2 className="text-sm font-semibold text-text-primary">{getTitle(pathname)}</h2>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
          <input
            type="text"
            placeholder="Asset or 0x address"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-48 pl-7 pr-3 py-1.5 bg-bg-card border border-bg-border rounded-md text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan transition-colors"
          />
        </form>

        {/* Refresh */}
        <button
          onClick={handleRefresh}
          className="p-1.5 rounded-md hover:bg-bg-hover transition-colors"
          title="Refresh all data"
        >
          <RefreshCw className="w-3.5 h-3.5 text-text-secondary" />
        </button>

        {/* WS status */}
        <div
          className={cn(
            'flex items-center gap-1.5 text-2xs font-medium',
            wsStatus === 'connected' ? 'text-accent-green' : 'text-accent-red'
          )}
        >
          {wsStatus === 'connected' ? (
            <Wifi className="w-3.5 h-3.5" />
          ) : (
            <WifiOff className="w-3.5 h-3.5" />
          )}
          {wsStatus === 'connected' ? 'Live' : 'Offline'}
        </div>
      </div>
    </header>
  );
}
