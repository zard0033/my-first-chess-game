import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Sarasa UI TC', ...defaultTheme.fontFamily.sans],
        display: ['Noto Serif TC', 'Georgia', ...defaultTheme.fontFamily.serif],
      },
      colors: {
        // Surface hierarchy — warm cream progression anchored to board palette
        surface: {
          base: '#faf6f0',   // page background
          card: '#fcf9f3',   // card/panel — slightly lifted off the page
          raised: '#f4ead8', // raised inner surface (= white piece fill)
          hover: '#efe4d2',  // hover state
        },
        line: {
          DEFAULT: '#e0d3bd', // hairline border / divider
          subtle: '#ece1cd',  // subtle dividers
          strong: '#cdb999',  // emphasized border
        },
        ink: {
          DEFAULT: '#3d2210', // primary text (= dark piece stroke)
          muted: '#7a5c44',   // secondary text
          faint: '#a88c76',   // placeholder / tertiary
        },
        // Primary action — warm umber (= dark board square)
        primary: {
          DEFAULT: '#8b6f5c',
          dark: '#6f5645',
          fg: '#fcf9f3',
        },
        success: {
          DEFAULT: '#4a7c59',
          dark: '#3a6447',
          light: '#eef4ee',
          fg: '#fcf9f3',
        },
        danger: {
          DEFAULT: '#b8533a',
          dark: '#9a4330',
          light: '#f9efe9',
          fg: '#fcf9f3',
        },
        hint: {
          DEFAULT: '#c9872e',
          dark: '#aa6f20',
          light: '#faf2e2',
          ring: '#e3c186',
          fg: '#3d2210',
        },
        // Navigation bar — deep brown anchor
        nav: {
          bg: '#2e1a0c',
          text: '#cdb999',
          active: '#fcf9f3',
        },
      },
      boxShadow: {
        // Warm brown-tinted shadows (not pure black) — refined, low, dignified
        card: '0 1px 2px rgba(61,34,16,0.04), 0 4px 14px rgba(61,34,16,0.06)',
        'card-hover': '0 2px 4px rgba(61,34,16,0.06), 0 10px 24px rgba(61,34,16,0.10)',
        button: '0 1px 2px rgba(61,34,16,0.10)',
      },
      borderRadius: {
        btn: '0.5rem',
        card: '0.75rem',
        'lg-card': '1rem',
      },
      fontSize: {
        display: ['2.75rem', { lineHeight: '1.15', letterSpacing: '-0.01em' }],
        'display-sm': ['2rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
      },
    },
  },
  plugins: [],
} satisfies Config
