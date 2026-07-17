/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        pink: {
          50: '#FFF5F8',
          100: '#FFE4EC',
          200: '#FFC0D3',
          300: '#FFB7C5',
          400: '#F8BBD9',
          500: '#F48FB1',
          600: '#EC407A',
          700: '#C2185B',
        },
        lavender: {
          300: '#E8B4F8',
          400: '#CE93D8',
        },
        berry: {
          700: '#6B3A6B',
          800: '#4A2545',
        },
      },
      fontFamily: {
        display: ['Quicksand', 'Noto Sans TC', 'sans-serif'],
        body: ['Nunito', 'Noto Sans TC', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px rgba(236, 64, 122, 0.12)',
        'glass-lg': '0 16px 48px rgba(236, 64, 122, 0.18)',
        glow: '0 0 24px rgba(255, 183, 197, 0.5)',
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        fadeIn: 'fadeIn 0.5s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
