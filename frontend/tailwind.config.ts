import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // DATK / Glass palette — dark only
        bg: {
          root: '#060b14',
          base: '#0a101f',
          surface: '#0f1729',
          elevated: '#131d33',
          float: '#18243d',
        },
        bd: {
          subtle: 'rgba(255, 255, 255, 0.04)',
          DEFAULT: 'rgba(255, 255, 255, 0.06)',
          strong: 'rgba(255, 255, 255, 0.10)',
        },
        tx: {
          primary: '#e8edf5',
          secondary: '#8899b4',
          muted: '#4a5568',
          placeholder: '#3d4a5c',
        },
        ac: {
          cyan: '#22d3ee',
          purple: '#a78bfa',
          green: '#34d399',
          amber: '#fbbf24',
          rose: '#fb7185',
        },
        status: {
          success: '#34d399',
          warning: '#fbbf24',
          error: '#fb7185',
          info: '#22d3ee',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs: ['10px', { lineHeight: '1.4' }],
        sm: ['12px', { lineHeight: '1.5' }],
        base: ['14px', { lineHeight: '1.6' }],
        lg: ['18px', { lineHeight: '1.5' }],
        xl: ['24px', { lineHeight: '1.3' }],
        '2xl': ['32px', { lineHeight: '1.2' }],
        '3xl': ['48px', { lineHeight: '1.1' }],
      },
      spacing: {
        '1': '4px', '2': '8px', '3': '12px', '4': '16px',
        '5': '20px', '6': '24px', '8': '32px', '12': '48px',
      },
      borderRadius: {
        sm: '6px', md: '10px', lg: '14px', xl: '20px', full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
        md: '0 4px 12px rgba(0, 0, 0, 0.4)',
        lg: '0 8px 32px rgba(0, 0, 0, 0.5)',
        glow: '0 0 20px rgba(34, 211, 238, 0.15)',
      },
      transitionDuration: {
        fast: '150ms',
        base: '250ms',
        slow: '400ms',
      },
      width: {
        sidebar: '260px',
      },
      height: {
        navbar: '48px',
      },
    },
  },
  plugins: [],
};

export default config;