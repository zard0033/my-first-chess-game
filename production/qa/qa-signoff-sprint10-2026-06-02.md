# Sprint 10 QA Sign-Off — Game Replay (Phase 2)

**Date**: 2026-06-02
**Sprint**: 10 (`production/sprints/sprint-10.md`)
**Verdict**: ✅ **APPROVED**

---

## Scope delivered

| ID | Story | Priority | Status |
|----|-------|----------|--------|
| S10-01 | pgn-viewer Vue 3 wrapper | Must | ✅ Done |
| S10-02 | ReplayView UI + navigation | Must | ✅ Done |
| S10-03 | Engine analysis overlay (eval bar + best-move arrow) | Must | ✅ Done |
| S10-04 | Game rating / notes | Should | ✅ Done |
| S10-05 | Animation polish | Nice | ⏸ Deferred (advisory; ships without) |
| S10-06 | Engine migration → Stockfish 18 Lite | Must (unplanned) | ✅ Done |

## Quality gates

- **Automated tests**: 492/492 pass (41 suites, +36 this sprint). Smoke: `production/qa/smoke-2026-06-02.md` → PASS.
- **Build**: `vue-tsc` + `vite build` green.
- **Code review**: conducted on the full S10 changeset (correctness/readability/architecture/security/performance). 2 High findings (programmatic-nav re-emit / ply-0 desync) fixed in `pgn-viewer.vue` (toPly bypasses the move-selected interceptor); Medium/Low items applied or consciously deferred (documented). Re-verified in browser post-fix.
- **Browser verification (Playwright)**: play (engine replies), replay navigation (keyboard + move-list click sync, no desync/loop), eval bar updates per move, best-move arrow renders, depth-12 pre-analysis completes. All PASS.
- **Design docs**: ADR-0001 amended (SF18 Lite migration); CLAUDE.md, technical-preferences, epics/index, stories updated.

## Conditions / follow-ups (non-blocking)

1. **S10-05 animation polish** — deferred to a future polish sprint (nice-to-have, manual-visual advisory gate).
2. **CSP `font-src`** — pgn-viewer embeds a base64 icon font blocked by `default-src 'self'`; cosmetic (board renders). Optional `font-src 'self' data:` cleanup in ADR-0008.
3. **iPhone real-device check** — replay UI + SF18 Lite analysis not yet verified on physical iPhone Safari (carries alongside the open S8-06 iOS item).
4. **No S1/S2 bugs** outstanding. The NNUE-not-deployed defect found this sprint was fixed (S10-06), not deferred.

## Sign-off

Sprint 10 Must-Have + Should-Have delivered, tested (automated + browser), and code-reviewed.
**APPROVED** for merge. Deferred S10-05 and the follow-ups above are tracked and non-blocking.
