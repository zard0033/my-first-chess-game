# Epic: Lesson System

> **Layer**: Feature (Phase 2)
> **GDD**: design/gdd/lesson-system.md (pending design-review)
> **Architecture Module**: LessonsView + LessonView (Vue components) + useLessonProgressStore + static lesson data
> **Status**: In Design — scheduled for S12 implementation
> **Stories**: story-001 through story-005 (S12)

## Overview

Implements a guided, lesson-by-lesson tutorial track for beginners. Each lesson is a static, pre-scripted sequence of board positions with coach narration and occasional "play this move" interactive steps. Lessons unlock linearly. Scope is opening-principles concept lessons, static front-end content (no backend, no AI), with localStorage progress tracking. Reuses the existing ChessBoard component and chess.js for move validation.

## Governing ADRs

| ADR | Decision Summary | Risk |
|-----|-----------------|------|
| ADR-0005: State Management | Progress is a small Pinia store (useLessonProgressStore) backed by localStorage; chess.js stays non-reactive | LOW |
| (deferred) ADR #4: Lesson ↔ Game linking | Out of scope for v0 static lessons; bidirectional linking deferred to a future phase | N/A (not built) |

**No new ADR required for v0** — static lessons reuse existing ChessBoard, chess.js, routing, and the established localStorage + Pinia pattern. A lesson↔game linking ADR is only needed if/when that future feature is built.

## GDD Requirements (from design/gdd/lesson-system.md)

| TR-ID | Requirement (AC) | Story |
|-------|------------------|-------|
| TR-lesson-system-001 | Catalog renders title/difficulty/completion (AC-01) | S12-03 |
| TR-lesson-system-002 | Linear unlock + lock badge; first always unlocked (AC-02, AC-03) | S12-02, S12-03 |
| TR-lesson-system-003 | Curriculum progress = completed/total (AC-04) | S12-02 |
| TR-lesson-system-004 | Narration step advances on Next (AC-05) | S12-04 |
| TR-lesson-system-005 | Interactive step accepts only expectedMove (AC-06, AC-12) | S12-04 |
| TR-lesson-system-006 | Wrong legal move: no advance, no commit, show hint (AC-07) | S12-04 |
| TR-lesson-system-007 | Coach arrows/highlights render (AC-08) | S12-04 |
| TR-lesson-system-008 | Progress persists; corrupt data treated as empty (AC-09) | S12-02 |
| TR-lesson-system-009 | Locked/non-existent lessonId redirects to /learn (AC-10) | S12-04 |
| TR-lesson-system-010 | Mobile layout + ≥44px touch targets (AC-11) | S12-03, S12-04 |

## Stories (S12)

| ID | Title | Type | Est. | Depends on |
|----|-------|------|------|-----------|
| S12-01 | Lesson types + static data loader | Logic | M | — |
| S12-02 | useLessonProgressStore (localStorage, linear unlock) | Logic | M | S12-01 |
| S12-03 | LessonsView (`/learn` catalog + progress/lock badges) | UI | M | S12-01, S12-02 |
| S12-04 | LessonView (`/learn/:lessonId` coach player) | Integration | L | S12-01, S12-02 |
| S12-05 | Author 3–4 opening-principles concept lessons | Config/Data | M | S12-01 |

Routes added in S12-03/04: `/learn` and `/learn/:lessonId`, lazy-loaded, **not** auth-required, following the existing `src/router/index.ts` pattern.

## Definition of Done

This epic is complete when:

1. **S12-01 lesson types + loader**: `src/types/lesson.ts` + `src/data/lessons/index.ts` load and expose the static catalog
2. **S12-02 progress store**: useLessonProgressStore with passing unit tests (unlock predicate, progress formula, corrupt-data handling)
3. **S12-03 LessonsView**: catalog with progress and lock badges, mobile-responsive
4. **S12-04 LessonView**: coach player with narration/interactive steps, move validation, hint/success feedback, redirect guards
5. **S12-05 content**: 3–4 opening-principles lessons authored
6. **All tests pass**: progress-store unit tests + LessonView interaction tests
7. **QA sign-off**: APPROVED (no critical issues)
8. **Design review passed** (GDD → APPROVED status)

## Phase 2 Roadmap Position

**Phase 2a (S10)**: Game Replay MVP ✓ (completed)
**Phase 2b (S11)**: AI Explanations — Claude API move commentary
**Phase 2c (S12)**: Lesson System (this epic) — static scripted concept lessons

> Note: original Phase 2 decision (`production/epics/planning/story-001-phase2-design.md`) estimated a Supabase-backed lesson schema. Scope was narrowed to **static front-end data** — no `lessons` table or migration — which removes the schema/DB story and reduces engineering load. Content authoring (S12-05) remains the critical-path effort.

## Success Metrics

- A beginner can complete the first lesson with no external guidance
- Linear unlock correctly gates subsequent lessons
- Progress survives reload and is independent of sign-in state
- No mobile-specific bugs (iOS Safari tested)
