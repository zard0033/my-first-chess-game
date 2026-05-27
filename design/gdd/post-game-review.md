# Post-Game Review

> **Status**: In Design
> **Author**: Eason + Claude
> **Last Updated**: 2026-05-27
> **Implements Pillar**: Pillar 2 (Knowledge Connects to Play) — primary; Pillar 1 (Accumulation Over Sessions); Pillar 3 (Single Player, No Pressure)
> **Priority**: v0 / Feature
> **Depends on**: Game Lifecycle, Chess Engine Integration, Opening Identification, Move Annotation Display

## Overview

Post-Game Review is the system that transforms a completed chess game into an explorable learning artifact. On the technical side, it receives the `CompletedGame` record emitted by Game Lifecycle (full UCI move history, result, player color, per-player thinking times), drives the Chess Engine's review engine to sequentially analyze every position in the game, queries Opening Identification once for the game's opening name and book-exit point, and feeds the resulting per-position annotations and evaluation data to Move Annotation Display to render on the board.

From the player's perspective, Post-Game Review is the game's debrief. After finishing a game, the player taps "Review" and the board resets to the starting position. From there, the player steps forward move by move — seeing the engine's best move as a neutral arrow, the centipawn difference between what they played and what was optimal, and at the top, the name of the opening they reached. The language is entirely numeric and informational: no "Blunder!" badges, no "Brilliant!" bursts — just the gap between played and best, named and measured. The player's experience is reading a map, not receiving a report card: each move becomes legible, each mistake a data point rather than a verdict, and each game a named, navigable record rather than a fading memory.

## Player Fantasy

The player's fantasy is **curiosity answered, not performance graded**. After finishing a game — won or lost — they tap "Review" with the same quiet question: *"What was actually happening there?"* The review satisfies that question without ceremony. The board replays from the first move; the engine's arrow appears; the number beside it says how far the played move was from optimal. The player is not told how they did. They are shown what happened, and they read it.

The anchor moment is the step where the gap is largest — the player scrubs through moves and notices the evaluation swing, pauses, looks at the engine's arrow, and thinks: *"Oh. I could have gone there."* That moment of recognition — not shame, not congratulation, just clarity — is what the review exists to deliver.

When the player closes the review, they carry three things:
1. **A named game** — "I played the Italian Game, left book at move 9" — the vague memory sharpened into something they can look up, recognize next time, and study deliberately.
2. **A specific gap** — "I consistently missed the rook-ending technique in the endgame" — actionable, not judgmental, pointing toward what's worth practicing.
3. **A trace left** — the knowledge that this game has been accounted for, reviewed, and will update their skill score. The session closed cleanly.

**Reference points:**
- **lichess analysis board** — arrows and numbers presented neutrally, no emotive labels, the position is the focus not the player's ego
- **Watching game film** — reviewing footage from a match: you see exactly what happened, the coach points at the screen, there's no praise or blame, just *what was there and what you missed*

**Explicitly NOT this system's job:**
- No "You lost 4 pawns of value on move 12!" headlines — numbers are per-move, not accumulated into a verdict
- No "Great game!" or "Tough luck" end-of-review message — the review ends when the player stops navigating, not on a note
- No recommendation to "study the Italian Game" within the review — that is Phase 2 territory (bidirectional lesson linking). The review names the opening and reports the gap; it does not prescribe the study
- No timer pressure — the player can linger on any position as long as they want

## Detailed Design

### Core Rules

#### Group 1: Entry and Initialization

1. Post-Game Review is entered when the player taps the "Review" button on the Game Over screen (per AC-20, Game Lifecycle).
2. On entry, `usePostGameReviewStore` initializes: loads `CompletedGame` from the route entry payload, resets the position cursor to 0, and initializes `analysisResults` as an array of `null` values of length N.
3. `identifyOpening(completedGame.moves)` is called once immediately on entry; the result is stored in the review store for the duration of the session.
4. An `AbortController` is created with `markRaw(new AbortController())` and stored in the review store — not wrapped in Vue reactivity, to prevent the abort signal from being replaced by a reactive proxy.
5. The board renders position 0 (the starting position) immediately on entry, before analysis begins.

#### Group 2: Position Sequence

6. The game contains N moves and N+1 positions. Position 0 is the starting position; position `i` is the state after move `i` has been played (1 ≤ i ≤ N).
7. Analysis covers positions 0 through N−1. Position N (the terminal state after the last move) is excluded from analysis; `analysisResults[N]` is never populated.
8. For position `i` (0 ≤ i ≤ N−1): the played move is `completedGame.moves[i]` and the best move is `analysisResults[i].bestMove`.

#### Group 3: Analysis Loop

9. The analysis loop starts immediately after initialization and runs sequentially: position 0 first, then 1, then 2, up to N−1.
10. Each position is analyzed with `reviewEngine.analyze({ fen: positions[i], targetDepth: REVIEW_TARGET_DEPTH, movetimeMs: REVIEW_MAX_MOVE_TIME_MS })`.
11. As each position completes, `analysisResults[i]` is written to the store immediately; the UI reflects the result without waiting for the full loop to finish (progressive disclosure).
12. A progress indicator shows "Analyzing… X/N" while the loop is running, where X is the count of completed analyses.
13. Before starting each `analyze()` call, the loop checks `abortController.signal.aborted`; if true, the loop exits without issuing further calls.
14. When position N−1 completes analysis, the store transitions to COMPLETE state.

#### Group 4: Navigation

15. The player navigates via Previous and Next buttons.
16. The Previous button is visible at cursor = 0 but rendered as disabled. The Next button is visible at cursor = N but rendered as disabled.
17. Each Next press increments the cursor by 1 (maximum N). Each Previous press decrements by 1 (minimum 0).
18. The board updates synchronously on cursor change to display the position at the new cursor index.

#### Group 5: Per-Position Display

19. At each cursor position `i`, the board displays the FEN for position `i`.
20. If `analysisResults[i]` is available and `moves[i]` exists:
    - If `normalize(moves[i]) === normalize(analysisResults[i].bestMove)`: display a single arrow in the **best-move color** (the played move was optimal; using the same color as the best-move arrow signals "engine's choice" without introducing a separate reward hue; no separate played-move arrow is shown).
    - If `normalize(moves[i]) !== normalize(analysisResults[i].bestMove)`: display both a best-move arrow and a played-move arrow in distinct role colors.
21. If `analysisResults[i]` is not yet available, no best-move arrow is shown for that position; the display shows "—" for cpLoss.
22. The cpLoss slot for position `i` follows a **three-state display contract**:
    - **pending**: `isPlayerMove[i]` is true AND (`analysisResults[i]` or `analysisResults[i+1]` is null) AND the store is in ANALYZING state. Display: a small spinner or `"…"` token — visually distinct from `"—"` so the player knows this position is actively being analyzed.
    - **not-applicable**: `isPlayerMove[i]` is false, OR `i = N−1` (last position, Rule 23), OR the store is COMPLETE but results are still null (engine error). Display: `"—"`.
    - **value**: `isPlayerMove[i]` is true AND both `analysisResults[i]` and `analysisResults[i+1]` are available. Display: the computed cpLoss integer with a qualitative label per F2. When cpLoss = 0 (best move), omit the chip entirely — the confirming arrow already signals optimality.
23. The last move (position N−1) always shows "—" for cpLoss because `analysisResults[N]` is never populated.
24. The evaluation display is sent to Move Annotation Display as `{ evalCp: analysisResults[i].evalCp, evalMate: analysisResults[i].evalMate, sideToMove }` — Post-Game Review does NOT pre-flip the value; Move Annotation Display normalizes to White's perspective internally.
25. The opening header is shown at positions 1 through N when `openingResult.isUnknown` is false. The header shows the opening name (e.g., "Italian Game"). When the cursor has passed `bookExitPly`, append " — left book at move X" where X = `Math.ceil(bookExitPly / 2)`. (`bookExitPly` is 1-based per Opening Identification GDD Rule 8; 1.e4 = ply 1.)

#### Group 6: Exit

26. The player exits by tapping the back/close button.
27. On exit: `abortController.abort()` is called, the analysis loop exits at its next abort-signal check, and the router navigates back to the Game Over screen.
28. The review store state is cleared on exit; no analysis results are persisted across separate review sessions.
29. If the browser tab is killed mid-analysis and the user returns, the session state (partial `analysisResults`) is restored from `sessionStorage`; the analysis loop restarts from the first position whose entry is still `null`.

### States and Transitions

| State | Entry | Exit | Description |
| ----- | ----- | ---- | ----------- |
| LOADING | Player taps "Review" | Opening identified; board at position 0 | Initialization: loads CompletedGame, calls identifyOpening, creates AbortController, renders starting position |
| ANALYZING | LOADING completes | All N positions analyzed (→ COMPLETE) or abort signaled (→ CANCELLED) | Analysis loop running; player may navigate concurrently; UI shows progressive results |
| COMPLETE | All N positions analyzed | Player exits | All analysisResults populated; no further analyze() calls |
| CANCELLED | abortController.abort() called | Player exits | Analysis cut short by exit; partial results remain available |

### Interactions with Other Systems

| System | Direction | Data / Call | Notes |
| ------ | --------- | ----------- | ----- |
| Game Lifecycle | Receives | `CompletedGame` via route entry payload | `moves`, `playerColor`, `result`, `playerMoveTimes`, `completedAt` |
| Chess Engine Integration | Calls | `reviewEngine.analyze({ fen, targetDepth, movetimeMs })` per position | Sequential loop positions 0..N−1; abort via AbortController |
| Opening Identification | Calls | `identifyOpening(moves)` → `OpeningResult` | Called once on entry; `isUnknown=true` → opening header omitted |
| Move Annotation Display | Sends | `Annotation[]`, `{ evalCp?, evalMate?, sideToMove }` | evalCp is raw side-to-move convention; Post-Game Review does not pre-flip |
| Chess Board (chessground) | Sends | FEN at current cursor; arrow shape configurations | Post-Game Review owns cursor and arrow state; board is a renderer only |

## Formulas

### F1: Position Count

```
N = len(completedGame.moves)
```

- `N`: total number of half-moves (plies) in the game
- Position sequence is 0..N; analysis covers positions 0..N−1

### F2: Centipawn Loss

```
cpLoss[i] = max(0, E[i] + E[i+1])
```

**Inputs (both in side-to-move convention — positive = the side that moves at that ply is better):**
- `E[i]`: centipawn value for position `i` (the moving player's perspective before their move)
- `E[i+1]`: centipawn value for position `i+1` (the *opponent's* perspective after the player's move)

**Why addition captures the swing:** The side-to-move flips at each ply, so `E[i+1]` is already from the opponent's perspective. When `E[i+1]` is large and positive, the opponent has a big advantage — the player just made things worse for themselves. `E[i] + E[i+1]` measures the total swing: the player was up `E[i]` before; the opponent is up `E[i+1]` after. A negative raw result (player outperformed the engine at the analyzed depth) is clamped to 0 and displayed as `0` numerically, not as `"—"`.

**Worked examples:**

| Scenario | E[i] | E[i+1] | Raw | cpLoss | Notes |
| -------- | ---- | ------ | --- | ------ | ----- |
| Best move | +100 | −100 | 0 | 0 | Opponent is now 100cp down — player maintained advantage |
| Inaccuracy | +100 | −50 | 50 | 50 | Player gave up some advantage |
| Blunder | +50 | +300 | 350 | 350 | Opponent went from losing to winning by 300cp |
| Recovery | −200 | −50 | −250 | 0 | Player improved; clamped to 0 |

*Note: E[i+1] is from the **opponent's** perspective. E[i+1] = +300 means the opponent (not the player) is now 300cp ahead.*

**Mate normalization (F2a) — handle all four combinations before applying F2:**

| E[i] source | E[i+1] source | Action |
|---|---|---|
| evalCp | evalCp | No substitution needed |
| evalCp | evalMate | E[i+1] = evalToCp(evalMate at i+1) |
| evalMate | evalCp | E[i] = evalToCp(evalMate at i) |
| evalMate | evalMate | Both: evalToCp(evalMate) for each independently |

**When cpLoss is not-applicable (display as "—"):** `analysisResults[i]` or `analysisResults[i+1]` is null, or `isPlayerMove[i]` is false. See three-state display contract in Rule 22.

**Qualitative labels** (displayed alongside the numeric centipawn value in the UI):

| cpLoss range | Label | Display format |
|---|---|---|
| 0 | *(Best — chip omitted)* | *(no chip; confirming arrow already signals optimality)* |
| 1–30 | Good | "Good (12 cp)" |
| 31–100 | Imprecise | "Imprecise (67 cp)" |
| 101–300 | Mistake | "Mistake (147 cp)" |
| 301+ | Blunder | "Blunder (412 cp)" |

Labels are neutral category names, not emotional verdicts.

### F3: Player Move Index

Determines whether position `i` is a player move and maps it to the correct index in `playerMoveTimes`.

```
isPlayerMove[i] =
  (playerColor === 'white' && i % 2 === 0) ||
  (playerColor === 'black' && i % 2 === 1)

playerMoveIndex[i] =
  playerColor === 'white' ? i / 2 : (i − 1) / 2
```

- `playerColor`: from `completedGame.playerColor` ('white' | 'black')
- `i`: ply index (0-based)
- `playerMoveIndex[i]` is only valid when `isPlayerMove[i]` is true
- Guard: assert `playerMoveIndex[i] < completedGame.playerMoveTimes.length` before reading

Examples:
- White player, position i=4: `isPlayerMove = true`, `playerMoveIndex = 2` → `playerMoveTimes[2]`
- Black player, position i=3: `isPlayerMove = true`, `playerMoveIndex = 1` → `playerMoveTimes[1]`

### F4: Mate Score Mapping

```
MATE_CP = 30_000

evalToCp(evalMate) =
  evalMate > 0 ? +MATE_CP : −MATE_CP
```

- Used in F2 when a position has a forced-mate evaluation instead of a centipawn evaluation
- `evalMate > 0`: side-to-move has forced mate → treated as +30 000 cp
- `evalMate < 0`: side-to-move is being mated → treated as −30 000 cp

### F5: Book Exit Move Display

```
bookExitMoveNumber = Math.ceil(bookExitPly / 2)
```

- `bookExitPly`: from `OpeningResult.bookExitPly` — **1-based ply index** (Opening Identification GDD Rule 8: 1.e4 = ply 1, 1...e5 = ply 2)
- `bookExitMoveNumber`: 1-based move number displayed to the player
- Displayed in the opening header as "left book at move X"
- Example: `bookExitPly = 9` (White's 5th move, 1-based) → `Math.ceil(9 / 2) = 5` → "left book at move 5"
- Example: `bookExitPly = 10` (Black's 5th move, 1-based) → `Math.ceil(10 / 2) = 5` → "left book at move 5"
- **Convention alignment**: Post-Game Review uses the same formula as Opening Identification GDD Rule 8 (`Math.ceil(ply / 2)`). Do not add +1 — the 1-based convention is already accounted for.

## Edge Cases

**EC-1: Last move has no cpLoss**
Position N−1 is the last played position; `analysisResults[N]` is never populated because position N is excluded from analysis. cpLoss for the last move is always "—". This is expected behavior, not an error.

**EC-2: Analysis interrupted by exit**
If the player exits mid-analysis, `abortController.abort()` is signaled. The analysis loop exits at its next position boundary. Partial `analysisResults` remain valid for positions already analyzed. No error is raised.

**EC-3: Browser tab killed mid-analysis (iOS)**
If the tab is killed while analysis is running, the partial `analysisResults` array is restored from `sessionStorage` on next visit. The analysis loop restarts from the first `null` entry. If `sessionStorage` is unavailable, analysis restarts from position 0.

**EC-4: Zero-move game**
If `completedGame.moves` is empty (N = 0), there are no positions to analyze and no moves to display. The board shows the starting position only. The opening header is omitted (no moves played). Previous and Next buttons are both disabled.

**EC-5: Unknown opening**
If `openingResult.isUnknown` is true, the opening header is omitted entirely for all cursor positions. No fallback label (e.g., "Unknown Opening") is shown.

**EC-6: Opening with no book exit (entire game was in book)**
If `bookExitPly` equals N or exceeds the game length, the " — left book at move X" suffix is never appended. The header shows only the opening name for all positions.

**EC-7: evalMate present instead of evalCp**
When `analysisResults[i].evalMate` is set and `evalCp` is undefined, F4 maps the mate score to ±30 000 cp before applying F2. Both positions in the cpLoss calculation may independently carry evalMate; each is mapped separately.

**EC-8: bestMove is null (game-over position)**
For terminal positions (checkmate, stalemate), `reviewEngine.analyze()` may return `bestMove = null`. In this case: no best-move arrow is shown, and cpLoss for that position is "—" regardless of player-move status.

**EC-9: cpLoss is negative before clamping**
The `max(0, …)` clamp in F2 ensures this never displays as negative. A negative raw result (player move was better than the engine's suggested continuation at the analyzed depth) is clamped to 0 and displayed as "0".

**EC-10: playerMoveTimes shorter than expected**
If `playerMoveIndex[i] >= completedGame.playerMoveTimes.length`, thinking time is treated as unavailable for that move; thinking time display is omitted for that position. This can occur if the game ended during the opponent's turn (per EC-11, Game Lifecycle).

**EC-11: Analysis depth lower than REVIEW_TARGET_DEPTH**
If Stockfish returns `depthReached < REVIEW_TARGET_DEPTH` (e.g., due to `movetimeMs` timeout), the result is used as-is. No retry is attempted. The evaluation is considered valid at the depth reached.

## Dependencies

### Upstream (systems this GDD depends on)

| System | What Post-Game Review requires |
| ------ | ------------------------------ |
| **Game Lifecycle** | `CompletedGame` record delivered as route entry payload on the Post-Game Review route. Requires: `moves[]`, `playerColor`, `result`, `playerMoveTimes[]`, `completedAt`. |
| **Chess Engine Integration** | `reviewEngine.analyze({ fen, targetDepth, movetimeMs })` API available and returning `{ bestMove, evalCp?, evalMate?, depthReached, pv }`. evalCp in side-to-move convention. |
| **Opening Identification** | `identifyOpening(moves)` API available and returning `OpeningResult` with `{ eco, name, bookExitPly, isUnknown }`. |
| **Move Annotation Display** | Accepts `Annotation[]` and `{ evalCp?, evalMate?, sideToMove }` and renders them on the board. Normalizes evalCp to White's perspective internally. |

### Downstream (systems that depend on this GDD)

| System | What they expect from Post-Game Review |
| ------ | -------------------------------------- |
| *(none in v0)* | Post-Game Review is a terminal feature in v0 — no other system reads its output. |

### Bidirectional Notes

- **Chess Engine Integration** (OQ#2): move classification thresholds are owned by Post-Game Review, not Chess Engine Integration. Post-Game Review defines what cpLoss ranges mean to the player.
- **Opening Identification** (OQ#7): Post-Game Review decides whether to show "Unknown opening" or omit the header when `isUnknown = true`. Decision: omit.
- **Game Lifecycle** (EC-11): `playerMoveTimes[j]` indexes player moves only, not global ply index. Post-Game Review must apply F3 to map ply index to the correct `playerMoveTimes` slot.

## Tuning Knobs

| Knob | Default | Safe Range | Affects |
| ---- | ------- | ---------- | ------- |
| `REVIEW_TARGET_DEPTH` | 22 | 12–26 | Analysis accuracy vs. speed. Higher values give more accurate cpLoss but take longer, especially on mobile. Values below 12 produce unreliable evaluations. |
| `REVIEW_MAX_MOVE_TIME_MS` | 10 000 ms | 3 000–30 000 ms | Per-position time cap. Lower values speed up total review time but may cause `depthReached` to fall short of `REVIEW_TARGET_DEPTH` on slow devices (iPhone Safari). |
| `MATE_CP` | 30 000 | 10 000–32 000 | Centipawn value used to represent a forced-mate evaluation in cpLoss calculations. Changing this affects how "large" a missed forced mate appears relative to regular blunders. |
| `SHOW_BEST_MOVE_ARROW` | true | true / false | Whether to display the engine's best-move arrow during review. Disabling removes the main teaching signal; intended as an accessibility or preference toggle only. |

## Visual/Audio Requirements

### Arrows

- **Best-move arrow**: distinct color indicating "engine recommends this" (suggested: yellow/amber, matching lichess convention)
- **Played-move arrow**: distinct color indicating "you played this" (suggested: blue or semi-transparent white)
- **Confirming arrow**: single arrow in a neutral color distinct from both best-move and played-move roles (e.g., green), used when the played move equals the best move
- Arrow opacity: sufficient contrast on both light and dark board squares
- Arrow head size: large enough to identify the target square on mobile (44 px touch-target equivalent)

### Evaluation Bar

- Vertical bar alongside the board; white fills from one end, black from the other
- Updates immediately when cursor changes to a position with available analysis
- When no analysis is available ("—" state): bar stays at 50/50 neutral position
- Forced mate: bar shows fully white or fully black (not a gradual fill)

### Progress Indicator

- Text format: "Analyzing… X/N" where X and N are integers
- Visible only during ANALYZING state
- Disappears when COMPLETE (no transition animation required in v0)

### Opening Header

- Plain text, no icon or badge treatment — neutral, non-evaluative
- Book exit suffix uses the same weight as the opening name; not styled differently
- Hidden when `isUnknown = true` (no placeholder text)

### Audio

- No audio requirements for v0. Post-Game Review is a silent reading experience by design.

## UI Requirements

> **Flag for UX design**: This system has real player-facing UI. A UX spec should be authored at `design/ux/post-game-review.md` before implementation begins.

### Required UI Elements

1. **Chess board** — shows the current position at cursor; full chessground instance in read-only mode
2. **Previous / Next navigation buttons** — always visible; rendered as disabled at boundary positions
3. **Opening header** — one line above or below the board; shown from position 1 onward when opening is known
4. **cpLoss display** — numeric centipawn loss for the current move (player moves only) or "—"
5. **Evaluation bar** — vertical bar alongside the board reflecting the position's eval
6. **Progress indicator** — "Analyzing… X/N" shown during ANALYZING state
7. **Exit / Back button** — returns the player to the Game Over screen

### Constraints

- All interactive elements (Previous, Next, Exit) must have touch targets ≥ 44×44 px (iPhone Safari requirement)
- No hover-only interactions; all controls must be functional with tap/click only
- No timer, countdown, or pressure UI of any kind
- No emotive labels, badges, or result summaries anywhere on this screen

## Acceptance Criteria

**AC-1** — Given a CompletedGame with N moves, when the player enters Post-Game Review, then analysis of position 0 starts within 500 ms and the progress indicator shows "Analyzing… 0/N".

**AC-2** — Given analysis of position i+1 is not yet complete, when the player navigates to position i, then cpLoss shows "—" for that position.

**AC-3** — Given `analysisResults[i]` and `analysisResults[i+1]` are both available and `isPlayerMove[i]` is true, when the player views position i, then the displayed cpLoss equals `max(0, E[i] + E[i+1])`.

**AC-4** — Given `isPlayerMove[i]` is false (opponent's move), when the player views position i, then cpLoss shows "—" regardless of analysis availability.

**AC-5** — Given position N−1 is a player move, when the player views position N−1, then cpLoss always shows "—".

**AC-6** — Given the played move at position i equals `analysisResults[i].bestMove`, when the player views position i, then exactly one confirming arrow is shown in the confirming-arrow color; no separate best-move and played-move arrows are shown.

**AC-7** — Given the played move at position i differs from `analysisResults[i].bestMove`, when the player views position i, then a best-move arrow is shown in the best-move color and a played-move arrow is shown in the played-move color; both colors are visually distinct from each other and from the confirming-arrow color (as defined in Visual/Audio Requirements).

**AC-8** — Given `openingResult.isUnknown` is false, when the player is at any position 1..N, then the opening name is shown in the opening header.

**AC-9** — Given the cursor is past `bookExitPly`, when the player views that position, then the opening header appends " — left book at move X" where X = `Math.ceil((bookExitPly + 1) / 2)`.

**AC-10** — Given `openingResult.isUnknown` is true, when the player views any position, then no opening header text is shown.

**AC-11** — Given the player is at cursor = 0, when they tap Previous, then the Previous button is visible and disabled; the cursor remains at 0.

**AC-12** — Given the player is at cursor = N, when they tap Next, then the Next button is visible and disabled; the cursor remains at N.

**AC-13** — Given analysis is running, when the player taps Exit, then `abortController.abort()` is called and the router navigates to the Game Over screen.

**AC-14** — Given a game with partial analysis persisted in `sessionStorage`, when the review screen loads after tab restoration, then previously computed cpLoss values are displayed without re-analysis and analysis continues from the last unanalyzed position.

**AC-15** — Given `analysisResults[i].evalMate` is set and `evalCp` is undefined, when cpLoss is computed for position i, then `evalMate` is mapped to ±30 000 cp per F4 before applying F2.

**AC-16** — Given all N positions have been analyzed, when the loop completes, then the progress indicator disappears from the UI.

**AC-17** — Given a CompletedGame with N moves, when the analysis loop runs, then positions are analyzed sequentially (0, 1, …, N−1) — position i+1 is not started before position i completes.

**AC-18** — Given the `AbortController` is instantiated in `usePostGameReviewStore`, when inspected in unit tests, then it is created with `markRaw()` and is not wrapped in Vue reactive state.

## Open Questions

**OQ-1: Move list panel (Phase 2 consideration)**
Should Post-Game Review include a scrollable move list panel showing all moves with their cpLoss values, allowing click-to-jump navigation? Currently designed as button-only navigation (no move list). A move list would make it easier to scan for the biggest swings but adds significant UI surface. Deferred to Phase 2.

**OQ-2: Two-pass analysis optimization**
Should the analysis loop run a fast first pass (depth 12, ~1 s/position) to produce immediate preliminary results, then re-analyze at full depth? This would make the review feel responsive immediately on slow devices (iPhone Safari). Not designed for v0 due to added complexity; revisit if analysis latency becomes a reported pain point.

**OQ-3: Evaluation bar animation**
Should the evaluation bar animate smoothly between positions on navigation, or jump immediately to the new value? Smooth animation would feel more polished but requires care to avoid artifacts when quickly skipping through positions. Left to UI implementation; no design constraint specified.

**OQ-4: cpLoss display format**
Should cpLoss be shown as a raw integer ("47"), a decimal ("0.47 pawns"), or both? Currently designed as raw centipawn integer for consistency with lichess convention. Revisit if user research shows beginners find centipawns unintuitive.
