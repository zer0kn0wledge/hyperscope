'use client';

import { useState, type ReactNode } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Skeleton } from './Skeleton';

function cn(...classes: (string | undefined | null | boolean)[]) {
  return twMerge(clsx(classes));
}

export interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  render?: (value: unknown, row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  error?: Error | null;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  skeletonRows?: number;
  className?: string;
  stickyHeader?: boolean;
  rowKey: (row: T) => string;
}

type SortDir = 'asc' | 'desc' | null;

function getNestedValue(obj: unknown, key: string): unknown {
  return (key as string).split('.').reduce<unknown>((acc, k) => {
    if (acc && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[k];
    }
    return undefined;
  }, obj);
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  error,
  onRowClick,
  emptyMessage = 'No data available',
  skeletonRows = 8,
  className,
  stickyHeader = true,
  rowKey,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc'));
      if (sortDir === 'desc') setSortKey(null);
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey || !sortDir) return 0;
    const aVal = getNestedValue(a, sortKey);
    const bVal = getNestedValue(b, sortKey);
    if (aVal === undefined || bVal === undefined) return 0;
    const comparison =
      typeof aVal === 'number' && typeof bVal === 'number'
        ? aVal - bVal
        : String(aVal).localeCompare(String(bVal));
    return sortDir === 'asc' ? comparison : -comparison;
  });

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full data-table border-collapse">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={cn(
                  'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted',
                  'border-b border-border-subtle',
                  stickyHeader && 'sticky top-0 bg-bg-secondary z-10',
                  col.sortable && 'cursor-pointer select-none hover:text-text-secondary transition-colors duration-150',
                  col.align === 'right' && 'text-right',
                  col.align === 'center' && 'text-center',
                  col.width && `w-${col.width}`,
                  col.className
                )}
                onClick={() => col.sortable && handleSort(String(col.key))}
                style={{ width: col.width }}
              >
                <div className={cn(
                  'flex items-center gap-1',
                  col.align === 'right' && 'justify-end',
                  col.align === 'center' && 'justify-center'
                )}>
                  {col.header}
                  {col.sortable && (
                    <span className="text-text-muted/60">
                      {sortKey === col.key ? (
                        sortDir === 'asc' ? (
                          <ChevronUp size={12} className="text-accent-cyan" />
                        ) : (
                          <ChevronDown size={12} className="text-accent-cyan" />
                        )
                      ) : (
                        <ChevronsUpDown size={12} />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: skeletonRows }).map((_, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td key={String(col.key)} className="px-4 py-3">
                    <Skeleton className="h-4 w-full max-w-[100px]" />
                  </td>
                ))}
              </tr>
            ))
          ) : error ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-accent-red text-sm"
              >
                Failed to load data
              </td>
            </tr>
          ) : sortedData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-text-muted text-sm"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedData.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'border-b border-border-subtle/40 transition-colors duration-150',
                  onRowClick && 'cursor-pointer hover:bg-bg-hover'
                )}
              >
                {columns.map((col) => {
                  const value = getNestedValue(row, String(col.key));
                  return (
                    <td
                      key={String(col.key)}
                      className={cn(
                        'px-4 py-3 text-sm text-text-primary',
                        col.align === 'right' && 'text-right',
                        col.align === 'center' && 'text-center',
                        col.className
                      )}
                    >
                      {col.render ? col.render(value, row) : String(value ?? '—')}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
