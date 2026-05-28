# Accessibility Requirements

> **Status**: Draft
> **Author**: Eason + Claude
> **Last Updated**: 2026-05-28
> **Applies to**: Chess Training Companion v0 — all screens and components

---

## Committed Tier

**WCAG 2.1 Level AA** for all v0 screens.

Source: Chess Board GDD §UI Requirements explicitly states WCAG 2.1 AA; applied uniformly to all screens.

WCAG 2.1 AA covers:
- Perceivable: 1.1 text alternatives, 1.3 adaptable, 1.4 distinguishable (contrast, resize, reflow)
- Operable: 2.1 keyboard accessible, 2.5 input modalities
- Understandable: 3.x readable, predictable
- Robust: 4.1 compatible with assistive technology

v0 exclusions (not applicable to this product):
- Live captions (no live video/audio streams)
- Sign language interpretation
- Extended audio description (no video content)

---

## Global Requirements

### 1. Touch & Pointer Targets

All interactive elements must have an effective hit area of **≥ 44 × 44px** on mobile viewports
(binding requirement per `technical-preferences.md`).

Exceptions:
- Chess board squares at minimum board size (352px): each square is exactly 44×44px — compliant.
  The 280–351px band is documented non-conformant; the responsive layout must not reach this band
  unless the viewport is physically too small (SC 1.4.10 reflow applies instead).
- Promotion dialog piece buttons: **≥ 56×56px** — elevated above minimum because this is a
  critical, infrequent, and irreversible action (Chess Board GDD §Promotion dialog UI).

Spacing: no two adjacent touch targets closer than 8px edge-to-edge.

Pointer types: all interactions achievable by both `pointer: fine` (mouse) and `pointer: coarse`
(touch). No fine-motor-only interactions.

### 2. Keyboard Navigation

All interactive elements reachable by Tab traversal (SC 2.1.1).

Focus management rules:
- **Visible focus indicator**: ≥ 3:1 contrast between focused and unfocused states (SC 2.4.11 AA).
- **No focus trap outside modals**: when a dialog opens, focus moves in; when it closes, focus
  returns to the trigger element (SC 2.1.2).
- **Tab order** follows visual reading order (SC 2.4.3).
- No keyboard shortcut conflicts with browser defaults (SC 2.1.4).

Screen-specific keyboard models:
- **Chess board**: roving tabindex — single tab stop for the whole board; internal navigation via
  arrow keys. Full spec in Per-System Requirements §Chess Board. Implemented via `useBoardKeyboard`
  composable (ADR-0009).
- **Setup screen**: standard Tab / Shift-Tab through color selector → skill selector → Start button.
- **Post-Game Review**: standard Tab through Previous / Next / Jump / Exit; board nav same as
  play mode.
- **Dialogs (resign confirm, promotion)**: focus trap; Escape behavior per each dialog's design
  (resign confirm → Cancel; promotion dialog → cancel the entire move and snap pawn back).

### 3. Color & Contrast

| Context | Minimum ratio | Standard |
| ------- | ------------- | -------- |
| Body text, labels, eval numbers, opening name | 4.5:1 | SC 1.4.3 AA |
| Large text (≥ 18pt normal or ≥ 14pt bold) | 3:1 | SC 1.4.3 AA |
| Non-text UI components (icon borders, focus indicators, state indicators) | 3:1 | SC 1.4.11 AA |
| Piece SVG outline vs square color | 4.5:1 against both light and dark squares | SC 1.4.3 AA |
| Legal-move dots | 3:1 against both default square colors; add 1px outline if one fill cannot satisfy both | SC 1.4.11 AA |
| Last-move tint + selection tint | 3:1 against unhighlighted square (tints must be visibly distinct from a plain square) | SC 1.4.11 AA |
| Check border ring | 3:1 against king's square color (ring is the non-color cue; red glow is supplementary) | SC 1.4.11 AA |

**No color-only signaling** (SC 1.4.1): every state communicated by color must also be
communicated by shape, text, or position.
- Check: border ring (shape) + red glow (color) + screen-reader announcement (text) — any one alone is sufficient.
- Move legality: legal-move dots and capture rings are shape cues, not color-dependent.
- Eval bar: position (height fill) + numeric eval badge (text) — not color alone.

### 4. Motion & Animation

**`prefers-reduced-motion: reduce`** — when set, **all animation durations collapse to
`reducedMotionDurationMs` (default 0 = instant)**. No partial reduction (e.g., "80% shorter") —
partial reduction still produces motion artifacts on iOS WebKit and fails WCAG intent.

Specific behaviors under reduced motion:
- Piece slide → instant placement
- Capture fade → instant removal
- Snap-back → instant return to origin
- Promotion tint → single-frame highlight (no fade-in)
- Check pulse → removed; border ring remains at full opacity
- Eval bar transitions → instant
- Route/screen transitions → instant or opacity-only crossfade (no transform/slide)

All animations use `transform` and `opacity` only — `width`, `height`, `top`, `left`,
`box-shadow` animations are forbidden (60fps budget + GPU compositor requirement).

### 5. Screen Reader Support

Primary AT targets: Safari + VoiceOver (iOS), Chrome + NVDA/JAWS (Windows).

- All non-decorative images: `alt` text (SC 1.1.1).
- Icon-only buttons: `aria-label` or visually-hidden text.
- All form inputs: associated `<label>` or `aria-labelledby` (SC 1.3.1, 4.1.2).
- Interactive elements: semantic roles or explicit ARIA roles matching behavior (SC 4.1.2).
- `<html lang="en">` (SC 3.1.1).

Dynamic content updates:
- Urgent, action-required: `aria-live="assertive"`.
- Non-urgent status: `aria-live="polite"`.
- Never use `assertive` for non-urgent content (interrupts in-progress reading).

**100ms merge policy**: if two `assertive` announcements fire within 100ms of each other, merge
into one concatenated string — e.g., `"Nxe5, capturing knight, check"`. Prevents announcement
queue overflow on rapid game events.

### 6. Forced Colors / High Contrast Mode

When `forced-colors: active` (Windows High Contrast Mode):
- Legal-move dots and capture rings: use `SelectedItem` / `Highlight` system colors + 1px solid outline.
- Last-move tint and selection tint: replace fills with **2px solid outlines** (fills are removed by
  forced-colors and become invisible).
- Check border ring: use `CanvasText` color.
- Piece SVGs: use `currentColor` or `fill: CanvasText` to remain visible.

(Source: Chess Board GDD §Visual > Forced-colors / Windows High Contrast Mode fallback)

### 7. Zoom & Reflow

- **200% zoom** (SC 1.4.4): text resizes to 200% without loss of content or functionality;
  no horizontal scrolling required.
- **400% zoom / 1280×320 CSS px** (SC 1.4.10 reflow): content reflows to single column with no
  horizontal scroll — except for the chess board grid itself, which requires two-dimensional
  layout and may use full viewport width.
- At 200% zoom on 1280×800: board remains functional with no horizontal scroll; promotion dialog
  reflows to fit.
- **Text spacing** (SC 1.4.12): layout remains usable when `line-height: 1.5`, `letter-spacing:
  0.12em`, `word-spacing: 0.16em`, `paragraph-spacing: 2em` are applied.

---

## Per-System Requirements

### Chess Board

Source: `design/gdd/chess-board-and-move-system.md` §UI Requirements > Accessibility
ADR: `docs/architecture/adr-0009-chess-board-substrate-vue3-chessboard-keyboard-model.md`

This system has the project's most demanding accessibility requirements due to the complexity of
a chess grid as an interactive widget.

#### Keyboard Model (roving tabindex)

The board is a **single tab stop**. Internal navigation:

| Key | Action |
| --- | ------ |
| `ArrowLeft/Right/Up/Down` | Move focus one square in **visual** direction (orientation-aware: ArrowLeft on a flipped Black board → h-file direction) |
| `Home` / `End` | Jump to file edge (a-file or h-file) on the current rank |
| `PgUp` / `PgDn` | Jump to rank edge (rank 1 or rank 8) on the current file |
| `Enter` or `Space` on own piece | Enter PIECE_SELECTED; legal destinations highlighted |
| `Enter` or `Space` on legal destination | Commit the move |
| `Enter` or `Space` on selected piece | Cancel selection |
| `Escape` | Cancel selection / move; return focus to origin square |

Promotion dialog keyboard:
- Focus trapped inside the four piece buttons
- Arrow keys cycle: Queen ↔ Rook ↔ Bishop ↔ Knight
- Digit keys 1/2/3/4 select directly
- Enter commits; Escape cancels the entire move (pawn snaps back)

#### ARIA Structure

```html
<div role="grid" aria-label="Chess board" aria-rowcount="8" aria-colcount="8">
  <TheChessboard />  <!-- vue3-chessboard: pieces, animations, drawable overlays -->
  <div class="focus-cell"
    role="gridcell"
    tabindex="0"
    :aria-label="squareAriaLabel(focusedSquare)"
    :aria-rowindex="focusedRank"
    :aria-colindex="focusedFile"
    style="position: absolute; opacity: 0; pointer-events: none"
  />
</div>
```

Square `aria-label` format: `"e4, empty"` / `"e4, white knight"` / `"e4, black queen"`.

Promotion dialog: `role="dialog" aria-modal="true" aria-label="Promote pawn"`;
each button: `aria-label="Promote to queen"` etc.

#### `aria-live` Regions

Mounted **outside** the board's DOM subtree to avoid re-announcement on board re-renders.

| Region ID | `aria-live` | Content |
| --------- | ----------- | ------- |
| `#board-assertive` | `assertive` | Legal moves (`"e4"`, `"Nxe5, capturing knight"`, `"O-O"`, `"e8=Q"`), illegal rejection (`"Illegal move, knight returned to g1"`), check, checkmate, stalemate, promotion dialog open (`"Promote pawn — choose Queen, Rook, Bishop, or Knight"`) |
| `#board-polite` | `polite` | Turn change (`"Black to move"`), opponent's move (`"Black plays Nxe5"`) — fired after move animation completes |

Merge policy: two assertive announcements within 100ms → one merged string.

#### Drag Accessibility (SC 2.5.7)

Tap-to-select is the **complete-feature equivalent** of drag-and-drop — no chess move requires
dragging. Switch access and voice-control users use tap-tap or keyboard exclusively.

---

### Setup Screen

Source: `design/gdd/game-lifecycle.md` §UI Requirements

- Color selector (White / Black / Random): keyboard-navigable (radio group or equivalent).
- Skill level selector: keyboard-navigable (arrow keys or Tab for select/stepper).
- "Start Game" button: ≥ 44×44px.
- All inputs have associated labels.

UX spec: `design/ux/setup-screen.md` (to be authored in Pre-Production).

---

### Post-Game Review

Source: `design/gdd/post-game-review.md` §UI Requirements > Constraints

- Previous / Next navigation: ≥ 44×44px; **visible and disabled** at boundary positions (not hidden).
- Jump to biggest-swing button: ≥ 44×44px; **visible and disabled** when `biggestSwingCursor` is null.
- Exit / Back button: ≥ 44×44px.
- No hover-only interactions; all controls functional with tap/click only.
- Eval bar: numeric eval badge (text) accompanies bar; forced-mate as `M3` / `M-3` text — not color alone.
- Arrow legend: text label required for each arrow role (not icon-only).
- cpLoss chip: text value shown; color coding (if any) is supplementary to the numeric value.
- Mobile default (< 768px): best-move arrow only + numeric eval badge — reduced visual complexity
  aids cognitive accessibility for beginners.

UX spec: `design/ux/post-game-review.md` (to be authored in Pre-Production).

---

### Game Export

Source: `design/gdd/game-export-share.md`

- "Analyze with Claude" button: primary-action styling; ≥ 44×44px.
- Fallback `<textarea>` (Clipboard API unavailable): accessible with associated `<label>` +
  visible instructions; keyboard-selectable content.
- "Copied!" success feedback: `aria-live="polite"` announcement in addition to visual indicator
  (not color-only).
- iOS Web Share sheet: native OS UI — accessibility handled by OS; no additional ARIA required.

UX spec: `design/ux/game-export.md` (to be authored in Pre-Production).

---

## Testing Requirements

### Automated (blocking gate — CI must pass)

| Test | Tool | Pass Criteria |
| ---- | ---- | ------------- |
| axe-core audit — Home screen | `@axe-core/playwright` | 0 `serious` or `critical` violations |
| axe-core audit — Play screen (in-game) | `@axe-core/playwright` | 0 `serious` or `critical` violations |
| axe-core audit — Review screen | `@axe-core/playwright` | 0 `serious` or `critical` violations |
| Keyboard game flow: Tab → board → arrow to e2 → Enter → arrow to e4 → Enter | Playwright | `move-made` event fires with `{ from: 'e2', to: 'e4' }` |
| Focus trap: promotion dialog — Tab never exits; Escape cancels | Playwright | Focus stays inside dialog; Escape → pawn at origin |
| Focus trap: resign confirm dialog | Playwright | Focus stays inside dialog; Escape = Cancel |
| `aria-live` merge policy | Vitest | Two assertive dispatches ≤ 50ms apart → one merged string |
| Keyboard orientation-awareness (Black perspective) | Vitest | ArrowRight on e4 (Black board) → focusedSquare = d4 |
| `prefers-reduced-motion` | Playwright | `pieceMoveAnimationMs` = 0 under `reduce` preference |

### Manual (advisory — pre-production sign-off required)

| Check | Method | Evidence |
| ----- | ------ | -------- |
| VoiceOver + Safari iOS: play one complete move; confirm announcement | iPhone, manual | `tests/evidence/` screenshot + notes |
| 200% browser zoom: board usable, no horizontal scroll | Chrome DevTools | `tests/evidence/` |
| Windows High Contrast Mode: board readable | Edge + Windows Settings | `tests/evidence/` |
| Keyboard-only: complete game from Setup → play → Review | Keyboard only, no mouse/touch | `tests/evidence/` |
| Promotion dialog: all key paths (arrow keys, digit keys, Escape) | Keyboard only | `tests/evidence/` |

---

## Open Questions

1. **Unspecced screens**: Setup screen, Post-Game Review, and Game Export UX specs are pending
   Pre-Production authoring. Those specs must not contradict this document; this document takes
   precedence.

2. **axe-core false positive risk**: The single roving-focus-cell pattern (ADR-0009) is
   semantically correct but non-standard. If axe-core flags `role="grid"` with a single
   dynamic `role="gridcell"`, document it as a known false positive with rationale in the test
   file — not as an exception to this document.

3. **Eval bar forced-colors**: Under `forced-colors`, the white/black fill becomes a
   single-color fill, potentially indistinguishable. Mitigation: add a center divider line
   (geometric cue). To be decided in the Post-Game Review UX spec.

4. **VoiceOver + chessground SVG**: chessground renders pieces as SVG; VoiceOver may attempt to
   read piece SVG nodes directly. All piece `<use>` / `<image>` elements inside chessground
   should carry `aria-hidden="true"` (screen reader reads the focus-cell `aria-label` instead).
   To be confirmed during the ADR-0009 boardRef spike.
