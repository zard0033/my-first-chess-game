# Story 003: Engine Analysis Overlay in Replay

> **Epic**: game-replay
> **Sprint**: S10-03 (Must Have)
> **Status**: Ready for Dev
> **Layer**: Feature / Analysis
> **Type**: Integration with Existing Engine
> **Estimate**: M (6 hours)
> **Manifest Version**: 2026-06-01
> **Last Updated**: 2026-06-01

## Context

**Depends on**: S10-02 ReplayView (move navigation ready)
**Purpose**: Show evaluation bar + best move arrow for each position during replay
**Reuse**: review-engine (S4), move-annotation (S3)

---

## Acceptance Criteria

- [ ] **AC-01**: Each move in replay shows evaluation bar (filled rectangle, White's perspective)
- [ ] **AC-02**: Best move arrow renders on board for current position
- [ ] **AC-03**: Evaluation updates instantly when user steps to new move (no lag)
- [ ] **AC-04**: 60fps performance maintained during rapid stepping (no jank)
- [ ] **AC-05**: Mobile: eval bar visible below board; arrow not clipped
- [ ] **AC-06**: Depth indicator shows analysis depth (e.g., "depth 20")

---

## Implementation Plan

### Data Flow

1. User loads game in ReplayView
2. On mount: Pre-analyze all positions (one pass, depth-12 for speed)
3. On move change: Fetch pre-computed eval + arrows from cache
4. Render: eval bar + move-annotation.vue

### Reuse Components

- **move-annotation.vue** (S3): Render arrow overlay
- **review-engine** (S4): Stockfish eval computation
- **Formulas from GDD**: CP loss calculation (already defined)

### Optimization

- Memoize evals: `Map<FEN, Eval>` to avoid re-analysis
- Depth-12 for speed (full game < 30s pre-analysis)
- Show "analysing..." spinner during pre-analysis

---

## QA Test Cases

- Pre-analysis completes without errors
- Eval bar updates on move step
- Best move arrow points to correct square
- Performance: 60fps @ 10 moves/second stepping

---

## Test Evidence

**Required**: Integration test `tests/integration/game-replay/analysis.test.ts` (≥4 tests)

---

## Notes

- Reuse FEN-to-eval caching pattern from PostGameReview (ADR-0005)
- Do NOT persist analysis to Supabase yet (Phase 2b feature)
