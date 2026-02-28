'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart2,
  TrendingUp,
  BookOpen,
  Users,
  ArrowLeftRight,
  Activity,
  Settings,
  Zap,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Overview', icon: BarChart2 },
  { href: '/markets/BTC', label: 'Markets', icon: TrendingUp, matchPrefix: '/markets' },
  { href: '/orderbook/BTC-PERP', label: 'Orderbook', icon: BookOpen, matchPrefix: '/orderbook' },
  { href: '/traders', label: 'Traders', icon: Users, matchPrefix: '/traders' },
  { href: '/compare/dex', label: 'Compare', icon: ArrowLeftRight, matchPrefix: '/compare' },
  { href: '/protocol', label: 'Protocol', icon: Activity },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  function isActive(item: (typeof NAV_ITEMS)[0]) {
    if (item.matchPrefix) return pathname.startsWith(item.matchPrefix);
    return pathname === item.href;
  }

  return (
    <aside
      style={{
        width: 220,
        minWidth: 220,
        maxWidth: 220,
        height: '100vh',
        position: 'sticky',
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(6, 6, 6, 0.92)',
        borderRight: '1px solid rgba(0, 255, 136, 0.07)',
        zIndex: 50,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '1.5rem 1.25rem 1rem',
          borderBottom: '1px solid rgba(0, 255, 136, 0.06)',
        }}
      >
        <Link
          href="/"
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.625rem' }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '8px',
              background: 'rgba(0, 255, 136, 0.12)',
              border: '1px solid rgba(0, 255, 136, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Zap size={14} color="#00ff88" strokeWidth={2.5} />
          </div>
          <div>
            <div
              style={{
                fontSize: '0.9375rem',
                fontWeight: 700,
                color: '#e8e8e8',
                fontFamily: 'Inter, sans-serif',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}
            >
              HyperScope
            </div>
            <div
              style={{
                fontSize: '0.625rem',
                color: 'rgba(0,255,136,0.6)',
                fontFamily: 'JetBrains Mono, monospace',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Hyperliquid Analytics
            </div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ padding: '0.75rem 0.75rem', flex: 1, overflowY: 'auto' }}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                marginBottom: '2px',
                textDecoration: 'none',
                background: active ? 'rgba(0, 255, 136, 0.08)' : 'transparent',
                border: active ? '1px solid rgba(0, 255, 136, 0.15)' : '1px solid transparent',
                color: active ? '#00ff88' : 'rgba(255,255,255,0.45)',
                transition: 'all 0.15s ease',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.background = 'rgba(255, 255, 255, 0.04)';
                  el.style.color = 'rgba(255,255,255,0.7)';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.background = 'transparent';
                  el.style.color = 'rgba(255,255,255,0.45)';
                }
              }}
            >
              <Icon
                size={15}
                strokeWidth={active ? 2.5 : 1.75}
                style={{ flexShrink: 0 }}
              />
              <span
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: active ? 600 : 400,
                  fontFamily: 'Inter, sans-serif',
                  letterSpacing: '-0.01em',
                }}
              >
                {item.label}
              </span>
              {active && (
                <div
                  style={{
                    position: 'absolute',
                    right: 8,
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: '#00ff88',
                    boxShadow: '0 0 6px rgba(0,255,136,0.8)',
                  }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: '0.75rem 1.25rem',
          borderTop: '1px solid rgba(0, 255, 136, 0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="live-dot" />
          <span
            style={{
              fontSize: '0.6875rem',
              color: 'rgba(255,255,255,0.3)',
              fontFamily: 'JetBrains Mono, monospace',
              letterSpacing: '0.06em',
            }}
          >
            LIVE DATA
          </span>
        </div>
      </div>
    </aside>
  );
}
