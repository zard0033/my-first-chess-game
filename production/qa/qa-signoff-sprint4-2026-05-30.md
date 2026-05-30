# QA Sign-Off — Sprint 4 (2026-05-30)

**Date**: 2026-05-30
**Sprint**: Sprint 4 — Feature Layer (post-game-review + game-export)
**Verdict**: **APPROVED WITH CONDITIONS**

## Summary

305/305 unit tests pass. All Must Have stories (S4-01~S4-04) and Should Have stories (S4-05~S4-07) complete. Nice-to-Have stories (S4-08~S4-09) also complete.

## Story Verdicts

| ID | Story | Type | Tests | Verdict |
|----|-------|------|-------|---------|
| S4-01 | PlayView ← useGameLifecycle | UI | Playwright screenshots | ✅ PASS |
| S4-02 | Two-Pass Analysis Loop | Logic | 30 unit tests | ✅ PASS |
| S4-03 | cpLoss Formula | Logic | 15 unit tests | ✅ PASS |
| S4-04 | biggestSwingCursor | Logic | 11 unit tests | ✅ PASS |
| S4-05 | sessionStorage Persistence | Logic | 8 unit tests | ✅ PASS |
| S4-06 | Mobile Calm Default | UI | advisory evidence | ✅ ADVISORY |
| S4-07 | PGN Assembly | Logic | 14 unit tests | ✅ PASS |
| S4-08 | Tier Delivery State Machine | Logic | 11 unit tests | ✅ PASS |
| S4-09 | Keyboard Nav | Logic | 37 unit tests | ✅ PASS |

## Conditions

1. **ADR-0007 provisional depth**: `REVIEW_TARGET_DEPTH = 22` is provisional. iPhone Safari depth-22 reachability spike must be completed in Sprint 5 before this value is confirmed.
2. **S4-06 screenshot**: Mobile calm default screenshot evidence (`s4-06-mobile-calm.png`) pending manual device verification. Logic confirmed via code inspection.
3. **S4-09 axe-core E2E**: `tests/e2e/chess-board-a11y.spec.ts` spec exists; `@axe-core/playwright` install and CI run deferred to Sprint 5.

## Deviations from Spec

- S4-02: state type uses `ANALYZING | CANCELLED` (not `ANALYZING_PASS1 | ANALYZING_PASS2 | ABORTED` per original spec) — accepted, tests cover the behaviour
- S4-03/S4-04 logic was partially implemented during S4-02; properly separated into dedicated files this session

## Sprint 4 Definition of Done

- [x] All Must Have tasks (S4-01~S4-04) completed and tests passing
- [x] useGameLifecycle wired into PlayView.vue
- [x] Post-Game Review two-pass analysis runs
- [x] cpLoss formula + depth-comparability guard pass all unit tests
- [x] biggestSwingCursor computed exactly once at COMPLETE
- [x] All Logic stories have passing unit tests
- [x] QA plan exists (`qa-plan-sprint-4-2026-05-30.md`)
- [x] Smoke check passed (`smoke-sprint4-2026-05-30.md`)
- [x] QA sign-off report: **APPROVED WITH CONDITIONS**
- [ ] `production/sprint-status.yaml` — not yet created (deferred)
- [x] `production/session-state/active.md` updated
