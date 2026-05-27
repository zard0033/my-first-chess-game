# Game Lifecycle

> **Status**: Complete
> **Author**: Eason + Claude
> **Last Updated**: 2026-05-27
> **Implements Pillar**: Pillar 1 (Accumulation Over Sessions) — every game from start to finish produces a permanent trace in skill scores and history; Pillar 3 (Single Player, No Pressure) — no time controls, no social opponent, no penalty for resignation
> **Priority**: v0 / Core
> **Depends on**: Chess Board & Move System, Chess Engine Integration
> **Depended on by**: Post-Game Review, Game Export / Share, Game History (MVP)

## Overview

Game Lifecycle is the orchestrating layer that turns a series of board moves and engine responses into a complete chess game — from first move to final position. On the technical side, it owns the authoritative game state: the active `chess.js` instance, the move history (UCI long-algebraic), the player's assigned color, and the current phase (whose turn it is, whether the AI is thinking, whether the game has ended). It coordinates two foundation systems: it feeds the Chess Board the current FEN and disabled state, receives `move-made` events from the board, and calls the Chess Engine for the AI's response after each player move. When terminal conditions arise — checkmate, stalemate, threefold repetition, the fifty-move rule, insufficient material, or the player's resignation — this system detects them, assembles the `CompletedGame` record, and hands off to the post-game flow.

On the player side, Game Lifecycle is the game's rhythm. After the player moves, input is silenced and a thinking indicator appears while Stockfish deliberates. When the AI responds, the board animates and the cycle resumes — each pair of moves a heartbeat. At the game's end, a result overlay appears, naming the outcome plainly and offering two forward paths: review the game, or play again.

This is the one system the player interacts with across the full arc of a chess session — the container that holds everything together.

## Player Fantasy

The player's fantasy is that **every game matters** — not a throwaway match against an anonymous engine, but a practice session that leaves a permanent trace. The anchor moment is the result overlay: seeing the plain outcome alongside the quiet certainty that this game is now recorded and will update the skill trace. Choosing "Review" feels like intellectual honesty — not masochism, but the reason you came.

During play, the fantasy is the clean rhythm of one complete practice rep. The player moves; Stockfish thinks; the AI responds; the cycle repeats. There is no clock ticking down, no opponent glaring back, no losing streak badge — just the position and the next decision. When the game ends, "Play Again" is not a consolation button: it's the natural next rep, slightly informed by what the last game revealed.

**Reference points:**
- **A training partner who never tires** — shows up every time, challenges at exactly the right level, never gloats after winning
- **The "lesson done" hit, minus the streak anxiety** — the satisfaction comes from finishing the loop cleanly, not from the app rewarding you for it
- **A notebook you actually fill** — each entry small, each one permanent, the whole growing slowly into something you can look back on

**Explicitly NOT this system's job:**
- No celebration or defeat animation — the result overlay is a fact, not a grade
- No "Well done!" banner, XP explosion, or streak counter at game end
- No shame mechanics — a loss and a win both offer the same two paths (Review / Play Again)
- No "you should have..." commentary at end screen — that belongs to Post-Game Review, not here

## Detailed Design

### Core Rules

1. **Game initialisation**: Each game begins with the setup screen (state: SETUP). The player selects their color (`"white"` / `"black"` / `"random"`) and AI skill level (integer 0–20). On "Start Game": resolve random color (if selected), initialise a fresh `chess.js` instance from the standard start position, record `startFen = chess.fen()`, `moves: string[] = []`, `startedAt = Date.now()`. Transition to PLAYER_TURN or AI_THINKING based on whose turn it is.

2. **Authoritative state**: Game Lifecycle owns the sole `chess.js` instance and the `moves[]` list (UCI long-algebraic strings). The Chess Board is a rendering surface — it receives `fen`, `playerColor`, and `disabled` props; it never holds or mutates game state. No other system reads or writes chess.js or `moves[]` directly.

3. **Player move processing**: When Chess Board emits `move-made: { from, to, promotion?, fen, animationDoneAt }`:
   1. Assemble UCI string: `from + to + (promotion ?? "")`. Append to `moves[]`.
   2. Apply to chess.js: `chess.move({ from, to, promotion })`. (The `fen` in the event is for sanity verification only — never used as the base for engine calls.)
   3. Await `animationDoneAt` (ensure board animation completes before AI move is applied).
   4. Run terminal detection (Rule 6). If terminal: proceed to Rule 8.
   5. Transition to AI_THINKING.

4. **AI move processing**: On entering AI_THINKING:
   1. Show thinking indicator; record `aiThinkStart = performance.now()`. Disable board input.
   2. Call `playEngine.play({ fen: chess.fen(), skillLevel, movetimeMs: playMaxMoveTimeMs })`. The engine internally uses `position fen <startFen> moves <list>` for threefold repetition detection — Game Lifecycle passes the full move list.
   3. On promise resolve:
      - If `bestMove === "0000"` or `"(none)"`: AI resigns → go to Rule 8 with player win, `endReason = "resignation"`.
      - Else: wait until `performance.now() - aiThinkStart ≥ minAiThinkDisplayMs` (Tuning Knob, default 500ms). Apply AI move: parse UCI `bestMove` → `{ from, to, promotion }`, call `chess.move(...)`, append to `moves[]`, push updated FEN to board.
   4. Hide thinking indicator.
   5. Run terminal detection (Rule 6). If terminal: proceed to Rule 8.
   6. Start player thinking timer. Transition to PLAYER_TURN.

5. **Player resignation**: The resign button is visible during PLAYER_TURN and AI_THINKING; hidden during SETUP and GAME_OVER.
   - On resign press: show one-step confirmation dialog ("Confirm resign?").
   - On confirm: if an engine call is in-flight, abort it via `AbortController.abort()` (the worker continues internally but the result is discarded). Set `endReason = "resignation"`, player loses. Proceed to Rule 8.
   - On cancel: return to current state, no change.

6. **Terminal condition detection**: After every move (player or AI), evaluate in order. Stop at first match.

| Priority | chess.js check | Outcome | `endReason` |
|---|---|---|---|
| 1 | `isCheckmate()` | `chess.turn()` side is checkmated; the *other* side wins | `"checkmate"` |
| 2 | `isStalemate()` | Draw | `"stalemate"` |
| 3 | `isThreefoldRepetition()` | Draw | `"threefold"` |
| 4 | `isInsufficientMaterial()` | Draw | `"insufficient-material"` |
| 5 | `isDraw()` (fallthrough) | Draw | `"fifty-move"` |

Result derivation:
- Checkmate: `chess.turn()` is the losing side. `result = '1-0'` if black was checkmated; `'0-1'` if white was checkmated.
- Player resign: player loses. `result = '0-1'` if player is white; `'1-0'` if black.
- AI resign (`bestmove 0000`): player wins. `result = '1-0'` if player is white; `'0-1'` if black.
- Draw: `result = '1/2-1/2'`.

7. **CompletedGame assembly**: Assembled once at terminal detection, before result overlay renders. Shape (contractually required by Game Export / Share GDD):

```ts
interface CompletedGame {
  moves: string[];                    // UCI strings, full history
  playerColor: 'white' | 'black';
  result: '1-0' | '0-1' | '1/2-1/2';
  endReason: 'checkmate' | 'resignation' | 'stalemate' |
             'threefold' | 'fifty-move' | 'insufficient-material';
  completedAt: number;                // epoch ms
  aiSkillLevel: number;               // 0–20
  isTerminal: true;
}
```

Emitted via `game-completed` event immediately after assembly, before overlay renders. Immutable after emission. `"draw-agreement"` and `"abandoned"` from the Game Export / Share GDD spec are valid `endReason` values but are not emitted in v0 (no offer/accept draw; navigation-away abandonment is out of scope).

8. **Game-over transition**: Set `phase = "ended"`, disable board, assemble `CompletedGame`, emit `game-completed`, show result overlay. Overlay shows: result headline (`"You Win"` / `"You Lose"` / `"Draw"`) + plain-language end reason + two actions: **"New Game"** (→ SETUP) and **"Review"** (→ Post-Game Review route, available once that system is implemented). Overlay does not auto-dismiss.

9. **Player thinking time tracking**: Owned by this system. Start timer when PLAYER_TURN is entered (including at game start if player is white). Stop and record elapsed ms when `move-made` fires. Store as `playerMoveTimes: number[]` alongside `moves[]`. Passed to Post-Game Review when requested.

### States and Transitions

| State | Description | Valid input | Transitions |
|---|---|---|---|
| **SETUP** | Setup screen: player picks color + skill level. No game active. | `startGame(color, skillLevel)` | → PLAYER_TURN (player is white or random resolved to white) / AI_THINKING (player chose Black) |
| **PLAYER_TURN** | Board enabled; waiting for player's move. Player thinking timer running. | `move-made(event)`, `resign()` | → AI_THINKING (legal move, no terminal) / GAME_OVER (terminal detected) / GAME_OVER (resign confirmed) |
| **AI_THINKING** | Engine promise in-flight; board disabled; thinking indicator visible. | engine resolves, `resign()` | → PLAYER_TURN (no terminal) / GAME_OVER (terminal detected or `bestmove 0000`) / GAME_OVER (resign confirmed, engine aborted) |
| **GAME_OVER** | Terminal; board disabled; result overlay shown; `CompletedGame` assembled and emitted. | `newGame()`, `review()` | → SETUP (`newGame()`) / Post-Game Review route (`review()`) |

**Notes:**
- SETUP is both the initial app state and the between-games state. Returning from GAME_OVER always passes through SETUP, giving the player a chance to change color or skill level.
- The transition SETUP → AI_THINKING occurs when the player selects Black and the AI must move first.
- `resign()` is valid in both PLAYER_TURN and AI_THINKING; in AI_THINKING it aborts the engine promise via `AbortController`.
- No LOADING / INIT state: engine initialization is a prerequisite resolved before SETUP is reachable (owned by Chess Engine Integration startup).

### Interactions with Other Systems

| System | Direction | Interface |
|---|---|---|
| **Chess Board** | OUT → (props) | `fen: string` — current position after every move or on game start |
| **Chess Board** | OUT → (props) | `playerColor: 'white' \| 'black'` — set once at game start |
| **Chess Board** | OUT → (props) | `disabled: boolean` — true during AI_THINKING and GAME_OVER |
| **Chess Board** | IN ← (event) | `move-made: { from, to, promotion?, fen, animationDoneAt: Promise }` |
| **Chess Engine** | OUT → | `playEngine.play({ fen, skillLevel, movetimeMs }) → Promise<PlayResult>` |
| **Chess Engine** | IN ← | `PlayResult.bestMove` (UCI long-algebraic, e.g. `"e2e4"`, `"e7e8q"`) |
| **Game Export / Share** | OUT → (event) | `game-completed` event carrying `CompletedGame` on every terminal condition |
| **Post-Game Review** | OUT → (event) | Same `game-completed` event; Review consumes `CompletedGame` to begin analysis |
| **Difficulty System** (MVP) | IN ← | Provides `skillLevel` and `movetimeMs` per preset; until Difficulty System exists, Game Lifecycle reads these from the setup screen directly |

## Formulas

This system has no simulation, balance, or scoring math. Chess rule evaluation (checkmate, stalemate, draw) is fully delegated to chess.js — this system reads the resulting booleans and maps them to a result/endReason enum. The two timing calculations below are the only design-level formulas.

### Formula 1: AI Thinking Display Pad

`waitMs = max(0, minAiThinkDisplayMs − elapsedMs)`

| Variable | Symbol | Type | Range | Description |
|---|---|---|---|---|
| `minAiThinkDisplayMs` | — | int (ms) | 300–1500 | Minimum display duration for the thinking indicator (Tuning Knob, default 500) |
| `elapsedMs` | — | int (ms) | 0–∞ | Wall-clock time from engine call sent to `PlayResult` received |
| `waitMs` | — | int (ms) | 0–minAiThinkDisplayMs | Additional sleep before applying the AI move and hiding the indicator |

**Output range:** `[0, minAiThinkDisplayMs]` — always non-negative; clamps to zero when engine is slower than the minimum.

**Example:** Engine responds in 120ms on Skill Level 1 → `max(0, 500 − 120) = 380ms` pad. Engine responds in 800ms on Skill Level 15 → `max(0, 500 − 800) = 0ms` pad (no wait).

### Formula 2: Player Thinking Time

`thinkingTimeMs = moveReceivedAt − turnStartedAt`

| Variable | Symbol | Type | Range | Description |
|---|---|---|---|---|
| `turnStartedAt` | — | int (ms) | — | `performance.now()` captured when PLAYER_TURN is entered (i.e., after AI move animation completes and board re-enables) |
| `moveReceivedAt` | — | int (ms) | — | `performance.now()` captured at the top of the `move-made` handler, before any move processing |
| `thinkingTimeMs` | — | int (ms) | 0–∞ | Per-move thinking duration stored in `playerMoveTimes[]` |

**Output range:** Unbounded; no clamping. Used for informational Post-Game Review data only — not for scoring or penalty logic.

**Example:** Turn entered at `t=1000ms`, move submitted at `t=4300ms` → `thinkingTimeMs = 3300ms`.

**Clock start precision:** `turnStartedAt` is reset at the moment board `disabled` is set to `false` (after AI move animation completes via `animationDoneAt`), not at engine response received — this excludes the `waitMs` pad from the player's thinking time.

### Cross-system formula references

- `playMaxMoveTimeMs = 6000ms` (default) and `errorTimeoutMs = movetimeMs × 2.0` are owned by the Chess Engine Integration GDD. Game Lifecycle reads `playMaxMoveTimeMs` from the engine config and passes it to `playEngine.play()`.

## Edge Cases

### Async / Race Conditions

**EC-01 — `move-made` fires after resign is confirmed**
If the Chess Board emits `move-made` after resign is confirmed and `phase = "ended"` is set: the event is ignored entirely. The move is not appended to `moves[]`, not applied to chess.js, and does not trigger AI_THINKING. Guard: check `phase !== "ended"` at the top of the `move-made` handler before any processing.

**EC-02 — Engine resolves after resign is confirmed**
If `AbortController.abort()` is called during AI_THINKING (player resigned) but the engine promise resolves before the abort signal propagates: the resolved `bestMove` is unconditionally discarded. The resolve handler must check a `cancelled` boolean flag set synchronously at abort time — not the AbortController signal itself, which may arrive after `.then()` is already queued. No move is applied; no state transition occurs.

**EC-03 — Engine resolves after player-move checkmate**
If the player delivers checkmate and terminal detection transitions the game to GAME_OVER, any engine promise that resolves afterward is discarded. Guard: the resolve handler checks `phase !== "ended"` before applying the AI move.

**EC-04 — `animationDoneAt` never resolves**
If `animationDoneAt` never settles (animation interrupted, DOM detachment, tab backgrounded): Game Lifecycle waits at most `animationTimeoutMs` (Tuning Knob, default 2000ms) before proceeding as if animation completed. This prevents the game from freezing indefinitely between PLAYER_TURN and AI_THINKING.

### State Machine Guards

**EC-05 — Rapid double-click on "Start Game"**
If `startGame()` is called a second time before the first SETUP → PLAYER_TURN/AI_THINKING transition completes: the second call is ignored. Guard: check `phase !== "setup"` at entry to `startGame()`. Only one chess.js instance is initialised per game.

**EC-06 — Navigation away during AI_THINKING**
If the component is unmounted while an engine promise is in-flight: `AbortController.abort()` is called in the `onUnmounted` hook. The resolve handler discards the result and does not emit `game-completed`. The game is abandoned silently — no `CompletedGame` record is produced.

### Engine Response Edge Cases

**EC-07 — `bestMove` is syntactically valid but fails `chess.move()`**
If the engine returns a well-formed UCI string that is illegal in the current position and `chess.move()` returns `null`: treat as AI resignation — `endReason = "resignation"`, player wins. The illegal UCI string is not appended to `moves[]`.

**EC-08 — `bestMove` is `"0000"` or `"(none)"` at any skill level**
These values are treated as AI resignation at all skill levels, not only at Skill Level 0. `endReason = "resignation"`, player wins.

### Promotion Edge Cases

**EC-09 — Promotable pawn move arrives with `promotion` absent**
If `move-made` fires for a pawn reaching the back rank with `promotion` absent or `undefined`: Game Lifecycle defaults to `"q"` (queen). The assembled UCI string becomes `from + to + "q"`. The Chess Board is responsible for blocking this event until the player selects a piece; if the event arrives without `promotion`, queen is the fallback.

### Timer and Analytics Edge Cases

**EC-10 — Player is Black; thinking timer not started at game init**
If the player's color is Black, the game begins in AI_THINKING. `playerMoveTimes[]` tracking does not start at game initialisation. `turnStartedAt` is first set when AI_THINKING transitions to PLAYER_TURN after the AI's opening move. `playerMoveTimes[0]` captures the player's first move thinking time only — not the AI's opening computation.

**EC-11 — `playerMoveTimes[]` / `moves[]` length invariant**
`playerMoveTimes[i]` corresponds to the (i+1)-th player move in game order, not the (i+1)-th entry in `moves[]` globally. Example: if the player makes 3 moves and the AI makes 2, `moves.length === 5` but `playerMoveTimes.length === 3`. Post-Game Review must index player thinking times against player moves only, not global move indices.

**EC-12 — Tab/window focus lost during thinking timer**
Player thinking time is wall-clock elapsed time (Formula 2). If the player switches tabs, the idle time is included in `thinkingTimeMs`. No Page Visibility API correction is applied — thinking time means time-to-commit, not active-focus time. Post-Game Review displays it as-is.

### chess.js State Integrity

**EC-13 — `startFen` must be recorded before the first move**
`startFen = chess.fen()` is recorded immediately after the chess.js instance is initialised, before `startGame()` returns and before any move is applied. If `startFen` is captured after a move, the engine's threefold repetition detection (which reconstructs the game via `position fen <startFen> moves <list>`) will evaluate from the wrong starting position.

**EC-14 — `isDraw()` fallthrough label assumption**
Priority 5 in the terminal detection table uses `isDraw()` as a catch-all and labels the result `"fifty-move"`. This is correct only because priorities 2–4 already handle every other draw type chess.js currently detects (stalemate, threefold, insufficient material). If a future chess.js upgrade adds a new draw condition, it will be mislabelled `"fifty-move"`. Re-verify this assumption whenever chess.js is updated.

## Dependencies

### Upstream Dependencies (what this system requires)

**Chess Board & Move System** (`design/gdd/chess-board-and-move-system.md`)
- Provides `move-made: { from, to, promotion?, fen, animationDoneAt: Promise }` event
- Accepts `fen: string`, `playerColor: 'white' | 'black'`, `disabled: boolean` props
- Game Lifecycle depends on `animationDoneAt` resolving before applying the AI move
- Interface is stable; Game Lifecycle must not bypass the board to apply moves directly

**Chess Engine Integration** (`design/gdd/chess-engine-integration.md`)
- Provides `playEngine.play({ fen, skillLevel, movetimeMs }) → Promise<PlayResult>`
- Provides `PlayResult.bestMove` (UCI long-algebraic, e.g. `"e2e4"`, `"e7e8q"`, `"0000"`)
- Engine startup and initialisation is resolved before SETUP is reachable — Game Lifecycle does not own this
- `playMaxMoveTimeMs` default 6000ms is owned by this GDD; Game Lifecycle reads it from engine config and passes it as `movetimeMs`
- Error timeout is `movetimeMs × 2.0` — owned by Chess Engine Integration; not duplicated here

### Downstream Dependents (what requires this system)

**Game Export / Share** (`design/gdd/game-export-share.md`)
- Consumes `game-completed` event carrying the `CompletedGame` record
- Depends on the exact `CompletedGame` interface (shape, field names, `endReason` enum values) — changes to this interface are a breaking change for Game Export / Share
- `"draw-agreement"` and `"abandoned"` are valid `endReason` values in Game Export / Share's spec but are not emitted by Game Lifecycle in v0

**Post-Game Review** (`design/gdd/post-game-review.md` — not yet designed)
- Consumes the same `game-completed` event as the entry point to review mode
- Requires `moves[]` (UCI), `playerColor`, `result`, `endReason`, and `playerMoveTimes[]`
- Must respect EC-11 (playerMoveTimes indexed against player moves, not global moves)
- The "Review" button in the result overlay is only available once Post-Game Review is implemented

**Game History (MVP)** (not yet designed)
- Consumes `game-completed` events to persist completed games to Supabase
- Depends on `completedAt` (epoch ms) for chronological ordering
- Depends on `aiSkillLevel` for filtering/display

### Dependency Notes

- No circular dependencies: Game Lifecycle does not read from Game Export / Share, Post-Game Review, or Game History
- Difficulty System (planned MVP): currently, Game Lifecycle reads `skillLevel` directly from the setup screen. When the Difficulty System is implemented, it will provide `skillLevel` and `movetimeMs` per preset, and Game Lifecycle's SETUP screen will delegate to it

## Tuning Knobs

| Knob | Default | Safe Range | What it affects |
|---|---|---|---|
| `minAiThinkDisplayMs` | 500ms | 300–1500ms | Minimum duration the thinking indicator is shown before the AI move is applied. Too low: indicator flickers on fast hardware. Too high: game feels sluggish at all skill levels. |
| `animationTimeoutMs` | 2000ms | 500–5000ms | Maximum time Game Lifecycle waits for `animationDoneAt` to resolve (EC-04 fallback). Too low: animation may be cut short on slow devices. Too high: a hung animation freezes the game for too long. |

**Knobs owned by upstream systems (referenced but not set here):**

| Knob | Owner | Default | Usage in this system |
|---|---|---|---|
| `playMaxMoveTimeMs` | Chess Engine Integration | 6000ms | Passed as `movetimeMs` to `playEngine.play()` |

## Visual/Audio Requirements

**Thinking indicator**: A visible affordance that the AI is computing — e.g., spinner or animated ellipsis with "Thinking…" label adjacent to or below the board. Must appear immediately on entering AI_THINKING and disappear only after the AI move animation completes. Exact visual form is defined in the UX spec.

**Board disabled state**: During AI_THINKING and GAME_OVER, the board must have a visually distinct non-interactive state (e.g., reduced opacity, cursor change to default). The player must not be able to confuse a disabled board for a ready board.

**Result overlay**: Appears as a plain modal overlay without entrance animation. Content is factual (result headline + end reason text + two buttons). No confetti, flash, sound effect, or badge animation. Visuals and copy are defined in the UX spec.

**Audio**: No audio requirements in v0.

## UI Requirements

**Setup screen**: Color selector (three options: White / Black / Random) + skill level selector (integer 0–20) + "Start Game" button. Accessible: all controls keyboard-navigable, touch targets ≥ 44×44px. Defined in `design/ux/setup-screen.md` (to be authored).

**Resign button**: Visible during PLAYER_TURN and AI_THINKING; hidden during SETUP and GAME_OVER. Triggers a single confirmation dialog ("Confirm resign?" with Confirm / Cancel). Touch target ≥ 44×44px.

**Result overlay**: Non-dismissable (no click-outside-to-close). Shows: result headline (`"You Win"` / `"You Lose"` / `"Draw"`) + plain-language end reason (copy TBD in UX spec) + "New Game" button (→ SETUP) + "Review" button (→ Post-Game Review route). Both buttons ≥ 44×44px.

**Thinking indicator placement**: Defined in UX spec. Must not overlap the board or the resign button.

## Acceptance Criteria

**AC-01 — Setup: color and skill selection initialises correct state**
Given the app is on the SETUP screen
When the player selects Black and skill level 12 and clicks "Start Game"
Then the state machine transitions to AI_THINKING, `playerColor` is `"black"`, `aiSkillLevel` is `12`, `moves[]` is empty, and the chess.js instance reflects the standard starting position.

**AC-02 — Player (White) delivers checkmate**
Given a game is in PLAYER_TURN with a position one move from checkmate by White
When the player submits the mating move
Then the state transitions to GAME_OVER, the overlay displays "You Win", `endReason` is `"checkmate"`, `result` is `"1-0"`, and a `game-completed` event is emitted with `moves[]` containing every move in UCI notation and `isTerminal: true`.

**AC-03 — AI delivers checkmate (player loses)**
Given a game is in AI_THINKING with a position where Stockfish will return a mating move
When Stockfish returns that move and it is applied
Then the state transitions to GAME_OVER, the overlay displays "You Lose", `endReason` is `"checkmate"`, and the `game-completed` event has `result: "0-1"` (player is White) or `"1-0"` (player is Black).

**AC-04 — Draw: stalemate**
Given a position one move from stalemate in PLAYER_TURN
When the player submits the stalemating move
Then terminal detection matches `isStalemate()`, state transitions to GAME_OVER, overlay displays "Draw", `endReason` is `"stalemate"`, `result` is `"1/2-1/2"`.

**AC-05 — Draw: threefold repetition**
Given the same position has occurred twice in the current game
When a move causes that position to occur a third time
Then terminal detection matches `isThreefoldRepetition()`, state transitions to GAME_OVER, `endReason` is `"threefold"`, `result` is `"1/2-1/2"`.

**AC-06 — Draw: fifty-move rule**
Given 49 full moves have elapsed with no pawn move and no capture
When any legal move is made that does not reset the counter
Then terminal detection matches `isDraw()` (fallthrough), `endReason` is `"fifty-move"`, `result` is `"1/2-1/2"`.

**AC-07 — Draw: insufficient material**
Given the position contains only kings (or king vs king+bishop/knight)
When any legal move is made
Then terminal detection matches `isInsufficientMaterial()`, `endReason` is `"insufficient-material"`, `result` is `"1/2-1/2"`.

**AC-08 — Player resignation from PLAYER_TURN**
Given the state machine is in PLAYER_TURN
When the player clicks "Resign" and confirms in the dialog
Then state transitions to GAME_OVER, overlay displays "You Lose", `endReason` is `"resignation"`, `game-completed` emitted with correct `result` (`"0-1"` if player is White, `"1-0"` if Black), and no engine call is made.

**AC-09 — Player resignation from AI_THINKING; engine result discarded**
Given the state machine is in AI_THINKING (engine request in-flight)
When the player clicks "Resign" and confirms
Then `AbortController.abort()` is called, the `cancelled` flag is set synchronously before the promise resolves, and the engine result (if it arrives) is silently discarded. The `game-completed` event has `endReason: "resignation"`, not the engine's move.

**AC-10 — `move-made` ignored after phase = "ended"**
Given the state machine has transitioned to GAME_OVER
When a `move-made` event is dispatched
Then the event is ignored: chess.js is not mutated, `moves[]` is unchanged, no additional `game-completed` event is emitted.

**AC-11 — AI thinking indicator visible for minimum 500ms**
Given the state machine enters AI_THINKING
When Stockfish returns a result in less than 500ms (e.g., 80ms)
Then the thinking indicator remains visible for ≥ 500ms from AI_THINKING entry before the AI move is applied and the indicator is hidden. Verified by recording the timestamp at entry and the timestamp when the indicator is hidden; the delta must be ≥ 500ms.

**AC-12 — Board disabled in correct phases**
Given the state machine is in AI_THINKING or GAME_OVER
When the board is rendered, all interactive board elements have pointer events disabled and the player cannot submit a move.
Given the state machine is in PLAYER_TURN, the board's `disabled` prop is `false`.

**AC-13 — Promotion defaults to queen when field absent**
Given the position allows a pawn promotion and `move-made` arrives with `promotion` absent
Then Game Lifecycle applies `chess.move({ from, to, promotion: "q" })` and the resulting position contains a queen on the promotion square.

**AC-14 — `animationDoneAt` timeout fallback**
Given an AI move has been applied and `animationDoneAt` never resolves
When 2000ms elapse from AI move application
Then the system proceeds (runs terminal detection, transitions to PLAYER_TURN or GAME_OVER) without hanging.

**AC-15 — `CompletedGame` event shape**
Given any game reaches a terminal state
When the `game-completed` event is emitted
Then the payload contains exactly: `moves: string[]` (length ≥ 1, UCI), `playerColor: 'white' | 'black'`, `result: '1-0' | '0-1' | '1/2-1/2'`, `endReason` (non-empty string), `completedAt: number` (epoch ms), `aiSkillLevel: number` (0–20), `isTerminal: true`. No required field is `null` or `undefined`.

**AC-16 — `CompletedGame.moves` is an immutable snapshot**
Given a `game-completed` event has been emitted and a consumer holds a reference to `event.moves`
When Game Lifecycle starts a new game and appends moves
Then `event.moves` retains its original contents (it is a cloned snapshot, not the live internal array).

**AC-17 — `playerMoveTimes[]` indexed against player moves only**
Given the player is White and four total moves have been made (W, B, W, B)
When the game ends
Then `playerMoveTimes.length === 2`, each entry a positive integer (ms), corresponding to the player's first and second move respectively. AI move durations are not included.

**AC-18 — No illegal state-machine transitions**
Given the state machine is in SETUP
Then dispatching `move-made` or `resign()` events does not change the state.
Given the state machine is in GAME_OVER
Then dispatching `move-made` or engine resolve events does not change the state, does not mutate `moves[]`, and does not emit a second `game-completed` event.

**AC-19 — "New Game" resets full state**
Given the state machine is in GAME_OVER
When the player clicks "New Game"
Then state transitions to SETUP, overlay is hidden, `moves[]` is empty, `playerMoveTimes[]` is empty, and the chess.js instance reflects the standard starting position.

**AC-20 — "Review" navigates to Post-Game Review route**
Given the state machine is in GAME_OVER
When the player clicks "Review"
Then the app navigates to the Post-Game Review route with the `CompletedGame` record available as the entry payload. The board remains non-interactive; no new engine call is made; state remains GAME_OVER.

## Open Questions

1. **End reason display copy**: The `endReason` enum values (`"checkmate"`, `"stalemate"`, `"threefold"`, `"fifty-move"`, `"insufficient-material"`, `"resignation"`) need to map to plain-language strings for the result overlay (e.g., `"fifty-move"` → `"Draw by fifty-move rule"`). This mapping belongs in the UX spec, not this GDD.

2. **Setup screen persistence**: Should the setup screen pre-fill with the player's previous color and skill level selection across sessions? Not specified in v0 — default to no persistence (always reset to defaults on app load). Revisit if user research shows friction.

3. **"Review" button availability**: The "Review" button is shown in the result overlay in v0 but the Post-Game Review route is not yet designed. Before Post-Game Review is implemented, the button is hidden or disabled (not a greyed-out "coming soon"). Confirm exact behaviour during Post-Game Review GDD design.
