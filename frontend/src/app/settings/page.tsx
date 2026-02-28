'use client';

import { useState } from 'react';
import { PageContainer, SectionHeader } from '@/components/layout/PageContainer';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Moon, Sun, Monitor, Check, RefreshCw } from 'lucide-react';

function cn(...classes: (string | undefined | null | boolean)[]) {
  return twMerge(clsx(classes));
}

interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function Toggle({ label, description, checked, onChange }: ToggleProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-bg-border last:border-0">
      <div>
        <p className="text-text-primary font-medium">{label}</p>
        {description && <p className="text-text-secondary text-xs mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-10 h-6 rounded-full transition-colors',
          checked ? 'bg-accent-cyan' : 'bg-bg-border'
        )}
      >
        <span
          className={cn(
            'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
            checked ? 'translate-x-5' : 'translate-x-1'
          )}
        />
      </button>
    </div>
  );
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}

function Slider({ label, value, min, max, step = 1, format, onChange }: SliderProps) {
  return (
    <div className="py-3 border-b border-bg-border last:border-0">
      <div className="flex items-center justify-between mb-2">
        <p className="text-text-primary font-medium">{label}</p>
        <span className="number text-accent-cyan text-sm">
          {format ? format(value) : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-bg-border rounded-full appearance-none cursor-pointer accent-accent-cyan"
      />
    </div>
  );
}

export default function SettingsPage() {
  const [largeTradeThreshold, setLargeTradeThreshold] = useLocalStorage('largeTradeThreshold', 100_000);
  const [orderThreshold, setOrderThreshold] = useLocalStorage('orderThreshold', 50_000);
  const [enableSounds, setEnableSounds] = useLocalStorage('enableSounds', false);
  const [enableAnimations, setEnableAnimations] = useLocalStorage('enableAnimations', true);
  const [defaultTimeframe, setDefaultTimeframe] = useLocalStorage('defaultTimeframe', '1h');
  const [compactMode, setCompactMode] = useLocalStorage('compactMode', false);
  const [showUSD, setShowUSD] = useLocalStorage('showUSD', true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const TIMEFRAME_OPTIONS = ['1m', '5m', '15m', '1h', '4h', '1d'];

  return (
    <PageContainer>
      <SectionHeader title="Settings" subtitle="Customize your HyperScope experience" />

      {/* Display Settings */}
      <div className="card p-4">
        <h3 className="text-text-primary font-semibold mb-4 flex items-center gap-2">
          <Monitor size={16} className="text-accent-cyan" />
          Display
        </h3>
        <Toggle
          label="Compact Mode"
          description="Reduce padding for denser information display"
          checked={compactMode}
          onChange={setCompactMode}
        />
        <Toggle
          label="Show USD Values"
          description="Display values in USD where applicable"
          checked={showUSD}
          onChange={setShowUSD}
        />
        <Toggle
          label="Enable Animations"
          description="Animate chart transitions and data updates"
          checked={enableAnimations}
          onChange={setEnableAnimations}
        />
      </div>

      {/* Alert Settings */}
      <div className="card p-4">
        <h3 className="text-text-primary font-semibold mb-4 flex items-center gap-2">
          <RefreshCw size={16} className="text-accent-cyan" />
          Data & Alerts
        </h3>
        <Slider
          label="Large Trade Threshold"
          value={largeTradeThreshold}
          min={50_000}
          max={1_000_000}
          step={50_000}
          format={(v) => `$${(v / 1000).toFixed(0)}k`}
          onChange={setLargeTradeThreshold}
        />
        <Slider
          label="Large Order Threshold"
          value={orderThreshold}
          min={10_000}
          max={500_000}
          step={10_000}
          format={(v) => `$${(v / 1000).toFixed(0)}k`}
          onChange={setOrderThreshold}
        />
        <Toggle
          label="Enable Sound Alerts"
          description="Play a sound on large trades"
          checked={enableSounds}
          onChange={setEnableSounds}
        />
      </div>

      {/* Chart Defaults */}
      <div className="card p-4">
        <h3 className="text-text-primary font-semibold mb-4 flex items-center gap-2">
          <Sun size={16} className="text-accent-cyan" />
          Chart Defaults
        </h3>
        <div className="py-3">
          <p className="text-text-primary font-medium mb-2">Default Timeframe</p>
          <div className="flex gap-2 flex-wrap">
            {TIMEFRAME_OPTIONS.map((tf) => (
              <button
                key={tf}
                onClick={() => setDefaultTimeframe(tf)}
                className={cn(
                  'px-3 py-1.5 rounded text-sm font-medium transition-colors',
                  defaultTimeframe === tf
                    ? 'bg-accent-cyan text-bg-primary'
                    : 'bg-bg-hover text-text-secondary hover:text-text-primary'
                )}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className={cn(
            'flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all',
            saved
              ? 'bg-accent-green text-bg-primary'
              : 'bg-accent-cyan text-bg-primary hover:bg-accent-cyan/90'
          )}
        >
          {saved ? (
            <><Check size={16} /> Saved!</>
          ) : (
            'Save Settings'
          )}
        </button>
      </div>
    </PageContainer>
  );
}
