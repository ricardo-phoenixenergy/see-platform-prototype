import type { Config } from 'tailwindcss'

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}', './hooks/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          25: 'hsl(var(--ink-25) / <alpha-value>)',
          50: 'hsl(var(--ink-50) / <alpha-value>)',
          100: 'hsl(var(--ink-100) / <alpha-value>)',
          200: 'hsl(var(--ink-200) / <alpha-value>)',
          300: 'hsl(var(--ink-300) / <alpha-value>)',
          400: 'hsl(var(--ink-400) / <alpha-value>)',
          500: 'hsl(var(--ink-500) / <alpha-value>)',
          600: 'hsl(var(--ink-600) / <alpha-value>)',
          700: 'hsl(var(--ink-700) / <alpha-value>)',
          800: 'hsl(var(--ink-800) / <alpha-value>)',
          900: 'hsl(var(--ink-900) / <alpha-value>)',
          950: 'hsl(var(--ink-950) / <alpha-value>)',
        },
        accent: {
          50: 'hsl(var(--accent-50) / <alpha-value>)',
          100: 'hsl(var(--accent-100) / <alpha-value>)',
          200: 'hsl(var(--accent-200) / <alpha-value>)',
          300: 'hsl(var(--accent-300) / <alpha-value>)',
          400: 'hsl(var(--accent-400) / <alpha-value>)',
          500: 'hsl(var(--accent-500) / <alpha-value>)',
          600: 'hsl(var(--accent-600) / <alpha-value>)',
          700: 'hsl(var(--accent-700) / <alpha-value>)',
          800: 'hsl(var(--accent-800) / <alpha-value>)',
          900: 'hsl(var(--accent-900) / <alpha-value>)',
        },
        tier: {
          bronze: '#A56A3E',
          silver: '#8B95A0',
          gold: '#C9A03E',
          platinum: '#6E7A8A',
        },
        success: { 500: '#1E9D6B' },
        warning: { 500: '#C9892B' },
        danger: { 500: '#C9384A' },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xs: '4px', sm: '6px', md: '8px', lg: '12px', xl: '16px', full: '9999px',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgb(10 11 13 / 0.04)',
        sm: '0 1px 3px 0 rgb(10 11 13 / 0.06), 0 1px 2px 0 rgb(10 11 13 / 0.04)',
        md: '0 4px 8px -2px rgb(10 11 13 / 0.06), 0 2px 4px -2px rgb(10 11 13 / 0.04)',
        lg: '0 12px 24px -4px rgb(10 11 13 / 0.08), 0 4px 8px -2px rgb(10 11 13 / 0.04)',
        xl: '0 24px 48px -8px rgb(10 11 13 / 0.10)',
        ring: '0 0 0 3px rgb(62 91 234 / 0.22)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config
