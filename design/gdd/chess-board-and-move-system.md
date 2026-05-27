# Chess Board & Move System

> **Status**: In Design
> **Author**: Eason + Claude
> **Last Updated**: 2026-05-27
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
7. **Promotion (with ritual feedback)**: When a pawn reaches the 8th (white) or 1st (black) rank:
   - **Dialog**: Pop up with four options (Queen, Rook, Bishop, Knight) — 300ms fade-in with slight scale, Queen default-highlighted
   - **After selection**: The new piece appears on board with a **soft glow animation** (500ms), accompanied by an optional subtle sound (e.g., low chime)
   - **Rationale**: Promotion is a rare, pivotal moment in a game — it deserves visual + audio acknowledgment that other moves don't get. But feedback stays restrained ("temple feel"), not celebratory.
   - **Boundary**: This is the **only** "special moment feedback" the board emits. All other moves (including check and captures) keep minimal feedback.
8. **Last move highlight**: After a successful move, highlight the origin and destination squares.
9. **Check indicator**: When the player's king is in check, render a subtle red glow on the king square.
10. **Auto-orient**: The player's own pieces always at the bottom. Playing Black → board flips automatically.
11. **Disable when not player's turn**: All input (drag, tap) is ignored when it is the opponent's turn or the game has ended; pieces remain visually present but unmovable.
12. **Emit move event**: After each successful move, emit a `move-made` event with `{ from, to, promotion?, fen }` for other systems to consume.
13. **Coordinates off by default**: Files (a-h) and ranks (1-8) are hidden by default. Settings system can toggle them on.
14. **No premove**: Input is never queued during opponent's turn — premove is explicitly not supported (Pillar 3: No Pressure).

### States and Transitions

| State | Description | Input | Transitions |
|-------|-------------|-------|-------------|
| **IDLE** | Waiting for player input. Board static. | Drag-start or piece-tap | → PIECE_SELECTED |
| **PIECE_SELECTED** | A piece is selected; legal destinations highlighted | Tap destination, tap another piece, tap empty | → IDLE (cancel) / MOVING (legal) / PROMOTING (legal + promotion) |
| **MOVING** | Piece animation in progress | None | → IDLE (after animation) |
| **PROMOTING** | Promotion dialog showing | Dialog buttons only | → MOVING (after selection) |
| **DISABLED** | Opponent's turn or game ended | None | → IDLE (when player's turn / game restarted) |

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
- **If the promotion dialog is dismissed without explicit selection** (escape key, tap outside on desktop): Treat as Queen promotion, **with the same celebration animation as a deliberate selection**. Rationale: a pawn reaching promotion MUST become something (chess rules forbid staying a pawn), but the player still went through the work — the moment deserves acknowledgment regardless of how the choice was made.

**Mobile / system interruption edge cases:**
- **If multiple simultaneous touches occur**: Only the first touch is honored; additional touches ignored until first releases. (Avoid ambiguous multi-piece drag.)
- **If a drag is interrupted by a system event** (incoming call, app backgrounded, orientation change): Cancel the drag, return piece to origin, restore IDLE state.
- **If the board is resized** during PIECE_SELECTED or MOVING: Maintain selection, re-render highlights at new scale. Animation in MOVING may visually skip rather than re-animate.

**Data edge cases:**
- **If the FEN string passed in is invalid or malformed**: Fall back to the standard starting position; log a console error. Do not crash. Rationale: invalid FEN is a programmer bug, not a player concern — silent recovery preserves UX.
- **If a position update arrives mid-animation**: Complete the current animation, then apply the new position. If new position contradicts in-progress move, prefer the incoming position (Game Lifecycle is truth).

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

### Downstream dependents (systems that depend on this)

| System | What they need from us | Interface |
|--------|----------------------|-----------|
| **Game Lifecycle** | Set position + receive move events | Props: `fen`, `playerColor`, `disabled`. Events: `move-made` |
| **Move Annotation Display** | DOM/SVG reference to draw overlays on board squares | Exposed ref: `boardRef` (HTMLElement); square-to-pixel coordinate helper |
| **Post-Game Review** | Display arbitrary positions in disabled (replay) mode | Same props as Game Lifecycle: `fen`, `disabled` |
| **Settings** (future) | Apply theme, piece set, coordinates toggle | Props: `theme`, `pieceSet`, `showCoordinates` |

### Bidirectional consistency notes

- When Game Lifecycle GDD is authored, it must declare receiving `move-made` events from this system and supplying `fen` props back
- When Move Annotation Display GDD is authored, it must declare consuming this system's `boardRef` and coordinate helper
- When Post-Game Review GDD is authored, it must declare reusing this same board component in disabled mode (not a separate replay board)

### Soft dependencies (enhanced by but not required)

- **Audio System** (future, Polish tier): If present, plays the optional promotion chime. This system functions silently if Audio System is absent.

## Tuning Knobs

| Knob | Default | Safe Range | What breaks if too high | What breaks if too low |
|------|---------|-----------|------------------------|----------------------|
| `pieceMoveAnimationMs` | 250 | 100–500 | Feels sluggish, blocks rapid play | Feels jarring, no sense of motion |
| `snapBackAnimationMs` | 200 | 100–400 | Illegal-move feedback feels slow | Feels glitchy, like a stutter |
| `captureFadeMs` | 300 | 150–600 | Captures linger awkwardly | Captures feel like teleport (no acknowledgment) |
| `legalMoveDotOpacity` | 0.4 | 0.2–0.7 | Hints become visually noisy, distract from pieces | Hints invisible, beginners get lost |
| `legalMoveDotSize` (rem) | 0.5 | 0.3–0.8 | Dots cover the square center, ugly | Dots too small to spot at a glance |
| `captureRingThicknessPx` | 3 | 2–5 | Ring overlaps piece edges | Ring barely visible |
| `checkGlowIntensity` (0–1) | 0.6 | 0.3–0.9 | King area too red, feels alarming (violates calm pillar) | Player misses the check warning |
| `promotionGlowMs` | 500 | 300–800 | Player waits too long to see the new piece | Glow flashes by, ritual feel lost |
| `promotionGlowColor` | `#FFD700` (gold) | any hex | — | — |
| `promotionChimeVolume` (0–1) | 0.3 | 0–0.5 | Sound startles in quiet env | Inaudible (intentional muting OK) |
| `boardSizeMinPx` | 280 | 240–320 | Mobile portrait gets cramped | Touch targets break 44px rule |
| `boardSizeMaxPx` | 720 | 600–900 | Desktop board overwhelms layout | Desktop board feels tiny |

### Interaction notes

- `pieceMoveAnimationMs` and `captureFadeMs` should usually be tuned together — if move is 250ms and fade is 100ms, the fade finishes before the move arrives, creating a "ghost capture" effect.
- `legalMoveDotOpacity` and the active theme's background contrast affect each other — a dark theme needs higher opacity than a light theme.
- All animation knobs should respect `prefers-reduced-motion` media query — if the user has reduced motion enabled, durations should be cut by ~80% or animations disabled entirely.

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
- **Check indicator**: Soft red radial gradient centered on the king's square, intensity per `checkGlowIntensity`. Pulses subtly (1 cycle at 800ms) when check is first triggered, then static.
- **Promotion glow**: Gold-toned soft glow on the newly-promoted piece, duration per `promotionGlowMs`.
- **Selection highlight**: When a piece is in PIECE_SELECTED state, its square gets a faint warm tint to reinforce "this is the active piece."

**Animations:**
- **Piece slide**: Linear-ease-out interpolation from origin to destination. Duration per `pieceMoveAnimationMs`.
- **Capture fade**: Captured piece fades opacity from 1.0 → 0.0 + slight scale down (1.0 → 0.85). Duration per `captureFadeMs`. Starts when the capturing piece arrives.
- **Snap-back**: Piece returns to origin with ease-in-out. Duration per `snapBackAnimationMs`.
- **Promotion dialog**: Fade-in with subtle scale (0.95 → 1.0) over 300ms.
- **All animations respect** `prefers-reduced-motion` — reduced by 80% or skipped entirely if user has the OS setting enabled.

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
| Promotion | Gentle chime (rising 3 notes) | 0.3 (per `promotionChimeVolume`) | Ritual moment marker |
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

### Accessibility

- **Touch targets**: Each square ≥ 44 × 44px effective hit area on mobile (per Apple HIG).
- **Keyboard navigation**: Tab focuses the board, then arrow keys move a focus indicator between squares; Enter/Space selects a piece, then again to move. (Implementation: vue3-chessboard supports this out of the box.)
- **Screen readers**: Each square has an ARIA label with its coordinate (e.g., `aria-label="e4"`). Pieces include their identity (e.g., `aria-label="e4, white knight"`). Move events announce the move in algebraic notation.
- **Color contrast**: Default themes must pass WCAG AA contrast for piece-vs-square. Legal-move dots and rings must be perceptible against both light and dark squares.
- **No color-only signaling**: Check indicator (red glow) is reinforced by the subtle pulse animation, so red-green colorblind users still get the cue.

### Promotion dialog UI

- Centered modal-style overlay above the board.
- Four equal-sized buttons in a row: Queen | Rook | Bishop | Knight.
- Each button shows the piece SVG (in the player's color) + name label below.
- Queen button has a subtle highlight (default focus).
- Escape key or click-outside dismisses with Queen as fallback.
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

- **GIVEN** the player drags a pawn to the 8th/1st rank, **WHEN** the pawn lands on the promotion square, **THEN** the promotion dialog appears with Queen highlighted within 300ms.
- **GIVEN** the promotion dialog is open, **WHEN** the player selects any piece, **THEN** the pawn is replaced with that piece AND a soft glow animates on the new piece for `promotionGlowMs` AND a `move-made` event is emitted with `promotion: [selected-piece]`.
- **GIVEN** the promotion dialog is open, **WHEN** the player dismisses without selection (escape key or tap outside), **THEN** Queen promotion is applied with the same glow + chime as a deliberate selection.

### Visual feedback

- **GIVEN** a move just completed, **WHEN** the board re-renders, **THEN** the origin and destination squares of the last move are visually highlighted.
- **GIVEN** the player's king is in check, **WHEN** the board re-renders, **THEN** the king square shows a red glow at intensity `checkGlowIntensity`.
- **GIVEN** the user has `prefers-reduced-motion` enabled in their OS, **WHEN** any move animates, **THEN** all animation durations are reduced by ~80% or animations are skipped entirely.

### Mobile / system interruption

- **GIVEN** the player has started a drag, **WHEN** the app is backgrounded or rotated, **THEN** the drag cancels and the piece returns to its origin.
- **GIVEN** the player is dragging a piece, **WHEN** a second finger touches the screen, **THEN** the second touch is ignored until the first releases.

### Disabled mode (replay / opponent turn)

- **GIVEN** the board is in DISABLED state, **WHEN** the player attempts any drag or tap, **THEN** no state change occurs and no event is emitted.
- **GIVEN** the board is in DISABLED state, **WHEN** an external system updates the FEN, **THEN** pieces animate to the new position.

### Performance

- **GIVEN** any single move on any device targeted, **WHEN** the move animates, **THEN** the frame rate stays ≥ 50fps throughout the animation.
- **GIVEN** the board mounts on iPhone Safari (16+), **WHEN** the initial render completes, **THEN** the time-to-interactive is ≤ 500ms on a 4G connection (excluding bundle download).

## Open Questions

### Design questions

1. **Default piece set**: Which specific SVG piece set do we ship as the default? Options: vue3-chessboard's default, lichess Cburnett set (open license), or a custom set. **Owner**: Eason. **Resolution**: Before v0 implementation begins (during prototype phase).
2. **Sound design tone**: The audio descriptions ("soft woodblock," "gentle chime") need actual sound files to evaluate. **Owner**: Audio System GDD (Polish tier). **Resolution**: Deferred to Polish tier — not blocking v0.
3. **Premove future-proofing**: We've decided no premove for v0. If we ever add it (e.g., for a "speed practice" mode), should this system handle premove logic, or should a parent system queue moves and feed them after opponent moves? **Owner**: Will become an ADR if/when premove is reconsidered. **Resolution**: Not blocking — flag for future.

### Technical questions

4. **iOS Safari Stockfish performance impact on board responsiveness**: When Stockfish is analyzing (especially deep analysis in Post-Game Review), does it block the main thread enough to make the board feel laggy? **Owner**: Chess Engine Integration GDD. **Resolution**: Prototype Stockfish in a Web Worker before Post-Game Review GDD is finalized.
5. **Multiple board instances on one page**: For potential future features (e.g., side-by-side comparison view, opening trainer with multiple positions), can vue3-chessboard handle N boards on one page without performance degradation? **Owner**: Not blocking v0. **Resolution**: Test with 2-3 instances during prototype if time allows.
6. **Landscape orientation on small phones**: At very small heights (e.g., iPhone SE landscape ≈ 375 × 667), does the board fit usefully with the move list beside it, or should we force portrait? **Owner**: UX spec (Pre-Production). **Resolution**: Decide during UX spec authoring.
