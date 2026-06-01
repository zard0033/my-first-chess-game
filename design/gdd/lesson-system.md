# Lesson System (GDD)

> **Status**: Draft — pending design-review (S12)
> **Tier**: Phase 2 (Feature layer)
> **Category**: Gameplay (Feature layer)
> **Depends on**: Chess Board & Move System (#1), Navigation & Routing (#4)

---

## 1. Overview

A guided, lesson-by-lesson tutorial track for beginners. Each lesson is a static, pre-scripted sequence of board positions where a coach explains chess concepts (opening principles, center control, piece development, king safety) one step at a time. The player reads the coach's explanation, then is occasionally asked to play a specific demonstration move; playing it correctly advances the lesson, playing wrong shows a hint and lets them retry. Lessons unlock linearly so the player progresses one course after another. v0 scope: static scripted content (no AI, no backend) covering opening-principles concept lessons, with localStorage progress tracking. Phase 2b may later layer AI commentary on top of the same scripted steps.

---

## 2. Player Fantasy

> *"It feels like a coach is sitting next to me, walking me through the board one move at a time, telling me why this move is better than that one. I finish a lesson, the next one unlocks, and I can feel myself getting less lost."*

- Guided, not self-directed: the player is never staring at a blank board wondering what to do
- Situational explanation: the coach speaks in the context of the exact position on screen
- Active, not passive: the player physically plays the demonstrated move, not just reads
- Forgiving: a wrong move is met with a hint, never a penalty or judgment
- Visible progress: completing a lesson unlocks the next, giving a sense of a path

---

## 3. Detailed Rules

### Access

- Entry point: top-level route `/learn` → lesson list
- Click a lesson → `/learn/:lessonId` → coached lesson player
- Not auth-required (lessons are static content, usable signed-out)
- Progress persists locally (localStorage), independent of account

### Lesson Structure

A lesson is an ordered list of **steps**. Each step is bound to one board position (FEN). There are two step kinds:

| Step kind | Trigger to advance | Player action |
|-----------|--------------------|---------------|
| **Narration** | Player clicks "Next" | Reads coach text; may see arrows/highlights |
| **Interactive** | Player plays the `expectedMove` | Must make the one demonstrated move on the board |

### Step Display

1. **Board**: ChessBoard renders the step's FEN. Orientation follows the lesson's `playerColor` (default white).
2. **Coach panel**: shows the step's `text` (narration or the prompt for an interactive step).
3. **Visual hints (optional)**: arrows (`arrows`) and square highlights (`highlights`) drawn over the board via chessground shapes.
4. **Controls**: Narration step shows a "Next" button. Interactive step disables "Next" and waits for the board move.

### Interactive Step Flow

```
Show position + prompt
   │
   ├─ player plays expectedMove ──► show successText (if any) ──► advance to next step
   │
   └─ player plays any other (legal) move ──► move is NOT applied to the board
                                              ──► show hint (if any) ──► player retries
```

- The board only commits the `expectedMove`. A wrong-but-legal move is rejected (board snaps back), treated as an incorrect attempt.
- Illegal moves are rejected by chess.js as usual and are not counted as attempts.

### Lesson Completion

- A lesson is **complete** when the player reaches the end of its steps (all interactive steps were played correctly).
- On completion, the lesson is marked done in progress storage and the next lesson (by `order`) unlocks.

### Unlocking

- Linear: lesson with `order = N` is unlocked only when the lesson with `order = N-1` is complete.
- The first lesson (`order = 1`) is always unlocked.
- Locked lessons appear in the list but are not clickable (show a lock badge).

### Progress Persistence

- Stored in localStorage under key `pgr:lessons:progress` (reuses the `pgr:` prefix convention from Game Replay rating).
- Shape: `{ completed: string[] }` — array of completed lesson IDs.
- No server sync in v0.

---

## 4. Formulas

### Curriculum Progress

```
progress = completedCount / totalLessons
where  completedCount = number of lesson IDs in pgr:lessons:progress.completed
       totalLessons   = number of lessons in the static catalog
       progress ∈ [0, 1]

Example: 3 of 4 lessons complete → progress = 0.75 → "75%"
```

### Lesson Unlock Predicate

```
isUnlocked(lesson) =
    lesson.order == 1
    OR  catalog[lesson.order - 1].id ∈ completed

Example: lesson order=3 is unlocked iff the order=2 lesson's id is in completed.
```

### Lesson Completion Predicate

```
lessonComplete = (currentStepIndex == lesson.steps.length)
i.e. the player advanced past the final step. Each interactive step can only be
passed by playing its expectedMove, so reaching the end implies all were played.
```

---

## 5. Edge Cases

- **EC-01**: Lesson with only narration steps (no interactive step) → player clicks through to the end; marked complete on reaching the final step.
- **EC-02**: Player plays a legal move that is not the `expectedMove` on an interactive step → move is not applied (board reverts), `hint` is shown, attempt does not advance. No limit on retries (retry count is a tuning knob, default unlimited).
- **EC-03**: Direct navigation to `/learn/:lessonId` for a **locked** lesson → redirect to `/learn`.
- **EC-04**: Navigation to `/learn/:lessonId` for a **non-existent** lessonId → redirect to `/learn` (404 behavior).
- **EC-05**: Interactive step whose `expectedMove` is a promotion → comparison must match `from`, `to`, AND `promotion` (e.g. `e7e8q`); a same-from/to move with a different promotion piece counts as incorrect.
- **EC-06**: Corrupt or unparseable `pgr:lessons:progress` in localStorage → treat as empty progress (no lessons completed), do not throw.
- **EC-07**: Player refreshes mid-lesson → lesson restarts from step 0 (in-lesson step position is ephemeral, not persisted); completed lessons remain unlocked.

---

## 6. Dependencies

### Upstream

- **Chess Board & Move System (#1)** — `chess-board.vue` renders FEN, emits `move-made` (from/to/promotion/fen); the lesson player listens and validates against `expectedMove`. Uses `disabled` prop to lock the board on narration steps.
- **chess.js** (bundled with vue3-chessboard) — validates move legality before the expectedMove comparison.
- **chessground shapes** — draws coach arrows and square highlights (`use-board-input.ts` `buildLegalMoveShapes()` is the reference pattern).
- **Navigation & Routing (#4)** — adds `/learn` and `/learn/:lessonId` lazy-loaded routes following the existing router pattern.

### Downstream

- **(Phase 2b) AI tutor** — Claude API may generate dynamic coach commentary layered on the same scripted step structure.
- **(Future) Lesson ↔ Game linking** — bidirectional linking between replayed game positions and lessons (corresponds to the deferred ADR #4 "Bidirectional lesson-to-game linking" in technical-preferences).
- **Game Replay (Phase 2a)** — `game-replay.md` Downstream already names "(Phase 2c) Lesson Linking"; this GDD is the corresponding upstream side of that bidirectional reference.

---

## 7. Tuning Knobs

| Knob | Default | Range | Notes |
|------|---------|-------|-------|
| Steps per lesson | 6 | 3–12 | Keep beginner lessons short; cap to avoid fatigue |
| Hint retry limit | unlimited | 1–unlimited | Could limit retries before revealing the move |
| Unlock mode | linear | linear / all-open | All-open lets advanced users skip ahead |
| Coach arrow color | green | green / blue / yellow | chessground brush; avoid red (reads as "danger") |
| Catalog size (v0) | 3–4 lessons | 3–10 | Opening-principles set; expand later |
| Auto-reveal after N wrong | off | off / 3–5 | If enabled, show the move after N failed attempts |

---

## 8. Acceptance Criteria

- **AC-01**: `/learn` renders the lesson catalog with each lesson's title, difficulty, and completion state.
- **AC-02**: Locked lessons show a lock badge and are not navigable; the first lesson is always unlocked.
- **AC-03**: Completing a lesson marks it done and unlocks the next lesson by `order`.
- **AC-04**: Curriculum progress indicator reflects `completedCount / totalLessons`.
- **AC-05**: A narration step shows coach text and advances on "Next".
- **AC-06**: An interactive step accepts only the `expectedMove`; playing it shows `successText` (if any) and advances.
- **AC-07**: Playing a legal non-expected move on an interactive step does not advance, does not commit to the board, and shows the `hint` (if any).
- **AC-08**: Coach arrows/highlights render on steps that define them.
- **AC-09**: Progress persists to `pgr:lessons:progress` and reloads correctly on revisit; corrupt data is treated as empty without error.
- **AC-10**: Direct navigation to a locked or non-existent lessonId redirects to `/learn`.
- **AC-11**: Mobile layout (<768px): board full width, coach panel below, touch targets ≥44×44px.
- **AC-12**: Promotion `expectedMove` matches only when from/to/promotion all match.

---

## Appendix: Lesson Data Schema

Static front-end data (no backend). S12 implementation places types in `src/types/lesson.ts` and content in `src/data/lessons/`.

```typescript
interface LessonStep {
  fen: string
  text: string                                   // coach narration / prompt
  arrows?: { orig: string; dest: string }[]      // chessground brush shapes
  highlights?: string[]                          // squares to highlight, e.g. ['e4','d4']
  expectedMove?: { from: string; to: string; promotion?: 'q' | 'r' | 'b' | 'n' }
  hint?: string                                  // shown after a wrong attempt
  successText?: string                           // shown after the correct move
}

interface Lesson {
  id: string
  title: string
  category: 'opening-principles' | 'center-control' | 'piece-development' | 'king-safety'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  order: number                                  // position in the linear curriculum
  summary: string
  objectives: string[]                           // what the player will learn
  steps: LessonStep[]
  playerColor?: 'white' | 'black'                // board orientation, default 'white'
}
```
