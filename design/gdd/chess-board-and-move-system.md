# Chess Board & Move System

> **Status**: Approved (post-propagate-design-change 2026-05-27 — squareToRect contract, annotation z-order, last-move tint ownership added)
> **Author**: Eason + Claude
> **Last Updated**: 2026-05-27 (revised after `/design-review` round 1)
> **Implements Pillar**: Pillar 3 (Single Player, No Pressure) — the board is the calm, central canvas where all play happens
> **Priority**: v0 / Foundation
> **Depends on**: None (Foundation layer)
> **Depended on by**: Game Lifecycle, Move Annotation Display, Post-Game Review

## Overview

The Chess Board & Move System is the visual canvas and input layer where all chess gameplay happens. It renders an 8×8 board with pieces in their current position, accepts the player's move input (drag-and-drop or tap-to-select), validates moves against chess rules, and emits move events for other systems to consume. It does not own game state or AI logic — it is a pure presentation and input primitive, built on top of `vue3-chessboard` (which wraps lichess's chessground).

For the player, this is the only system they touch directly. Every other system in the app either feeds this one (game state, annotations, replay positions) or reacts to it (move detected → engine thinks). Its responsiveness and visual quality define the entire product's feel — a slow, ugly, or unresponsive board makes everything else feel cheap, no matter how good the underlying logic is.

Without this system, the app cannot exist — chess without a board is just a list of moves.

## Player Fantasy

The board should feel like a quiet temple with just enough life. When the player moves a piece, it glides — not snaps — to its destination. When a capture happens, the captured piece fades or tumbles off rather than vanishing, giving a small moment of acknowledgment without celebration. There are no confetti bursts, no "Brilliant!" labels, no XP popups. Yet the board is not dead silent either — pieces respond to touch, illegal moves return home with a gentle correction, and every action has a quiet visual confirmation.

The target feeling is **focused calm with subtle satisfaction**. The player should feel they're in a serious thinking space, not a casual game arena, but also feel that the interface respects them — every gesture matters, every move is acknowledged.

**Reference points:**
- **chess.com's piece-slide animation** — but without its noise (no "Brilliant!" labels, no avatar reactions)
- **lichess's clean restraint** — but slightly more polish, slightly more warmth
- **Well-made iOS apps** — subtle haptic feedback, gentle transitions, every touch acknowledged

**Explicitly NOT this system's job:**
- No achievement notifications, confetti, or celebratory bursts on capture
- No "Brilliant!" / "Mistake!" / "Blunder!" labels during play (those belong in Post-Game Review, after the game ends)
- No background music
- No timer pressure or visual urgency cues (per Pillar 3: No Pressure)

Isolating feedback to subtle, non-intrusive moments protects the player's concentration. During play, the dominant emotion should be **clear thinking** — not stimulation.

## Detailed Design

### Core Rules

1. **Display**: Render the current chess position from a FEN string (Forsyth–Edwards Notation, standard chess position format).
2. **Input modes (both always active):**
   - **Drag-and-drop**: tap a piece, drag to destination, release
   - **Tap-tap**: tap a piece to select, tap a destination square to move
3. **Selection feedback** (lichess / chess.com convention): When a piece is selected (drag started or tapped):
   - Empty legal destination squares → display a **semi-transparent small dot** in the center of each square
   - Capturable enemy pieces → display a **semi-transparent ring** around that piece
   - Both hints use the same color tone (default light gray; customizable via Settings theme)
   - Triggered by either drag-start or piece-tap
4. **Validation**: Validate every attempted move against chess rules (delegated to chess.js via vue3-chessboard).
5. **Illegal move**: Return piece to origin with a brief snap-back animation; no error message, no sound.
6. **Legal move**: Animate piece to destination; if a capture, the captured piece fades out.
7. **Promotion (with restrained feedback)**: When a pawn reaches the 8th (white) or 1st (black) rank:
   - **Flow**: Pawn slides to the back-rank square (normal MOVING animation) → dialog opens (PROMOTING state) → player picks → pawn glyph is swapped in place for the chosen piece with a brief warm tint
   - **Dialog**: Four options (Queen, Rook, Bishop, Knight) — 300ms fade-in with slight scale, Queen default-highlighted, anchored to the promotion file's destination square; falls back to centered only if it would clip the viewport
   - **After selection**: The new piece appears with a **brief warm tint** matching the last-move highlight color (no gold, no glow), duration `promotionTintMs`. Optional single low tone if Audio System is present — no rising 3-note chime
   - **Dismissal**: Escape key or tap-outside **cancels the entire move** — the pawn snaps back to its origin (same as illegal-move snap-back); no auto-promotion to Queen. The dialog is otherwise modal until a deliberate choice is made
   - **Rationale**: Promotion is rare and pivotal but still subject to Player Fantasy's "no celebratory burst" rule. The dialog gives a teaching moment (beginners learn underpromotion exists). A stray tap must never silently auto-promote.
8. **Last move highlight**: After a successful move, highlight the origin and destination squares.
9. **Check indicator**: When the player's king is in check, render a subtle red glow on the king square **plus a persistent thick border ring** around that square (non-color reinforcement for SC 1.4.1 and `prefers-reduced-motion` users). The glow pulses once at 800ms when check is first triggered, then fades to `checkGlowResidualOpacity` (default 0.3) until check is resolved by the player's next move. The border ring stays at full opacity throughout.
10. **Auto-orient**: The player's own pieces always at the bottom. Playing Black → board flips automatically.
11. **Disable when not player's turn**: All input (drag, tap) is ignored when it is the opponent's turn or the game has ended; pieces remain visually present but unmovable.
12. **Emit move event**: After each successful move, emit a `move-made` event with `{ from, to, promotion?, fen }` for other systems to consume.
13. **Coordinates off by default**: Files (a-h) and ranks (1-8) are hidden by default. Settings system can toggle them on.
14. **No premove**: Input is never queued during opponent's turn — premove is explicitly not supported (Pillar 3: No Pressure).
15. **Drag-vs-tap discriminator**: A pointer interaction is classified as a `tap` if cumulative movement ≤ `tapMaxMovementPx` (default 5) AND hold duration ≤ `tapMaxHoldMs` (default 250); otherwise classified as `drag`. Classification is final on pointer release. While ambiguous (below both thresholds), the piece visually follows the pointer but state stays PIECE_SELECTED; on release-as-tap with no destination crossed, selection persists; on release-as-tap on a legal destination square, the move commits.
16. **Disabled-state visual**: When DISABLED (opponent's turn or game ended), the player's own pieces dim to `disabledPieceOpacity` (default 0.85) to make turn ownership unmistakable. Opponent's pieces stay at full opacity. The board itself does not visually change.
17. **Overlay precedence (z-order, lowest → highest)**: square base color → last-move highlight tint → selection-square warm tint → check border ring → legal-move dot → capturable ring → check red glow → piece SVG → in-flight animating piece → **Move Annotation Display overlay** → promotion dialog. Only one tint is applied per square at any time; when two would conflict (e.g., selected piece is also part of last move), the higher-z layer wins.
18. **Annotation overlay contract (for Move Annotation Display):**
   - **`squareToRect` helper**: this system exposes `squareToRect(square: Square): { x: number; y: number; width: number; height: number } | null`. Coordinates are relative to `boardRef`'s top-left corner, orientation-aware (values are already corrected for Black perspective — callers need not flip). Returns `null` for any invalid square identifier. This is the sole source of square geometry for the overlay; the overlay must never compute its own geometry from CSS layout.
   - **Annotation overlay z-position**: the Move Annotation Display SVG overlay sits **above the in-flight animating piece layer** but below the promotion dialog (see z-order in Rule 17). This ensures arrows remain visible during piece move animations in replay/DISABLED mode.
   - **Last-move tint ownership**: this system draws its native last-move tint (Rule 8) in **all modes including DISABLED/replay**. Move Annotation Display must NOT render an additional `lastMove`-role highlight — doing so would double-draw and produce color conflicts. Last-move visual feedback is exclusively owned by this system.

### States and Transitions

| State | Description | Input | Transitions |
|-------|-------------|-------|-------------|
| **IDLE** | Waiting for player input. Board static. | Drag-start or piece-tap | → PIECE_SELECTED |
| **PIECE_SELECTED** | A piece is selected; legal destinations highlighted | Tap destination, tap another piece, tap empty | → IDLE (cancel) / MOVING (legal non-promotion) / MOVING_PROMOTION (legal pawn reaching back rank) |
| **MOVING** | Piece slide animation in progress for a non-promotion move | None (input ignored) | → IDLE (after slide + any capture fade complete) |
| **MOVING_PROMOTION** | Pawn slide animation in progress toward back-rank square | None | → PROMOTING (slide complete; pawn glyph still visible on back rank) |
| **PROMOTING** | Promotion dialog open over the destination square; pawn visible on back rank | Dialog buttons only (Esc / tap-outside cancels move) | → MOVING (after deliberate selection: swap glyph + warm tint) / IDLE-with-snapback (cancel: pawn returns to origin) |
| **DISABLED** | Opponent's turn or game ended | None | → IDLE (when player's turn resumes) |

**Notes**:
- PROMOTING is a *pause inside* the move sequence, not a sibling of MOVING — the pawn has already physically reached the back rank when PROMOTING begins.
- `move-made` event timing: emitted at the *logical commit point* (chess.js validation passes), which is **after** PROMOTING resolves for promotion moves and **at slide start** for normal moves. Payload includes `animationDoneAt: Promise` so consumers can await visual completion if needed.
- If the player cancels promotion (Esc / tap-outside), no `move-made` event is emitted; the pawn snap-back is treated as a discarded interaction.

### Interactions with Other Systems

| System | Direction | Interface |
|--------|-----------|-----------|
| **Game Lifecycle** | IN ← | Sets current position (FEN), informs whose turn, sets DISABLED state at game end |
| **Game Lifecycle** | OUT → | Emits `move-made` event with `{ from, to, promotion?, fen }` |
| **Move Annotation Display** | OUT → | Provides the board's DOM reference so Annotation can overlay arrows/highlights on same squares |
| **Post-Game Review** | IN ← | During replay: feeds positions, sets DISABLED, triggers Move Annotation for each step |
| **Settings** (future) | IN ← | Reads board theme, piece set, coordinates on/off |

## Formulas

**N/A** — This system has no design-level mathematical formulas.

**Why:**
- Chess rules are encoded in `chess.js` (bundled with vue3-chessboard), not authored by this project. Move generation, legality checking, and game-end detection are pure logic with no tunable variables.
- Visual feedback values (animation duration, highlight radius, glow intensity) are configuration values, not formulas. These are documented in the [Tuning Knobs](#tuning-knobs) section.
- No score calculation, no resource math, no probability distributions occur in this system.

Mathematical concerns appear in downstream systems: Skill Scoring defines the scoring formula; Chess Engine Integration defines depth/time math for Stockfish; Difficulty System defines ELO-to-Stockfish-skill-level mapping.

## Edge Cases

**Input edge cases:**
- **If the player taps an opponent's piece**: Ignore the input. No selection state change, no visual feedback. (Avoid confusing selection of pieces the player cannot move.)
- **If the player taps an empty square with no piece selected**: Ignore the input.
- **If the player releases a dragged piece on an illegal destination**: Snap piece back to origin with a brief ease-out animation. Return to IDLE.
- **If the player taps a different piece while in PIECE_SELECTED**: Cancel current selection, select the new piece.
- **If the player taps the already-selected piece**: Cancel selection. → IDLE.
- **If the player taps outside the board while in PIECE_SELECTED**: Cancel selection.

**Promotion edge cases:**
- **If the promotion dialog is dismissed without explicit selection** (escape key, tap outside): **Cancel the entire move.** The pawn animates back to its origin square (same as illegal-move snap-back), no `move-made` event is emitted, and the board returns to IDLE. Rationale: a stray tap on mobile must never silently auto-promote; preserving the choice as deliberate protects beginners who don't yet know underpromotion exists and prevents irreversible accidental moves.
- **If a `move-made` event consumer has already optimistically reacted to a promotion before PROMOTING resolves**: this is a consumer bug. The board only emits `move-made` *after* PROMOTING resolves (see States table notes). Consumers must not pre-fire on MOVING_PROMOTION.

**Mobile / system interruption edge cases:**
- **If multiple simultaneous touches occur**: Only the first touch is honored; additional touches ignored until first releases. (Avoid ambiguous multi-piece drag.)
- **If a drag is interrupted by a system event** (incoming call, app backgrounded, orientation change): Cancel the drag, return piece to origin, restore IDLE state.
- **If the board is resized** during PIECE_SELECTED or MOVING: Maintain selection, re-render highlights at new scale. Animation in MOVING may visually skip rather than re-animate.

**Data edge cases:**
- **If the FEN string passed in is invalid or malformed**: Fall back to the standard starting position; log a console error. Do not crash. Rationale: invalid FEN is a programmer bug, not a player concern — silent recovery preserves UX.
- **If a position update arrives mid-animation**: **Cancel the in-flight animation** and reconcile from the current visual position (not the target square) to the new authoritative position with a **short reconciliation animation** (`reconcileAnimationMs`, default 100ms — distinctly shorter than `pieceMoveAnimationMs`). This avoids a visible teleport. Game Lifecycle remains the source of truth; the board only owns the visual continuity.
- **If multiple position updates arrive mid-animation (queueing)**: Maintain a `pendingFen` queue of depth **1** (latest wins). Intermediate positions are dropped silently. This bounds memory during rapid Post-Game Review step-through and prevents cascading animation chains that would block input.
- **If a position update arrives during PROMOTING**: Treat the same as cancel (snap pawn back to origin) before applying the incoming FEN — Game Lifecycle has overruled the player's pending choice.

**Selection edge cases (beyond input rules above):**
- **If the player taps a different own-color piece on a legal destination of the currently selected piece** (ambiguous: re-select or move?): Treat as **re-selection** (matches lichess behavior). To capture your own piece is illegal anyway; this rule keeps the disambiguation simple and predictable.
- **If the player taps an empty square that is not a legal destination of the selected piece**: Cancel selection (return to IDLE). Same behavior as tapping outside the board.

**External state edge cases:**
- **If DISABLED is entered while PIECE_SELECTED** (e.g., opponent resigns mid-think, time control elapses externally): Selection clears; any pending drag is canceled with piece returning to origin. The board enters DISABLED.
- **If a snap-back animation is in progress when a FEN update arrives**: Abort the snap-back and apply the FEN as the authoritative state. Snap-back is purely visual; it can be interrupted by truth.

**Game state edge cases:**
- **If check happens but player has no legal moves** (checkmate): Board only highlights the king and waits for Game Lifecycle to set DISABLED. Game-over UI is owned by Game Lifecycle, not this system.

## Dependencies

### Upstream dependencies (this system depends on)

**None.** This is a Foundation-layer system with no internal dependencies.

### External dependencies (third-party libraries)

| Dependency | Version | Purpose | Replaceable? |
|------------|---------|---------|--------------|
| `vue3-chessboard` | ^1.x | Vue wrapper around chessground + chess.js | Yes, but at high cost (rewrite Vue integration layer) |
| `chessground` | (bundled) | lichess's chess board UI primitive | Yes — could swap for chessboard.js or custom DOM |
| `chess.js` | (bundled) | Chess rules and move validation | Yes — could swap for chessops, but current stack uses chess.js via vue3-chessboard |

> **Verification required**: chessground 9.x ships **without** built-in keyboard navigation. The Accessibility section's keyboard model is authored by this GDD, not inherited from the library. See Open Question #7 — must resolve before keyboard ACs can pass.

### Downstream dependents (systems that depend on this)

| System | What they need from us | Interface |
|--------|----------------------|-----------|
| **Game Lifecycle** | Set position + receive move events | Props: `fen`, `playerColor`, `disabled`. Events: `move-made` |
| **Move Annotation Display** | DOM/SVG reference to draw overlays on board squares | Exposed ref: `boardRef` (HTMLElement); `squareToRect(square: Square): { x: number; y: number; width: number; height: number } \| null` — coordinates relative to `boardRef`'s top-left, orientation-aware (already corrected for Black perspective), returns `null` for invalid squares |
| **Post-Game Review** | Display arbitrary positions in disabled (replay) mode | Same props as Game Lifecycle: `fen`, `disabled` |
| **Settings** (future) | Apply theme, piece set, coordinates toggle | Props: `theme`, `pieceSet`, `showCoordinates` |

### Bidirectional consistency notes

- When Game Lifecycle GDD is authored, it must declare receiving `move-made` events from this system and supplying `fen` props back
- Move Annotation Display consumes `squareToRect(square: Square): { x, y, width, height } | null` (coordinates relative to `boardRef` top-left, orientation-aware). Move Annotation must NOT draw a `lastMove`-role overlay — this system's native last-move tint covers all modes including DISABLED/replay (Rule 18).
- When Post-Game Review GDD is authored, it must declare reusing this same board component in disabled mode (not a separate replay board)

### Soft dependencies (enhanced by but not required)

- **Audio System** (future, Polish tier): If present, plays the optional promotion chime. This system functions silently if Audio System is absent.

## Tuning Knobs

| Knob | Default | Safe Range | What breaks if too high | What breaks if too low |
|------|---------|-----------|------------------------|----------------------|
| `pieceMoveAnimationMs` | 250 | 100–500 | Feels sluggish, blocks rapid play | Feels jarring, no sense of motion |
| `reconcileAnimationMs` | 100 | 50–200 | Mid-animation reconciliation lingers and feels stuttery | Reconciliation snaps, defeats the purpose of avoiding teleport |
| `snapBackAnimationMs` | 200 | 100–400 | Illegal-move feedback feels slow | Feels glitchy, like a stutter |
| `captureFadeMs` | 300 | 150–600 | Captures linger awkwardly | Captures feel like teleport (no acknowledgment) |
| `tapMaxMovementPx` | 5 | 3–10 | Drags get misread as taps; pieces don't follow finger | Taps get misread as drags; selection feels unresponsive |
| `tapMaxHoldMs` | 250 | 150–400 | Slow taps get misread as drags | Held drags get committed as taps |
| `legalMoveDotOpacity` | 0.4 (light theme) / 0.55 (dark theme) | 0.2–0.7 | Hints become visually noisy, distract from pieces | Hints invisible, beginners get lost. Per-theme value — must achieve ≥3:1 contrast against the square color it sits on |
| `legalMoveDotSize` (rem) | 0.5 | 0.3–0.8 | Dots cover the square center, ugly | Dots too small to spot at a glance |
| `captureRingThicknessPx` | 3 | 2–5 | Ring overlaps piece edges | Ring barely visible |
| `checkGlowIntensity` (0–1) | 0.6 | 0.3–0.9 | King area too red, feels alarming (violates calm pillar) | Player misses the check warning |
| `checkGlowResidualOpacity` (0–1) | 0.3 | 0.15–0.5 | Persistent red feels alarming | Glow disappears, only border ring remains |
| `checkBorderRingPx` | 3 | 2–5 | Border dominates the square | Border too thin to read as "this square is special" |
| `promotionTintMs` | 500 | 300–800 | Player waits too long to see the new piece | Tint flashes by, acknowledgment lost |
| `promotionTintColor` | matches `lastMoveHighlightColor` | any hex | — | — |
| `promotionToneVolume` (0–1) | 0.3 | 0–0.5 | Sound startles in quiet env | Inaudible (intentional muting OK) |
| `disabledPieceOpacity` (0–1) | 0.85 | 0.7–1.0 | Own pieces hard to read, may confuse | Hard to tell whose turn it is at a glance |
| `boardSizeMinPx` | 352 | 320–400 | Mobile portrait gets cramped | Touch targets break 44px rule. **Note**: 280–351 is a known non-conformant band — see Accessibility section |
| `boardSizeMaxPx` | 720 | 600–900 | Desktop board overwhelms layout | Desktop board feels tiny |
| `reducedMotionDurationMs` | 0 (instant) | 0–60 | Defeats the purpose — still appears as motion | — |

**Bundle budget (subsystem, not a tuning knob but a constraint)**: the chess board subsystem — vue3-chessboard + chess.js + piece-set SVGs + this component — must total ≤ 120KB gzipped. Verified at build time.

### Interaction notes

- `pieceMoveAnimationMs` and `captureFadeMs` should usually be tuned together — if move is 250ms and fade is 100ms, the fade finishes before the move arrives, creating a "ghost capture" effect.
- `legalMoveDotOpacity` is per-theme (defaults differ above) because a single global value cannot achieve ≥3:1 contrast on both light and dark squares simultaneously.
- **`prefers-reduced-motion` policy (deterministic)**: when the user has reduced motion enabled, all animation durations collapse to `reducedMotionDurationMs` (default 0 = instant). Snap-back becomes instant. Promotion tint becomes a single-frame highlight. Check pulse is removed (border ring remains). This is non-negotiable — partial-reduction (e.g., "80% shorter") still produces motion artifacts on iOS WebKit and fails WCAG intent.
- **All animations must use `transform` and `opacity` only** (GPU compositor properties). Animating `width`, `height`, `top`, `left`, or `box-shadow` is forbidden by this GDD because it triggers layout/paint thrash that breaks the 60fps budget on mid-tier iPhones. Check glow must be implemented as an SVG overlay with `opacity` transitions, not `box-shadow`.
- **Selection overlays must use chessground's native `drawable` API**, not Vue-reactive SVG children, to avoid a full vDOM diff on every selection change (up to 27 simultaneous dots for a centralized queen).

### Source of truth

These values live in a TypeScript config file (e.g., `src/config/board-tuning.ts`) as named exports. Settings panel (Polish tier) reads them for theme presets but cannot exceed Safe Range bounds.

## Visual/Audio Requirements

### Visual

**Static visual elements:**
- **Chess pieces**: SVG assets, one set per theme (default: a Staunton-like clean modern set). Pieces scale crisp at any board size. Future Settings system can switch piece sets.
- **Board squares**: Two-color checkerboard. Default theme uses warm light/dark gray (low saturation to support the "temple" feel). At least three theme presets ready: Classic (cream/brown), Modern (light/dark gray), Slate (cool tones).
- **Coordinate labels**: Files (a–h) and ranks (1–8) in a small unobtrusive font, hidden by default; rendered along bottom and left edges when enabled.

**Dynamic visual elements:**
- **Legal-move dot**: Semi-transparent filled circle, centered on each empty legal destination square. Sizing per `legalMoveDotSize`, opacity per `legalMoveDotOpacity`.
- **Capturable ring**: Semi-transparent ring around enemy pieces that can be captured. Thickness per `captureRingThicknessPx`.
- **Last-move highlight**: Translucent overlay on origin + destination squares of the most recent move (~25% opacity, theme-tinted).
- **Check indicator**: Two layers — (1) soft red radial gradient centered on the king's square (`checkGlowIntensity`), pulses once at 800ms when check is first triggered then fades to `checkGlowResidualOpacity` until resolved; (2) **persistent thick border ring** (`checkBorderRingPx`) around the king square that remains at full opacity throughout, providing a non-color, non-motion cue that survives `prefers-reduced-motion` and forced-colors environments.
- **Promotion tint**: Brief warm tint on the newly-promoted piece's square (same color family as `lastMoveHighlightColor`, not gold), duration per `promotionTintMs`. No glow, no gold, no scale.
- **Selection highlight**: When a piece is in PIECE_SELECTED state, its square gets a faint warm tint (visually distinct from last-move tint via lighter saturation) to reinforce "this is the active piece."
- **Forced-colors / Windows High Contrast Mode fallback**: When `forced-colors: active` is detected, dots and rings are rendered with `SelectedItem` / `Highlight` system colors and a 1px solid outline; last-move and selection tints become 2px solid outlines instead of fills; check border ring uses `CanvasText` color.

**Animations:**
- **Piece slide**: Linear-ease-out interpolation from origin to destination. Duration per `pieceMoveAnimationMs`.
- **Capture fade**: Captured piece fades opacity from 1.0 → 0.0 + slight scale down (1.0 → 0.85). Duration per `captureFadeMs`. Starts when the capturing piece arrives.
- **Snap-back**: Piece returns to origin with ease-in-out. Duration per `snapBackAnimationMs`.
- **Promotion dialog**: Fade-in with subtle scale (0.95 → 1.0) over 300ms.
- **All animations collapse to `reducedMotionDurationMs` (default 0)** when `prefers-reduced-motion: reduce` is set — see Tuning Knobs > Interaction notes for the full policy.
- **All animations use `transform` and `opacity` only** — no `width`/`height`/`top`/`left`/`box-shadow` animations (60fps budget constraint).

### Audio

All sounds optional, user-toggleable globally. Sounds must be:
- Short (< 300ms)
- Low-frequency, warm timbre (no harsh beeps)
- Volume capped at the tuning knob's safe range

| Event | Sound | Default volume | Purpose |
|-------|-------|----------------|---------|
| Move (normal) | Soft "tap" or muted woodblock | 0.2 | Subtle confirmation |
| Move (capture) | Slightly heavier "thud" | 0.3 | Distinguishes capture from move |
| Check | Brief low tone | 0.3 | Warning without alarm |
| Promotion | **Single soft low tone** (NOT a rising chime — would read as celebratory burst) | 0.3 (per `promotionToneVolume`) | Restrained acknowledgment, optional |
| Illegal-move snap-back | Optional soft "click" or silence | 0.15 | Acknowledge rejection |
| Selection (piece tap) | Optional very subtle "tick" or silence | 0.1 | Most users will keep this off |

Audio is gated by the future Audio System. This system functions silently if Audio System is absent.

> **📌 Asset Spec** — After the art bible is approved, run `/asset-spec system:chess-board-and-move-system` to produce per-asset visual descriptions and generation prompts from this section.

## UI Requirements

The board itself is a UI primitive — most "UI" concerns are covered in [Detailed Design](#detailed-design). This section focuses on cross-cutting UI concerns:

### Layout & Responsive Behavior

- **Mobile portrait** (≤ 480px): Board fills available width, centered horizontally. Min size 280px. Coordinate labels off by default to maximize space.
- **Mobile landscape**: Board sized to fit available height, not width. Layout shifts to put metadata (turn indicator, captured pieces) beside the board, not above/below.
- **Tablet & desktop**: Board centered, max width per `boardSizeMaxPx`. Surrounding UI (move list, controls) flows around it.
- **Board must remain square** at all viewport sizes — never stretched.

### Accessibility (WCAG 2.1 AA target)

- **Touch targets**: Each square ≥ 44 × 44px effective hit area at all board sizes ≥ `boardSizeMinPx` (352px). The 280–351px band is documented as non-conformant; the responsive layout must not let the board shrink below 352px unless the viewport is too small to fit any usable layout, in which case the layout reflows (per SC 1.4.10) rather than shrinking the board further.
- **Keyboard navigation** (full spec — do NOT assume vue3-chessboard provides this; see Open Questions):
  - The board is a single tabbable widget (roving tabindex; only the currently-focused square has `tabindex="0"`, all others `-1`)
  - Arrow keys move focus to the adjacent square; Home/End jump to the file edge (a/h-file); PgUp/PgDn jump to the rank edge (rank 1/8)
  - Enter or Space on an own piece enters PIECE_SELECTED; Enter or Space on a legal destination commits the move; Enter or Space on the same selected piece cancels
  - Escape cancels selection or move and returns focus to the origin square
  - Promotion dialog: focus trap inside the four buttons; arrow keys cycle Queen ↔ Rook ↔ Bishop ↔ Knight; digit keys 1/2/3/4 select directly; Enter commits; Escape cancels the move (per Rule 7) and returns focus to the origin square
- **Screen reader announcements** (`aria-live` model):
  - One `aria-live="assertive"` region for move feedback: legal moves (`"e4"` / `"Nxe5, capturing knight"` / `"O-O"` / `"e8=Q"`), illegal-move rejection (`"Illegal move, knight returned to g1"`), check (`"Check"`), checkmate (`"Checkmate"`), stalemate (`"Stalemate"`), promotion choice opened (`"Promote pawn — choose Queen, Rook, Bishop, or Knight"`)
  - One `aria-live="polite"` region for ambient state: turn change (`"Black to move"`), opponent's move (`"Black plays Nxe5"`) — fired *after* the opponent's move animation completes
  - Each square: `role="gridcell" aria-label="e4, empty"` or `"e4, white knight"`; updates on every position change
  - Live-region collision policy: if two announcements would fire within 100ms (e.g., capture + check), they are merged into one (`"Nxe5, capturing knight, check"`); never queued unbounded
- **Promotion dialog ARIA**: `role="dialog" aria-modal="true" aria-label="Promote pawn"`; each button `aria-label="Promote to queen"` etc.
- **Color contrast**:
  - Pieces vs squares: WCAG AA (≥4.5:1 for piece SVG outline against either square color)
  - Legal-move dots: ≥3:1 non-text contrast (SC 1.4.11) against *both* default-light and default-dark square colors; if a single fill cannot satisfy both, add a 1px contrasting outline
  - Last-move tint and selection tint: ≥3:1 non-text contrast against the unhighlighted square color (i.e., the tint must be visibly different from a plain square)
  - Check glow + border ring: the border ring alone must ≥3:1 against the king's square color (so the red glow is supplementary, not load-bearing)
- **No color-only signaling**: Check is signaled by border ring (shape) + red glow (color) + screen-reader announcement (text); any one alone is sufficient — satisfies SC 1.4.1.
- **Reduced motion**: per Tuning Knobs policy — all animations collapse to instant.
- **Forced colors**: per Visual section — fallback styles apply when `forced-colors: active`.
- **Zoom & reflow (SC 1.4.4, 1.4.10)**: At 200% browser zoom on a 1280×800 viewport, the board must remain functional with no horizontal scrolling; the promotion dialog must reflow to fit. At 400% zoom on a 320×256 viewport, the board may use full viewport width.
- **Drag accessibility (SC 2.5.7)**: Tap-to-select is the complete-feature equivalent of drag-and-drop — no input path is drag-only. Switch and voice-control users use tap-tap or keyboard.

### Promotion dialog UI

- **Anchoring**: Anchored to the promotion file's destination square — the four buttons form a vertical column extending from the back-rank square toward the player's side (matches lichess / chess.com convention). Falls back to centered above the board only if the anchored layout would clip the viewport.
- Four equal-sized buttons in a column: Queen | Rook | Bishop | Knight (player's color).
- Each button shows the piece SVG + name label.
- Queen button has the initial focus and a subtle highlight ring (default focus).
- **Dismissal**: Escape key or tap-outside **cancels the entire move** (pawn snaps back to origin) — does NOT auto-promote to Queen. This protects beginners against accidental irreversible promotions.
- **Focus management**: `role="dialog" aria-modal="true"`; focus trapped inside the four buttons; arrow keys cycle; digit keys 1/2/3/4 select directly; closing returns focus to the origin square.
- Buttons ≥ 56 × 56px (above the touch-target minimum because this is a critical, infrequent action).

> **📌 UX Flag — Chess Board & Move System**: In Pre-Production phase, run `/ux-design` to author a UX spec for the promotion dialog and any cross-screen integration before writing implementation epics.

## Acceptance Criteria

### Board rendering

- **GIVEN** a valid FEN string is provided, **WHEN** the board mounts, **THEN** all pieces appear on their correct squares within 100ms.
- **GIVEN** an invalid FEN string is provided, **WHEN** the board mounts, **THEN** the standard starting position is rendered and a console error is logged.
- **GIVEN** the player is set to Black, **WHEN** the board mounts, **THEN** the board displays with Black pieces at the bottom (rank 8 at bottom).

### Input — drag-and-drop

- **GIVEN** it is the player's turn, **WHEN** the player drags their own piece to a legal destination, **THEN** the piece animates to the destination and a `move-made` event is emitted with `{ from, to, fen }`.
- **GIVEN** it is the player's turn, **WHEN** the player drags their own piece to an illegal destination, **THEN** the piece snaps back to its origin within `snapBackAnimationMs` and no event is emitted.
- **GIVEN** it is the opponent's turn, **WHEN** the player attempts to drag any piece, **THEN** no drag interaction starts (input ignored).

### Input — tap-tap

- **GIVEN** it is the player's turn and no piece is selected, **WHEN** the player taps their own piece, **THEN** the piece enters PIECE_SELECTED state and all legal destinations show dots/rings.
- **GIVEN** a piece is selected, **WHEN** the player taps a legal destination, **THEN** the piece animates to that square and a `move-made` event is emitted.
- **GIVEN** a piece is selected, **WHEN** the player taps the same piece again, **THEN** selection is cancelled and dots/rings disappear (return to IDLE).
- **GIVEN** a piece is selected, **WHEN** the player taps a different own-color piece, **THEN** the new piece becomes selected and old selection clears.

### Promotion

- **GIVEN** the player drags or taps a pawn to the 8th/1st rank, **WHEN** the pawn-slide animation completes, **THEN** the promotion dialog appears anchored to the promotion file with Queen focused within 300ms (±50ms).
- **GIVEN** the promotion dialog is open, **WHEN** the player selects any piece (click, tap, Enter on focused button, or digit key 1–4), **THEN** the pawn glyph is replaced with that piece AND a warm tint matching `lastMoveHighlightColor` animates on the new square for `promotionTintMs` (±50ms) AND a `move-made` event is emitted with `promotion: [selected-piece]`.
- **GIVEN** the promotion dialog is open, **WHEN** the player dismisses without selection (Escape or tap outside), **THEN** the pawn snaps back to its origin square within `snapBackAnimationMs` (+50ms) AND **no** `move-made` event is emitted AND focus returns to the pawn's origin square.
- **GIVEN** the promotion dialog is open, **WHEN** a screen reader is connected, **THEN** the dialog announces `"Promote pawn — choose Queen, Rook, Bishop, or Knight"` via assertive live region AND focus is on the Queen button AND focus cannot leave the four buttons until a choice is made or the dialog cancels.

### Visual feedback

- **GIVEN** a move just completed, **WHEN** the board re-renders, **THEN** the origin and destination squares carry the `data-last-move="true"` attribute AND the rendered tint achieves ≥3:1 non-text contrast against the unhighlighted square color.
- **GIVEN** the player's king is in check, **WHEN** the board re-renders, **THEN** the king square shows (a) a red glow at intensity `checkGlowIntensity` that pulses once then fades to `checkGlowResidualOpacity`, AND (b) a persistent border ring of width `checkBorderRingPx` AND (c) an assertive screen-reader announcement of `"Check"`.
- **GIVEN** the player's king is in check AND `prefers-reduced-motion: reduce` is set, **WHEN** the board re-renders, **THEN** no pulse animation occurs but the border ring is still present (non-color, non-motion cue survives).
- **GIVEN** the user has `prefers-reduced-motion: reduce` set in their OS, **WHEN** any move or capture would animate, **THEN** all animation durations equal `reducedMotionDurationMs` (default 0) — pieces snap to destination instantly, no fade, no glow.
- **GIVEN** overlays would stack on the same square (e.g., selected piece on a last-move square that is also in check), **WHEN** the board renders, **THEN** the visible layers follow the z-order in Rule 17 AND no two competing tints fill the same square simultaneously.

### Mobile / system interruption

- **GIVEN** the player has started a drag (Vitest unit), **WHEN** `document.dispatchEvent(new Event('visibilitychange'))` fires with `document.hidden = true`, **THEN** `cancelDrag()` is called AND the piece position state resets to the origin square.
- **GIVEN** the player is mid-drag on a real iPhone (manual evidence), **WHEN** the app is backgrounded or the device rotates, **THEN** the piece visibly returns to its origin — documented in `production/qa/evidence/`.
- **GIVEN** the player is dragging a piece, **WHEN** a second touch begins on a piece, **THEN** the second touch is ignored until the first releases.

### Input edge cases (missing ACs added)

- **GIVEN** it is the player's turn, **WHEN** the player taps an opponent's piece, **THEN** no state change occurs AND no visual feedback is shown.
- **GIVEN** PIECE_SELECTED is active, **WHEN** the player taps outside the board (any non-board area), **THEN** selection clears and the board returns to IDLE.
- **GIVEN** PIECE_SELECTED is active, **WHEN** the viewport resizes, **THEN** selection state is preserved AND highlights re-render at the new scale within one frame.
- **GIVEN** PIECE_SELECTED is active, **WHEN** the selected piece can capture an opponent piece on a square, **THEN** that square renders a capturable ring (NOT a dot) AND the count of `.move-capture` elements equals the count of legal-capture destinations from `chess.js.moves({square, verbose:true})`.

### Event payload

- **GIVEN** a non-promotion move completes, **WHEN** the `move-made` event fires, **THEN** the payload has `promotion: undefined` (not `null`, not a string).
- **GIVEN** any move completes, **WHEN** the `move-made` event fires, **THEN** the `fen` field equals the position *after* the move is applied (verified by re-feeding into chess.js).
- **GIVEN** the board is in DISABLED state, **WHEN** an external system updates the FEN, **THEN** no `move-made` event fires (only Game Lifecycle should fire authoritative state changes).

### Accessibility ACs

- **GIVEN** a Playwright test with `@axe-core/playwright`, **WHEN** the board mounts in the starting position, **THEN** no axe violations of impact `serious` or `critical` are reported.
- **GIVEN** the board has keyboard focus, **WHEN** arrow keys are pressed, **THEN** the focused square indicator moves one square in the corresponding direction AND wraps at board edges (no, does not wrap — confirm via dedicated test).
- **GIVEN** the board has keyboard focus on an own piece, **WHEN** Enter is pressed, **THEN** PIECE_SELECTED is entered AND dots/rings appear AND the assertive live region announces the selection (`"Knight at g1 selected"`).
- **GIVEN** the promotion dialog is open, **WHEN** Tab is pressed repeatedly, **THEN** focus cycles only among the four promotion buttons (focus trap verified).
- **GIVEN** a default theme is rendered, **WHEN** computed pixel colors are measured, **THEN** legal-move dot fill achieves ≥3:1 contrast against both the light-square and dark-square colors (axe + manual color sampling).
- **GIVEN** the OS `forced-colors: active` media query is matched (test via Playwright `emulateMedia`), **WHEN** the board renders, **THEN** dots and rings use `SelectedItem`/`Highlight` colors with outlines AND the check border ring uses `CanvasText`.
- **GIVEN** `prefers-reduced-motion: reduce` is set, **WHEN** any move occurs, **THEN** the measured `transition-duration` of the piece element equals `0s` (or matches `reducedMotionDurationMs` if non-zero is configured).

### Experiential acceptance (playtest evidence)

- **GIVEN** 5 chess beginners (ELO < 800 or self-identified beginners) play the board for 10 minutes each, **WHEN** asked to describe how the board felt in 3 words, **THEN** at least 4 of 5 describe it using words from the calm family (calm / quiet / focused / clean / restful) AND zero describe it using words from the celebratory family (exciting / flashy / loud / busy). Evidence stored in `production/qa/evidence/`.

### Disabled mode (replay / opponent turn)

- **GIVEN** the board is in DISABLED state, **WHEN** the player attempts any drag or tap, **THEN** no state change occurs and no event is emitted.
- **GIVEN** the board is in DISABLED state, **WHEN** an external system updates the FEN, **THEN** pieces animate to the new position.

### squareToRect helper

- **GIVEN** a valid algebraic square (e.g., `'e4'`), **WHEN** `squareToRect('e4')` is called, **THEN** it returns `{ x, y, width, height }` relative to `boardRef`'s top-left AND `width === height` (square cells are equal-sided) AND values update correctly when board orientation flips between White and Black perspective.
- **GIVEN** an invalid square identifier (e.g., `'z9'`), **WHEN** `squareToRect('z9')` is called, **THEN** it returns `null`.
- **GIVEN** the board is in any state (IDLE, DISABLED, MOVING, etc.), **WHEN** `squareToRect` is called, **THEN** it returns the current pixel rect — values are live, not cached from a previous render.

### Performance

- **GIVEN** any single move animates on a fixed-CPU CI runner (Chromium with 4× CPU throttle), **WHEN** a CDP performance trace is captured, **THEN** no frame in the trace exceeds **20ms** (50fps lower bound for worst-case) AND the p95 frame time is ≤ **16.6ms** (60fps target). Test is tagged `@perf` and excluded from the default suite.
- **GIVEN** the board subsystem bundle is built for production, **WHEN** measured gzipped, **THEN** chess-board JS + chess.js + piece-set SVGs total ≤ **120KB gzipped**.
- **GIVEN** the board mounts on Chromium with `Mobile - Slow 4G` Lighthouse-CI profile, **WHEN** Lighthouse reports, **THEN** Time-to-Interactive ≤ **3s including bundle download** (aligned with `technical-preferences.md` "< 3s on mobile 4G" budget; a tighter ≤1.5s target requires switching to the `Fast 4G` profile, which is the chosen baseline once bundle is < 60KB gzipped).
- **GIVEN** the board mounts on a real iPhone Safari 16+ device on a real 4G connection, **WHEN** measured manually and recorded in `production/qa/evidence/`, **THEN** TTI is documented (target ≤ 1.5s) — flagged as Visual/Feel evidence, not blocking automated CI.
- **GIVEN** a position update arrives during an in-flight piece animation, **WHEN** the new FEN differs from the current animation's target, **THEN** the in-flight animation is canceled AND a reconciliation animation of `reconcileAnimationMs` (±50ms) runs from the current visual position to the new authoritative position AND no visible teleport occurs.
- **GIVEN** rapid position updates during Post-Game Review step-through, **WHEN** more than one update arrives mid-animation, **THEN** only the latest is applied (queue depth 1) AND memory measured before and after 100 rapid steps shows no monotonic growth beyond 5MB.

## Open Questions

### Design questions

1. **Default piece set**: Which specific SVG piece set do we ship as the default? Options: vue3-chessboard's default, lichess Cburnett set (open license), or a custom set. **Owner**: Eason. **Resolution**: Before v0 implementation begins (during prototype phase).
2. **Sound design tone**: The audio descriptions ("soft woodblock," "gentle chime") need actual sound files to evaluate. **Owner**: Audio System GDD (Polish tier). **Resolution**: Deferred to Polish tier — not blocking v0.
3. **Premove future-proofing**: We've decided no premove for v0. If we ever add it (e.g., for a "speed practice" mode), should this system handle premove logic, or should a parent system queue moves and feed them after opponent moves? **Owner**: Will become an ADR if/when premove is reconsidered. **Resolution**: Not blocking — flag for future.

### Technical questions

4. **iOS Safari Stockfish performance impact on board responsiveness**: When Stockfish is analyzing (especially deep analysis in Post-Game Review), does it block the main thread enough to make the board feel laggy? **Owner**: Chess Engine Integration GDD. **Resolution**: Prototype Stockfish in a Web Worker before Post-Game Review GDD is finalized.
5. **Multiple board instances on one page**: For potential future features (e.g., side-by-side comparison view, opening trainer with multiple positions), can vue3-chessboard handle N boards on one page without performance degradation? **Owner**: Not blocking v0. **Resolution**: Test with 2-3 instances during prototype if time allows.
6. **Landscape orientation on small phones**: At very small heights (e.g., iPhone SE landscape ≈ 375 × 667), does the board fit usefully with the move list beside it, or should we force portrait? **Owner**: UX spec (Pre-Production). **Resolution**: Decide during UX spec authoring. **Constraint**: must not force portrait (would violate WCAG 2.1 SC 1.3.4 Orientation).
7. **Keyboard navigation feasibility in vue3-chessboard / chessground 9.x**: The Accessibility section specifies a full keyboard model (roving tabindex, arrow keys, Home/End, PgUp/PgDn, Enter/Space, Escape). chessground 9.x does NOT provide this out of the box. **Owner**: ui-programmer. **Resolution**: Before v0 implementation — verify whether we extend vue3-chessboard's API surface, write a custom focus manager component as a sibling, or fork chessground locally. Blocks the keyboard ACs from passing.
8. **Drag-vs-tap threshold tuning on iPhone**: Defaults (`tapMaxMovementPx: 5`, `tapMaxHoldMs: 250`) are educated guesses. **Owner**: gameplay-programmer + Eason. **Resolution**: Tune during prototype on a real iPhone — capture playtest evidence and lock defaults before v0 implementation hardens.
9. **Per-theme dot opacity values**: The Tuning Knobs default uses 0.4 (light) / 0.55 (dark) but exact values must achieve ≥3:1 contrast against measured square colors. **Owner**: ux-designer + accessibility-specialist. **Resolution**: After theme palette is fixed in Settings GDD, measure with a color sampler and lock per-theme values.
10. **Forced-colors styling verification**: The fallback styles described in Visual Requirements need to be verified in Windows High Contrast Mode across Chromium-based Edge and Firefox. **Owner**: accessibility-specialist + ui-programmer. **Resolution**: Manual smoke during v0 build.
