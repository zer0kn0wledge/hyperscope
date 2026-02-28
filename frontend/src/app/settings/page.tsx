'use client';

import { useState } from 'react';
import { PageContainer, SectionHeader } from '@/components/layout/PageContainer';
import { useAPIHealth } from '@/hooks/useAPI';
import { API_BASE } from '@/lib/constants';

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 0', borderBottom: '1px solid rgba(0,255,136,0.06)' }}>
      <div style={{ flex: 1, marginRight: '2rem' }}>
        <div style={{ fontSize: '0.875rem', color: '#e8e8e8', fontWeight: 500, fontFamily: 'Inter, sans-serif', marginBottom: description ? '0.25rem' : 0 }}>{label}</div>
        {description && <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', fontFamily: 'Inter, sans-serif' }}>{description}</div>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        background: value ? 'rgba(0,255,136,0.3)' : 'rgba(255,255,255,0.1)',
        border: value ? '1px solid rgba(0,255,136,0.5)' : '1px solid rgba(255,255,255,0.15)',
        cursor: 'pointer',
        position: 'relative',
        transition: 'all 0.2s ease',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 2,
          left: value ? 22 : 2,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: value ? '#00ff88' : 'rgba(255,255,255,0.4)',
          transition: 'all 0.2s ease',
          boxShadow: value ? '0 0 8px rgba(0,255,136,0.6)' : 'none',
        }}
      />
    </button>
  );
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: ok ? '#00ff88' : '#ff4d4d', boxShadow: ok ? '0 0 6px rgba(0,255,136,0.8)' : '0 0 6px rgba(255,77,77,0.8)' }} />
      <span style={{ fontSize: '0.8125rem', color: ok ? '#00ff88' : '#ff4d4d', fontFamily: 'JetBrains Mono, monospace' }}>{ok ? 'Connected' : 'Disconnected'}</span>
    </div>
  );
}

export default function SettingsPage() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [showAnimations, setShowAnimations] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<30 | 60 | 120>(30);

  const { data: health, isLoading: healthLoading, refetch: refetchHealth } = useAPIHealth();
  const isConnected = !healthLoading && !!(health as any)?.status;

  return (
    <PageContainer>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#e8e8e8', margin: '0 0 0.375rem', letterSpacing: '-0.02em', fontFamily: 'Inter, sans-serif' }}>Settings</h1>
        <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.35)', margin: 0, fontFamily: 'Inter, sans-serif' }}>Configure HyperScope display and data preferences</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div>
          <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
            <SectionHeader title="Data" subtitle="Refresh and update settings" />
            <SettingRow label="Auto Refresh" description="Automatically refresh data on an interval">
              <Toggle value={autoRefresh} onChange={setAutoRefresh} />
            </SettingRow>
            <SettingRow label="Refresh Interval" description="How often to poll for new data">
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {([30, 60, 120] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setRefreshInterval(s)}
                    style={{ background: refreshInterval === s ? 'rgba(0,255,136,0.12)' : 'rgba(255,255,255,0.04)', border: refreshInterval === s ? '1px solid rgba(0,255,136,0.3)' : '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: refreshInterval === s ? '#00ff88' : 'rgba(255,255,255,0.45)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', padding: '0.25rem 0.625rem', cursor: 'pointer' }}
                  >
                    {s}s
                  </button>
                ))}
              </div>
            </SettingRow>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <SectionHeader title="Display" subtitle="UI and visual preferences" />
            <SettingRow label="Compact Mode" description="Reduce padding and spacing throughout the UI">
              <Toggle value={compactMode} onChange={setCompactMode} />
            </SettingRow>
            <SettingRow label="Animations" description="Enable smooth transitions and effects">
              <Toggle value={showAnimations} onChange={setShowAnimations} />
            </SettingRow>
          </div>
        </div>

        <div>
          <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
            <SectionHeader title="API Connection" subtitle="Backend connectivity status" />
            <SettingRow label="API Status">
              {healthLoading ? (
                <div style={{ width: 80, height: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 4, animation: 'pulse 1.5s ease-in-out infinite' }} />
              ) : (
                <StatusDot ok={isConnected} />
              )}
            </SettingRow>
            <SettingRow label="API Endpoint" description="Backend base URL">
              <code style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'JetBrains Mono, monospace', background: 'rgba(255,255,255,0.04)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>{API_BASE}</code>
            </SettingRow>
            <div style={{ paddingTop: '1rem' }}>
              <button
                onClick={() => refetchHealth()}
                style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: '8px', color: '#00ff88', fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', padding: '0.5rem 1.25rem', cursor: 'pointer', width: '100%' }}
              >
                Test Connection
              </button>
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <SectionHeader title="About" subtitle="HyperScope version info" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { label: 'Version', value: '1.0.0' },
                { label: 'Frontend', value: 'Next.js 14 + React 18' },
                { label: 'Data Source', value: 'Hyperliquid API' },
                { label: 'Charts', value: 'Recharts 2.x' },
              ].map((item) => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter, sans-serif' }}>{item.label}</span>
                  <span style={{ fontSize: '0.8125rem', color: '#e8e8e8', fontFamily: 'JetBrains Mono, monospace' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
