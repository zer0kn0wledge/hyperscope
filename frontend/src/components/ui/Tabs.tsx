'use client';

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...classes: (string | undefined | null | boolean)[]) {
  return twMerge(clsx(classes));
}

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function Tabs({ tabs, activeTab, onTabChange, size = 'md', className }: TabsProps) {
  return (
    <div className={cn('flex items-center bg-bg-card border border-bg-border rounded-md p-0.5 gap-0.5', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'rounded transition-colors font-medium',
            size === 'sm' ? 'px-2 py-1 text-2xs' : 'px-3 py-1.5 text-xs',
            activeTab === tab.id
              ? 'bg-bg-hover text-text-primary'
              : 'text-text-muted hover:text-text-secondary'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// Alias for pill-style tabs (same component, exported under both names)
export const PillTabs = Tabs;
