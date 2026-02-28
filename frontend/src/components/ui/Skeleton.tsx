import { CSSProperties } from 'react';

interface SkeletonProps {
  className?: string;
  style?: CSSProperties;
}

function Shimmer({ className = '', style = {} }: SkeletonProps) {
  return (
    <div
      className={`${className}`}
      style={{
        background: 'linear-gradient(90deg, rgba(0,255,136,0.03) 0%, rgba(0,255,136,0.07) 50%, rgba(0,255,136,0.03) 100%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.8s ease-in-out infinite',
        borderRadius: '6px',
        ...style,
      }}
    />
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <>
      <style>{`
        @keyframes skeleton-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      <div className={`card ${className}`} style={{ background: '#0a0a0a', border: '1px solid rgba(0,255,136,0.05)', borderRadius: '12px', padding: '1.25rem' }}>
        <Shimmer style={{ height: 10, width: '50%', marginBottom: '14px' }} />
        <Shimmer style={{ height: 24, width: '70%', marginBottom: '10px' }} />
        <Shimmer style={{ height: 10, width: '40%' }} />
      </div>
    </>
  );
}

export function SkeletonTable({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <>
      <style>{`
        @keyframes skeleton-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: '12px' }}>
        <div style={{ display: 'flex', gap: '1rem', padding: '0.625rem 0.75rem', borderBottom: '1px solid rgba(0,255,136,0.08)', background: '#0a0a0a' }}>
          {Array.from({ length: cols }).map((_, i) => <Shimmer key={i} style={{ height: 8, flex: 1 }} />)}
        </div>
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} style={{ display: 'flex', gap: '1rem', padding: '0.625rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
            {Array.from({ length: cols }).map((_, colIdx) => <Shimmer key={colIdx} style={{ height: 12, flex: colIdx === 0 ? 1.5 : 1, opacity: 0.7, animationDelay: `${(rowIdx * cols + colIdx) * 0.04}s` }} />)}
          </div>
        ))}
      </div>
    </>
  );
}

export function SkeletonChart({ height = 280 }: { height?: number }) {
  return (
    <>
      <style>{`
        @keyframes skeleton-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      <div className="card" style={{ padding: '1.25rem', borderRadius: '12px' }}>
        <Shimmer style={{ height: 12, width: '35%', marginBottom: '1rem' }} />
        <div style={{ height, borderRadius: '8px', position: 'relative', overflow: 'hidden', background: 'rgba(0,255,136,0.015)' }}>
          <Shimmer style={{ position: 'absolute', inset: 0, borderRadius: '8px', animationDuration: '2.4s' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', background: 'rgba(0,255,136,0.06)' }} />
        </div>
      </div>
    </>
  );
}

export function SkeletonText({ lines = 3, width = '100%' }: { lines?: number; width?: string }) {
  return (
    <>
      <style>{`
        @keyframes skeleton-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      <div className="space-y-2" style={{ width }}>
        {Array.from({ length: lines }).map((_, i) => <Shimmer key={i} style={{ height: 12, width: i === lines - 1 ? '60%' : '100%', animationDelay: `${i * 0.1}s` }} />)}
      </div>
    </>
  );
}
