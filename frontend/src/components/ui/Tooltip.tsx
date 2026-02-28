'use client';

import { ReactNode, useState, useRef, useEffect, CSSProperties } from 'react';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export function Tooltip({ content, children, placement = 'top', delay = 200 }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const show = () => { timerRef.current = setTimeout(() => setVisible(true), delay); };
  const hide = () => { if (timerRef.current) clearTimeout(timerRef.current); setVisible(false); };

  useEffect(() => { return () => { if (timerRef.current) clearTimeout(timerRef.current); }; }, []);

  const placementStyles: Record<string, CSSProperties> = {
    top: { bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)' },
    bottom: { top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)' },
    left: { right: 'calc(100% + 8px)', top: '50%', transform: 'translateY(-50%)' },
    right: { left: 'calc(100% + 8px)', top: '50%', transform: 'translateY(-50%)' },
  };

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }} onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
      {children}
      {visible && content && (
        <div role="tooltip" style={{ position: 'absolute', zIndex: 9999, ...placementStyles[placement], background: '#0d0d0d', border: '1px solid rgba(0,255,136,0.2)', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', color: '#e8e8e8', whiteSpace: 'nowrap', pointerEvents: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.8), 0 0 16px rgba(0,255,136,0.05)', animation: 'slide-up 0.15s ease' }}>
          {content}
        </div>
      )}
    </div>
  );
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number | string; color?: string }>;
  label?: string;
  formatter?: (value: number | string, name: string) => [string, string];
  labelFormatter?: (label: string) => string;
}

export function ChartTooltip({ active, payload, label, formatter, labelFormatter }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0a0a0a', border: '1px solid rgba(0,255,136,0.2)', borderRadius: '10px', padding: '0.625rem 0.875rem', boxShadow: '0 8px 32px rgba(0,0,0,0.9), 0 0 20px rgba(0,255,136,0.04)', minWidth: '120px' }}>
      {label && <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.375rem', fontFamily: 'JetBrains Mono, monospace' }}>{labelFormatter ? labelFormatter(label) : label}</div>}
      <div className="space-y-1">
        {payload.map((item, idx) => {
          const [formattedValue, formattedName] = formatter ? formatter(item.value, item.name) : [String(item.value), item.name];
          return (
            <div key={idx} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.color ?? '#00ff88', flexShrink: 0 }} />
                <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif' }}>{formattedName}</span>
              </div>
              <span style={{ fontSize: '0.8125rem', fontFamily: 'JetBrains Mono, monospace', color: item.color ?? '#00ff88', fontWeight: 500 }}>{formattedValue}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
