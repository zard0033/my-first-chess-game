# Gambit — App UI Kit

High-fidelity, interactive recreation of the **Gambit** chess-training app (繁體中文, mobile PWA),
built from `uploads/visual-design-system.md` + `uploads/claude-design-brief.md` + the seed mockup.
Open `index.html` for a click-thru prototype inside a phone shell.

## Screens (4 core, matching the seed mockup)
1. **首頁 · 儀表板 (Home)** — greeting, deep-jade *new-game* feature card with gold CTA, continue-learning
   card (jade left-rule + progress + hero badge), overview stats (one locked "即將推出" placeholder).
2. **學習 · 地圖 (Learn)** — chapter header card + **bottom-up quest map**: done (✓) / current (gold breathe
   ring + 繼續 bubble) / locked nodes, gold dashed trail → grey dashed for locked.
3. **對局 (Game)** — wood board (coords, no eval bar per spec), **AI 思考中 ●●●** glass turn badge
   (tap to toggle 輪到你), move list with gold live-move chip, 提示 / 認輸 actions (提示 lights a key square).
4. **覆盤 (Review)** — board with gold key-square highlight, **wood eval bar** (gold divider), ◀ ▶ ply
   stepping, player-side verdict (白方稍優…), 關鍵一手 gold jump.

Game + Review share the **對局 tab** via a segmented toggle (both are board surfaces). The **我的 tab**
is intentionally a blank placeholder — that screen was not in the source design.

## Files
| File | What |
| --- | --- |
| `index.html` | Entry — loads React 18 + Babel + all components, mounts `App`. |
| `colors_and_type.css` | Local copy of the system tokens (font path adjusted to `../../fonts/`). |
| `icons.jsx` | Lucide-style line-icon set (`IconHome`, `IconZap`, `IconCheck`, …). |
| `primitives.jsx` | `PhoneFrame`, `TopHeader`, `BottomTab`, `Button`, `GlassPanel`, `Card`, `Progress`, `Pill`. |
| `Chessboard.jsx` | FEN-driven wood board + styled Unicode pieces + coords + highlights. |
| `HomeScreen.jsx` / `LearnScreen.jsx` / `GameScreen.jsx` / `ReviewScreen.jsx` | The four screens. |
| `App.jsx` | Shell: tab state, play-mode toggle, screen routing. |

## Fidelity notes / substitutions
- **Board & pieces:** production uses `/board/wood12.jpg` + the **Gioco Wood SVG** piece set. Those
  assets were not provided, so the board is mocked with CSS wood tones + recolored Unicode glyphs.
  Drop the real assets in and swap `Chessboard.jsx`'s renderer to finalize.
- **Icons** are Lucide paths (matches the brief's "Lucide-style line icons"), inlined as React components.
- **Body font:** Sarasa UI TC Regular self-hosted; 500/700 fall back to Noto Sans TC (see root README).
- Components are cosmetic recreations (no real chess engine / routing) — faithful visuals, simplified logic.
