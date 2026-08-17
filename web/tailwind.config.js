/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0b0d0f',
        surface: '#15171a',
        surface2: '#1c1f23',
        edge: '#26292e',
        ink: '#e8e9eb',
        muted: '#8a8f97',
        accent: {
          DEFAULT: '#a6e22e',
          dim: '#7fb520',
        },
        warn: '#e8b339',
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
        float: 'float 3.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
