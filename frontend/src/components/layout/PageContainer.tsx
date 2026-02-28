import { type ReactNode } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...classes: (string | undefined | null | boolean)[]) {
  return twMerge(clsx(classes));
}

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn('p-4 space-y-4', className)}>{children}</div>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle?: ReactNode;
  className?: string;
}

export function SectionHeader({ title, subtitle, className }: SectionHeaderProps) {
  return (
    <div className={cn('space-y-0.5', className)}>
      <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      {subtitle && (
        <p className="text-xs text-text-secondary flex items-center gap-1">{subtitle}</p>
      )}
    </div>
  );
}
