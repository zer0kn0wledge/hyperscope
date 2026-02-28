import { ReactNode, CSSProperties } from 'react';

type BadgeVariant = 'neon' | 'red' | 'yellow' | 'blue' | 'purple' | 'muted' | 'ghost';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: 'xs' | 'sm' | 'md';
  dot?: boolean;
  style?: CSSProperties;
  className?: string;
}

const VARIANT_STYLES: Record<BadgeVariant, CSSProperties> = {
  neon: { background: 'rgba(0,255,136,0.1)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.2)' },
  red: { background: 'rgba(255,77,77,0.1)', color: '#ff4d4d', border: '1px solid rgba(255,77,77,0.2)' },
  yellow: { background: 'rgba(234,179,8,0.1)', color: '#eab308', border: '1px solid rgba(234,179,8,0.2)' },
  blue: { background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' },
  purple: { background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.2)' },
  muted: { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.08)' },
  ghost: { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.06)' },
};

const SIZE_STYLES: Record<'xs' | 'sm' | 'md', CSSProperties> = {
  xs: { fontSize: '0.625rem', padding: '0.1rem 0.35rem', borderRadius: '4px' },
  sm: { fontSize: '0.6875rem', padding: '0.15rem 0.5rem', borderRadius: '5px' },
  md: { fontSize: '0.75rem', padding: '0.25rem 0.625rem', borderRadius: '6px' },
};

export function Badge({ children, variant = 'muted', size = 'sm', dot = false, style = {}, className = '' }: BadgeProps) {
  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: dot ? '0.3rem' : undefined, fontFamily: 'JetBrains Mono, monospace', fontWeight: 500, letterSpacing: '0.02em', whiteSpace: 'nowrap', ...VARIANT_STYLES[variant], ...SIZE_STYLES[size], ...style }}
    >
      {dot && <span style={{ width: 5, height: 5, borderRadius: '50%', background: VARIANT_STYLES[variant].color as string, flexShrink: 0 }} />}
      {children}
    </span>
  );
}

export function LiveBadge() { return <Badge variant="neon" dot>LIVE</Badge>; }
