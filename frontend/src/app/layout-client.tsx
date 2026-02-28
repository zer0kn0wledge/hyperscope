'use client';

import { QueryProvider } from '@/providers/QueryProvider';
import { Sidebar } from '@/components/layout/Sidebar';
import { MouseGlow } from '@/components/layout/MouseGlow';

export function LayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <div className="flex min-h-screen bg-black relative">
        {/* Mouse follow glow — behind everything */}
        <MouseGlow />

        {/* Sidebar */}
        <Sidebar />

        {/* Main content area */}
        <main
          className="flex-1 min-w-0 relative z-10"
          style={{ background: 'transparent' }}
        >
          {children}
        </main>
      </div>
    </QueryProvider>
  );
}
