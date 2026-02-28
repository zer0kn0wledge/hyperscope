import type { Metadata } from 'next';
import './globals.css';
import { LayoutClient } from './layout-client';

export const metadata: Metadata = {
  title: 'HyperScope — Hyperliquid Analytics',
  description:
    'Real-time analytics dashboard for Hyperliquid: market overview, orderbook depth, trader analytics, protocol health, and cross-exchange comparisons.',
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
      <body>
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  );
}
