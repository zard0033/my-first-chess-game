# Story 001: Lesson Types + Static Data Loader

> **Epic**: lesson-system
> **Sprint**: S12-01 (Must Have)
> **Status**: Backlog
> **Layer**: Feature / Logic
> **Type**: Types + Data Loader
> **Estimate**: M (4 hours)
> **Manifest Version**: 2026-06-01
> **Last Updated**: 2026-06-01

## Context

**Depends on**: — (foundational for the epic)
**Purpose**: Define the `Lesson` / `LessonStep` types and a loader that exposes the static lesson catalog sorted by `order`.

---

## Acceptance Criteria

- [ ] **AC-01**: `src/types/lesson.ts` defines `Lesson` and `LessonStep` per the GDD schema appendix.
- [ ] **AC-02**: `src/data/lessons/index.ts` exports the catalog as a readonly array sorted by `order`.
- [ ] **AC-03**: A `getLessonById(id)` helper returns the lesson or `undefined`.
- [ ] **AC-04**: Catalog has no duplicate `id` and no duplicate `order` (enforced by a unit test).

## Implementation Plan

- Types match GDD appendix (`LessonStep`, `Lesson`).
- `src/data/lessons/` holds one file per lesson + an `index.ts` aggregator.
- Loader sorts by `order` and exposes `lessons` + `getLessonById`.

## Test Evidence

**Required**: `tests/unit/data/lessons.test.ts` — unique ids/orders, sorted order, getLessonById hit/miss.

## Notes

- Static data only; no backend, no fetch. Covers GDD AC-01 data side.
