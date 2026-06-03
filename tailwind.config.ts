import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'
import animate from 'tailwindcss-animate'

export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Sarasa UI TC covers the subset; explicit CJK sans fallbacks prevent SimSun/MingLiU
        // (thin-stroke Ming/serif fonts) from rendering un-subsetted Chinese characters.
        sans: [
          'Sarasa UI TC',
          'PingFang TC', 'PingFang SC',          // macOS / iOS
          'Noto Sans CJK TC', 'Noto Sans TC',    // Linux / Android
          'Microsoft JhengHei', 'Microsoft YaHei', // Windows Traditional / Simplified
          ...defaultTheme.fontFamily.sans,
        ],
        display: [
          'Sarasa UI TC',
          'PingFang TC', 'PingFang SC',
          'Microsoft JhengHei', 'Microsoft YaHei',
          ...defaultTheme.fontFamily.sans,
        ],
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
          foreground: 'hsl(var(--primary-foreground))', // shadcn alias
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
        // Navigation bar — deep walnut, same family as the board's dark squares
        nav: {
          bg: '#8b6f5c',  // matches board dark-square colour (was too-dark walnut)
          text: '#f4ead8',
          active: '#ffffff',
        },
        // shadcn-vue semantic colors → CSS variables (warm-mapped in main.css :root).
        // Coexist with the warm tokens above; do not replace them.
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
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
        // shadcn-vue radius scale derived from --radius (not used elsewhere — safe)
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontSize: {
        display: ['2.75rem', { lineHeight: '1.15', letterSpacing: '-0.01em' }],
        'display-sm': ['2rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
      },
    },
  },
  plugins: [animate],
} satisfies Config
