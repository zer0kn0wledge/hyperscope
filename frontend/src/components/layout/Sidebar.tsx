'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

const nav = [
  { href: '/', label: 'Overview' },
  { href: '/markets/BTC', label: 'Markets' },
  { href: '/compare', label: 'Compare' },
  { href: '/orderbook/BTC-PERP', label: 'Orderbook' },
  { href: '/traders', label: 'Traders' },
  { href: '/protocol', label: 'Protocol' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-52 shrink-0 flex flex-col bg-[#0d0d0d] border-r border-white/5 h-screen">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <Image
            src="/favicon.svg"
            alt="Hyperscope"
            width={28}
            height={28}
            className="shrink-0"
          />
          <div>
            <div className="text-white font-semibold text-sm leading-none">hyperscope</div>
            <div className="text-neon-green text-xs font-mono leading-tight mt-0.5 opacity-70">
              hl analytics
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {nav.map(({ href, label }) => {
          const active =
            href === '/'
              ? pathname === '/'
              : pathname.startsWith(href.split('/')[1] ? `/${href.split('/')[1]}` : href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center px-3 py-2 rounded text-sm font-mono transition-colors ${
                active
                  ? 'bg-neon-green/8 text-neon-green'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/3'
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/5">
        <a
          href="https://x.com/0xhyperscope"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-white/30 hover:text-white/60 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          <span className="text-xs">@0xhyperscope</span>
        </a>
      </div>
    </aside>
  );
}
