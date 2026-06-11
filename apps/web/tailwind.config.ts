import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'cl-primary':       '#0F3460',
        'cl-primary-hover': '#0A2540',
        'cl-primary-light': '#E8F0FE',
        'cl-accent':        '#C9A84C',
        'cl-accent-hover':  '#A8882F',
        'cl-accent-light':  '#FBF3DC',
        'cl-success':       '#1B7A4A',
        'cl-success-light': '#E6F4ED',
        'cl-warning':       '#B45309',
        'cl-warning-light': '#FEF3C7',
        'cl-danger':        '#9B1C1C',
        'cl-danger-light':  '#FEE2E2',
        'cl-gray-50':       '#F8FAFC',
        'cl-gray-100':      '#F1F5F9',
        'cl-gray-200':      '#E2E8F0',
        'cl-gray-400':      '#94A3B8',
        'cl-gray-600':      '#475569',
        'cl-gray-800':      '#1E293B',
        'cl-gray-900':      '#0F172A',
      },
      fontFamily: {
        arabic: ['IBM Plex Sans Arabic', 'Segoe UI', 'sans-serif'],
        sans:   ['IBM Plex Sans Arabic', 'Segoe UI', 'sans-serif'],
        mono:   ['IBM Plex Mono', 'monospace'],
      },
      borderRadius: {
        card:  '12px',
        input: '8px',
      },
    },
  },
  plugins: [],
}

export default config
