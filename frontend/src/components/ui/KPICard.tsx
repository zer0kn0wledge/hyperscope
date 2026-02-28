'use client';

import { type ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Skeleton } from './Skeleton';
import { Sparkline } from '@/components/charts/Sparkline';

function cn(...classes: (string | undefined | null | boolean)[]) {
  return twMerge(clsx(classes));
}

interface KPICardProps {
  label: string;
  value: string | ReactNode;
  change?: number;
  changeLabel?: string;
  sparklineData?: number[];
  isLoading?: boolean;
  error?: boolean;
  icon?: ReactNode;
  className?: string;
  accent?: 'cyan' | 'green' | 'red';
}

export function KPICard({
  label,
  value,
  change,
  changeLabel,
  sparklineData,
  isLoading,
  error,
  icon,
  className,
  accent = 'cyan',
}: KPICardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  const sparklineColor =
    change !== undefined
      ? change >= 0
        ? '#00D1FF'
        : '#FF4D6A'
      : accent === 'green'
      ? '#00FF88'
      : '#00D1FF';

  return (
    <div
      className={cn(
        'card card-glow p-5 flex flex-col gap-3',
        'relative overflow-hidden',
        className
      )}
    >
      {/* Subtle top border glow */}
      <div
        className="absolute top-0 left-0 right-0 h-px opacity-50"
        style={{
          background:
            accent === 'green'
              ? 'linear-gradient(90deg, transparent, #00FF88, transparent)'
              : 'linear-gradient(90deg, transparent, #00D1FF, transparent)',
        }}
      />

      {/* Header */}
      <div className="flex items-start justify-between">
        <span className="text-text-secondary text-xs font-medium uppercase tracking-wider">
          {label}
        </span>
        {icon && (
          <span className="text-text-tertiary">{icon}</span>
        )}
      </div>

      {/* Value */}
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-3 w-20" />
        </div>
      ) : error ? (
        <div className="text-accent-red text-sm">Data unavailable</div>
      ) : (
        <div>
          <div className="number text-2xl font-bold text-text-primary leading-none mb-1">
            {value}
          </div>
          {change !== undefined && (
            <div className={cn(
              'flex items-center gap-1 text-xs number font-medium',
              isPositive && 'text-accent-cyan',
              isNegative && 'text-accent-red',
              !isPositive && !isNegative && 'text-text-secondary'
            )}>
              {isPositive ? (
                <TrendingUp size={12} />
              ) : isNegative ? (
                <TrendingDown size={12} />
              ) : (
                <Minus size={12} />
              )}
              {change > 0 ? '+' : ''}{change.toFixed(2)}%
              {changeLabel && (
                <span className="text-text-tertiary ml-0.5">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Sparkline */}
      {sparklineData && sparklineData.length > 0 && !isLoading && !error && (
        <div className="h-12 -mx-1">
          <Sparkline
            data={sparklineData}
            color={sparklineColor}
            height={48}
          />
        </div>
      )}
    </div>
  );
}
