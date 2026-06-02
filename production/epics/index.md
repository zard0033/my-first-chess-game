# Epics Index

**Last Updated**: 2026-06-30
**Engine**: Web App — TypeScript 5 · Vue 3 · Vite 5 · vue3-chessboard · stockfish@18.0.7 (SF18 Lite single-threaded, NNUE embedded; ADR-0001 amended 2026-06-02)
**Manifest Version**: 2026-05-29 (control-manifest.md)

## v0 Epics (all systems)

| Epic | Layer | Module | GDD | TR-IDs | ADR Coverage | Stories | Status |
|------|-------|--------|-----|--------|--------------|---------|--------|
| [chess-board](chess-board/EPIC.md) | Foundation | ChessBoard | chess-board-and-move-system.md | 7 | 7/7 ✅ | 7 stories | **Shipped** (S2) |
| [chess-engine](chess-engine/EPIC.md) | Foundation | ChessEngine | chess-engine-integration.md | 9 | 9/9 ✅ | 7 stories | **Shipped** (S2, NNUE S9) |
| [opening-id](opening-id/EPIC.md) | Foundation | OpeningIndex | opening-identification.md | 4 | 4/4 ✅ | 1 story | **Shipped** (S2) |
| [app-router](app-router/EPIC.md) | Foundation | AppRouter | navigation-and-routing.md | 6 | 6/6 ✅ | 2 stories | **Shipped** (S2) |
| [game-lifecycle](game-lifecycle/EPIC.md) | Core | GameLifecycle | game-lifecycle.md | 5 | 5/5 ✅ | 2 stories | **Shipped** (S3) |
| [move-annotation](move-annotation/EPIC.md) | Core | MoveAnnotationDisplay | move-annotation-display.md | 5 | 5/5 ✅ | 2 stories | **Shipped** (S3) |
| [post-game-review](post-game-review/EPIC.md) | Feature | PostGameReview | post-game-review.md | 7 | 7/7 ✅ | 5 stories | **Shipped** (S4) |
| [game-export](game-export/EPIC.md) | Feature | GameExport | game-export-share.md | 4 | 4/4 ✅ | 2 stories | **Shipped** (S4) |
| [opening-knowledge-cards](opening-knowledge-cards/EPIC.md) | Feature | (PostGameReview panel) | opening-knowledge-cards.md | 6 | 6/6 ✅ | 2 stories | **Shipped** (S6) |
| [visual-identity](visual-identity/EPIC.md) | Presentation | BoardTheme | visual-identity.md *(pending)* | 2 | 0/2 — no ADR yet | 1 story | **Backlog** |

## MVP Epics

| Epic | Layer | Module | GDD | TR-IDs | ADR Coverage | Stories | Status |
|------|-------|--------|-----|--------|--------------|---------|--------|
| [supabase](supabase/EPIC.md) | Persistence | useAuthStore + useDataSyncStore | supabase-integration.md | 13 | 13/13 (ADR-0011) | 8 stories | **Shipped** (S7) |
| [game-history](game-history/EPIC.md) | MVP Feature | useGameHistoryStore + HistoryView | game-history.md | 27 | ADR-0005 + ADR-0011 | 4 stories | **Shipped** (S8, QA approved w/ conditions — S8-06 iOS Magic Link 實機補測待辦) |

## Phase 2 Epics

| Epic | Layer | Module | GDD | ADR Coverage | Stories | Status |
|------|-------|--------|-----|--------------|---------|--------|
| [game-replay](game-replay/EPIC.md) | Feature (Phase 2) | ReplayView + review-engine | game-replay.md | ADR-0001/0003/0005 (no new ADR) | 5 stories | **In Progress** (S10 — S10-01/02/03 done; S10-04/05 implemented, pending QA) |
| [lesson-system](lesson-system/EPIC.md) | Feature (Phase 2) | LessonsView + LessonView + useLessonProgressStore | lesson-system.md | ADR-0005 (no new ADR for v0) | 5 stories | **Designed** (scheduled S12 — 0% build) |

## Process Epics

| Epic | Purpose | Stories |
|------|---------|---------|
| [planning](planning/) | Phase 2 prioritisation & design (S9-04) | story-001-phase2-design |
| [technical-debt](technical-debt/) | TR-registry maintenance (S9-05) | story-001-tr-registry-update |

## Summary

- **Feature/system epics**: 14 (10 v0 + 2 MVP + 2 Phase 2)
- **Shipped**: 11 (9 v0 + supabase + game-history)
- **In Progress**: 1 (game-replay — S10)
- **Designed (not built)**: 1 (lesson-system — S12)
- **Backlog**: 1 (visual-identity — GDD + ADR pending)
- **Total TR-IDs**: 89 (49 v0 + 13 MVP supabase + 27 MVP game-history) + Phase 2 TRs (game-replay / lesson-system, in GDDs)
- **ADRs**: 11 Accepted/Proposed (ADR-0001…0011; ADR-0011 supabase → Accepted pending S8-06 iOS 補測)

## Layer Order (implementation sequence)

```
v0 Foundation (Sprints 2–3):       chess-board → chess-engine → opening-id → app-router ✅
v0 Core (Sprint 3):                game-lifecycle → move-annotation ✅
v0 Feature (Sprints 4–6):          post-game-review → game-export → opening-knowledge-cards ✅
MVP Persistence (Sprint 7):        supabase (Auth #9 + Data Sync #11) ✅
MVP Feature (Sprint 8):            game-history (#12) ✅
Phase 2 (Sprint 10):               game-replay ← in progress
Phase 2 (Sprint 12):               lesson-system (designed)
Presentation:                      visual-identity (board theme) — Sprint TBD, GDD/ADR pending
```

## Story Count Summary

| Layer | Epics | Total Stories |
|-------|-------|---------------|
| Foundation | chess-board (7), chess-engine (7), opening-id (1), app-router (2) | 17 |
| Core | game-lifecycle (2), move-annotation (2) | 4 |
| Feature | post-game-review (5), game-export (2), opening-knowledge-cards (2) | 9 |
| Persistence (MVP) | supabase (8) | 8 |
| MVP Feature | game-history (4) | 4 |
| Phase 2 | game-replay (5), lesson-system (5) | 10 |
| **Total** | **14 feature epics** | **52 stories** |

## Next Steps

Sprint 10 shipped (Game Replay full feature; engine migrated SF16→SF18 Lite). Sprint 11 closed
the 2026-06-02 spec↔code drift audit: S11-01 move-annotation eval-bar GDD aligned to arctan code;
S11-02 game-export assembler aligned to the GDD "Coach" template + PGN tags; S11-03 `game_sessions.pgn`
now stores real PGN; S11-04 removed the dead `Use NNUE` no-op. 510 unit tests pass, build green.

Deferred (need Eason): **lesson-system (S12 prep) vs visual-identity** feature choice; SF16→SF18
historical-docs reconciliation (forward-reference notes, S11-05); iPhone on-device QA.

**Last Updated**: 2026-06-30
