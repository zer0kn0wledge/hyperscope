'use client';

import { QueryProvider } from '@/providers/QueryProvider';
import { Sidebar } from '@/components/layout/Sidebar';

export function LayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <div className="flex h-screen bg-bg-primary overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </QueryProvider>
  );
}
