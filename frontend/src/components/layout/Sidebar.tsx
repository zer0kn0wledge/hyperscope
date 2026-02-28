'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BarChart2,
  BookOpen,
  Users,
  Shield,
  GitCompare,
  Settings,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...classes: (string | undefined | null | boolean)[]) {
  return twMerge(clsx(classes));
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  children?: { href: string; label: string }[];
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/markets', label: 'Markets', icon: BarChart2 },
  { href: '/orderbook', label: 'Orderbook', icon: BookOpen },
  { href: '/traders', label: 'Traders', icon: Users },
  { href: '/protocol', label: 'Protocol', icon: Shield },
  {
    href: '/compare/dex',
    label: 'Compare',
    icon: GitCompare,
    children: [
      { href: '/compare/dex', label: 'DEX' },
      { href: '/compare/cex', label: 'CEX' },
    ],
  },
  { href: '/settings', label: 'Settings', icon: Settings },
];

function NavLink({ item, depth = 0 }: { item: NavItem; depth?: number }) {
  const pathname = usePathname();
  const isActive =
    item.href === '/'
      ? pathname === '/'
      : pathname.startsWith(item.href);
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div>
      <Link
        href={item.href}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all group',
          depth === 0 ? 'font-medium' : 'font-normal text-xs pl-9',
          isActive
            ? 'bg-bg-hover text-accent-cyan'
            : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
        )}
      >
        {depth === 0 && (
          <item.icon
            className={cn(
              'w-4 h-4 shrink-0 transition-colors',
              isActive ? 'text-accent-cyan' : 'text-text-muted group-hover:text-text-secondary'
            )}
          />
        )}
        <span className="flex-1">{item.label}</span>
        {hasChildren && <ChevronRight className="w-3 h-3 text-text-muted" />}
      </Link>
      {hasChildren && isActive && (
        <div className="mt-0.5 space-y-0.5">
          {item.children!.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              className={cn(
                'flex items-center gap-2 py-1.5 pl-10 pr-3 rounded-md text-xs transition-colors',
                pathname === child.href
                  ? 'text-accent-cyan bg-bg-hover'
                  : 'text-text-muted hover:text-text-secondary hover:bg-bg-hover'
              )}
            >
              <span className="w-1 h-1 rounded-full bg-current" />
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="w-52 shrink-0 flex flex-col bg-bg-secondary border-r border-bg-border overflow-hidden">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-bg-border">
        <div className="w-7 h-7 rounded-lg bg-accent-cyan/10 flex items-center justify-center">
          <Zap className="w-4 h-4 text-accent-cyan" />
        </div>
        <div>
          <p className="font-bold text-text-primary text-sm leading-none">HyperScope</p>
          <p className="text-2xs text-text-muted mt-0.5">Hyperliquid Analytics</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-bg-border">
        <p className="text-2xs text-text-muted">Built by Zero Knowledge</p>
      </div>
    </aside>
  );
}
