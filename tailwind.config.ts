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
        'bg-top':  '#FDF0E6',
        'bg-bottom': '#F5C8A8',
        accent: {
          DEFAULT: '#E07A4F',
          dark: '#C4622D',
        },
        brown: {
          '500': '#B18272',
          DEFAULT: '#8B5E3C',
          '900': '#3D2314',
        },
        destructive: '#D04A20',
        surface: 'rgba(255, 255, 255, 0.80)',
        'surface-solid': '#FFF8F2',
        disabled: '#D4C4B4',
        notification: '#E05252',
      },
      fontFamily: {
        serif: ['"Noto Serif TC"', 'serif'],
        sans:  ['"Noto Sans TC"', 'sans-serif'],
      },
      borderRadius: {
        pill: '100px',
        card: '24px',
        interactive: '16px',
      },
      boxShadow: {
        xs:    '0 1px 4px rgba(0, 0, 0, 0.06)',
        sm:    '0 2px 12px rgba(196, 98, 45, 0.06)',
        card:  '0 2px 16px rgba(196, 98, 45, 0.08)',
        modal: '0 8px 40px rgba(196, 98, 45, 0.12)',
        btn:   '0 4px 12px rgba(224, 122, 79, 0.35)',
      },
      backgroundImage: {
        'app-gradient': 'linear-gradient(160deg, #FDF0E6 0%, #FBDFC8 55%, #F5C8A8 100%)',
      },
    },
  },
  plugins: [],
} satisfies Config
