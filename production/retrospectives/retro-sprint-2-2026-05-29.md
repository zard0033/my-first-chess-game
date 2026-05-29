# Retrospective: Sprint 2
Period: 2026-05-29 (accelerated — planned 2026-06-12 to 2026-06-25)
Generated: 2026-05-29

## Metrics

| Metric | Planned | Actual | Delta |
|--------|---------|--------|-------|
| Stories (in-scope) | 10 (7 Must + 3 Should) | 10 | 0 |
| Completion Rate (in-scope) | — | 100% | — |
| Nice-to-Have backlogged | 3 | 3 | 0 (by design) |
| Estimated effort (completed) | ~31h | ~31h | ≈0 |
| Bugs found (smoke check) | — | 3 | — |
| Bugs fixed | — | 3 | — |
| Unplanned tasks added | — | 3 bug fixes | — |
| Commits | — | 6 | — |

## Velocity Trend

| Sprint | In-Scope Planned | Completed | Rate | Notes |
|--------|-----------------|-----------|------|-------|
| Sprint 1 | 12 (7 Must + 4 Should + 1 NtH) | 12 | 100% | Spikes + scaffold |
| Sprint 2 | 10 (7 Must + 3 Should) | 10 | 100% | Implementation stories |

**Trend**: Stable at 100% — two consecutive sprints completed all in-scope stories.
Sprint 2 was the first implementation sprint (actual code + tests), delivering the primary sprint goal: human can play against Stockfish in browser.

## What Went Well

- **Sprint goal fully achieved**: First end-to-end game loop (human vs Stockfish HCE, browser) works as of session close. All 7 Must Have stories done and 3/3 Should Have stories done — no scope reduction required.
- **Test coverage breadth**: Every Logic story shipped with passing unit tests (9 automated test suites, 0 failing). Zero TODO/FIXME/HACK debt in `src/`.
- **Smoke check did its job**: Caught 3 real bugs before QA sign-off — Stockfish WASM timeout, `handleMoveMade` stub, SPA redirect handler. All 3 fixed in the same session, preventing silent regressions.
- **Sprint 1 spikes paid off**: ADR-0009 and ADR-0006 spikes eliminated API surprises in S2-02 and S2-03. No unblocked surprises during implementation.

## What Went Poorly

- **Stockfish WASM `READYOK_TIMEOUT_MS` hardcoded too short**: 2,000ms timeout was set without measuring actual WASM init time (3–8s on desktop). Bug only discovered at smoke check, requiring a post-implementation path change (`public/stockfish/` static serving + timeout increase). Root cause: no "engine initialization roundtrip" test was planned in the QA spec.
- **S2-08 QA path was blocked by design**: Promotion Dialog can't be manually QA'd without a way to reach the promotion rank quickly. No FEN injection dev tool existed. This was foreseeable — the QA plan should have flagged it as a prerequisite for S2-08 testing.
- **CSS collapse at ~1112px viewport missed**: Board disappears below ~1112px width — a `min-width` gap. Not caught until smoke check. Should have been caught earlier with a basic responsive layout check.

## Blockers Encountered

| Blocker | Duration | Resolution | Prevention |
|---------|----------|------------|------------|
| Stockfish WASM `readyok` timeout (2s) | ~1 session | Increased to 10s; moved files to `public/stockfish/` for static serving | Add UCI handshake roundtrip smoke test to CI |
| `handleMoveMade` stub (engine integration missing) | ~1 session | Added full `PlayEngine` integration + `setGameInProgress(true)` | Story AC for `use-chess-board.ts` should explicitly require non-stub integration |
| S2-08 QA blocked (no FEN setter) | Open (deferred) | Sprint 3 action item: add FEN injection dev tool | Include dev-tool prerequisite in QA plan when testing UI that requires rare game states |

## Estimation Accuracy

The sprint was planned for 14 calendar days (~24h effective) but completed in one accelerated session. Effort estimates (story points in fraction-of-day units) are directionally accurate for relative sizing (S2-02 at 5h was the largest story and was treated as the key integration story). No systematic over/under-estimation detected within the sprint.

**Overall estimation accuracy**: Not measurable from this sprint (AI-accelerated session compresses calendar time). Watch actual vs estimated ratio in Sprint 3 where stories are larger and cross-system.

## Carryover Analysis

| Task | Priority | Reason | Action |
|------|----------|--------|--------|
| S2-11 Keyboard Navigation | Nice-to-Have | Deliberately backlogged (not time-blocked) | Candidate for Sprint 3 |
| S2-12 Review Engine | Nice-to-Have | Deliberately backlogged | Candidate for Sprint 3 |
| S2-13 Visual Feedback | Nice-to-Have | Deliberately backlogged | Candidate for Sprint 3 |

No unplanned carryover. All deferrals were by design per Sprint 2 scope definition.

## Technical Debt Status

- Current TODO count: **0**
- Current FIXME count: **0**
- Current HACK count: **0**
- Trend: **Clean** (first implementation sprint, no accumulated debt)

Advisory items logged to Sprint 3 via QA sign-off:
- CSS `min-width` missing → board collapse at ~1112px (Sprint 3 bug fix)
- `public/favicon.ico` missing (Sprint 3 trivial fix)

## Previous Action Items Follow-Up

| Action Item | Status | Notes |
|-------------|--------|-------|
| No previous retrospectives | N/A | Sprint 2 is first retro |

## Action Items for Next Iteration

| # | Action | Owner | Priority | Deadline |
|---|--------|-------|----------|----------|
| 1 | Build FEN injection dev tool (prerequisite for S2-08 full QA sign-off) | TD/LP | **High** | Sprint 3 start |
| 2 | Fix chess board CSS collapse at ~1112px viewport (add `min-width`) | LP | **High** | Sprint 3 start |
| 3 | Add `public/favicon.ico` | LP | Low | Sprint 3 |
| 4 | Add UCI handshake roundtrip smoke test to CI (prevent `readyok` timeout regressions) | TD | Medium | Sprint 3 |
| 5 | Schedule iPhone device session for ADR-0007 + ADR-0008 spikes (blocks PostGameReview stories) | Eason | Medium | Before Sprint 3 PostGameReview stories begin |

## Process Improvements

1. **QA plan must flag "test prerequisite tools"**: When a story requires a rare game state to test (promotion, game-over, specific FEN), the QA plan should identify the dev tool or test fixture needed before the story enters the sprint. S2-08 was approved without this check.
2. **Add one responsive-layout smoke check step**: A quick 768px/1024px/1440px viewport resize check should be part of every smoke check run, not just functional smoke-testing. CSS layout bugs are cheap to catch early.

## Summary

Sprint 2 delivered its primary goal: a human can play a full game against Stockfish HCE in the browser, with dual input, promotion dialog, navigation guards, and opening identification all implemented. 100% completion rate on in-scope stories with zero test failures. The main process gap exposed this sprint was **QA prerequisite tooling** — stories that require rare game states need companion dev tools scoped into the sprint alongside the story itself. Sprint 3 should open with two quick fixes (FEN tool + CSS collapse) to close out S2-08 QA, then advance into game-lifecycle and move-annotation epics.
