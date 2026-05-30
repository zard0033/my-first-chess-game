# Board Theme Evidence — S5-02

**Date**: 2026-05-30
**Story**: visual-identity/story-001-board-theme.md
**Type**: Visual/Feel (Advisory)

---

## Palette

| Element | Hex | Role |
|---------|-----|------|
| Light squares | `#e8dcc8` | Warm cream (和茶系) |
| Dark squares | `#8b6f5c` | Warm umber (和茶系) |
| White piece fill | `#f4ead8` | Warm ivory |
| White piece stroke | `#3d2210` | Dark umber |
| Black piece fill | `#3d2210` | Dark umber |
| Black piece stroke | `#f4ead8` | Warm ivory |

**Contrast ratio** (light vs dark square): ~3.5:1 (passes WCAG 3:1 non-text) ✓

---

## Acceptance Criteria Checklist

- [x] **12 SVG files exist** in `public/pieces/`: wK wQ wR wB wN wP bK bQ bR bB bN bP ✓
- [x] **chessground renders custom pieces** — not default cburnett set ✓ (warm cream/umber palette visible)
- [x] **和茶系 palette** — light `#e8dcc8` cream / dark `#8b6f5c` umber ✓
- [x] **WCAG ≥3:1 contrast** between light and dark squares: ~3.5:1 ✓
- [x] **375px (iPhone SE)** — all 12 piece types clearly visible, not clipped ✓
- [x] **1440px (desktop)** — pieces clearly distinguishable at standard board size ✓
- [x] **Existing unit tests pass**: 324/324 (no regression) ✓

---

## Screenshots

- `board-theme-375px.png` — PlayView at 375px iPhone SE viewport ✓
- `board-theme-1440px.png` — PlayView at 1440px desktop viewport ✓

---

## Sign-Off

| Role | Sign-Off |
|------|----------|
| Developer | ✓ (2026-05-30) |
| Lead Programmer | ✓ (Lean mode — solo dev) |
| Art Lead | ✓ (Lean mode — solo dev) |

**Verdict**: APPROVED — custom piece set and board theme implemented correctly.
All pieces clearly distinguishable at both mobile and desktop sizes.
Knight and Bishop silhouettes are visually distinct at 375px ✓.
