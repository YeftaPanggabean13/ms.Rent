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
        serif: ['"DM Serif Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        base: '#FBF9F6',
        ink: {
          DEFAULT: '#1B2430',
          light: '#2D3A4B',
          muted: '#5A687A',
          faint: '#8D99A8',
        },
        rust: {
          DEFAULT: '#C1622A',
          hover: '#A95120',
          dark: '#8C3F18',
          light: '#F8ECE5',
          faint: '#FDF7F3',
        },
        moss: {
          DEFAULT: '#2F4A3D',
          hover: '#243A30',
          light: '#EAF0EC',
          faint: '#F3F6F4',
        },
        sand: {
          50: '#FBF9F6',
          100: '#F5F0EA',
          200: '#E8E2D8',
          300: '#D6CFC4',
          400: '#BCB3A5',
        },
      },
      boxShadow: {
        'warm-sm': '0 1px 3px rgba(27, 36, 48, 0.04), 0 1px 2px rgba(27, 36, 48, 0.02)',
        'warm-md': '0 6px 20px -2px rgba(27, 36, 48, 0.06), 0 4px 12px -1px rgba(27, 36, 48, 0.03)',
        'warm-lg': '0 14px 36px -4px rgba(27, 36, 48, 0.08), 0 4px 12px -2px rgba(27, 36, 48, 0.04)',
        'warm-xl': '0 24px 60px -12px rgba(27, 36, 48, 0.14), 0 8px 20px -6px rgba(27, 36, 48, 0.06)',
        'glow-rust': '0 10px 30px -8px rgba(193, 98, 42, 0.35)',
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
