import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...classes: (string | undefined | null | boolean)[]) {
  return twMerge(clsx(classes));
}

type BadgeVariant = 'buy' | 'sell' | 'neutral' | 'info' | 'warning';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  buy: 'bg-accent-green/10 text-accent-green border-accent-green/20',
  sell: 'bg-accent-red/10 text-accent-red border-accent-red/20',
  neutral: 'bg-bg-hover text-text-secondary border-bg-border',
  info: 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20',
  warning: 'bg-accent-yellow/10 text-accent-yellow border-accent-yellow/20',
};

export function Badge({ variant = 'neutral', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded text-2xs font-medium border',
        VARIANT_CLASSES[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
