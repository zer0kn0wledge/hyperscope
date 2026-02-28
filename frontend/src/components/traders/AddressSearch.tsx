'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...classes: (string | undefined | null | boolean)[]) {
  return twMerge(clsx(classes));
}

interface AddressSearchProps {
  placeholder?: string;
  className?: string;
  onSearch?: (address: string) => void;
}

export function AddressSearch({ placeholder = 'Search wallet address (0x...)...', className, onSearch }: AddressSearchProps) {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const address = value.trim();
    if (!address) return;
    if (onSearch) {
      onSearch(address);
    } else {
      router.push(`/traders/${address}`);
    }
    setValue('');
  };

  return (
    <form onSubmit={handleSubmit} className={cn('relative', className)}>
      <div className={cn(
        'flex items-center gap-3 rounded-xl border transition-all duration-200',
        'bg-bg-secondary px-4 py-3',
        focused
          ? 'border-accent-cyan/50 shadow-[0_0_12px_rgba(0,209,255,0.15)]'
          : 'border-border-default hover:border-border-hover'
      )}>
        <Search size={16} className="text-text-tertiary shrink-0" />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none font-mono"
        />
        {value && (
          <button
            type="submit"
            className="text-xs text-accent-cyan hover:text-accent-cyan-dim transition-colors px-2 py-1 rounded border border-accent-cyan/30 hover:bg-accent-cyan/10"
          >
            Look up
          </button>
        )}
      </div>
    </form>
  );
}
