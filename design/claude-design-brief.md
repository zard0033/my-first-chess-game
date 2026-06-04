# Design System Brief — Chess Training Companion ("Gambit")

> One-page seed for **Claude Design** (and the root for our art-bible). Pair this with the finished
> reference screen `claude-design-seed-mockup.png`. Full detail lives in `design/gdd/game-concept-v2.md`
> and `design/visual-design-system.md`.

## Product in one line
A warm, premium, **single-player chess-training "dojo" that feels like a journey through a chess realm** —
you learn for real against AI, then **graduate** to play humans on chess.com / lichess. UI language is
**Traditional Chinese (繁體中文)**.

## Audience & tone
- **Adult chess beginners (25–50).** Mature, not childish.
- **Game-feel dialed to ~7/10**: premium and motivating, but calm and low-pressure (no streaks, no timers,
  no leaderboards). Think "elegant chess club / atmospheric game world," not "candy mobile game."

## Reference north stars
- **Epic Seven** — painterly weight, premium mature game art.
- **Wuthering Waves (鳴潮)** — atmospheric, moody, modern **glass** UI finish.
- **Chants of Sennaar** — elegant, restrained palette, near-wordless storytelling.
- **Black Myth: Wukong** — depth of worldview + cinematic drama (only for **special moments**, not everyday UI).
- Admire **chess.com**'s polished Learn/Puzzle pages; **reject** its childish icons & overly-bright green.
  **Reject** lichess's tool-coldness, and any chunky cartoon "RPG kit" look.

## Visual language
- **Finish: modern glass** as the base everywhere (frosted panels, soft top-light sheen, gentle gold glow on
  the focused element, layered depth shadows). **Painterly/atmospheric drama** (gold filigree, motes, slow
  shimmer) is reserved for **special moments only** (hero, level-up, chapter intro).
- **Restrained motion**: soft glow, depth, slow gold shimmer; 150–250ms easing. **No** confetti, cartoon
  bounce, neon flashes, or screen shake.
- **The chessboard is a warm wooden centerpiece** — real wood board + wood piece set, unchanged. The app
  "world" (deep jade + gold + glass) frames it.
- **Icons: clean vector line icons** (Lucide-style), single family. **Never** emoji, never raster sticker art.

## Color tokens
| Role | Hex | Notes |
| --- | --- | --- |
| **Primary — Jade** | `#1C7059` | deep 青瓷 jade-green; white text ≥4.5:1. Hover `#155747`. |
| Primary soft | `#CFE9E0` | focus halo / selected tint |
| **Accent — Gold (山吹)** | `#F8B500` | the one brand gold (fills/indicators only). Light `#FFC94D`. |
| Gold for text | `#8F6200` | only deep gold allowed on light bg |
| Text on gold | `#3A2408` | |
| Deep anchor surface (jade) | `#103029` | nav, immersive "world" zones; raised `#18443A` |
| Text on deep | `#E7F1EC` | dim `#9BBDB1` |
| Page background | `#FAF6F0` | warm cream (content areas) |
| Card surface | `#FCF9F3` | |
| Body text (ink) | `#3D2210` | warm near-black; muted `#7A5C44` |
| Map tile (POP) | top `#46C7A3` · face `#1F9E7A` · socket `#0F6E54` | learning-map nodes that pop off cream |
| Board squares / pieces | wood texture + wood piece SVGs | **do not restyle** |
| Annotation (in-play only) | seiji `#7EBEA5` · rikyū-nezu `#888E7E` · asagi `#33A6B8` · beni-ukon `#E08E79` · keySquare gold `#F8B500` | role-neutral, never emotive |

## Glass spec (the signature finish)
- On dark/jade: `background: rgba(255,255,255,.07)`, `backdrop-blur: 8–12px`, `border: 1px solid rgba(255,255,255,.16)`,
  `inset 0 1px 0 rgba(255,255,255,.22)` top sheen, soft outer shadow.
- Focused element: gold ring + soft gold glow (`0 0 0 3px #F8B500, 0 0 18px rgba(248,181,0,.5)`), slow 2s breathe.
- Gold CTA: `linear-gradient(180deg,#FFC94D,#F8B500)`, text `#3A2408`, soft gold glow.

## Typography (self-hosted CJK — keep)
- **Display / headings**: `Noto Serif TC` (600–700) — gravitas.
- **Body / UI**: `Sarasa UI TC` (400 / 700).
- Numbers/notation: tabular figures. **Do not** swap to Latin-only Google fonts (breaks Chinese).

## Gamification surfaces to design
Levels, a **bottom-up quest map** (chapters = places in a chess realm), badges, a light mentor persona
(**Beth Harmon** — mature, understated; her illustration is TBD/bespoke, none exists yet). **No** streak UI.

## Anti-patterns (do not generate)
Childish/sticker icons · emoji as icons · bright candy green · chunky cartoon RPG panels · confetti/bounce/neon ·
Latin-only fonts breaking Chinese · gold used as body text · big flat 100%-saturation color slabs.
