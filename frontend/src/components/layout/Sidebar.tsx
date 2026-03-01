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

function CatLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="cat-logo"
      aria-label="HyperScope cat logo"
    >
      <rect x="5" y="10" width="22" height="18" rx="5" stroke="#00ff88" strokeWidth="1.5" />
      <polyline points="7,11 5,3 12,8" stroke="#00ff88" strokeWidth="1.5" strokeLinejoin="round" />
      <polyline points="25,11 27,3 20,8" stroke="#00ff88" strokeWidth="1.5" strokeLinejoin="round" />
      <polyline points="8,10 6.5,5 11,8" stroke="#00ff88" strokeWidth="0.75" strokeLinejoin="round" strokeOpacity="0.5" />
      <polyline points="24,10 25.5,5 21,8" stroke="#00ff88" strokeWidth="0.75" strokeLinejoin="round" strokeOpacity="0.5" />
      <path d="M11 19 L13 17 L15 19 L13 21 Z" stroke="#00ff88" strokeWidth="1.25" strokeLinejoin="round" />
      <path d="M17 19 L19 17 L21 19 L19 21 Z" stroke="#00ff88" strokeWidth="1.25" strokeLinejoin="round" />
      <path d="M15 23 L16 22 L17 23 L16 24 Z" fill="#00ff88" opacity="0.8" />
      <line x1="5" y1="23" x2="14" y2="23.5" stroke="#00ff88" strokeWidth="0.75" strokeOpacity="0.5" />
      <line x1="18" y1="23.5" x2="27" y2="23" stroke="#00ff88" strokeWidth="0.75" strokeOpacity="0.5" />
      <circle cx="16" cy="19" r="7" fill="#00ff88" opacity="0.03" />
    </svg>
  );
}

function XIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.243 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  function isActive(item: (typeof NAV_ITEMS)[0]) {
    if (item.matchPrefix) return pathname.startsWith(item.matchPrefix);
    return pathname === item.href;
  }

  return (
    <aside
      style={{
        width: 220, minWidth: 220, maxWidth: 220, height: '100vh', position: 'sticky', top: 0,
        display: 'flex', flexDirection: 'column', background: 'rgba(4, 4, 4, 0.95)',
        borderRight: '1px solid rgba(0, 255, 136, 0.07)', zIndex: 50,
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      <div style={{ padding: '1.25rem 1.25rem 1rem', borderBottom: '1px solid rgba(0, 255, 136, 0.06)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -20, left: -20, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,255,136,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative' }}>
          <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(0, 255, 136, 0.06)', border: '1px solid rgba(0, 255, 136, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 12px rgba(0,255,136,0.08)' }}>
            <CatLogo size={24} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="brand-title" style={{ fontSize: '1rem', fontFamily: 'Inter, sans-serif', lineHeight: 1.15, letterSpacing: '-0.03em' }}>HyperScope</div>
            <div style={{ fontSize: '0.5625rem', color: 'rgba(0,255,136,0.45)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '2px' }}>Hyperliquid Analytics</div>
          </div>
        </Link>
      </div>

      <nav style={{ padding: '0.75rem', flex: 1, overflowY: 'auto' }}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.75rem', borderRadius: '8px', marginBottom: '2px', textDecoration: 'none', background: active ? 'rgba(0, 255, 136, 0.08)' : 'transparent', border: active ? '1px solid rgba(0, 255, 136, 0.15)' : '1px solid transparent', color: active ? '#00ff88' : 'rgba(255,255,255,0.45)', transition: 'all 0.15s ease', position: 'relative' }}
              onMouseEnter={(e) => { if (!active) { const el = e.currentTarget as HTMLAnchorElement; el.style.background = 'rgba(255, 255, 255, 0.04)'; el.style.color = 'rgba(255,255,255,0.7)'; } }}
              onMouseLeave={(e) => { if (!active) { const el = e.currentTarget as HTMLAnchorElement; el.style.background = 'transparent'; el.style.color = 'rgba(255,255,255,0.45)'; } }}
            >
              <Icon size={15} strokeWidth={active ? 2.5 : 1.75} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '0.8125rem', fontWeight: active ? 600 : 400, fontFamily: 'Inter, sans-serif', letterSpacing: '-0.01em' }}>{item.label}</span>
              {active && <div style={{ position: 'absolute', right: 8, width: 4, height: 4, borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 6px rgba(0,255,136,0.8)' }} />}
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: '0.75rem 1rem 1rem', borderTop: '1px solid rgba(0, 255, 136, 0.06)', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="live-dot" />
          <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.06em' }}>LIVE DATA</span>
        </div>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', width: '100%' }} />
        <a href="https://x.com/zerokn0wledge_" target="_blank" rel="noopener noreferrer" className="social-link" title="Follow @zerokn0wledge_ on X">
          <XIcon size={11} />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6875rem', letterSpacing: '0.04em' }}>@zerokn0wledge_</span>
        </a>
      </div>
    </aside>
  );
}
