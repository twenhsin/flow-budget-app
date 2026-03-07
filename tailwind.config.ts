import type { Config } from 'tailwindcss'

export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue',
  ],
  theme: {
    extend: {
      colors: {
        'bg-top': '#FDF0E6',
        'bg-bottom': '#F5C8A8',
        accent: {
          DEFAULT: '#E07A4F',
          dark: '#C4622D',
        },
        brown: {
          DEFAULT: '#8B5E3C',
          soft: '#C4A882',
        },
        surface: '#FFF8F2',
        disabled: '#D4C4B4',
      },
      fontFamily: {
        serif: ['"Noto Serif TC"', 'serif'],
        sans: ['"Noto Sans TC"', 'sans-serif'],
      },
      borderRadius: {
        pill: '100px',
      },
      backgroundImage: {
        'app-gradient': 'linear-gradient(160deg, #FDF0E6 0%, #FBDFC8 55%, #F5C8A8 100%)',
      },
    },
  },
  plugins: [],
} satisfies Config
