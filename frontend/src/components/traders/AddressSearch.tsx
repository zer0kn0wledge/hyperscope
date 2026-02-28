'use client';

import { useState, useRef, ChangeEvent, KeyboardEvent, FormEvent } from 'react';

interface AddressSearchProps {
  onSearch: (address: string) => void;
  placeholder?: string;
  label?: string;
  isLoading?: boolean;
  className?: string;
  defaultValue?: string;
}

function isValidAddress(addr: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(addr.trim());
}

export function AddressSearch({
  onSearch,
  placeholder = '0x... trader address',
  label,
  isLoading = false,
  className = '',
  defaultValue = '',
}: AddressSearchProps) {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    if (error) setError(null);
  };

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setError('Enter an address');
      return;
    }
    if (!isValidAddress(trimmed)) {
      setError('Invalid address format');
      return;
    }
    setError(null);
    onSearch(trimmed);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').trim();
    if (isValidAddress(pasted)) {
      setValue(pasted);
      setError(null);
      setTimeout(() => onSearch(pasted), 50);
      e.preventDefault();
    }
  };

  const borderColor = error
    ? 'rgba(255,77,77,0.5)'
    : focused
    ? 'rgba(0,255,136,0.4)'
    : 'rgba(0,255,136,0.12)';

  const boxShadow = focused ? '0 0 0 3px rgba(0,255,136,0.07)' : 'none';

  return (
    <form onSubmit={handleSubmit} className={className} style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      {label && (
        <label
          style={{
            fontSize: '0.6875rem',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'rgba(255,255,255,0.3)',
          }}
        >
          {label}
        </label>
      )}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              position: 'absolute',
              left: '10px',
              color: focused ? 'rgba(0,255,136,0.6)' : 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
              transition: 'color 0.15s ease',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            style={{
              background: '#060606',
              border: `1px solid ${borderColor}`,
              borderRadius: '8px',
              color: '#e8e8e8',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.8125rem',
              padding: '0.5625rem 0.75rem 0.5625rem 2.25rem',
              width: '100%',
              outline: 'none',
              boxShadow,
              transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              letterSpacing: '0.02em',
            }}
          />
          {value && (
            <button
              type="button"
              onClick={() => { setValue(''); setError(null); inputRef.current?.focus(); }}
              style={{
                position: 'absolute',
                right: '10px',
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.3)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: 0,
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.6)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.3)')}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={isLoading}
          style={{
            background: 'rgba(0,255,136,0.1)',
            border: '1px solid rgba(0,255,136,0.25)',
            borderRadius: '8px',
            color: '#00ff88',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            fontSize: '0.8125rem',
            padding: '0.5625rem 1rem',
            cursor: isLoading ? 'wait' : 'pointer',
            whiteSpace: 'nowrap',
            transition: 'background 0.15s ease, box-shadow 0.15s ease',
            opacity: isLoading ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
          onMouseEnter={(e) => { if (!isLoading) { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,255,136,0.18)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 12px rgba(0,255,136,0.12)'; } }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,255,136,0.1)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'; }}
        >
          {isLoading ? (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="2" strokeDasharray="14" strokeLinecap="round" />
              </svg>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              Looking up...
            </>
          ) : 'Search'}
        </button>
      </div>
      {error && (
        <p style={{ fontSize: '0.6875rem', color: '#ff4d4d', fontFamily: 'Inter, sans-serif', margin: 0 }}>
          {error}
        </p>
      )}
    </form>
  );
}
