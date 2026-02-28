'use client';

import { ReactNode } from 'react';

interface TabItem {
  key: string;
  label: string;
  icon?: ReactNode;
  count?: number;
}

interface TabsProps {
  items: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function Tabs({ items, activeKey, onChange, className = '', size = 'md' }: TabsProps) {
  const textSize = size === 'sm' ? '0.75rem' : '0.8125rem';
  const padding = size === 'sm' ? '0.375rem 0.75rem' : '0.5rem 1rem';

  return (
    <div className={`flex gap-0 ${className}`} role="tablist" style={{ borderBottom: '1px solid rgba(0,255,136,0.08)' }}>
      {items.map((item) => {
        const active = item.key === activeKey;
        return (
          <button
            key={item.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.key)}
            style={{ padding, fontSize: textSize, fontFamily: 'Inter, sans-serif', fontWeight: active ? 500 : 400, color: active ? '#00ff88' : 'rgba(255,255,255,0.4)', background: 'transparent', border: 'none', borderBottom: active ? '2px solid #00ff88' : '2px solid transparent', marginBottom: '-1px', cursor: 'pointer', transition: 'color 0.15s ease, border-color 0.15s ease', display: 'flex', alignItems: 'center', gap: '0.375rem', whiteSpace: 'nowrap', outline: 'none', boxShadow: active ? '0 2px 8px rgba(0,255,136,0.2)' : 'none' }}
            onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.65)'; }}
            onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.4)'; }}
          >
            {item.icon && <span style={{ opacity: active ? 1 : 0.6 }}>{item.icon}</span>}
            {item.label}
            {item.count !== undefined && (
              <span style={{ background: active ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.08)', color: active ? '#00ff88' : 'rgba(255,255,255,0.4)', fontSize: '0.625rem', fontFamily: 'JetBrains Mono, monospace', padding: '0.1rem 0.35rem', borderRadius: '4px', minWidth: '18px', textAlign: 'center' }}>
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
