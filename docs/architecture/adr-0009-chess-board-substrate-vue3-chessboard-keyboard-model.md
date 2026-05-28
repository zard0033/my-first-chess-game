# ADR-0009: Chess Board Substrate, vue3-chessboard Integration, and Custom Roving-Tabindex Keyboard Model

## Status
Accepted

> **Spikes complete (2026-05-28)**: `scripts/spike-adr0009-chessboard-api-audit.mjs` — all three blocking questions answered. Decision §1/§3 patched with concrete API patterns. See Validation Criteria results below.

## Date
2026-05-28

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | Web APIs + vue3-chessboard ^1.x (wraps chessground 9.x) — Web App, no traditional game engine |
| **Domain** | UI Substrate / Chess Board |
| **Knowledge Risk** | MEDIUM — chessground 9.x `config.drawable.shapes` API schema (brush format, shapes array structure) and chessground's internal event propagation model (does it stop pointer/touch events in a way that affects the focus-cell's keydown handler?) may differ from training data. Three BLOCKING spikes resolve all three unknowns before implementation. |
| **References Consulted** | `design/gdd/chess-board-and-move-system.md` (all sections); `design/gdd/move-annotation-display.md` (squareToRect consumer); `docs/architecture/adr-0006-move-annotation-rendering-substrate.md` (coordinate contract consumer); `docs/architecture/architecture-review-2026-05-28.md` (TR-chess-board-001..007 gap analysis) |
| **Post-Cutoff APIs Used** | chessground 9.x `config.drawable.shapes` — confirm brush format and shapes array schema are correct for pinned version. vue3-chessboard ^1.x `boardRef` expose pattern — confirm the library exposes the chessground container element in this version. |
| **Verification Required** | (1) Confirm chessground 9.x `drawable.shapes` API accepts the format used for legal-move dots and capture rings, and that an animation-complete hook exists for `animationDoneAt` (or confirm a timed fallback is needed). (2) Confirm `useBoardKeyboard` focus-cell `keydown` events fire correctly when chessground's own event listeners are active on the same DOM region. (3) Confirm vue3-chessboard ^1.x exposes `boardRef` or equivalent for ResizeObserver and coordinate math. |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | None — vue3-chessboard is already pinned in the tech stack; this ADR formalises how we use it, not whether to use it |
| **Enables** | ADR-0006 (Move Annotation Rendering Substrate) — the `squareToRect()` contract established here is the coordinate source that ADR-0006's SVG overlay consumes. ADR-0006 can reach Accepted once this ADR's `squareToRect()` shape is confirmed by spike. |
| **Blocks** | Chess Board implementation stories cannot begin until this ADR is Accepted. Move Annotation Display implementation stories are transitively blocked (they depend on `squareToRect()` being locked). |
| **Ordering Note** | Foundation-layer ADR. All Chess Board stories and any story that calls `squareToRect()` must list this ADR as a prerequisite. |

## Context

### Problem Statement

The Chess Board & Move System GDD specifies a complete keyboard navigation model (roving
tabindex, arrow/Home/End/PgUp/PgDn keys, Enter/Space, Escape, promotion dialog focus trap,
aria-live announcements) that **chessground 9.x does not provide natively** (GDD Open
Question #7 confirms this). Without a formal ADR, a programmer encountering OQ-7 would face
three structurally different options — fork the library, add a grid overlay, or write a
composable — each with different maintenance costs and accessibility tradeoffs.

Beyond keyboard navigation, this ADR also locks four implementation decisions the GDD
leaves open:

1. **Integration pattern** — how `ChessBoard.vue` wraps vue3-chessboard and what stable API
   it exposes to consumers (Game Lifecycle, Post-Game Review, Move Annotation Display)
2. **Keyboard model** — which of three approaches implements the roving-tabindex spec
3. **Selection overlays** — legal-move dots and capture rings (chessground `drawable.shapes`
   vs Vue-reactive SVG)
4. **squareToRect() contract** — return coordinate space (board-local vs viewport-relative)
   and orientation semantics

Without this ADR, programmers make these choices independently, producing inconsistent
accessibility implementation and API drift across the chess board stories.

### Constraints

- **vue3-chessboard is the pinned library** — alternatives are not in scope (`CLAUDE.md` tech stack)
- **chessground 9.x has no built-in keyboard navigation** (GDD Open Question #7 confirmed)
- **Selection overlays must use chessground `drawable` API** — GDD Tuning Knobs: "Selection
  overlays must use chessground's native `drawable` API, not Vue-reactive SVG children, to
  avoid a full vDOM diff on every selection change (up to 27 simultaneous dots for a centralized
  queen)"
- **squareToRect() is the sole source of square geometry for the annotation overlay** — GDD
  Rule 18: the overlay must never compute its own geometry from CSS layout
- **All animations must use `transform` and `opacity` only** — no `width/height/top/left/
  box-shadow` animations (60fps budget; GDD Tuning Knobs policy)
- **WCAG 2.1 AA compliance** — keyboard navigation is a hard requirement, not a stretch goal
- **Board subsystem bundle ≤ 120 KB gzipped** (GDD performance constraint)

### Requirements

- Expose a stable prop/event API to consumers that hides chessground internals
- Full keyboard navigation matching the GDD specification (roving tabindex, 64 navigable
  squares, arrow/Home/End/PgUp/PgDn/Enter/Space/Escape)
- `move-made` event with `{ from, to, promotion?, fen, animationDoneAt }` payload

> **Spike V.C.1 — `animationDoneAt` (2026-05-28)**: No built-in animation completion hook in vue3-chessboard or chessground. Timed fallback confirmed: `animation.duration` default is **300ms** (not 200ms as originally estimated). `animationDoneAt = new Promise<void>(r => setTimeout(r, configuredAnimDuration))` — store the value when configuring the board.
- `squareToRect(square: Square): { x, y, width, height } | null` via `defineExpose`
- Screen-reader announcements via two `aria-live` regions (assertive + polite)
- Promotion dialog focus trap
- Legal-move dots and capture rings via chessground `drawable.shapes`
- All keyboard navigation and `squareToRect()` orientation-correct for White and Black perspective

## Decision

### 1. Integration Pattern: Thin Adapter Wrapper

`ChessBoard.vue` is a **thin adapter** around `<TheChessboard>` (vue3-chessboard). It:

- Accepts a minimal, semantically stable prop set (`fen`, `playerColor`, `disabled`)
- Emits a single `move-made` event with the GDD-specified payload
- Exposes `boardRef` and `squareToRect()` via `defineExpose` for annotation overlay consumers
- Does **not** leak chessground's own config API to parent components — all chessground
  configuration is internal to `ChessBoard.vue`

> **Spike V.C.3 (2026-05-28)**: `TheChessboard.vue` does NOT call `defineExpose()` and `BoardApi` has no public DOM getter. `boardRef` is captured via `boardConfig.events.insert` callback:
> ```typescript
> const boardRef = ref<HTMLElement | null>(null)
> // inside boardConfig passed to <TheChessboard :boardConfig="boardConfig">:
> events: { insert: (elements) => { boardRef.value = elements.wrap } }
> // elements.wrap === the .cg-wrap element; offsetWidth === full board CSS width
> ```
> Fallback: template ref on wrapper div + `querySelector('.cg-wrap')`.

This thin-wrapper pattern keeps the board API at three concepts (position, ownership,
interactability) and hides chessground's larger config surface (brushes, drawable, movable,
events, animation). If vue3-chessboard or chessground is ever replaced, only `ChessBoard.vue`
changes — no consumer changes.

The board state machine (IDLE / PIECE_SELECTED / MOVING / MOVING_PROMOTION / PROMOTING /
DISABLED) is implemented in a `useBoardStateMachine` composable inside `ChessBoard.vue`.
It is not exposed to parents.

### 2. Keyboard Model: Single Roving Focus Cell (`useBoardKeyboard` composable)

A `useBoardKeyboard(boardRef, stateMachine, chessInstance, orientation)` composable implements
the GDD keyboard model using a **single roving focus cell**: one absolutely-positioned
transparent `<div>` that repositions to the currently focused square.

**Architecture:**

```
<div.board-wrapper
  role="grid"
  aria-label="Chess board"
  aria-rowcount="8"
  aria-colcount="8"
  style="position: relative"
>
  <TheChessboard ... />           ← vue3-chessboard (pieces, animations, drawable overlays)

  <div.focus-cell                 ← single div, repositioned by useBoardKeyboard
    role="gridcell"
    :aria-label="squareAriaLabel(focusedSquare)"
    :aria-rowindex="focusedRank"
    :aria-colindex="focusedFile"
    tabindex="0"
    style="position: absolute; opacity: 0; pointer-events: none"
    :style="focusCellStyle"       ← { top, left, width, height } from squareToRect()
    @keydown="handleKeydown"
  />
</div>
```

**Key behaviours:**

- `focusedSquare: Ref<Square | null>` — the composable's sole internal state
- Arrow keys move `focusedSquare` by one file/rank in the **visual** direction
  (orientation-aware: ArrowLeft on a Black board moves toward the h-file, not the a-file)
- `Home` / `End`: jump to file edge (a-file or h-file) of the current rank
- `PgUp` / `PgDn`: jump to rank edge (rank 1 or rank 8) of the current file
- `Enter` / `Space`: `stateMachine.selectPiece(square)` (own piece in IDLE) |
  `stateMachine.commitMove(square)` (legal destination in PIECE_SELECTED) |
  `stateMachine.cancel()` (selected piece tapped again)
- `Escape`: `stateMachine.cancel()`; return focus to origin or selected square
- Board wrapper: `tabindex="-1"` with a `focus()` call that sets `focusedSquare` to the
  last-focused square (or a1) — making the board a single tab stop per the GDD

**Why not 64-cell grid overlay:** See Alternative 1 below.

**Why not fork chessground:** See Alternative 2 below.

### 3. Selection Overlays: chessground `drawable.shapes`

Legal-move dots (empty destination squares) and capture rings (capturable enemy pieces) are
rendered via **chessground's native `config.drawable.shapes` API**, not Vue-reactive SVG.

When the state machine transitions to PIECE_SELECTED:

```typescript
// Spike V.C.1 confirmed pattern (2026-05-28):
// BoardApi.setShapes() TypeScript restricts brush to 8 fixed BrushColors — cannot use custom names.
// Use boardApi.setConfig() to set both custom brushes AND shapes in one call:
boardApi.setConfig({
  drawable: {
    brushes: {
      // inherit chessground defaults; extend with project-specific brushes
      green: { key: 'green', color: '#15781B', opacity: 1, lineWidth: 10 },
      red:   { key: 'red',   color: '#882020', opacity: 1, lineWidth: 10 },
      // selection feedback brushes (values are tuning knobs — see annotation-tuning.ts)
      legalDot:    { key: 'legalDot',    color: '#3e9c35', opacity: 0.5, lineWidth: 10 },
      captureRing: { key: 'captureRing', color: '#ee6644', opacity: 0.6, lineWidth: 10 },
    },
    shapes: legalSquares.map(sq => ({
      orig: selectedSquare,
      dest: sq,
      brush: isCapture(sq) ? 'captureRing' : 'legalDot',
    })),
  },
})
```

When selection clears: `boardApi.setConfig({ drawable: { shapes: [] } })`

This is the GDD-mandated approach and avoids a full vDOM diff for up to 27 simultaneous
legal-move indicators (centralized queen).

**Distinction from ADR-0006 annotation overlays:** `drawable.shapes` (selection feedback)
and the ADR-0006 custom SVG overlay (post-game review arrows) are two separate rendering
layers at different z-indices serving different systems. They coexist: `drawable.shapes`
lives inside chessground's own SVG; the annotation SVG is mounted above it as a sibling.

### 4. squareToRect() — Board-Local Coordinate Convention

`squareToRect(square: Square)` returns `{ x, y, width, height }` relative to `boardRef`'s
top-left corner (**board-local**, NOT viewport-relative).

```typescript
function squareToRect(square: Square): Rect | null {
  if (!isValidSquare(square)) return null
  const boardEl = boardRef.value
  if (!boardEl) return null
  const boardPx = boardEl.offsetWidth        // board is always square
  const squarePx = boardPx / 8
  const file = square.charCodeAt(0) - 97    // 'a'=0 … 'h'=7
  const rank = parseInt(square[1]) - 1      // '1'=0 … '8'=7
  // Orientation-correct: col 0 = leftmost visual column
  const col = orientation.value === 'white' ? file : 7 - file
  // Orientation-correct: row 0 = topmost visual row
  const row = orientation.value === 'white' ? 7 - rank : rank
  return {
    x: col * squarePx,
    y: row * squarePx,
    width: squarePx,
    height: squarePx,
  }
}
```

**Why board-local (not viewport-relative):** The primary consumer — ADR-0006's SVG overlay —
is absolutely-positioned at `top: 0; left: 0` over `boardRef`, so its SVG coordinate origin
is identical to `boardRef`'s top-left. Board-local coordinates are used directly as SVG
coordinates with zero conversion. The secondary consumer — `useBoardKeyboard`'s focus cell —
uses `top`/`left` CSS offsets relative to `boardRef`, also board-local. Viewport-relative
would require every consumer to subtract `boardRef.getBoundingClientRect()`, creating a bug
surface (stale rects after scroll/resize).

> ⚠️ **Correction to ADR-0006 documentation**: ADR-0006 Decision §2 describes
> `squareToRect()` as returning "viewport-relative coordinates" and states "all square
> coordinates are `squareToRect()` results minus `boardRef.getBoundingClientRect()`". This
> was written before this ADR established the authoritative contract. The **correct
> behaviour is board-local** per the Chess Board GDD Acceptance Criteria. ADR-0006's SVG
> overlay uses `squareToRect()` values directly as SVG coordinates — no subtraction of
> `boardRef`'s viewport position is needed or correct.

### 5. Aria Live Regions

Two `aria-live` regions are mounted in the page layout (not inside the board's DOM subtree,
to avoid re-announcement on board re-renders):

| Region | `aria-live` | Content |
|--------|------------|---------|
| `#board-assertive` | `assertive` | Move feedback: legal moves, illegal rejections, check, checkmate, stalemate, promotion dialog open |
| `#board-polite` | `polite` | Ambient state: turn changes, opponent's move (fired after animation completes) |

**Merge policy (GDD live-region collision rule):** If two announcements would fire within
100ms, they are merged into a single string separated by `"; "`. Implementation: a
`pendingAssertive: string[]` queue flushed via a 100ms debounce. This prevents screen
readers from dropping the second announcement in a rapid sequence (e.g., capture + check →
`"Nxe5, capturing knight; Check"`).

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  ChessBoard.vue                                             │
│                                                             │
│  Props:  fen, playerColor, disabled                         │
│  Emits:  move-made { from, to, promotion?, fen,             │
│                      animationDoneAt: Promise<void> }       │
│  Expose: boardRef: HTMLElement                              │
│          squareToRect(sq): { x, y, width, height } | null  │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  <div.board-wrapper role="grid" position:relative>     │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  <TheChessboard> (vue3-chessboard)               │  │ │
│  │  │  ├── chessground canvas (pieces, animations,     │  │ │
│  │  │  │   last-move tint, check glow, board colors)  │  │ │
│  │  │  └── chessground SVG (drawable.shapes:           │  │ │
│  │  │      legal-move dots, capture rings)             │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  <div.focus-cell>                                │  │ │
│  │  │  role="gridcell", tabindex="0"                   │  │ │
│  │  │  opacity: 0; pointer-events: none                │  │ │
│  │  │  Positioned at focusedSquare via squareToRect()  │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  Composables (internal — not exposed):                      │
│  ├── useBoardStateMachine(chess, chessgroundApi)            │
│  ├── useBoardKeyboard(boardRef, stateMachine, orientation)  │
│  └── useBoardAnnouncer(stateMachine, chess)                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Move Annotation Display (ADR-0006 consumer)                │
│  Accesses squareToRect() via Vue template ref to            │
│  ChessBoard.vue (defineExpose). Renders SVG overlay above   │
│  drawable.shapes layer, below promotion dialog.             │
└─────────────────────────────────────────────────────────────┘

Page layout (outside board):
  <div id="board-assertive" aria-live="assertive" aria-atomic="true" />
  <div id="board-polite"    aria-live="polite"    aria-atomic="false" />
```

### Key Interfaces

```typescript
// ChessBoard.vue props
interface ChessBoardProps {
  fen: string             // current position; invalid FEN → fallback to start position + console error
  playerColor: Color      // 'white' | 'black'; controls auto-orient
  disabled: boolean       // true = opponent's turn or game ended; all input ignored
}

// move-made event payload (GDD Core Rule 12 + States and Transitions note)
interface MoveMadePayload {
  from: Square                    // e.g. 'e2'
  to: Square                      // e.g. 'e4'
  promotion?: PromotionPiece      // 'q' | 'r' | 'b' | 'n'; undefined for non-promotion
  fen: string                     // position AFTER the move (verified by re-feeding into chess.js)
  animationDoneAt: Promise<void>  // resolves when slide animation + capture fade complete
                                  // consumers that need the visual to finish await this
}

// ChessBoard.vue defineExpose
interface ChessBoardExposed {
  boardRef: HTMLElement   // the chessground container element; used by ResizeObserver + coordinate math
  squareToRect(square: Square): {
    x: number      // pixels from boardRef's left edge; board-local, orientation-corrected
    y: number      // pixels from boardRef's top edge; board-local, orientation-corrected
    width: number  // squarePx = boardEl.offsetWidth / 8
    height: number // == width (square cells are always equal-sided)
  } | null          // null if square identifier is invalid (e.g. 'z9', 'a9', '')
}
```

## Alternatives Considered

### Alternative 1: 64-Cell Transparent Div Grid Overlay

- **Description**: A full 8×8 grid of absolutely-positioned transparent `<div>` cells covering
  the board, each with `role="gridcell"`, `aria-label`, and roving `tabindex`. Keyboard events
  handled on the grid container.
- **Pros**: Full ARIA grid semantics; screen readers in browse mode can navigate all 64 squares
  without JavaScript involvement; all squares present in the accessibility tree simultaneously.
- **Cons**: 64 DOM nodes. `aria-label` for all 64 squares updates on every FEN change (O(64)
  vDOM diff per move). ResizeObserver must update all 64 cell positions on board resize. Heavier
  memory footprint than a single roving cell.
- **Rejection Reason**: The 64-diff-per-move overhead is non-trivial for the GDD's 60fps
  requirement and mobile CPU budget. A screen reader user navigating a chess board moves one
  square at a time — the single roving cell provides identical keyboard UX with O(1) overhead.
  The `role="grid"` on the wrapper still satisfies ARIA grid semantics.

### Alternative 2: Fork vue3-chessboard / chessground

- **Description**: Maintain a local fork of chessground (or vue3-chessboard) in
  `src/vendor/chessground/` with keyboard navigation added to the library's event system.
- **Pros**: Keyboard is native to the board render cycle; no separate composable to maintain.
- **Cons**: Fork diverges from the pinned version over time. Keyboard nav is not part of
  chessground's public API contract — upstream may add incompatible keyboard handling. All
  future vue3-chessboard updates require manual rebase. Fork is invisible to project-level
  version management.
- **Rejection Reason**: Maintenance burden without proportional benefit. The composable achieves
  the same keyboard UX with zero forking risk and aligns with the project's dependency-injection
  philosophy.

### Alternative 3: Vue-Reactive SVG for Selection Overlays

- **Description**: Render legal-move dots and capture rings as Vue `<circle>` / SVG elements
  in a reactive SVG sibling to chessground (similar pattern to ADR-0006's annotation overlay).
- **Pros**: Full TypeScript control over dot sizing, color, and opacity.
- **Cons**: vDOM diff on every PIECE_SELECTED transition for all legal squares. GDD Tuning Knobs
  explicitly bans this: "Selection overlays must use chessground's native `drawable` API, not
  Vue-reactive SVG children."
- **Rejection Reason**: GDD prohibition. Chessground's own layer is the correct owner of
  real-time selection feedback (selection is a board-internal concern); annotation arrows are
  a separate cross-system concern owned by Move Annotation Display.

## Consequences

### Positive

- `ChessBoard.vue`'s stable prop/event API isolates all chessground details — consumers
  (Game Lifecycle, Post-Game Review, Move Annotation Display) are insulated from library changes
- Single roving focus cell: O(1) DOM overhead vs O(64) for the grid overlay alternative
- `squareToRect()` board-local return convention means ADR-0006's SVG overlay uses values
  directly — zero conversion, zero stale-rect bug surface
- `drawable.shapes` for selection overlays: no vDOM diff overhead on PIECE_SELECTED transitions
- No library fork: keyboard model survives future chessground/vue3-chessboard updates unchanged

### Negative

- `useBoardKeyboard` is ~200 lines of custom keyboard event handling; this code must be tested
  and maintained as part of the chess board implementation
- Single roving focus cell: a screen reader user in browse mode (not application mode) sees one
  cell at a time — full board exploration requires arrowing through sequentially. This matches
  the GDD's deliberate single-tab-stop model but may be unfamiliar to AT users accustomed to
  full grid navigation on other chess sites.

### Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| chessground 9.x `drawable.shapes` API has a different schema than assumed | Medium | High — selection overlays won't render | **Spike V.C.1** confirms exact API schema and `animationDoneAt` hook before implementation |
| chessground's pointer/touch event handling blocks `focus-cell` `keydown` events | Low | High — keyboard nav silently broken | **Spike V.C.2**; fallback: mount focus cell outside chessground's DOM subtree |
| `squareToRect()` returns stale values after rapid board resize | Low | Low — annotation geometry briefly incorrect | `ResizeObserver` on `boardRef`; values are computed live (`offsetWidth`) not cached |
| ADR-0006 implementation uses viewport-relative assumption (pre-correction) | Medium | Medium — annotation SVG offset by scroll amount | Correction documented in Decision §4; CI test: annotation arrow tip lands at expected SVG coords |
| vue3-chessboard ^1.x does not expose `boardRef` in this version | Low | High — `squareToRect()` cannot be implemented without DOM access | **Spike V.C.3**; fallback: wrapper `ref` on the div that contains `<TheChessboard>` |

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| chess-board-and-move-system.md | Core Rule 1: Render current position from FEN | Decision §1: `fen` prop drives vue3-chessboard's position config |
| chess-board-and-move-system.md | Core Rules 2–3: Drag + tap-tap input; legal-move selection feedback | Decision §1: vue3-chessboard handles pointer input; Decision §3: dots/rings via `drawable.shapes` |
| chess-board-and-move-system.md | Core Rule 12: Emit `move-made` event after each successful move | Decision §1: `move-made` emit with GDD-specified payload including `animationDoneAt: Promise<void>` |
| chess-board-and-move-system.md | Rule 18 / squareToRect() contract | Decision §4: board-local coordinate implementation, exact return type, and orientation semantics |
| chess-board-and-move-system.md | Accessibility: Keyboard navigation (roving tabindex, arrow/Home/End/PgUp/PgDn, Enter/Space, Escape) | Decision §2: `useBoardKeyboard` composable implements the complete GDD keyboard specification |
| chess-board-and-move-system.md | Accessibility: `aria-live` regions (assertive + polite) and 100ms merge policy | Decision §5: two `aria-live` regions with debounce merge |
| chess-board-and-move-system.md | Tuning Knobs: selection overlays must use chessground `drawable` API (not Vue-reactive SVG) | Decision §3: mandated approach implemented; Alternative 3 (Vue SVG) explicitly rejected |
| move-annotation-display.md | squareToRect() as sole source of board geometry for SVG overlay | Decision §4: coordinate contract established; ADR-0006 viewport-relative documentation error corrected |

## Performance Implications

- **CPU**: O(1) DOM update per focused-square change. `drawable.shapes` avoids vDOM diff on
  PIECE_SELECTED. No regression vs raw vue3-chessboard.
- **Memory**: `useBoardKeyboard` + `useBoardStateMachine` composables: < 5 KB heap. One
  additional DOM node (focus cell). Annotation SVG overhead is ADR-0006's concern.
- **Load Time**: No new bundle dependencies. `ChessBoard.vue` + composables add ~200 lines
  (≤ 3 KB minified gzipped). Total chess board subsystem must remain ≤ 120 KB gzipped (GDD
  constraint) — this ADR adds negligible overhead.
- **Network**: None — no additional fetches.

## Migration Plan

No existing chess board implementation. This ADR establishes the initial substrate for a
greenfield implementation. No migration required.

## Validation Criteria

1. **[Spike — drawable.shapes schema + `animationDoneAt`]** ✅ COMPLETE (2026-05-28)
   Script: `scripts/spike-adr0009-chessboard-api-audit.mjs`

   | Question | Result |
   |---|---|
   | Custom brush names via `setShapes()` | ❌ Restricted to 8 `BrushColor` values — use `setConfig({ drawable: { brushes, shapes } })` instead |
   | Custom brushes via `setConfig()` | ✅ `BoardConfig.drawable.brushes` uses chessground's open `DrawBrushes` — any key allowed |
   | Shapes render and clear via `setConfig` | ✅ Confirmed (chessground `drawable.shapes` driven by `setConfig`) |
   | `animationDoneAt` built-in hook | ❌ NONE — timed fallback: `new Promise(r => setTimeout(r, configuredAnimDuration))` |
   | Default `animation.duration` | **300ms** (not 200ms as estimated) |

2. **[Spike — focus-cell keydown event propagation]** ✅ COMPLETE (2026-05-28)
   Script: `scripts/spike-adr0009-chessboard-api-audit.mjs`

   | Question | Result |
   |---|---|
   | chessground registers keydown/keyup listener | ❌ NO — only `contextmenu`, `touchstart`, `mousedown` |
   | `pointer-events: none` blocks keyboard events | ❌ NO (CSS spec: pointer-events is pointer-only) |
   | Focus-cell keydown fires when focused | ✅ YES — guaranteed by browser spec |
   | DOM structure change needed | ❌ NO — Decision §2 diagram implementable as specified |

3. **[Spike — vue3-chessboard `boardRef` exposure]** ✅ COMPLETE (2026-05-28)
   Script: `scripts/spike-adr0009-chessboard-api-audit.mjs`

   | Question | Result |
   |---|---|
   | `TheChessboard.vue` calls `defineExpose()` | ❌ NO — not in component setup |
   | `BoardApi` has public DOM getter | ❌ NO — `board` element is private field |
   | `boardConfig.events.insert` callback available | ✅ YES — present in `BoardConfig.d.ts` and confirmed called in bundle |
   | `elements.wrap` gives `.cg-wrap` element | ✅ YES — same element passed to chessground init; `offsetWidth` = full board CSS size |

4. **[Unit — `squareToRect()` board-local convention]**
   On a 400 px board (White orientation):
   - `squareToRect('a8')` → `{ x: 0, y: 0, width: 50, height: 50 }` (top-left square)
   - `squareToRect('h1')` → `{ x: 350, y: 350, width: 50, height: 50 }` (bottom-right)
   - `squareToRect('e4')` → `{ x: 200, y: 200, width: 50, height: 50 }` (e-file col 4, rank 4)
   On a 400 px board (Black orientation):
   - `squareToRect('a8')` → `{ x: 350, y: 350, width: 50, height: 50 }` (flipped)
   - `squareToRect('h8')` → `{ x: 0, y: 0, width: 50, height: 50 }` (top-left when Black)
   - `squareToRect('z9')` → `null` (invalid square)
   - `squareToRect('')`   → `null` (empty string)

5. **[Unit — keyboard navigation orientation-awareness]**
   White orientation: `ArrowRight` on `e4` → `focusedSquare` becomes `f4`
   Black orientation: `ArrowRight` on `e4` → `focusedSquare` becomes `d4` (visual right = d-file)
   White orientation: `Home` on `e4` → `a4`; `End` on `e4` → `h4`
   Black orientation: `Home` on `e4` → `h4`; `End` on `e4` → `a4`
   Any orientation: `PgUp` on `e4` → `e8`; `PgDn` on `e4` → `e1`

6. **[Unit — `aria-live` merge policy]**
   Dispatch two assertive announcements within 50ms → one merged announcement fires.
   Dispatch two assertive announcements 150ms apart → two separate announcements fire.

7. **[E2E — full keyboard game flow]**
   Playwright: Tab to board → Arrow keys to e2 → Enter (select pawn, dots appear) →
   Arrow keys to e4 → Enter (commit move). Assert: `move-made` event fires with
   `{ from: 'e2', to: 'e4', promotion: undefined, fen: '<e4 position FEN>' }`.

8. **[E2E — axe-core accessibility baseline]**
   Playwright + `@axe-core/playwright`: mount `ChessBoard` in starting position →
   no axe violations of impact `serious` or `critical` are reported.

## Related Decisions

- [ADR-0006](adr-0006-move-annotation-rendering-substrate.md) — annotation SVG overlay
  consumes `squareToRect()` via template ref; Decision §4 corrects ADR-0006's coordinate
  description from "viewport-relative" to "board-local"
- [ADR-0005](adr-0005-pinia-store-boundaries-and-completed-game-transport.md) — Game Lifecycle
  reads from `gameStore` and drives `ChessBoard.vue`'s `fen` + `disabled` props reactively
- [ADR-0002](adr-0002-web-worker-isolation-and-uci-protocol.md) — Chess Engine Integration is
  triggered by `move-made` events emitted from this system; the `animationDoneAt` promise lets
  the engine wait for visual completion before announcing the AI's response move
- `design/gdd/chess-board-and-move-system.md` — the GDD this ADR implements
- `design/gdd/move-annotation-display.md` — primary external consumer of `squareToRect()`
- `design/gdd/post-game-review.md` — reuses `ChessBoard.vue` in DISABLED mode for replay
