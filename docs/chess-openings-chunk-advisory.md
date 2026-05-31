# chess-openings Chunk Advisory

**Sprint**: 6 — S6-07
**Date**: 2026-05-30
**Status**: CLOSED — Within Budget / Defer to Sprint 7

## Summary

chess-openings contributes **137 kB gzip** to the main application bundle. This is within the < 150 KB gzip budget established in ADR-0003 and GDD Formula 4 (opening-identification). No action required in Sprint 6.

## Current State

- Library: `chess-openings@0.1.1` (exact pin), lichess organization
- Bundle contribution: 137 kB gzip (pre-compiled opening book, ~3,500 entries)
- Usage: exclusively on PostGameReview screen via `ECO.lookupSync(fen)` in `use-opening-id.ts`
- Interface contract: `identifyOpening(moves: string[]): OpeningResult` — **synchronous** (registered in `docs/registry/architecture.yaml` as `opening_index_api`)

## Budget Check

| Budget | Limit | Actual | Status |
|--------|-------|--------|--------|
| GDD Formula 4 (index gzip) | < 150 KB | 137 KB | ✅ Within budget |
| Initial load target | < 3s on 4G | Not measured | TBD |

## Lazy-Load Assessment

chess-openings is used only in PostGameReview, not during active play. A dynamic `import('chess-openings')` in ReviewView.vue would remove 137 kB from the initial bundle and load it on-demand when the review screen mounts.

**Blocker**: The registered `opening_index_api` interface contract specifies `identifyOpening` as a **synchronous** function. Changing it to async requires:
1. An ADR update to ADR-0003 (architecture registry update)
2. Updates to all callers (PostGameReview, PostGameReview tests)
3. A re-registration of the `opening_index_api` interface in architecture.yaml

This scope is disproportionate to the Nice to Have priority of this advisory.

## Verdict: CLOSED — Defer to Sprint 7

**Rationale**: 137 kB is within the established budget. The lazy-load optimization is real (would remove ~137 kB from initial bundle, beneficial for mobile first load), but requires changing a registered synchronous interface — an architectural change that warrants its own story and ADR revision, not a sprint side-task.

**If initial load time is measured to be a problem in Sprint 7**: Open a dedicated story to:
1. Revise ADR-0003 — change `identifyOpening` to return `Promise<OpeningResult>`
2. Update architecture registry (`opening_index_api` interface signature)
3. Refactor `use-opening-id.ts` to use `await import('chess-openings')` internally
4. Update PostGameReview and all test callers

**Estimated effort if pursued**: ~0.5d (1 ADR revision + 1 composable refactor + test updates)
