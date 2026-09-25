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
        'warm-md': '0 6px 20px -2px rgba(27, 36, 48, 0.06), 0 2px 6px -1px rgba(27, 36, 48, 0.03)',
        'warm-lg': '0 14px 36px -4px rgba(27, 36, 48, 0.08), 0 4px 12px -2px rgba(27, 36, 48, 0.04)',
      },
    },
  },
  plugins: [],
};
