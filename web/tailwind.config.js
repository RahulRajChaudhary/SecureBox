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
        series: {
          documents: '#3987e5',
          media: '#199e70',
          archives: '#c98500',
          other: '#9085e9',
        },
        file: {
          pdf: '#e2624a',
          doc: '#4f8fe0',
          sheet: '#3ba55d',
          slide: '#e07b39',
          image: '#38bdf8',
          video: '#9085e9',
          audio: '#ec6a9e',
          archive: '#c98500',
          code: '#4fb3bf',
        },
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
