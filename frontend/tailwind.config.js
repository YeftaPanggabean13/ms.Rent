/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        ink: {
          DEFAULT: 'var(--ink)',
          muted: 'var(--ink-muted)',
        },
        line: 'var(--line)',
        accent: {
          DEFAULT: 'var(--accent)',
          ink: 'var(--accent-ink)',
        },
        dark: 'var(--dark)',
        watermark: 'var(--watermark)',
        rust: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent)',
          dark: 'var(--accent)',
          light: 'var(--bg)',
          faint: 'var(--bg)',
        },
      },
      boxShadow: {
        'warm-sm': '0 1px 3px rgba(27, 36, 48, 0.04), 0 1px 2px rgba(27, 36, 48, 0.02)',
        'warm-md': '0 6px 20px -2px rgba(27, 36, 48, 0.06), 0 4px 12px -1px rgba(27, 36, 48, 0.03)',
        'warm-lg': '0 14px 36px -4px rgba(27, 36, 48, 0.08), 0 4px 12px -2px rgba(27, 36, 48, 0.04)',
        'warm-xl': '0 24px 60px -12px rgba(27, 36, 48, 0.14), 0 8px 20px -6px rgba(27, 36, 48, 0.06)',

      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(18px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'bar-grow': {
          from: { transform: 'scaleY(0)' },
          to: { transform: 'scaleY(1)' },
        },
        'bar-grow-x': {
          from: { transform: 'scaleX(0)' },
          to: { transform: 'scaleX(1)' },
        },
        'donut-pop': {
          from: { opacity: '0', transform: 'scale(0.85)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fade-in 0.6s ease both',
        'scale-in': 'scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-down': 'slide-down 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
        'bar-grow': 'bar-grow 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
        'bar-grow-x': 'bar-grow-x 0.8s cubic-bezier(0.16, 1, 0.3, 1) both',
        'donut-pop': 'donut-pop 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [],
};
