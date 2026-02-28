'use client';

import { QueryProvider } from '@/providers/QueryProvider';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export function LayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <div className="flex h-screen bg-bg-primary overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </QueryProvider>
  );
}
