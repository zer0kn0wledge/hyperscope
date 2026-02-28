import type { Metadata } from 'next';
import './globals.css';
import { LayoutClient } from './layout-client';

export const metadata: Metadata = {
  title: 'HyperScope — Hyperliquid Analytics',
  description: 'Real-time Hyperliquid analytics dashboard. Track markets, traders, protocol metrics, and compare against other exchanges.',
  keywords: ['hyperliquid', 'analytics', 'defi', 'perps', 'trading', 'dashboard'],
  openGraph: {
    title: 'HyperScope — Hyperliquid Analytics',
    description: 'Real-time Hyperliquid analytics dashboard',
    type: 'website',
  },
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  );
}
