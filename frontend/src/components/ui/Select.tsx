'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...classes: (string | undefined | null | boolean)[]) {
  return twMerge(clsx(classes));
}

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function Select({ options, value, onChange, placeholder = 'Select...', className }: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-bg-card border border-bg-border rounded-md text-xs text-text-primary hover:border-accent-cyan/50 transition-colors min-w-[100px]"
      >
        <span className="flex-1 text-left">{selected?.label ?? placeholder}</span>
        <ChevronDown className={cn('w-3 h-3 text-text-muted transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 right-0 z-50 min-w-full bg-bg-card border border-bg-border rounded-md shadow-lg overflow-hidden">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => { onChange(option.value); setOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-left hover:bg-bg-hover transition-colors"
            >
              <Check className={cn('w-3 h-3 shrink-0', option.value === value ? 'text-accent-cyan' : 'opacity-0')} />
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
