# QA Test Plan — Sprint 10

**Sprint**: Sprint 10 — Game Replay (Phase 2)
**Date**: 2026-06-01
**Stage**: Production
**Sprint File**: production/sprints/sprint-10.md

---

## Scope

Sprint 10 delivers the Game Replay epic: a fully functional replay viewer where players can step through completed games and see engine evaluation + best-move suggestions per position. QA covers:
- 3 Must Have stories (S10-01~03) as BLOCKING automated gates
- 1 Should Have story (S10-04, UI + localStorage logic) as BLOCKING unit test
- 1 Nice to Have story (S10-05, animation) as ADVISORY visual test

**GDD**: `design/gdd/game-replay.md` (Status: Draft — pending design-review)

---

## Story Classification

| Story | Title | Type | Automated Gate | Manual QA | Status |
|-------|-------|------|----------------|-----------|--------|
| S10-01 | pgn-viewer Vue 3 wrapper | Integration | BLOCKING — 6 unit tests | None | Ready for Dev |
| S10-02 | ReplayView UI + navigation | UI + Integration | BLOCKING — 8 unit tests | ADVISORY screenshots + mobile test | Ready for Dev |
| S10-03 | Engine analysis overlay | Integration | BLOCKING — 4 integration tests | ADVISORY — eval accuracy spot-check | Backlog (depends S10-02) |
| S10-04 | Game rating / notes | UI + Logic | BLOCKING — 4 unit tests | None | Backlog (depends S10-03) |
| S10-05 | Animation polish | Visual/Feel | None (not automatable) | ADVISORY — screenshot/recording | Backlog (depends S10-03) |

---

## Automated Test Requirements

### S10-01 — pgn-viewer Vue 3 Wrapper (BLOCKING, 6 tests)

**File**: `tests/unit/components/pgn-viewer.test.ts`

- AC-01 render: PgnViewer mounts with valid PGN — no console errors or warnings
- AC-02 emit: Simulate user interaction → assert `@move-selected` emitted with correct move notation
- AC-03 orientation: `orientation="black"` prop passed → board flip attribute/class set correctly
- AC-04 keyboard: Arrow keys trigger prev/next navigation; Space triggers select
- AC-05 touch: Click/tap gesture triggers `@move-selected` emit
- AC-06 cleanup: Spy on console.warn/error; mount then unmount → 0 calls

**Edge cases**:
- Invalid PGN string → component renders without throwing; shows fallback/empty state
- Empty string `pgn=""` → no crash
- Missing optional `orientation` prop → defaults to 'white' (no TypeScript error)
- Missing optional `highlighted` prop → no crash

---

### S10-02 — ReplayView UI + Navigation (BLOCKING, 8 tests)

**File**: `tests/unit/views/replay-view.test.ts`

- AC-02 route: `/replay/:gameId` resolves to ReplayView; auth guard (reusing S7-05 pattern) verified
- AC-03a next: `nextMove()` → `moveIndex` increments by 1; clamped at `totalMoves`
- AC-03b prev: `prevMove()` → `moveIndex` decrements by 1; clamped at 0
- AC-03c slider: `jumpToMove(5)` on 10-move game → `moveIndex === 5`
- AC-03d play/pause: Toggle `isPlaying` boolean state
- AC-04 highlight: Move list item at `moveIndex` has active highlight class; scroll-into-view triggered
- AC-05 back: Back button calls `router.back()`; `moveIndex` resets to 0 on re-mount (state not persisted)
- AC-07 keyboard: Arrow keys call `nextMove`/`prevMove`; Esc calls `router.back()`

**Edge cases (GDD EC-01~EC-03)**:
- EC-01: Game with 0 moves → show final position; prev/next controls disabled
- EC-02: Game aborted at move 3 → move list shows 3 items only
- EC-03: `gameId` not found in gameStore → redirect to `/history`
- Boundary: `moveIndex` at 0, call `prevMove()` → stays at 0 (no underflow)
- Boundary: `moveIndex` at max, call `nextMove()` → stays at max (no overflow)

---

### S10-03 — Engine Analysis Overlay (BLOCKING, 4 integration tests)

**File**: `tests/integration/game-replay/analysis.test.ts`

**GDD Formula — Eval Bar Fill Ratio**: `fillRatio = (eval + 4) / 8` where `eval ∈ [-4, +4]`

- Formula verification (eval bar):
  - eval = 0 → fillRatio = 0.5 (equal position)
  - eval = 4 → fillRatio = 1.0 (White winning)
  - eval = -4 → fillRatio = 0.0 (Black winning)
  - eval = 6 (over range) → clamped to 1.0 (no overflow)
  - eval = -6 (under range) → clamped to 0.0 (no underflow)
- Pre-analysis: 5-move game analyzed at depth-12 (`depthForSpeed = 12`) without errors
- Eval reactivity: Step from move 1 to move 2 → eval bar `fillRatio` updates
- Arrow integration: Best move arrow component receives correct `from`/`to` square data

**Edge cases (GDD EC-04~EC-05)**:
- EC-04: Stockfish error or 3s timeout → eval bar hidden; board still visible; no crash
- EC-05: 100+ move game → eval bar updates without perceptible delay
- Depth indicator: "depth 12" string rendered in overlay
- Position timeout: move shows blank eval (not crash or stuck spinner)

**Note**: Use tuning constants (`depthForSpeed`, `depthTimeLimit`) — do not hardcode values.

---

### S10-04 — Game Rating / Notes (BLOCKING, 4 tests)

**File**: `tests/unit/components/game-replay-rating.test.ts`

- AC-02 save: Click star 3 → `localStorage.getItem('pgr:replay:${gameId}')` contains `{ rating: 3 }`
- AC-03 load: Set localStorage before mount → component renders correct selected star state
- AC-02 deselect: Click already-selected star → rating cleared; localStorage updated
- AC-04 notes: Type in textarea → value persisted on blur; ≤200 chars accepted; 201st char rejected or truncated

**Edge cases**:
- `gameId` undefined → no localStorage write; no crash
- Notes = 200 chars exactly → accepted without error
- localStorage unavailable (private browsing / throws) → silent failure; UI still functional

---

## Manual QA Scope

### S10-02 — Mobile Responsive Check (ADVISORY)

**Evidence path**: `production/qa/evidence/s10-02-replay-view-mobile.png`
**Who signs off**: Eason

| Scenario | Expected |
|----------|----------|
| Board at 375px viewport | Full-width; no horizontal scroll |
| Move list position | Below board; independently scrollable |
| Controls (play/prev/next) | Touch targets ≥ 44×44px; visible; not overlapping board |
| Back button | Touch target ≥ 44×44px |
| Overall layout | No element clipping; no overlap between board and controls |

### S10-05 — Animation Polish (ADVISORY)

**Evidence path**: Screen recording or before/after screenshots
**Who signs off**: Eason

| Criterion | Expected |
|-----------|----------|
| Eval bar transition | 100ms fade-in/out visible on move change (not instant) |
| Best move arrow | 200ms slide-in from previous position (not a jump) |
| Move list highlight | 100ms crossfade between active items |
| Rapid stepping (hold arrow key 3s) | No stutter; smooth animation throughout |
| iPhone Safari performance | DevTools Performance panel: 60fps maintained |
| CSS properties animated | `transform` and `opacity` only (no layout reflow) |

*"Smooth" must be verified by observation, not just CSS declaration. Profile on iPhone before sign-off.*

---

## Out of Scope

| Item | Reason |
|------|--------|
| AI move explanations (Claude API) | Phase 2b — deferred |
| Supabase rating/notes sync | Phase 2b — deferred |
| Lesson system cross-linking | Phase 2c — deferred |
| Piece animation during move playback | Requires chessground API extension — deferred |

---

## Entry Criteria

- [ ] All Sprint 9 work committed and pushed (444/444 tests passing)
- [ ] `production/epics/game-replay/` story files exist (S10-01 to S10-05)
- [ ] `design/gdd/game-replay.md` exists
- [ ] `@lichess-org/pgn-viewer` npm package availability confirmed (pre-check before S10-01)

---

## Exit Criteria

- [ ] S10-01: 6 unit tests green (`tests/unit/components/pgn-viewer.test.ts`)
- [ ] S10-02: 8 unit tests green (`tests/unit/views/replay-view.test.ts`); mobile screenshot captured
- [ ] S10-03: 4 integration tests green (`tests/integration/game-replay/analysis.test.ts`); eval formula verified for eval ∈ {-6, -4, 0, 4, 6}
- [ ] S10-04: 4 unit tests green (`tests/unit/components/game-replay-rating.test.ts`)
- [ ] S10-05: Screenshot/recording evidence captured + Eason sign-off
- [ ] Smoke check pass after Sprint 10 implementation (all 444+ tests green)
- [ ] No S1/S2 bugs in delivered features
- [ ] QA sign-off issued (`production/qa/qa-signoff-sprint10-*.md`)
