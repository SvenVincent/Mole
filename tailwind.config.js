/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)',
        secondary: 'var(--secondary)',
        accent: 'var(--accent)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        info: 'var(--info)',
      },
      backgroundColor: {
        app: 'var(--bg-app)',
        card: 'var(--bg-card)',
        elevated: 'var(--bg-elevated)',
        overlay: 'var(--bg-overlay)',
      },
      textColor: {
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        tertiary: 'var(--text-tertiary)',
        link: 'var(--text-link)',
        inverse: 'var(--text-inverse)',
      },
      borderColor: {
        light: 'var(--border-light)',
        medium: 'var(--border-medium)',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'system-ui', 'sans-serif'],
        mono: ['SF Mono', 'Menlo', 'Monaco', 'monospace'],
      },
      fontSize: {
        'h1': ['28px', { lineHeight: '1.2', fontWeight: '700' }],
        'h2': ['22px', { lineHeight: '1.3', fontWeight: '600' }],
        'body': ['15px', { lineHeight: '1.5', fontWeight: '400' }],
        'caption': ['13px', { lineHeight: '1.4', fontWeight: '400' }],
        'number': ['24px', { lineHeight: '1', fontWeight: '700' }],
        'number-lg': ['36px', { lineHeight: '1', fontWeight: '700' }],
      },
      borderRadius: {
        'card': '12px',
        'button': '8px',
      },
      backdropBlur: {
        'glass': '20px',
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite',
      },
    },
  },
  plugins: [],
}
