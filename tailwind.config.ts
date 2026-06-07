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
        // 標題 — BIZ UDPMincho 明朝（殿堂感）；繁中缺字 fallback Noto Serif TC
        display: [
          'BIZ UDPMincho', 'Noto Serif TC',
          'PingFang TC', 'Songti TC',
          'Microsoft JhengHei',
          ...defaultTheme.fontFamily.serif,
        ],
        // 課程內文 — LXGW WenKai TC 楷體（溫暖閱讀）
        lesson: [
          'LXGW WenKai TC', 'Noto Serif TC',
          'PingFang TC', 'Songti TC',
          'Microsoft JhengHei',
          ...defaultTheme.fontFamily.serif,
        ],
        // 數字 / 棋譜 / 評分 — Cubic 11 點陣像素字（tabular fallback Sarasa）
        num: [
          'Cubic 11', 'Sarasa UI TC',
          ...defaultTheme.fontFamily.mono,
        ],
        // GAMBIT 品牌字標
        brand: ['Cinzel', 'BIZ UDPMincho', 'Noto Serif TC', 'serif'],
      },
      colors: {
        // Surface hierarchy — warm cream progression anchored to board palette
        surface: {
          base: '#faf6f0',     // page background
          card: '#fcf9f3',     // card/panel — slightly lifted off the page
          raised: '#f4ead8',   // raised inner surface (= white piece fill)
          hover: '#efe4d2',    // hover state
          deep: '#103029',     // dark anchor: nav, immersive map world (jade)
          'deep-2': '#18443a', // raised layer inside a deep-anchored region
          dungeon: '#0b211b',  // 試煉道場 world — one step deeper than `deep`, still warm jade (not cold near-black)
          'dungeon-2': '#0e2a22', // raised layer inside the dungeon (header)
        },
        line: {
          DEFAULT: '#e0d3bd', // hairline border / divider
          subtle: '#ece1cd',  // subtle dividers
          strong: '#cdb999',  // emphasized border
        },
        ink: {
          DEFAULT: '#3d2210',      // primary text (= dark piece stroke)
          muted: '#7a5c44',        // secondary text
          faint: '#a88c76',        // placeholder / tertiary
          'on-deep': '#e7f1ec',    // text on a deep anchor (nav, map world)
          'on-deep-dim': '#9bbdb1',// secondary text on a deep anchor
        },
        // Primary action — 深青瓷 jade #1c7059
        primary: {
          DEFAULT: '#1c7059',
          dark: '#155747',
          soft: '#cfe9e0', // focus halo / low-intensity selected fill
          fg: '#ffffff',
          foreground: 'hsl(var(--primary-foreground))', // shadcn alias
        },
        success: {
          DEFAULT: '#4a7c59',
          dark: '#3a6447',
          light: '#eef4ee',
          fg: '#fcf9f3',
          'on-deep': '#7fd4a8', // lightened sage for legibility on a deep/dungeon anchor
        },
        danger: {
          DEFAULT: '#b8533a',
          dark: '#9a4330',
          light: '#f9efe9',
          fg: '#fcf9f3',
          'on-deep': '#e08e79', // lightened warm-red for legibility on a deep/dungeon anchor
        },
        hint: {
          DEFAULT: '#c9872e',
          dark: '#aa6f20',
          light: '#faf2e2',
          ring: '#e3c186',
          fg: '#3d2210',
        },
        // Brand gold — 山吹色 yamabuki #f8b500 (= keySquare / eval peak; the one "moment" gold).
        // Named `gold` because shadcn already owns `accent` (= surface.raised).
        gold: {
          DEFAULT: '#f8b500', // focus ring, progress, CTA gradient, nav indicator — fill/indicator only
          light: '#ffc94d',   // CTA gradient top edge
          dark: '#8f6200',    // the only gold allowed for text (on cream ≈ 4.95:1 AA)
          ink: '#3a2408',     // dark text on a gold fill (≈ 8.1:1 AAA)
        },
        // Learning-map tile ramp (jade) + connector trail — the POP layer.
        map: {
          tile: {
            top: '#46c7a3',
            face: '#1f9e7a',
            socket: '#0f6e54',
            'lock-top': '#ebe2d2',
            'lock-face': '#d8cdb9',
            'lock-socket': '#b5a790',
          },
          trail: {
            DEFAULT: '#f8b500', // unlocked path (= gold)
            base: '#d4c5a2',    // locked path track
          },
        },
        // Navigation bar — deep forest walnut (solid dark anchor, replaces wood photo)
        nav: {
          bg: '#103029',          // = surface.deep (jade anchor)
          text: '#e7f1ec',        // default link text
          dim: '#9bbdb1',         // inactive link text
          'active-bg': '#18443a', // active pill background (= surface.deep-2)
          active: '#ffffff',      // active link text
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
