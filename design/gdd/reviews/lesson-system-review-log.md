# Lesson System — Design Review Log

## Review — 2026-06-30 — Verdict: APPROVED (with recommended clarifications)
Scope signal: M (producer should verify before sprint planning)
Specialists: lean mode — structural completeness + internal consistency + implementability, single session (no specialist agents). Upstream interface claims verified against actual code.
Blocking items: 0 | Recommended: 3 | Nice-to-have: 3
Prior verdict resolved: First review

**Summary**: A clean, well-scoped Phase-2 feature GDD. All 8 required sections present plus a data schema appendix. All three declared dependency GDDs exist (chess-board, navigation-and-routing, game-replay). The upstream interface assumptions were verified against the real implementation and all hold: `chess-board.vue` has a `disabled` prop and emits `move-made` with `{from,to,promotion?,fen,animationDoneAt}` (the `animationDoneAt` promise is a bonus for sequencing `successText` after the move animation); the `pgr:` localStorage prefix convention is real (used by replay rating + post-game analysis). No new ADR required — covered by ADR-0004 (routing) + ADR-0005 (store boundaries) + the established localStorage pattern. Three recommended clarifications (unlock-predicate indexing, wrong-move board-revert mechanism, step-kind discrimination) are minor and non-blocking.

### Required Before Implementation (blocking)
None.

### Recommended Revisions
1. **Unlock predicate conflates `order` with array index.** §4 writes `isUnlocked = ... OR catalog[lesson.order - 1].id ∈ completed`. This indexes the catalog array by `order-1`, which only works if `order` is contiguous 1..N *and* the array is sorted by order. Restate as "the lesson whose `order === this.order - 1` is in `completed`" (lookup by order, not array position) so a non-contiguous or unsorted catalog can't silently break unlocking.
2. **Wrong-move board-revert mechanism is unspecified.** §3 says a wrong-but-legal move is "not applied (board snaps back)". But vue3-chessboard/chessground applies a move optimistically *before* `move-made` fires (see `use-chess-board.ts`), so the lesson player must actively re-set the board to the step's FEN on a non-`expectedMove`. State this explicitly (re-render step FEN) so it isn't mistaken for a no-op.
3. **Step kind is inferred, not declared.** The schema has no `kind` field — a step is "interactive" iff `expectedMove` is present. This works but should be stated as the explicit discriminator in §3 so implementers don't add a redundant field.

### Nice-to-Have
- No in-lesson "previous step" navigation (forward-only). Likely intentional for scripted lessons; worth a one-line note confirming it's deliberate.
- Sequencing when the final step is interactive with `successText`: clarify whether `successText` shows before the completion transition (use `animationDoneAt` to order it).
- `difficulty` is shown in the catalog (AC-01) but plays no role in unlocking (which is purely by `order`) — confirm it's display-only.

### Acceptance Criteria
All 12 ACs are concrete and independently testable (including AC-11 mobile layout and AC-12 promotion matching). No "feels good"-style unverifiable criteria. Strong.

### Scope Signal
**M** — LessonsView + LessonView, a `useLessonProgressStore` (Pinia), static catalog data, two lazy routes. 4 dependencies (all existing), 3 simple formulas, **no new ADR**. Matches the epic's 5-story estimate.

### Verdict: APPROVED (implementation-ready; address the 3 recommended clarifications during /create-stories)
