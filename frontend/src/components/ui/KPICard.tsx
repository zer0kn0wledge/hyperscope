'use client';

import { type ReactNode } from 'react';
import { fmt } from '@/lib/format';

interface Props {
  label: string;
  value: string | number | null | undefined;
  sub?: string;
  highlight?: boolean;
  icon?: ReactNode;
}

export function KPICard({ label, value, sub, highlight = false, icon }: Props) {
  const displayValue =
    value == null || value === '' ? '\u2014' : typeof value === 'number' ? fmt.smart(value) : value;

  return (
    <div className="card card-hover">
      <div className="flex items-start justify-between mb-1">
        <span className="text-xs font-mono text-white/40 uppercase tracking-wider">
          {label}
        </span>
        {icon && <span className="text-white/30">{icon}</span>}
      </div>
      <div
        className={`text-xl font-semibold leading-none mt-1 ${
          highlight ? 'text-neon-green neon-glow' : 'text-white/90'
        }`}
      >
        {displayValue}
      </div>
      {sub && (
        <div className="text-xs font-mono text-white/30 mt-1.5">{sub}</div>
      )}
    </div>
  );
}
