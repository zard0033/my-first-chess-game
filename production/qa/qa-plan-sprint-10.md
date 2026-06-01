# QA Plan: Sprint 10 — Game Replay Phase 2

**Date**: 2026-06-01
**Sprint**: S10 (2026-06-16 to 2026-06-29)
**Feature**: Game Replay (Phase 2)
**Test Lead**: QA Team

---

## Test Coverage Summary

| Story | Type | Auto Test | Manual QA | Risk Level |
|-------|------|-----------|-----------|-----------|
| S10-01 pgn-viewer wrapper | Logic | 6 unit tests | Component mount + error cases | LOW |
| S10-02 ReplayView UI | UI + Navigation | 8 unit tests + Playwright E2E | Touch nav, mobile responsive, back button | MEDIUM |
| S10-03 Analysis overlay | Integration | 4 integration tests | Eval bar accuracy, arrow placement, 60fps | MEDIUM |
| S10-04 Game rating | UI + Data | 4 unit tests | localStorage persistence, form validation | LOW |
| S10-05 Animation polish | Visual | Manual screenshot | Smooth transitions, no jank | LOW |

**Total Automated**: 22+ unit/integration tests
**Total Manual**: Guided test cases per story

---

## Automated Test Plan

### S10-01: pgn-viewer Wrapper (6 tests)

**File**: `tests/unit/components/pgn-viewer.test.ts`

1. ✅ Mount with valid PGN → no errors
2. ✅ Emit move-selected on user interaction
3. ✅ Orientation prop (white/black) flips board
4. ✅ Invalid PGN handled gracefully (no crash)
5. ✅ Cleanup on unmount (no memory leak)
6. ✅ Keyboard nav: arrow keys + space work

**Gate level**: BLOCKING

---

### S10-02: ReplayView UI (8 tests)

**File**: `tests/unit/views/replay-view.test.ts` + Playwright E2E

**Unit tests**:
1. ✅ Load from History route with :gameId param
2. ✅ Move stepping (next/prev) updates UI
3. ✅ Move list highlights current move
4. ✅ Slider input jumps to move
5. ✅ Back button returns to History
6. ✅ Play/pause toggle works
7. ✅ Mobile layout adapts (<768px)
8. ✅ Keyboard nav (arrow keys, esc)

**E2E tests** (Playwright):
- History → click game → Replay → step through 5+ moves → back to History

**Gate level**: BLOCKING

---

### S10-03: Analysis Overlay (4 tests)

**File**: `tests/integration/game-replay/analysis.test.ts`

1. ✅ Pre-analysis: all positions analyzed in <30s
2. ✅ Eval bar displays for each move (fillRatio correct)
3. ✅ Best move arrow rendered on board (correct square)
4. ✅ Step through moves with rapid clicking (60fps maintained)

**Gate level**: BLOCKING

---

### S10-04: Game Rating (4 tests)

**File**: `tests/unit/components/game-replay-rating.test.ts`

1. ✅ Click star to rate → state updates
2. ✅ Rating saved to localStorage after 500ms debounce
3. ✅ On reload, rating loads and displays
4. ✅ Notes field (textarea) updates on blur

**Gate level**: BLOCKING

---

### S10-05: Animation Polish (Manual)

**Visual test cases**:
1. ✅ Eval bar fade-in/out during move change
2. ✅ Arrow slides smoothly between positions
3. ✅ Move list highlight crossfades
4. ✅ No stuttering at rapid step speed (10+ moves/sec)

**Gate level**: ADVISORY (visual only)

---

## Manual Test Cases

### Critical Path: History → Replay → Back

| Step | Expected | Verdict |
|------|----------|---------|
| 1. Home → History | History loads with game list | ✅ PASS / ❌ FAIL |
| 2. Click a game row | ReplayView opens with board visible | ✅ PASS / ❌ FAIL |
| 3. Move 0 (initial) displayed | Board shows start position | ✅ PASS / ❌ FAIL |
| 4. Click "next move" (arrow/button) | Position updates, move 1 plays | ✅ PASS / ❌ FAIL |
| 5. Step through 5+ moves | All positions render correctly | ✅ PASS / ❌ FAIL |
| 6. Click back button | Return to History; game list intact | ✅ PASS / ❌ FAIL |
| 7. Click same game again | Move index resets to 0 | ✅ PASS / ❌ FAIL |

### Mobile Responsiveness (iPhone Safari)

| Scenario | Expected | Verdict |
|----------|----------|---------|
| Board width | Full screen, no horizontal scroll | ✅ PASS / ❌ FAIL |
| Move list | Below board, scrollable | ✅ PASS / ❌ FAIL |
| Controls | Touch targets ≥44px, tappable | ✅ PASS / ❌ FAIL |
| Eval bar | Visible, accurate | ✅ PASS / ❌ FAIL |

### Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| Game with 1 move | Show initial + final position |
| Game with 100+ moves | Slider responds, no lag |
| No internet (pre-analysis timeout) | Show board without eval bar (AC-04) |
| Rate game, navigate away | Rating persists on return |

---

## Performance Benchmarks

| Metric | Target | Tool |
|--------|--------|------|
| Pre-analysis (50-move game) | <30s | Stopwatch / DevTools |
| Move stepping FPS | 60fps @ 10 moves/sec | Chrome FPS counter |
| Page load time | <2s | Lighthouse |
| Memory peak | <180MB | Chrome DevTools heap |

---

## Blockers & Known Risks

| Risk | Mitigation |
|------|-----------|
| pgn-viewer npm compatibility | Early integration test (S10-01) |
| Eval accuracy (depth-12) | Spot-check 5 positions manually |
| Mobile performance | Test on real iPhone before sign-off |

---

## Sign-Off Criteria

- [ ] All 22+ automated tests pass
- [ ] Critical path manual test PASS
- [ ] Mobile responsive test PASS
- [ ] No S1/S2 bugs reported
- [ ] Design review passed (GDD APPROVED)
- [ ] Code review approved

**Sign-off**: QA Lead approval after all criteria met.
