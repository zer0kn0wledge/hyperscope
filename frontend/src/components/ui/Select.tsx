'use client';

import { SelectHTMLAttributes, forwardRef } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Array<{ value: string; label: string }>;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, className = '', ...props }, ref) => {
    return (
      <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        {label && (
          <label style={{ fontSize: '0.6875rem', fontFamily: 'Inter, sans-serif', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.3)' }}>
            {label}
          </label>
        )}
        <div style={{ position: 'relative' }}>
          <select
            ref={ref}
            {...props}
            style={{ background: '#060606', border: `1px solid ${error ? 'rgba(255,77,77,0.4)' : 'rgba(0,255,136,0.12)'}`, borderRadius: '8px', color: '#e8e8e8', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8125rem', padding: '0.5rem 2rem 0.5rem 0.75rem', width: '100%', cursor: 'pointer', outline: 'none', appearance: 'none', WebkitAppearance: 'none', transition: 'border-color 0.15s ease, box-shadow 0.15s ease', ...(props.style ?? {}) }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(0,255,136,0.35)'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0,255,136,0.08)'; props.onFocus?.(e); }}
            onBlur={(e) => { e.currentTarget.style.borderColor = error ? 'rgba(255,77,77,0.4)' : 'rgba(0,255,136,0.12)'; e.currentTarget.style.boxShadow = 'none'; props.onBlur?.(e); }}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} style={{ background: '#0a0a0a', color: '#e8e8e8' }}>
                {opt.label}
              </option>
            ))}
          </select>
          {/* Custom chevron */}
          <div style={{ position: 'absolute', right: '0.625rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
              <path d="M1 1L5 5L9 1" stroke="rgba(0,255,136,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        {error && <span style={{ fontSize: '0.6875rem', color: '#ff4d4d', fontFamily: 'Inter, sans-serif' }}>{error}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';
