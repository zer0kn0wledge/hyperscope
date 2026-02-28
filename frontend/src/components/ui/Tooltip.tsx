'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Info } from 'lucide-react';

function cn(...classes: (string | undefined | null | boolean)[]) {
  return twMerge(clsx(classes));
}

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ content, children, placement = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          className={cn(
            'absolute z-50 px-2 py-1 text-xs text-text-primary bg-bg-card border border-bg-border rounded shadow-lg whitespace-nowrap pointer-events-none',
            placement === 'top' && 'bottom-full mb-1 left-1/2 -translate-x-1/2',
            placement === 'bottom' && 'top-full mt-1 left-1/2 -translate-x-1/2',
            placement === 'left' && 'right-full mr-1 top-1/2 -translate-y-1/2',
            placement === 'right' && 'left-full ml-1 top-1/2 -translate-y-1/2'
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}

export function InfoIcon({ className }: { className?: string }) {
  return <Info className={cn('w-3 h-3 text-text-muted', className)} />;
}
