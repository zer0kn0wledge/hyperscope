'use client';

import { useState, ReactNode, useCallback } from 'react';

export interface Column<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
  width?: string;
  render?: (value: any, row: T, index: number) => ReactNode;
}

interface DataTableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T, index: number) => void;
  emptyMessage?: string;
  className?: string;
  stickyHeader?: boolean;
  rowKey?: (row: T, index: number) => string | number;
}

type SortDirection = 'asc' | 'desc' | null;

function SortIcon({ direction }: { direction: SortDirection }) {
  return (
    <span className="inline-flex flex-col ml-1 gap-[2px]" style={{ verticalAlign: 'middle' }}>
      <svg width="7" height="5" viewBox="0 0 7 5" fill="none">
        <path d="M3.5 0L6.5 4H0.5L3.5 0Z" fill={direction === 'asc' ? '#00ff88' : 'rgba(255,255,255,0.2)'} />
      </svg>
      <svg width="7" height="5" viewBox="0 0 7 5" fill="none">
        <path d="M3.5 5L0.5 1H6.5L3.5 5Z" fill={direction === 'desc' ? '#00ff88' : 'rgba(255,255,255,0.2)'} />
      </svg>
    </span>
  );
}

export function DataTable<T extends Record<string, any>>({
  columns, data, onRowClick, emptyMessage = 'No data available', className = '', stickyHeader = true, rowKey,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);

  const handleSort = useCallback((col: Column<T>) => {
    if (!col.sortable) return;
    if (sortKey === col.key) {
      if (sortDir === 'asc') setSortDir('desc');
      else if (sortDir === 'desc') { setSortKey(null); setSortDir(null); }
      else setSortDir('asc');
    } else {
      setSortKey(col.key);
      setSortDir('asc');
    }
  }, [sortKey, sortDir]);

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey || !sortDir) return 0;
    const av = a[sortKey]; const bv = b[sortKey];
    if (av === null || av === undefined) return 1;
    if (bv === null || bv === undefined) return -1;
    if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av;
    const as = String(av).toLowerCase(); const bs = String(bv).toLowerCase();
    if (sortDir === 'asc') return as < bs ? -1 : as > bs ? 1 : 0;
    return as > bs ? -1 : as < bs ? 1 : 0;
  });

  return (
    <div className={`overflow-x-auto ${className}`} style={{ borderRadius: '0 0 12px 12px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 'max-content' }}>
        <thead>
          <tr style={{ background: stickyHeader ? '#0a0a0a' : 'transparent', position: stickyHeader ? 'sticky' : 'static', top: 0, zIndex: 10 }}>
            {columns.map((col) => (
              <th key={col.key} onClick={() => handleSort(col)} style={{ textAlign: col.align ?? 'left', width: col.width, cursor: col.sortable ? 'pointer' : 'default', whiteSpace: 'nowrap', padding: '0.625rem 0.75rem', fontSize: '0.6875rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: sortKey === col.key ? '#00ff88' : 'rgba(255,255,255,0.3)', borderBottom: '1px solid rgba(0,255,136,0.08)', userSelect: 'none', fontFamily: 'Inter, sans-serif' }}>
                {col.label}{col.sortable && <SortIcon direction={sortKey === col.key ? sortDir : null} />}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 ? (
            <tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'rgba(255,255,255,0.2)', fontSize: '0.875rem', fontFamily: 'JetBrains Mono, monospace' }}>{emptyMessage}</td></tr>
          ) : (
            sortedData.map((row, index) => (
              <tr key={rowKey ? rowKey(row, index) : index} onClick={() => onRowClick?.(row, index)} style={{ cursor: onRowClick ? 'pointer' : 'default', borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.1s ease' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(0,255,136,0.03)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
              >
                {columns.map((col) => (
                  <td key={col.key} style={{ textAlign: col.align ?? 'left', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', color: '#e8e8e8', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap' }}>
                    {col.render ? col.render(row[col.key], row, index) : row[col.key] !== undefined && row[col.key] !== null ? String(row[col.key]) : '—'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
