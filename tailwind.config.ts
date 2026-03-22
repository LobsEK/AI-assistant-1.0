import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#030712',
          900: '#0a0f1a',
          850: '#0f1624',
          800: '#141e2e',
          750: '#1a2540',
          700: '#1e2d4a',
          600: '#263554',
          500: '#2e3f63',
        },
        neon: {
          blue:  '#3b82f6',
          cyan:  '#06b6d4',
          green: '#10b981',
          violet:'#8b5cf6',
          amber: '#f59e0b',
          red:   '#ef4444',
        },
        slate: {
          text: '#94a3b8',
          muted:'#64748b',
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in':   'slideIn 0.25s ease-out',
        'fade-in':    'fadeIn 0.3s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%':   { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)',     opacity: '1' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
export default config
