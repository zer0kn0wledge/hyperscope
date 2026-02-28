import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'neon': '#00ff88',
        'neon-dim': '#00cc6a',
        'bg-primary': '#000000',
        'bg-card': '#0a0a0a',
        'bg-card-hover': '#111111',
        'bg-surface': '#060606',
        'border-subtle': 'rgba(0, 255, 136, 0.08)',
        'border-active': 'rgba(0, 255, 136, 0.25)',
        'text-primary': '#e8e8e8',
        'text-secondary': 'rgba(255,255,255,0.5)',
        'text-muted': 'rgba(255,255,255,0.3)',
        'red': '#ff4d4d',
        'red-dim': '#cc3333',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
