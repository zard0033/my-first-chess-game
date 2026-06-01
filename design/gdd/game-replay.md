# Game Replay (GDD)

> **Status**: Draft — pending design-review (S10)
> **Tier**: v0 (Phase 2)
> **Category**: Gameplay (Feature layer)
> **Depends on**: Game History (S8), Stockfish NNUE (S9-02)

---

## 1. Overview

Players can replay completed games move-by-move, seeing the engine's evaluation and best-move suggestions for each position. This completes the "Accumulation Over Sessions" value proposition by letting players learn from their past games. v0 scope: step through moves + eval bar + best move arrow + optional rating/notes. Phase 2b will add AI commentary via Claude API.

---

## 2. Player Fantasy

> *"After a game, I can relive it move by move, seeing where I went wrong and what the engine suggests. I can rate how I felt about the game and jot a note to remember my learning moment."*

- Reflective experience: no judgment, just data to learn from
- Effortless navigation: arrows or slider to step through moves
- Clear visual feedback: eval bar shows position strength, arrow shows the engine's choice
- Optional personal notes: for tracking learning over time

---

## 3. Detailed Rules

### Access

- Entry point: History view → click a row → /replay/:gameId
- Only accessible to authenticated users
- Replay state is ephemeral — not persisted across sessions

### Navigation

| Control | Effect |
|---------|--------|
| **Arrow keys** | Previous / Next move |
| **Space** | Play/Pause (auto-step every 1s) |
| **Slider** | Jump to move number |
| **Back button** | Return to History |

### Position Display

1. **Board state**: Chess board showing current position (no piece animation, just static)
2. **Move list**: All moves from the game; highlight current move
3. **Eval bar**: Horizontal bar showing position strength (White's perspective always)
4. **Best move arrow**: Yellow arrow on board pointing to engine's recommended move
5. **Opening name**: Display opening ECO at top (reuse from S8-04)

### Move Stepping

```
Initial position (move 0) → move 1 → move 2 → ... → final position
```

- Move index starts at 0 (initial position after setup)
- Each arrow key moves ±1 in the move sequence
- Slider allows jumping to any move

### Rating (Optional)

After replay finishes, offer to rate the game:
- 5-star scale (1=poor, 5=excellent)
- Text notes: ≤200 characters
- Both persist to localStorage (key: `pgr:replay:${gameId}`)
- No validation errors; all-optional fields

---

## 4. Formulas

### Evaluation Bar Fill Ratio

```
Formula: fillRatio = (eval + 4) / 8
where eval ∈ [-4, +4] (pawns, clamped)
and fillRatio ∈ [0, 1]

fillRatio = 0.0 → Black winning (-4 pawns)
fillRatio = 0.5 → Equal (0 pawns)
fillRatio = 1.0 → White winning (+4 pawns)
```

**Variables**:
- `eval`: Stockfish evaluation in pawns (from UCI info)
- `-4 to +4`: Clamp range (beyond is "winning")

### Pre-Analysis Depth

```
depthForSpeed = 12  // Trade-off: speed vs accuracy
depthTimeLimit = 3s per position (timeout)

Goal: Analyze all N moves in < 30s total
```

---

## 5. Edge Cases

- **EC-01**: Game with no moves (opponent resigned on move 1) → show final position only
- **EC-02**: Game aborted early (player exited) → show positions up to last recorded move
- **EC-03**: User navigates to /replay/:gameId that doesn't exist → 404, redirect to History
- **EC-04**: Eval data unavailable (network error during pre-analysis) → show bare board without eval bar
- **EC-05**: Very long game (100+ moves) → sliding scale interpolation for eval bar (no lag)

---

## 6. Dependencies

### Upstream

- **Game History (S8)** — ReplayView reads game metadata + move list from gameStore
- **Stockfish NNUE (S9)** — Engine provides evaluations for pre-analysis
- **Move Annotation (S3)** — Reuse arrow-overlay component for best move arrow
- **Opening ID (system #3)** — ECO code available for opening display

### Downstream

- **(Phase 2b) AI Explanations** — When Claude integration added, fetch AI commentary per move
- **(Phase 2c) Lesson Linking** — When lesson system built, cross-link replayed positions to lessons

---

## 7. Tuning Knobs

| Knob | Default | Range | Notes |
|------|---------|-------|-------|
| Pre-analysis depth | 12 | 10–16 | Balance speed vs eval quality |
| Pre-analysis timeout | 3s/move | 2–5s | Abort if timeout, show blanks |
| Auto-play speed | 1s/move | 0.5–2s | Configurable in Phase 2b |
| Star rating count | 5 stars | 3–5 | Use emoji or icons |
| Notes max length | 200 chars | 100–500 | Keep notes brief for mobile |
| Eval bar clamp range | [-4, +4] pawns | [-3, +3] to [-5, +5] | Adjust if endgame evals too extreme |

---

## 8. Acceptance Criteria

- **AC-01**: Replay view loads from History without errors
- **AC-02**: All moves in a 50-move game can be stepped through
- **AC-03**: Eval bar displays for each move (or "analysing..." if pre-analysis ongoing)
- **AC-04**: Best move arrow points to correct square (verified against Stockfish output)
- **AC-05**: Rating persists to localStorage and reloads on revisit
- **AC-06**: Mobile layout: board responsive, controls accessible (touch targets ≥44px)
- **AC-07**: Navigation: back button returns to History without reloading
- **AC-08**: Performance: stepping through 10+ moves/second maintains 60fps

---

## Appendix: Phase 2 Feature Tree

```
Phase 2: Extended Learning
├─ Phase 2a: Game Replay (v0, this GDD)
│  ├─ Move stepping + eval bar
│  ├─ Best move arrow
│  └─ Rating/notes
├─ Phase 2b: AI Explanations (Claude API)
│  ├─ AI commentary per move
│  ├─ Alternative move evaluation
│  └─ Learning context
└─ Phase 2c: Lesson System (defer if Replay takes priority)
   ├─ Structured curriculum
   ├─ Checkpoint puzzles
   └─ Progress tracking
```
