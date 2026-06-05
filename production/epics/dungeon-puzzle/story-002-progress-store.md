# Story 002: useDungeonProgressStore (localStorage, linear unlock, counts)

> **Epic**: dungeon-puzzle
> **Sprint**: S13-02 (Must Have)
> **Status**: Complete (2026-06-05)
> **Layer**: Feature / Logic
> **Type**: Pinia Store
> **Estimate**: M (4 hours)
> **GDD**: design/gdd/dungeon-puzzle-mode.md (§3.6, §4.1, §4.2)
> **TR**: TR-dungeon-001, TR-dungeon-008
> **ADR**: ADR-0005 (Pinia + localStorage), ADR-0011 (Supabase sync)

## Context

**Depends on**: S13-01, S13-07 (data-sync methods + table)
**Purpose**: Track per-puzzle progress (`solved`, `hintUsed`) local-first (localStorage)
**and synced to Supabase** once logged in, compute linear unlock and the current-node
selection, and expose calm progress counts.

---

## Acceptance Criteria

- [ ] **AC-01**: Store persists `{ [id]: { solved, hintUsed } }` to localStorage; corrupt/absent data is treated as empty (never throws).
- [ ] **AC-02**: `isSolved(id)`, `markSolved(id)`, `markHintUsed(id)` work and persist; `markSolved` is monotonic (idempotent).
- [ ] **AC-03**: `isUnlocked(puzzle)` is true iff `order === 1` or the predecessor by `order` is solved (missing predecessor → unlocked, defensive).
- [ ] **AC-04**: `nodeState(puzzle)` returns `done` / `current` / `locked` per GDD §4.1; exactly one `current` exists unless all solved (then none).
- [ ] **AC-05**: `solvedCount`, `totalCount`, `percent` per GDD §4.2 (`percent = 0` when total is 0).
- [ ] **AC-06**: SSR/`localStorage`-undefined guard mirrors `useLessonProgressStore`.
- [ ] **AC-07**: `markSolved`/`markHintUsed` best-effort write to Supabase via the data-sync store (no-op when logged out); `reconcileOnLogin()` pushes local-only progress up then pulls cloud progress down (union; `hintUsed` resolved by OR). Wired to the App.vue userId watch like lessons.

## Implementation Plan

- Mirror `src/stores/lesson-progress.ts` shape, guards, and **sync wiring** exactly.
- `STORAGE_KEY = 'pgr:dungeon:progress'`.
- Keep the progress map a `ref`; reassign a new object on mutation so computed deps re-run.
- **Cross-device sync is in scope** (Eason requirement): call the data-sync methods from
  S13-07 (`upsertDungeonProgress` / `loadDungeonProgress`); progress is monotonic so
  reconcile is a union — no conflict resolution needed beyond OR-ing `hintUsed`.

## Test Evidence

**Required**: `tests/unit/stores/dungeon-progress.test.ts` — unlock predicate, nodeState
across a mixed progress set, counts/percent, corrupt-data handling, monotonic markSolved,
reconcile union (mock data-sync).

## Notes

- No streak field anywhere (Gambit rule). `hintUsed` is stored but surfaces no judgement in v0.
