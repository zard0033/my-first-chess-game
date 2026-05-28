# ADR-0006: Move Annotation Rendering Substrate

## Status
Proposed

> **Next action to reach Accepted**: Complete the 1-day chessground `drawable` spike (Validation Criterion 1) to confirm or update the provisional decision below. If the spike proves chessground sufficient, update Decision §1 and remove the "provisional" qualifier.

## Date
2026-05-28

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | Web APIs: SVG, chessground 9.x (via vue3-chessboard), CSS — Web App, no traditional game engine |
| **Domain** | Core / Move Annotation Display (rendering layer) |
| **Knowledge Risk** | MEDIUM — chessground 9.x `drawable` API shape contracts (brush format, shape rendering behavior, arrowhead termination point) are specific to the pinned version and may differ from what the LLM knows from older versions. The spike (Validation Criterion 1) resolves this. |
| **References Consulted** | `design/gdd/move-annotation-display.md` (Core Rules 1–14, Formulas 1–4, Open Questions OQ#1); `design/gdd/post-game-review.md` (Visual Requirements, Arrow section); `docs/architecture/architecture.md` (MoveAnnotationDisplay module, Key Interfaces) |
| **Post-Cutoff APIs Used** | chessground 9.x `drawable` API — arrowhead termination geometry and per-brush color capabilities may differ from training data. Confirm via spike. |
| **Verification Required** | OQ#1 spike: can chessground `drawable` express (a) per-role neutral colors, (b) arrowheads at square edge, (c) operate alongside a separate eval bar? One-day code check before implementation begins. |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | None beyond the chess-board module being buildable |
| **Enables** | Move Annotation Display implementation stories; Post-Game Review implementation stories (consumes annotation rendering) |
| **Blocks** | Move Annotation Display cannot be implemented without knowing the rendering substrate |
| **Ordering Note** | Should be resolved (spike complete) before Post-Game Review implementation begins, since PostGameReview is the primary consumer |

## Context

### Problem Statement

The Move Annotation Display GDD requires a rendering layer that draws neutral arrows, square highlights, and an evaluation bar onto the chess board. Two substrate candidates exist: (a) chessground's built-in `drawable` API (native to the library bundled via `vue3-chessboard`) and (b) a custom `pointer-events: none` SVG overlay mounted over the `boardRef` element. The choice has cascading consequences for: arrow geometry control (arrowhead termination point), per-role color semantics, the Pillar 3 neutrality constraint, and the separation between the eval bar and the annotation layer.

GDD Open Question #1 explicitly documents this spike. Without a formal ADR, a programmer could pick chessground `drawable` for its simplicity without verifying whether it can express the required arrowhead-at-edge geometry (GDD Rule 12) or deterministic per-role neutral colors (GDD Rule 4) — leading to a mid-implementation pivot to custom SVG.

### Constraints

- **Arrowheads must terminate at the destination square edge**, not its center (GDD Core Rule 12 — the arrowhead tip is placed at the intersection of the arrow line and the destination-square boundary, keeping the piece glyph ≥70% unoccluded).
- **Per-role neutral colors** — `bestMove` / `playedMove` / `alternateLine` / `threat` each have distinct, configurable colors that carry semantic (navigational) meaning, never emotional valence. Colors must be per-role, not global.
- **Eval bar is separate from the annotation layer** — it lives in the surrounding layout, not inside the board SVG. The annotation substrate must not couple to the eval bar placement.
- **`pointer-events: none` on the overlay** — annotations must never capture clicks; all board input goes through chessground.
- **Board orientation awareness** — annotations are authored in algebraic square names and must automatically flip with the board orientation.
- **60fps resize handling** — geometry must recompute via `requestAnimationFrame` throttle on board resize (GDD Formula 4).

### Requirements

- One or more neutral-colored, role-tagged arrows (up to `maxArrows = 4`, configurable)
- One or more square highlights (translucent fill / ring, configurable opacity)
- Arrow geometry: shaft width and head size scale with board pixel size per Formula 2
- Arrowhead terminates at destination square edge, not center (Formula 2, Rule 12)
- Declarative input: `annotations: Annotation[]` prop; full overlay re-render on prop change
- Eval bar rendered in layout (not in board SVG) — substrate must not prevent this placement
- `aria-hidden="true"` on the annotation overlay (decorative SVG)
- `forced-colors` fallback: arrow outlines use system colors

## Decision

### 1. Provisional Decision: Custom SVG Overlay over `boardRef`

**Provisional** (pending the OQ#1 spike — see Validation Criteria): the rendering substrate is a **custom `pointer-events: none` SVG element** absolutely-positioned over the `boardRef` element, sized to match it exactly.

The eval bar is a separate layout element outside the SVG (a vertical flex child or absolutely-positioned strip alongside the board), not part of the annotation SVG.

**Rationale for custom SVG over chessground `drawable`:**

chessground's `drawable` API (`brushes` + `shapes`) is designed for lichess-style interactive arrow drawing (right-click drag to draw, shift-click to erase). It serves that use case well. For this project's requirements, it has three specific mismatches:

1. **Arrowhead termination geometry**: chessground renders arrows from square center to square center, with the arrowhead pointing at the destination square center. GDD Rule 12 requires the arrowhead tip at the destination square *edge*, with the piece glyph kept ≥70% unoccluded. Overriding chessground's internal SVG `<marker>` element geometry to achieve edge termination requires patching the library's rendering internals — fragile and update-unsafe.

2. **Per-role color control**: chessground brushes are named globally in the chessground config (`movable.color`, `highlight.color`, etc.). Achieving multiple per-role colors (bestMove/teal, playedMove/gray, threat/amber) with different opacities per role may require multiple brush definitions. Whether chessground's `shapes` API allows per-shape brush lookup is version-dependent — the spike must confirm.

3. **Cursor isolation**: chessground's drawable overlay is part of chessground's own SVG layer, which is managed by the library. A custom SVG overlay is in our DOM tree, giving full control over z-order, `aria-hidden`, forced-colors fallback, and `pointer-events: none`.

**Why custom SVG is not high-risk:** The geometry the custom SVG must compute is straightforward:
- Arrow from center(`from`) to edge-of(`to`) — two points derived from `squareToRect()`
- SVG `<line>` + `<polygon>` for shaft + arrowhead (or `<path>` for the combined shape)
- `squarePx = boardPx / 8` for size scaling (Formula 2)
- ArrowHead termination formula from GDD Rule 12 (trigonometry to find edge intersection)

This is ~150 lines of TypeScript for the geometry logic, anchored to `boardRef`-local coordinates (per ADR-0009 §4 — the authoritative `squareToRect()` contract). Not trivial but well within scope.

### 2. SVG Overlay Architecture

```typescript
// MoveAnnotationDisplay.vue (illustrative)
// Mounted as a sibling of the chessground container:
<div class="board-wrapper" style="position: relative">
  <ChessBoard ref="chessBoardRef" ... />
  <svg
    class="annotation-overlay"
    aria-hidden="true"
    style="position: absolute; top: 0; left: 0; pointer-events: none; z-index: 10"
    :width="boardPx" :height="boardPx"
    :viewBox="`0 0 ${boardPx} ${boardPx}`"
  >
    <!-- rendered arrows and highlights -->
  </svg>
</div>
```

**Coordinate system**: All annotation geometry uses the `squareToRect(square)` helper exposed by ChessBoard. Per **ADR-0009 §4** (authoritative contract), `squareToRect()` returns **board-local** coordinates — pixels relative to `boardRef`'s top-left corner, orientation-aware. The SVG overlay is absolutely-positioned at `top: 0; left: 0` over `boardRef`, so its coordinate origin is identical to `boardRef`'s top-left. `squareToRect()` values are therefore used **directly as SVG coordinates with zero conversion** — no `boardRef.getBoundingClientRect()` subtraction is needed or correct.

> **Doc-drift correction (2026-05-29)**: An earlier draft of this ADR described `squareToRect()` as "viewport-relative" and instructed callers to subtract `boardRef.getBoundingClientRect()`. That description was authored before ADR-0009 locked the authoritative contract. The corrected behaviour above matches ADR-0009 §4 and the Chess Board GDD Acceptance Criteria. The C1 doc-drift entry in [architecture-review-2026-05-29.md](./architecture-review-2026-05-29.md) is resolved by this patch.

**Resize handling**: `ResizeObserver` on `boardRef` → sets `boardPx` → SVG `viewBox` and all annotation geometry recompute. Coalesced via `requestAnimationFrame` per Formula 4.

### 3. Arrowhead Termination Geometry

Per GDD Rule 12, the arrowhead tip lands at the intersection of the `from→to` line with the destination square boundary. Algorithm:

```typescript
// Compute tip position at destination square edge
function computeArrowTip(fromCenter: Point, toCenter: Point, squarePx: number): Point {
  const dx = toCenter.x - fromCenter.x
  const dy = toCenter.y - fromCenter.y
  const angle = Math.atan2(dy, dx)
  const halfSq = squarePx / 2
  // distance from center to edge along this angle (rectangular clip)
  const tMax = Math.min(
    Math.abs(halfSq / Math.cos(angle)),
    Math.abs(halfSq / Math.sin(angle))
  )
  return { x: toCenter.x - Math.cos(angle) * tMax, y: toCenter.y - Math.sin(angle) * tMax }
}
```

The arrowhead body is then drawn backward from the tip along the angle for `headLengthPx`, clamped so the head base stays outside the `pieceGlyphRadius = squarePx × 0.40` keep-clear disc.

### 4. Fallback — Accept chessground `drawable` if Spike Passes

If the OQ#1 spike demonstrates that chessground `drawable` **can** achieve per-role colors and approximate edge termination in chessground 9.x (within the ≥70% piece-glyph threshold), the decision may be revised to use chessground's native API. This would simplify the implementation at the cost of less precise geometry control. The Decision section would be updated and the "provisional" qualifier removed.

**Criteria for accepting chessground `drawable`:**
1. Can render at least 4 named brushes with distinct colors and opacities
2. Arrow terminus is within the destination square boundary (piece glyph ≥70% unoccluded at 352px board)
3. `aria-hidden` equivalent is achievable (the drawable SVG can be hidden from AT)
4. Resize redraws via a callback (not a polling mechanism)

### Architecture Diagram

```
┌────────────────────────────────────────────┐
│  .board-wrapper (position: relative)       │
│  ┌──────────────────────────────────────┐  │
│  │  <ChessBoard> (vue3-chessboard)      │  │
│  │  chessground canvas + SVG layers     │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │  <svg.annotation-overlay>           │  │  z-index: 10 (above chessground pieces)
│  │  aria-hidden="true"                 │  │  pointer-events: none
│  │  position: absolute; top:0; left:0  │  │
│  │                                     │  │
│  │  ● highlights (fill/ring)           │  │  lowest z within SVG
│  │  ● arrow shafts                     │  │
│  │  ● arrowheads                       │  │  highest z within SVG
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│  Eval bar (vertical, alongside board)      │  Layout element — NOT in annotation SVG
│  ┌───┐  fills white/black per fillRatio    │
│  │   │  peak-marker tick for biggest-swing │
│  └───┘                                     │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│  Eval badge (text chip, beside board)      │  +1.2 / −0.7 / M3 / —
└────────────────────────────────────────────┘
```

### Key Interfaces

```typescript
// Annotation type — Pillar 3 structural enforcement (no emotive roles)
interface Annotation {
  kind: 'arrow' | 'highlight'
  role: 'bestMove' | 'playedMove' | 'alternateLine' | 'threat' | 'keySquare' | 'from' | 'to'
  from?: Square   // for kind: 'arrow'
  to?: Square     // for kind: 'arrow'
  square?: Square // for kind: 'highlight'
}

// Evaluation input (raw, side-to-move convention — this component normalizes internally)
interface AnnotationEvaluation {
  evalCp?: number      // side-to-move convention; component flips to White's perspective
  evalMate?: number    // side-to-move convention; 0 = terminal
  sideToMove: 'w' | 'b'
}

// MoveAnnotationDisplay component props
interface MoveAnnotationDisplayProps {
  annotations: Annotation[]
  evaluation: AnnotationEvaluation | null
}

// Consumed from ChessBoard (via defineExpose / provide-inject)
// squareToRect(square: Square): { x: number; y: number; width: number; height: number } | null
// Returns board-local coordinates relative to boardRef's top-left (per ADR-0009 §4); null for invalid squares
// boardRef: HTMLElement — for ResizeObserver and coordinate origin
```

## Alternatives Considered

### Alternative 1: chessground `drawable` API (native)

- **Description**: Use chessground's built-in `shapes` + `brushes` system for arrows and highlights. Eval bar remains a separate layout element.
- **Pros**: Zero custom SVG code; automatic orientation handling (chessground's own shapes flip with the board); maintained by the library.
- **Cons**: Arrowhead terminates at destination square center (not edge) — piece occlusion at small board sizes likely fails the ≥70% threshold at 352px. Per-role color control is brush-based; the exact capabilities of chessground 9.x `drawable` for multiple named brushes are LLM-training-data-uncertain. Accessing the drawable layer to apply `aria-hidden` may require internal DOM manipulation.
- **Rejection Reason (provisional)**: Unconfirmed geometry control. This alternative becomes preferred if the spike confirms edge-termination and per-role color support. See Decision §4.

### Alternative 2: Canvas 2D Overlay

- **Description**: Use an HTML `<canvas>` element absolutely positioned over `boardRef` instead of SVG.
- **Pros**: Easier pixel-level custom arrowhead geometry; no SVG `<path>` math.
- **Cons**: Canvas is rasterized — scaling on high-DPI screens requires explicit `devicePixelRatio` handling. SVG is resolution-independent; all browsers scale SVG correctly with no DPR code. Canvas has no native `aria-hidden` equivalent for individual elements (forced-colors fallback is also more complex). Canvas rendering is not diffable (entire canvas redraws on every annotation change); SVG allows per-element updates.
- **Rejection Reason**: SVG's resolution-independence and accessibility primitives are worth the path math. Canvas offers no meaningful benefit over SVG for this use case.

### Alternative 3: CSS + HTML (absolute-positioned divs for arrows)

- **Description**: Use absolutely-positioned `<div>` elements with CSS `border` + `transform: rotate()` to render arrows.
- **Pros**: No SVG or canvas expertise required.
- **Cons**: Arrow geometry (including the arrowhead polygon) is extremely awkward to express in CSS. Borders and transforms do not compose cleanly for non-axis-aligned arrows. Resize handling is more complex. Not used by any major chess UI library.
- **Rejection Reason**: Wrong tool for 2D vector drawing. SVG is the correct substrate.

## Consequences

### Positive

- Full control over arrowhead termination geometry — GDD Rule 12 ≥70% threshold is achievable
- Per-role colors as plain TypeScript constants in `annotation-tuning.ts` — no brush name registry to manage
- Eval bar placement is orthogonal — it lives in layout, not in the SVG
- `aria-hidden="true"` on the SVG is trivial and guaranteed

### Negative

- ~150 lines of SVG geometry code for the arrow rendering — custom code to maintain
- Spike required before implementation begins (one-day code check)
- If chessground updates its `drawable` API in a way that conflicts with our overlay's z-order, the overlay may need z-index adjustment

### Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| chessground `drawable` API proves to be superior after the spike | Low | Low — update the ADR, use chessground | Spike is explicitly designed to answer this; Decision §4 provides clear acceptance criteria |
| Arrow geometry edge-termination formula wrong for diagonal moves | Low | Medium — pieces partially occluded at mobile size | Unit test: for a 352px board, knight-move arrow head base must be outside `r = squarePx × 0.40` disc |
| SVG overlay z-order conflicts with chessground's own SVG layers (e.g., promotion dialog) | Low | Medium — promotion dialog covered by annotation SVG | z-index set below chessground's promotion dialog; test on real chessground instance |
| `ResizeObserver` not supported on target browser range | Very Low | Low — all modern browsers support it | Polyfill is bundled via Vite's target config; no action needed |

## GDD Requirements Addressed

| GDD System | Section / Requirement | How This ADR Addresses It |
|------------|----------------------|--------------------------|
| move-annotation-display.md | Core Rule 1: Declarative `annotations` prop (no imperative add-arrow API) | Decision §2: SVG element is fully re-rendered from `annotations` prop; no imperative API exposed |
| move-annotation-display.md | Core Rule 2: Rendering substrate (this ADR's subject) | Decision §1: custom SVG overlay over boardRef (provisional; spike confirms) |
| move-annotation-display.md | Core Rule 3: Board orientation inherited via squareToRect() | Decision §2: all square coordinates resolved through squareToRect(); no raw pixel storage |
| move-annotation-display.md | Core Rule 9: pointer-events: none | Decision §2: `pointer-events: none` on SVG element |
| move-annotation-display.md | Core Rule 12: Arrowhead at square edge, piece glyph ≥70% unoccluded | Decision §3: edge-termination algorithm documented; ≥70% threshold is the acceptance criterion |
| move-annotation-display.md | Formula 2: Arrow geometry scales with squarePx | Decision §2: squarePx = boardPx/8; shaft width and head length from Formula 2 |
| move-annotation-display.md | Formula 4: rAF-coalesced resize throttle | Decision §2: ResizeObserver → requestAnimationFrame throttle |
| move-annotation-display.md | Open Question #1: chessground drawable vs custom SVG | Decision §1: provisional custom SVG; spike resolves definitively |

## Performance Implications

- **CPU**: SVG re-render on every `annotations` prop change. For 4 arrows + 4 highlights, this is ~8 SVG nodes. Virtual DOM diffing on 8 nodes is negligible (< 0.1ms).
- **Memory**: 8 SVG nodes + annotation geometry data. Negligible.
- **Load Time**: No additional bundle cost — SVG is native browser API.
- **60fps**: ResizeObserver + rAF throttle ensures at most one geometry recompute per 16.6ms frame during board resize. Arrow geometry computation for 4 arrows is O(1) time per frame.

## Migration Plan

No existing annotation implementation. This ADR establishes the initial substrate for new implementation.

## Validation Criteria

1. **[BLOCKING spike — chessground `drawable` audit]**
   One-day code check before implementation:
   - Instantiate `vue3-chessboard` (chessground 9.x) in a test harness
   - Add 3 shapes via the `drawable.shapes` API with distinct brush colors (teal, gray, amber)
   - Measure: does the arrowhead tip land at the destination square center or edge?
   - Measure: at board size 352px, what % of the destination piece glyph bounding box is covered by the arrowhead?
   - Confirm: can brushes be customized per-shape (not just globally)?
   - If criteria in Decision §4 are met → update this ADR to use chessground drawable. Else → custom SVG confirmed.

2. **[Unit — arrowhead edge termination]**
   For a horizontal arrow (e2→e4) on a 352px board: the computed tip `x` must be ≤ `toCenter.x + squarePx/2` AND the arrowhead base must be outside the `squarePx × 0.40` keep-clear disc around toCenter.

3. **[Unit — diagonal arrow (knight move: g1→f3)]**
   Arrow from g1 to f3 at 352px board: arrowhead tip is at the intersection of the g1→f3 vector with f3's square boundary, NOT at f3's center. Piece-occlusion assertion: ≥70% of a simulated piece glyph bounding box at f3 is unoccluded.

4. **[Unit — Pillar 3 type enforcement]**
   TypeScript: `Annotation.role` must not accept `'lastMove'`, `'quality'`, `'blunder'`, `'brilliant'`, `'mistake'`, or any non-listed value (exhaustive union type check via `expect-type`).

5. **[Unit — eval bar independence]**
   DOM inspection: the SVG overlay element contains zero text nodes and zero elements with an `aria-label` containing "eval" (eval output lives in separate layout elements, not in the annotation SVG).

6. **[E2E — resize coalescing]**
   Playwright: simulate 30 rapid resize events on the board container → MutationObserver or performance.mark confirms ≤1 SVG geometry recalculation per ~16.6ms frame (Formula 4 rAF throttle).

## Related Decisions

- [ADR-0002](adr-0002-web-worker-isolation-and-uci-protocol.md) — ChessEngine provides `evalCp`/`evalMate` in side-to-move convention; this system normalizes to White's perspective
- [ADR-0005](adr-0005-pinia-store-boundaries-and-completed-game-transport.md) — PostGameReview (the primary consumer of annotations) reads from gameStore; this component receives props, not store data
- `design/gdd/move-annotation-display.md` — the GDD this ADR implements
- `design/gdd/post-game-review.md` — primary consumer of the annotation component
