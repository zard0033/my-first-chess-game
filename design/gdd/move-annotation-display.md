# Move Annotation Display

> **Status**: Approved (2026-05-27)
> **Author**: Eason + Claude
> **Last Updated**: 2026-05-27
> **Implements Pillar**: Pillar 3 (Single Player, No Pressure) — annotations are a neutral compass, never a verdict; no flash, no celebration, no punishment
> **Priority**: v0 / Core (Presentation)
> **Depends on**: Chess Board & Move System
> **Depended on by**: Post-Game Review

## Overview

The Move Annotation Display is a pure rendering layer that draws neutral visual aids on top of the chess board: arrows (best move / suggested line), square highlights (origin/destination, key squares), and an evaluation readout (a numeric badge and/or a vertical eval bar). It owns no chess logic and no judgment — it receives a declarative list of annotations from a consumer (chiefly Post-Game Review) and paints them onto the board's SVG overlay using the `boardRef` and square-to-pixel coordinate helper exposed by the Chess Board & Move System. It is the visual half of a strict division of labor: the consumer decides *what* to annotate and *why*; this system decides *how* to draw it, legibly and at 60fps.

For the player, this system is what makes a Post-Game Review legible — the arrow that says "this was the engine's move," the highlight that says "this square mattered," the `+1.2` that says "white stands a little better here." Crucially, it renders all of this in deliberately flat, unemotional visual language. There are no gold "Brilliant!" bursts, no red "Blunder!" explosions. The eval number is a reading, not a grade. The arrow colors carry semantic meaning (which arrow is the engine's pick vs. the played move) but never emotional valence (good/bad). This restraint is not a stylistic choice — it is the load-bearing enforcement of Pillar 3 at the pixel level.

## Player Fantasy

When the player looks at an annotated position, they should feel they are reading a map, not receiving a report card. An arrow points from one square to another the way a compass needle points north — it states a direction, calmly. The eval bar is a horizon line: it tilts toward white or black to show who the terrain favors, and the player reads the tilt without being told they "lost" by it. A highlighted square draws the eye to "look here" without shouting.

The target feeling is **quiet legibility**. The player thinks "ah, I see — the engine wanted the knight here, and the position was roughly equal" — a moment of understanding, not a moment of being judged. The annotations should feel like a knowledgeable friend pointing at the board with a finger, not a scoreboard lighting up.

**Reference points:**
- **lichess analysis board arrows** — clean colored arrows that show lines without moralizing
- **lichess eval bar** — a calm vertical gauge that tilts; you read it, it doesn't read you
- **A coach's hand on the board** — "what about here?" — gesture, not grade

**Explicitly NOT this system's job:**
- No "Brilliant!" / "Great!" / "Good" / "Inaccuracy" / "Mistake!" / "Blunder!" text labels, icons, or colored glyphs of any kind (Post-Game Review's data model is a neutral pawn-swing number, not a classification ladder — and this system never *renders* an emotive label either way)
- No celebratory animation (sparkle, glow pulse, confetti, scale-bounce) on a "good" move and no punitive animation (shake, red flash, X mark) on a "bad" move
- No sound — this system is silent (move/check sounds belong to Chess Board; this layer adds none)
- No move-quality evaluation — it does not decide a move's quality; it receives a neutral annotation payload and draws it
- No interactivity that changes game state — annotations are display-only; the board owns all input

The discipline here mirrors the Chess Board's "no Brilliant! labels during play" and the Chess Engine's "compass not grade" framing. The eval delta is information; this system renders that information without dressing it in emotion.

## Detailed Design

### Core Rules

1. **Declarative input.** The consumer sets an `annotations` prop — an array of annotation objects (arrows, highlights) plus an optional `evaluation` object. The system fully re-renders the overlay to match. There is no imperative "add one arrow" API; the displayed state always equals the latest prop.

2. **Rendering substrate.** All annotations are drawn into a single SVG overlay element positioned exactly over the board, sized and coordinate-mapped via the Chess Board's exposed `boardRef` (HTMLElement) and its square-to-pixel coordinate helper. This system does **not** compute its own square geometry — it asks the board where square `e4` is, in current pixel coordinates, accounting for current board size and orientation.

3. **Board orientation is inherited, never recomputed.** When the board is flipped (player is Black), the coordinate helper already returns flipped pixel coordinates for a given algebraic square. Arrows and highlights are authored in algebraic terms (`from: "e2", to: "e4"`) and resolved through the helper, so they automatically point the correct visual direction after a flip. This system never stores raw pixel vectors.

4. **Arrow types and neutral color semantics.** Arrows carry a `role` enum that maps to a color/style, where color encodes *which kind of arrow* (a categorical, navigational distinction), never *quality valence*:
   - `bestMove` — the engine's top move (default: solid teal/blue, the "primary suggestion" tone)
   - `playedMove` — the move actually played, when shown alongside the best move for contrast (default: solid neutral gray)
   - `alternateLine` — a secondary suggested move (default: same hue as `bestMove` at reduced opacity)
   - `threat` — a square/move the opponent threatens (default: muted amber — caution, not alarm)
   None of these is "green = good / red = bad." Amber for `threat` is the strongest hue and is still muted (per Pillar 3 "no alarm"). Colors are theme-aware tuning knobs.

5. **Highlight types.** Square highlights carry a `role` enum:
   - `keySquare` — a square the consumer wants to draw attention to (default: faint warm ring)
   - `from` / `to` of an annotated (not-yet-played) move — paired with an arrow of the same `role`
   Highlights are translucent fills or rings; they never fully obscure the piece beneath.

6. **Evaluation readout — two coordinated views, both neutral and numeric.**
   - **Eval badge**: a small text chip showing the formatted eval (e.g. `+1.2`, `−0.7`, `M3`, or `—` when no data). Positive is conventionally White-favoring (see Formula 3 sign convention). Placed in a fixed UI slot beside the board, never floating over pieces.
   - **Eval bar**: an optional thin vertical bar beside the board, filled proportionally white-from-bottom / black-from-top to reflect the compressed eval (Formula 1, arctan curve). The bar is a gauge, not a score — no tick marks reading "you are losing," no color shift to red at extremes.
   - Both views read from the same `evaluation` object so they never disagree.

7. **Eval sign convention (display layer owns the flip).** The Chess Engine returns `evalCp` / `evalMate` in *side-to-move* convention (positive = side-to-move is better). This system renders from a fixed **White's perspective** by default (positive = White better), so it flips the sign when the annotated position has Black to move. The consumer passes the position's side-to-move alongside the eval so this system can normalize. **Both `evalCp` and `evalMate` go through the same normalization** (raw in → this system flips): the normalized values are `evalNormCp` and `evalMateNorm`, and all downstream formulas (Formula 1 bar, Formula 3 display) consume the normalized values, never the raw inputs. (This mirrors the Chess Engine GDD's note: "Display layer flips sign if rendering from White's perspective.")

8. **Stacking / layering within the overlay (z-order, lowest → highest):** square-fill highlights → square rings (keySquare, from/to) → arrow shafts → arrow heads → eval-related square markers (none by default). Arrows always draw above highlights so a highlighted destination square does not hide the arrowhead landing on it. The eval badge and eval bar live in the surrounding UI layout, **not** in the board overlay SVG, so they never overlap pieces.

9. **Overlay sits above the board's own overlays.** Per Chess Board GDD Rule 17 z-order, this annotation overlay is mounted **above the in-flight animating-piece layer** but below the promotion dialog — arrows remain visible during piece move animations in replay/DISABLED mode. Annotations must not block pointer events on the board — the overlay is `pointer-events: none`.

   **DISABLED mode animation**: when Chess Board is in DISABLED/replay state, it still animates pieces when FEN changes (Chess Board GDD AC). The annotation overlay sits above the animating-piece layer by design — no contention. (B8 resolved — see Chess Board GDD Rule 18.)

10. **Clearing.** Setting `annotations` to an empty array and `evaluation` to `null` clears the overlay completely within one frame. Stepping between positions in Post-Game Review clears the previous position's annotations before drawing the new ones (no stale arrows carry over). The eval badge shows `—` when `evaluation` is `null`.

11. **Multiple simultaneous annotations.** The overlay supports an arbitrary list, but the consumer is expected to keep it small (typically 1 best-move arrow, optionally 1 played-move arrow, optional 1–2 highlights). This system caps the rendered arrow count at `maxArrows` (default 4) and, on overflow, drops the lowest-priority arrows (priority order: `bestMove` > `playedMove` > `threat` > `alternateLine`) and logs a console warning — overflow is a consumer bug, not a player concern.

12. **Mobile readability rule + arrow termination geometry.** On small boards, arrows must not obscure the pieces they connect. Arrow shaft width and head size scale with square size (Formula 2), and shaft opacity is set so the piece glyph beneath remains identifiable. Arrowheads terminate at the destination square *edge*, not its center, so they don't cover the piece on that square. **Precise termination:** the arrow runs along the straight `from`-center → `to`-center line. The arrowhead's *tip* is placed at the intersection of that line with the boundary of the destination square (the edge the line crosses on entry), and the head's *body* lies entirely outside an inner keep-clear disc of radius `r = pieceGlyphRadius` centered on the destination square center (`pieceGlyphRadius ≈ squarePx × 0.40`, matching chessground's piece glyph footprint). If `headLengthPx` would push the head base inside that disc, the tip is pulled back along the line until the head base sits tangent to the disc — guaranteeing the centered piece glyph is never overlapped by the head. **Measurable success condition** (see AC): at the mobile-minimum board (352px), the piece glyph under an arrowhead retains ≥ 70% of its bounding-box pixels un-overlapped by any arrow mark. (The exact `0.40` glyph-radius factor and the 70% threshold are provisional pending the OQ1 substrate spike — see Open Questions — but the *condition* is fixed and testable.)

13. **No motion by default.** Annotations appear and disappear without animation by default (instant draw on position change). An optional subtle fade-in (`annotationFadeMs`, default 0 = off) may be enabled, but it is a uniform opacity fade only — never a directional "draw-on" or scale effect that could read as celebratory. Under `prefers-reduced-motion`, any fade collapses to instant (consistent with Chess Board's reduced-motion policy).

14. **Decoupled from input.** This system renders only; it never emits `move-made` or any game event, and never enters the board's state machine. It reacts to prop changes.

### States

This is a near-stateless render layer. Its only meaningful states are presence/absence of content:

| State | Description | Transition |
|-------|-------------|-----------|
| **EMPTY** | No annotations, no eval (or eval = `—`). Overlay SVG present but contains no marks. | → POPULATED when `annotations`/`evaluation` props become non-empty |
| **POPULATED** | One or more arrows/highlights and/or a numeric eval are drawn. | → EMPTY on clear; → POPULATED (re-render) on prop change |
| **RESIZING** | A board resize / orientation change is in flight; overlay is recomputing pixel coordinates from the helper. | → POPULATED once geometry is reread and marks redrawn (throttled per Formula 4) |

There is no input-driven state — the consumer's prop is the single source of truth.

### Interactions with Other Systems

| System | Direction | Interface |
|--------|-----------|-----------|
| **Chess Board & Move System** | IN ← | Consumes the board's exposed `boardRef` (HTMLElement) and square-to-pixel coordinate helper to position the overlay and resolve algebraic squares to current pixel coordinates (orientation-aware). Reads board size on resize. |
| **Post-Game Review** | IN ← | Receives the `annotations` array (arrows + highlights, each with a neutral `role`) and the `evaluation` object (`evalCp` / `evalMate` + side-to-move) per displayed position. Post-Game Review owns *what* to show (the neutral pawn-swing number + best line); this system owns *how* to draw it. |
| **Settings** (future, Polish) | IN ← | Reads annotation theme: arrow colors per role, eval-bar visibility default, eval-bar softness (`evalBarSoftnessCp`), `annotationFadeMs`. Cannot exceed Safe Ranges. |

## Formulas

This system has four design-level formulas. All visual constants not listed here are configuration values documented in [Tuning Knobs](#tuning-knobs).

### Formula 1: Eval → eval-bar fill ratio

Maps a centipawn (or mate) evaluation to a 0–1 fill ratio for the vertical eval bar. A linear cp scale is unusable (a +900 position would peg the bar identically to +200), so an **arctangent compression curve** is used: it is steepest (most expressive) in the meaningful ±3-pawn middlegame range and flattens smoothly toward the extremes, self-bounding to (0, 1) without a hard clamp.

`fillRatio = atan(evalNormCp / evalBarSoftnessCp) / π + 0.5`

where `evalNormCp` is `evalCp` already normalized to White's perspective (Rule 7) and `evalBarSoftnessCp` is the curve's softness constant (the cp value at which the bar reaches the 0.75 / 0.25 quarter marks).

For mate scores, the bar pegs fully to the mating side (using `evalMateNorm`, already flipped to White's perspective per Rule 7), with a third branch for terminal positions:

- `evalMateNorm > 0` (White mates) → `fillRatio = 1.0`
- `evalMateNorm < 0` (White is mated) → `fillRatio = 0.0`
- `evalMateNorm === 0` (terminal position — checkmate/stalemate already on the board, no forward eval) → `fillRatio = 0.5` and the bar renders **dimmed/neutral** (consistent with the no-data dimmed state per Edge Cases / AC; the badge shows `—`)

> **Note (arctan vs. clamp):** unlike a hard clamp, the arctan curve **asymptotically approaches but never reaches** 0.0/1.0 for finite cp — only a *mate* score pegs the bar to the rail. A hopeless −50.0 cp position renders at ≈0.02, visually indistinguishable from the rail but never quite touching it. This is intentional: the bar reserves the literal rail for forced mate.

| Variable | Type | Range | Description |
|----------|------|-------|-------------|
| `evalCp` | int (centipawns) | −∞..+∞ in theory; practically ±3000 | Position eval (raw, side-to-move convention) |
| `evalNormCp` | int (centipawns) | −∞..+∞ | `evalCp` normalized to White's perspective (Rule 7) |
| `evalBarSoftnessCp` | int | 200–600 | Softness constant; cp at the 0.75/0.25 quarter marks. Default `300` (≈ +3.0 pawns). Currently a code constant in `annotation-formulas.ts`; a future Settings knob may expose it |
| `fillRatio` | float | (0.0, 1.0) | White-side fill fraction (0.5 = equal); open interval for cp, closed only via mate branch |

**Output range:** approaches 0.0 (Black fully winning) and 1.0 (White fully winning) asymptotically for cp; reaches them exactly only via the mate branch. 0.5 = dead equal.
**Example:** `evalCp = +120` (White to move) → `fillRatio = atan(120/300)/π + 0.5 = atan(0.4)/π + 0.5 ≈ 0.621` (bar ≈62% white). `evalCp = +300` → `atan(1)/π + 0.5 = 0.75`. `evalCp = +5000` → `atan(16.67)/π + 0.5 ≈ 0.981` (near the rail but not pegged). `evalMateNorm = +3` → `fillRatio = 1.0` (mate pegs). `evalMateNorm = 0` (terminal) → `fillRatio = 0.5`, bar dimmed.

### Formula 2: Square size → arrow geometry

Arrow shaft width and head size scale with the current square edge length so arrows stay proportional and remain readable on small mobile boards without obscuring pieces.

`squarePx = boardPx / 8`

`shaftWidthPx = clamp(squarePx × shaftWidthRatio, shaftWidthMinPx, shaftWidthMaxPx)`

`headLengthPx = clamp(squarePx × headLengthRatio, headLengthMinPx, headLengthMaxPx)`

| Variable | Type | Range | Description |
|----------|------|-------|-------------|
| `boardPx` | int | 280–900 | Current board edge length (from board; clamped by Chess Board's `boardSizeMin/MaxPx`) |
| `squarePx` | float | 35–112 | One square's edge length |
| `shaftWidthRatio` | float | 0.10–0.22 | Shaft width as a fraction of a square. Default `0.16` |
| `shaftWidthPx` | float | 4–20 | Resulting shaft width |
| `shaftWidthMinPx` | float | 3–6 | Lower clamp so shaft is visible on tiny boards. Default `4` |
| `shaftWidthMaxPx` | float | 16–24 | Upper clamp so shaft doesn't dominate on large boards. Default `20` |
| `headLengthRatio` | float | 0.30–0.55 | Arrowhead length as a fraction of a square. Default `0.40` |
| `headLengthPx` | float | 12–60 | Resulting head length |

**Output range:** shaft 3–20px, head 12–60px across the supported board-size range.
**Example:** `boardPx = 352` (mobile min) → `squarePx = 44` → `shaftWidthPx = clamp(44×0.16, 4, 20) = 7.04px`, `headLengthPx = clamp(44×0.40, 12, 60) = 17.6px`. On a 720px desktop board: `squarePx = 90` → shaft `clamp(14.4) = 14.4px`, head `clamp(36) = 36px`.

### Formula 3: Eval display formatting

Maps raw engine output to the displayed string. Centipawns render as pawns to one decimal; mate renders as `M{n}`; absent data renders as an em-dash.

```
if evalMateNorm === 0:         display = "—"   // terminal position — no forward eval (game already decided)
else if evalMateNorm is defined: display = (evalMateNorm >= 0 ? "M" : "−M") + abs(evalMateNorm)
else if evalCp is defined:     display = sign(evalNormCp) + (abs(evalNormCp) / 100).toFixed(1)
else:                          display = "—"
```

where `evalNormCp` and `evalMateNorm` are `evalCp` / `evalMate` already normalized to White's perspective (Rule 7), and `sign` yields `"+"` for ≥ 0 and `"−"` (true minus, U+2212) for < 0. The negative-mate prefix uses the same U+2212 true minus (`−M`) as `evalCp` negatives, for sign-character consistency.

| Variable | Type | Range | Description |
|----------|------|-------|-------------|
| `evalCp` | int \| undefined | ±3000 typical | Centipawn eval from engine (pre-normalization, side-to-move convention) |
| `evalMate` | int \| undefined | −40..+40 typical | Moves-to-mate from engine (pre-normalization, side-to-move convention; positive = side-to-move mates) |
| `evalNormCp` | int | ±3000 | White's-perspective centipawns (post-normalization) |
| `evalMateNorm` | int | −40..+40 | White's-perspective moves-to-mate (post-normalization; positive = White mates, 0 = terminal) |
| `display` | string | — | Rendered text |

**Output range:** strings like `+1.2`, `−0.7`, `0.0`, `M3`, `−M2`, `—` (mate negatives use the same U+2212 minus as cp negatives).
**Example:** `evalCp = 120` (White to move, no flip) → `"+1.2"`. `evalCp = 70`, Black to move → normalize to −70 → `"−0.7"`. `evalMate = 3`, White to move → `evalMateNorm = 3` → `"M3"`. `evalMate = 2`, Black to move → `evalMateNorm = −2` → `"−M2"`. `evalCp` and `evalMate` both undefined → `"—"`. Note `0.0` is shown without an explicit `+` only if `sign` treats 0 as non-negative — default shows `+0.0`; a tuning knob `showPlusOnZero` (default false → `"0.0"`) controls this.

### Formula 4: Redraw throttle on resize

Board resize/orientation events can fire continuously (drag-resize, rotation). Recomputing every annotation's geometry on every event would blow the 16.6ms frame budget, so geometry recomputation is coalesced into a single `requestAnimationFrame` callback: every resize event sets a `pendingRedraw` flag and schedules one rAF (if not already scheduled); the rAF callback recomputes geometry once and clears the flag.

```
on resize event:
  if (!rafScheduled):
    rafScheduled = true
    requestAnimationFrame(redraw)

redraw():
  recompute all annotation geometry from helper, repaint
  rafScheduled = false
```

A single rAF callback per frame already guarantees at most one redraw per ~16.6ms frame, so a separate `redrawThrottleMs` time gate is redundant and was removed (it could only ever fire *less* often than rAF, adding visible lag for no benefit).

| Variable | Type | Range | Description |
|----------|------|-------|-------------|
| `rafScheduled` | bool | — | Whether a redraw rAF is already queued for the next frame |

**Output:** at most one geometry recompute + repaint per animation frame.
**Example:** A 300ms drag-resize fires ~40 `resize` events. Each sets `pendingRedraw` and at most one rAF is queued per frame, so the overlay redraws ~18 times over 300ms (once per frame), each well within the 16.6ms budget — instead of 40 synchronous reflows.

## Edge Cases

**Multiple / overlapping annotations:**
- **If two arrows share the same `from`/`to` (duplicate):** render once; dedupe by `(from, to, role)`. Identical arrows do not stack opacity.
- **If two arrows overlap visually (cross or share a square):** both draw; arrowheads always render above shafts (z-order Rule 8) so neither head is hidden. No automatic curving in v0 (lichess-style curved arrows for knight moves is deferred — see Open Questions).
- **If more than `maxArrows` arrows are supplied:** keep the highest-priority `maxArrows` (priority `bestMove` > `playedMove` > `threat` > `alternateLine`), drop the rest, log a console warning. Never silently render an unbounded pile that obscures the board.
- **If a `bestMove` arrow and a `from`/`to` highlight target the same square:** both render; the highlight (fill/ring) is below the arrow per z-order, so the arrowhead stays visible on top.

**Evaluation edge cases:**
- **If `evaluation` is `null` or both `evalCp` and `evalMate` are undefined:** eval badge shows `—`; eval bar renders at its `fillRatio = 0.5` neutral position **dimmed/grayed** (visually distinct from a real "equal" reading) OR hidden per `evalBarHideWhenUnknown` (default: dimmed, not hidden, so the bar doesn't jump in/out of layout). This honors the Chess Engine GDD's "Consumer should display '—' rather than '0'" rule.
- **If `evalMate` is present:** the bar pegs fully to the mating side (Formula 1); the badge shows `M{n}`. No "checkmate is coming!" styling — it's still a neutral readout.
- **If `evalMate = 0`** (the position *is* checkmate/stalemate, per engine's `bestmove (none)` → `{ evalMate: 0 }` contract): badge shows `—` (game already over, no forward eval to display) and no best-move arrow is drawn (there is no best move). The consumer should not pass a best-move arrow for a terminal position; if it does, the arrow is dropped and a console warning is logged.
- **If eval is extreme** (e.g. `evalCp = ±5000` from a hopeless position): Formula 1's arctan curve compresses the bar to ≈0.98/0.02 (near the rail but never pegged for a non-mate cp); the badge shows the true large number (`+50.0`) without special styling. The compression is on the *bar*, not the *number*.
- **If sign normalization data (side-to-move) is missing from the payload:** default to treating the eval as already White's-perspective (no flip) and log a console warning — a missing side-to-move is a consumer contract violation, not a player concern.

**Orientation / geometry edge cases:**
- **If the board is flipped (player is Black) between renders:** arrows/highlights are authored in algebraic squares and resolved via the coordinate helper, so they automatically point the correct visual direction after the flip (Rule 3). No annotation stores raw pixel vectors that would point backwards.
- **If a board resize arrives while annotations are drawn:** recompute all geometry from the coordinate helper, throttled per Formula 4. Arrows scale per Formula 2. No teleport/jitter beyond one frame's redraw.
- **If the coordinate helper returns coordinates for a square that is off-screen / clipped** (shouldn't happen for valid algebraic squares, but defensive): skip that mark and log a console warning rather than drawing an arrow into negative space.
- **If an annotation references an invalid square string** (not `a1`–`h8`): skip that single annotation, log a console error, render the rest. Do not crash the overlay.

**Small-screen readability edge cases:**
- **If the board is at its minimum size (`boardSizeMinPx`, 352px):** arrow geometry uses the lower clamps in Formula 2 so shafts stay ≥ 4px and heads land at the destination square *edge* (Rule 12), keeping the piece glyph identifiable. Eval bar narrows but stays ≥ `evalBarMinWidthPx`.
- **If many highlights fill the board (e.g. consumer highlights 8 key squares):** highlights are translucent fills capped at `highlightMaxOpacity` so pieces remain readable even when several stack near each other.

**Lifecycle edge cases:**
- **If the `boardRef` is not yet mounted when annotations arrive:** defer rendering until the next frame when `boardRef` is available; if still unavailable after a short retry, render nothing and log a console warning (the board must mount before its overlay).
- **If annotations are set while the board is mid-piece-animation:** annotations resolve square geometry through the coordinate helper, which returns *target* square positions, so a brief visual mismatch while a piece is still sliding into place is accepted and self-corrects when the animation settles. Note this can occur in review/replay: per Chess Board GDD Rule 18 and its AC, the Chess Board's DISABLED mode still animates pieces when FEN changes — the overlay sits above the in-flight animating-piece layer (confirmed z-order), so it must not assume the board is fully static between positions.
- **If `prefers-reduced-motion` is set and `annotationFadeMs > 0`:** the fade collapses to instant (0ms), consistent with Chess Board's reduced-motion policy.

**Accessibility edge cases:**
- **If a screen reader is active:** arrows and highlights are decorative SVG (`aria-hidden="true"` on the overlay) — they duplicate information the consumer (Post-Game Review) announces in text (e.g. "engine's move: Nf3; evaluation plus one point two"). The eval badge text is a real, readable DOM node with an `aria-label` (e.g. `aria-label="Evaluation: White plus 1.2"`), not SVG-only, so it is announced. The eval bar carries `role="img"` with an `aria-label` describing the tilt in words.
- **If `forced-colors: active` (Windows High Contrast):** arrows and ring outlines fall back to system colors (`Highlight` / `CanvasText`) with a solid 1px outline so they survive forced-color stripping; translucent fills become solid 1px outlines. Eval bar uses `CanvasText` border + `Canvas` fill split at `fillRatio`.

## Dependencies

### Upstream dependencies (this system depends on)

| System | What we need | Interface |
|--------|--------------|-----------|
| **Chess Board & Move System** | A DOM anchor and orientation-aware geometry to draw on | Consumes `boardRef` (HTMLElement) and `squareToRect(square: Square): { x: number; y: number; width: number; height: number } \| null` — coordinates relative to `boardRef`'s top-left, orientation-aware (already corrected for Black perspective), returns `null` for invalid squares. (B7 resolved — precise signature now defined in Chess Board GDD Rule 18 and Dependencies table.) |

### Downstream dependents (systems that depend on this)

| System | What they need from us | Interface |
|--------|----------------------|-----------|
| **Post-Game Review** | Render arrows/highlights/eval per position; owns the *what*, delegates the *how* | Props: `annotations: Annotation[]` (each `{ kind: 'arrow' \| 'highlight', role, from?, to?, square? }`), `evaluation: { evalCp?, evalMate?, sideToMove } \| null`. **This system receives raw engine eval in side-to-move convention** (`evalCp` / `evalMate` positive = side-to-move better) **plus `sideToMove`, and flips both to White's perspective itself** (Rule 7) — the consumer must NOT pre-flip. This system renders them neutrally and exposes no classification API. |

### External dependencies (third-party libraries)

| Dependency | Version | Purpose | Replaceable? |
|------------|---------|---------|--------------|
| `chessground` (via `vue3-chessboard`) | (bundled) | chessground ships a native `drawable` arrows/highlights API (the `brushes` + `shapes` model). v0 should evaluate using it directly rather than hand-rolling SVG. | Yes — if its drawable API can't express neutral per-role styling or the eval bar, fall back to a custom `pointer-events:none` SVG overlay over `boardRef`. See Open Questions. |

### Bidirectional consistency notes

- Chess Board GDD Rule 18 now defines: (a) `squareToRect` precise signature relative to `boardRef`; (b) annotation overlay z-position (above in-flight animating piece, below promotion dialog); (c) last-move tint owned by Chess Board in all modes including DISABLED. **B6/B7/B8 all resolved — fully consistent.**
- When **Post-Game Review** GDD is authored, it must declare: (a) it supplies the `annotations` array and `evaluation` object to this system; (b) it computes a neutral pawn-swing number (no classification ladder) and supplies *neutral* annotation roles + the numeric eval before handing off — it must NOT expect this system to render emotive labels; (c) it reuses the single board component in DISABLED mode (per the Chess Board GDD) with this overlay on top.
- This GDD does **not** depend on Chess Engine Integration directly. It consumes already-evaluated numbers handed to it by Post-Game Review. (The sign-convention flip in Rule 7 mirrors the Chess Engine GDD's display-layer note, but there is no runtime coupling.)

### Soft dependencies (enhanced by but not required)

- **Settings** (future, Polish tier): supplies annotation theme (arrow colors per role, eval-bar visibility, eval-bar softness). This system ships with defaults and functions fully without Settings.

## Tuning Knobs

| Knob | Default | Safe Range | What breaks if too high | What breaks if too low |
|------|---------|-----------|------------------------|----------------------|
| `evalBarSoftnessCp` | 300 | 200–600 | Bar barely tilts for normal advantages; loses resolution in the meaningful ±3 pawn range | Bar saturates near the rail at modest advantages (+6 looks the same as +60); loses high-end nuance |
| `shaftWidthRatio` | 0.16 | 0.10–0.22 | Arrow shaft covers pieces it crosses; board feels cluttered | Arrows too thin to read at a glance on mobile |
| `shaftWidthMinPx` | 4 | 3–6 | Shaft too thick on tiny boards, obscures pieces | Shaft invisible on smallest boards |
| `shaftWidthMaxPx` | 20 | 16–24 | Shaft dominates large desktop board | Arrows look thin/weak on large board |
| `headLengthRatio` | 0.40 | 0.30–0.55 | Arrowhead covers the destination piece | Head too small to read as a direction indicator |
| `arrowOpacity` | 0.85 | 0.5–1.0 | Fully opaque arrow hides the piece beneath at its destination edge | Arrow too faint to notice against busy board |
| `bestMoveArrowColor` | theme teal/blue | any hex | — | Must keep ≥3:1 non-text contrast vs both square colors |
| `playedMoveArrowColor` | theme neutral gray | any hex | — | Must stay visually distinct from `bestMoveArrowColor` AND not read as "wrong" (no red) |
| `threatArrowColor` | muted amber | any hex | Too saturated → reads as alarm, violates Pillar 3 | Indistinguishable from other arrows |
| `highlightMaxOpacity` | 0.30 | 0.15–0.45 | Highlights obscure pieces; board hard to read with several stacked | Highlights invisible, fail to draw the eye |
| `keySquareRingColor` | theme warm | any hex | — | Must keep ≥3:1 non-text contrast vs square color |
| `maxArrows` | 4 | 2–6 | Too many arrows clutter the board, obscure pieces | Legitimate multi-line annotations get dropped |
| `evalBarMinWidthPx` | 10 | 8–16 | Bar steals board width on mobile | Bar too thin to read the tilt |
| `evalBarHideWhenUnknown` | false (dim) | true / false | — | — |
| `annotationFadeMs` | 0 (off) | 0–150 | Slow fade reads as a "draw-on" effect → drifts toward celebratory; violates Pillar 3 | — (0 is fine) |
| `showPlusOnZero` | false | true / false | — | — |

### Interaction notes

- **`evalBarSoftnessCp` ↔ Player Fantasy "compass not score":** the arctan curve deliberately compresses extreme evals so the bar reads as a *direction of advantage*, not a precise loss tally. Don't lower it so far that the bar saturates on every middlegame edge (loses its calm "slight tilt" expressiveness), and don't raise it so high that decisive advantages look equal.
- **`arrowOpacity` + `headLengthRatio` should be tuned together for mobile:** at small board sizes a high opacity *and* a long head together can fully cover the destination piece. Validate on a 352px board (the mobile minimum) that the piece under an arrowhead is still identifiable.
- **`threatArrowColor` is the one "warning" hue and is deliberately the most restrained design risk:** keep it muted amber, never red/orange-red. A saturated threat color is the most likely way this system could accidentally violate Pillar 3 ("no alarm").
- **All arrow/ring colors are per-theme** for the same ≥3:1 non-text contrast reason as Chess Board's `legalMoveDotOpacity` — a single global hue cannot satisfy contrast on both light and dark squares; provide per-theme values.

### Source of truth

These values live in a TypeScript config file (e.g. `src/config/annotation-tuning.ts`) as named exports, alongside `board-tuning.ts`. Settings (Polish tier) reads them for theme presets but cannot exceed Safe Range bounds.

## Acceptance Criteria

### Arrow rendering

- **GIVEN** an `annotations` prop containing one `{ kind: 'arrow', role: 'bestMove', from: 'g1', to: 'f3' }`, **WHEN** the overlay renders over a board showing the start position, **THEN** exactly one identifiable arrow mark is present pointing from the g1 square center toward the f3 square edge, colored with `bestMoveArrowColor`. (Substrate-agnostic per OQ1: whether realized as a chessground drawable shape or a custom SVG node, the assertion targets one rendered arrow, not a specific DOM-node type.)
- **GIVEN** a `bestMove` arrow and a `playedMove` arrow for different moves, **WHEN** the overlay renders, **THEN** two visually distinct arrows are drawn (distinct colors per their roles) AND neither arrowhead is occluded by the other's shaft (arrowheads above shafts).
- **GIVEN** an `annotations` array with more than `maxArrows` (default 4) arrows, **WHEN** the overlay renders, **THEN** exactly `maxArrows` arrows are drawn (the highest-priority by role) AND a console warning is logged.
- **GIVEN** an arrow with an invalid square (`from: 'z9'`), **WHEN** the overlay renders, **THEN** that arrow is skipped, a console error is logged, AND any other valid annotations still render.

### Highlights

- **GIVEN** a `{ kind: 'highlight', role: 'keySquare', square: 'd5' }`, **WHEN** the overlay renders, **THEN** a translucent ring/fill marks d5 at ≤ `highlightMaxOpacity` AND the piece (if any) on d5 remains visible beneath it.
- **GIVEN** a highlight and a `bestMove` arrow whose head lands on the same square, **WHEN** the overlay renders, **THEN** the highlight is below the arrow in z-order AND the arrowhead remains fully visible.

### Evaluation readout

- **GIVEN** `evaluation = { evalCp: 120, sideToMove: 'w' }`, **WHEN** the eval views render, **THEN** the badge text equals `"+1.2"` AND the eval bar `fillRatio` equals `atan(120/300)/π + 0.5 ≈ 0.621` (±0.5%).
- **GIVEN** `evaluation = { evalCp: 70, sideToMove: 'b' }`, **WHEN** the eval views render, **THEN** the sign is flipped to White's perspective AND the badge shows `"−0.7"` (true minus U+2212) AND the bar tilts toward Black.
- **GIVEN** `evaluation = { evalMate: 3, sideToMove: 'w' }`, **WHEN** the eval views render, **THEN** the badge shows `"M3"` AND the eval bar pegs to `fillRatio = 1.0`.
- **GIVEN** `evaluation = { evalMate: 3, sideToMove: 'b' }` (side-to-move = Black mates in 3, so after flip White is being mated), **WHEN** the eval views render, **THEN** `evalMateNorm = −3`, the badge shows `"−M3"` (true minus U+2212) AND the eval bar pegs to `fillRatio = 0.0` (tilts fully to Black).
- **GIVEN** the eval bar is enabled AND `evaluation = null`, **WHEN** the eval views render, **THEN** the badge shows `"—"` AND the eval bar renders dimmed at the neutral 0.5 position (not hidden, default `evalBarHideWhenUnknown = false`) AND no console error is logged. (Whether the eval bar is enabled by default on mobile is OQ3 — see Open Questions; this AC governs only the enabled case.)
- **GIVEN** `evaluation = { evalCp: 5000, sideToMove: 'w' }`, **WHEN** the eval views render, **THEN** the bar compresses toward the rail at `fillRatio = atan(5000/300)/π + 0.5 ≈ 0.981` (never pegged to 1.0 for a non-mate cp) AND the badge shows the true `"+50.0"` (compression affects bar, not number).

### Pillar enforcement (structural — no emotive labels)

- **GIVEN** the public `Annotation` and `Evaluation` TypeScript types, **WHEN** the type definitions are statically inspected (`expect-type` / tsc), **THEN** no field named `quality`, `label`, `judgment`, `rating`, `classification`, `brilliant`, `great`, `good`, `inaccuracy`, `mistake`, `blunder`, or any emotive/evaluative term exists; arrow/highlight `role` values are limited to the neutral navigational set (`bestMove`, `playedMove`, `alternateLine`, `threat`, `keySquare`, `from`, `to`) — `lastMove` is explicitly NOT a role this system manages (Chess Board owns last-move tint in all modes per Chess Board GDD Rule 18). (Anchors Pillar 3 into the type system, mirroring the Chess Engine GDD's structural pillar AC.)
- **GIVEN** the rendered overlay for any annotation, **WHEN** the DOM is inspected, **THEN** no text node, icon, or glyph rendering an emotive label (e.g. "Brilliant!", "Blunder!", "!", "??", "Mistake") is present — the only text the system renders is the numeric/`M`/`—` eval readout.
- **GIVEN** any annotation appears or changes, **WHEN** the overlay updates, **THEN** no scale-bounce, sparkle, glow-pulse, color-flash, or shake animation occurs (only an optional uniform opacity fade if `annotationFadeMs > 0`).

### Orientation & geometry

- **GIVEN** a `bestMove` arrow `from: 'e2' to: 'e4'` is drawn with the board in White orientation, **WHEN** the board flips to Black orientation, **THEN** the arrow re-resolves through the coordinate helper AND visually points from the now-lower e4 toward the now-upper e2 region correctly (still the e2→e4 move, drawn in flipped pixel space) with no stale backward arrow.
- **GIVEN** annotations are drawn on a 720px board, **WHEN** the board resizes to 352px, **THEN** arrow `shaftWidthPx` recomputes via Formula 2 to `clamp(44×0.16,4,20)=7.04px` (±0.5px) AND `headLengthPx` to `17.6px` (±1px) AND no arrowhead extends beyond its destination square.
- **GIVEN** a `bestMove` arrow landing on a square that holds a piece, drawn on the mobile-minimum 352px board, **WHEN** the overlay renders, **THEN** the arrowhead tip sits on the destination-square edge (not its center) AND the piece glyph on that square retains ≥ 70% of its bounding-box pixels un-overlapped by any arrow mark (measured by pixel diff against the same board with no overlay, or by geometric check that no arrow mark intrudes within radius `pieceGlyphRadius ≈ squarePx × 0.40` of the square center). (Threshold provisional pending OQ1 spike; the test is fixed.)
- **GIVEN** the board fires 30+ resize events during a drag-resize, **WHEN** the overlay reacts, **THEN** redraws are coalesced via `requestAnimationFrame` to at most one per frame (Formula 4) AND a CDP performance trace shows no overlay-redraw frame exceeding 16.6ms (p95) on the fixed-CPU CI runner. (Tagged `@perf`, excluded from default suite.)

### Clearing & multiple annotations

- **GIVEN** a populated overlay, **WHEN** `annotations` is set to `[]` and `evaluation` to `null`, **THEN** the overlay contains zero arrow/highlight marks within one frame AND the badge shows `"—"`.
- **GIVEN** Post-Game Review steps from position N to position N+1, **WHEN** the new annotations are applied, **THEN** none of position N's arrows/highlights remain (no stale carry-over).
- **GIVEN** duplicate identical arrows in the input array, **WHEN** the overlay renders, **THEN** the arrow is drawn exactly once (deduped by `from`,`to`,`role`) AND opacity does not double.

### Accessibility

- **GIVEN** a Playwright test with `@axe-core/playwright`, **WHEN** the overlay renders with arrows + eval over the board, **THEN** no axe violations of impact `serious` or `critical` are reported.
- **GIVEN** a screen reader (or accessibility-tree inspection), **WHEN** the overlay is present, **THEN** the arrow/highlight container (whatever substrate renders the marks) is hidden from assistive technology (`aria-hidden="true"` or equivalent — it carries no accessible role/name) AND the eval badge exposes an `aria-label` (e.g. `"Evaluation: White plus 1.2"`) AND the eval bar exposes `role="img"` with a worded `aria-label`.
- **GIVEN** `forced-colors: active` is emulated (Playwright `emulateMedia`), **WHEN** the overlay renders, **THEN** arrows and rings use system colors (`Highlight`/`CanvasText`) with solid outlines AND remain distinguishable from the board.
- **GIVEN** `prefers-reduced-motion: reduce` is set AND `annotationFadeMs > 0`, **WHEN** annotations change, **THEN** the measured transition-duration of the overlay is `0s` (fade collapses to instant).

### Terminal / no-data positions

- **GIVEN** a terminal position with `evaluation = { evalMate: 0, sideToMove: 'w' }` (checkmate/stalemate), **WHEN** the views render, **THEN** the badge shows `"—"` AND no `bestMove` arrow is drawn (a supplied best-move arrow for a terminal position is dropped with a console warning).
- **GIVEN** `evaluation` with `sideToMove` missing, **WHEN** the views render, **THEN** the eval is treated as White's-perspective (no flip) AND a console warning is logged AND the badge still renders a value (no crash).

### Performance

- **GIVEN** a position with 4 arrows + 4 highlights + eval bar on a fixed-CPU CI runner (Chromium 4× CPU throttle), **WHEN** a CDP performance trace is captured during the draw, **THEN** the overlay draw completes within one frame and no frame exceeds 16.6ms (p95). Tagged `@perf`.
- **GIVEN** Post-Game Review steps rapidly through 100 positions (each clearing + redrawing annotations), **WHEN** memory is sampled before and after, **THEN** no monotonic growth in the overlay's mark/node count beyond a small bound (overlay fully clears stale marks each step; no leaked nodes), regardless of whether marks are chessground drawables or custom SVG nodes.
- **GIVEN** the overlay is mounted, **WHEN** any annotation animation is configured, **THEN** only `opacity` is animated (no `width`/`height`/`top`/`left`/`box-shadow`/`transform`-scale) — consistent with the Chess Board GDD's GPU-compositor-only constraint.

## Open Questions

### Design questions

1. **chessground `drawable` API vs custom SVG overlay**: chessground ships a native arrows/highlights drawing API (`brushes` + `shapes`). Can it express (a) per-role neutral colors, (b) arrowheads at square *edge* not center, and (c) sit beneath a separately-rendered eval bar — or must we hand-roll a `pointer-events:none` SVG overlay over `boardRef`? **Owner**: ui-programmer. **Resolution**: 1-day spike before v0 implementation. If `drawable` can't do per-role styling cleanly, fall back to custom SVG (the GDD is written to support either substrate).
2. **Curved arrows for knight moves**: lichess curves knight-move arrows so the L-shape reads naturally. v0 uses straight arrows for all moves. Is a straight arrow for `g1→f3` acceptable, or do beginners misread it? **Owner**: ux-designer + Eason. **Resolution**: Evaluate during prototype playtest; defer curving to a later iteration if straight arrows test fine.
3. **Eval bar default visibility on mobile**: the eval bar steals horizontal width on a 352px portrait board. Should it default to *off* on mobile (badge only) and *on* on desktop, or always on? **Owner**: ux-designer + Eason. **Resolution**: Decide during UX spec; defaults currently assume always-on with `evalBarMinWidthPx` guard.
4. **`evalBarSoftnessCp` default (300)**: ≈+3 pawns at the quarter-mark is an educated guess. Does the arctan curve make the bar feel responsive in the meaningful ±3-pawn middlegame range, or too flat/steep? **Owner**: Eason. **Resolution**: Tune during prototype against real reviewed games. *(Resolved 2026-06-30, S11-01: arctan curve adopted to match implementation; divisor 300 ships as the code constant.)*

### Technical questions

5. **Per-theme arrow/ring color values for ≥3:1 contrast**: like Chess Board's per-theme dot opacity, exact arrow colors must achieve ≥3:1 non-text contrast against measured square colors of each theme. **Owner**: ux-designer + accessibility-specialist. **Resolution**: After Settings theme palette is fixed, measure with a color sampler and lock per-theme values.
6. **Eval bar accessibility wording**: what exact `aria-label` phrasing best conveys a neutral tilt without implying judgment (e.g. "White advantage 1.2" vs "Evaluation plus 1.2")? **Owner**: accessibility-specialist. **Resolution**: During UX spec; must stay neutral per Pillar 3.
