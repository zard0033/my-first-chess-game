# Epics Index

**Last Updated**: 2026-05-30
**Engine**: Web App — TypeScript 5 · Vue 3 · Vite 5 · vue3-chessboard · stockfish@16.0.0
**Manifest Version**: 2026-05-29 (control-manifest.md)

## v0 Epics (all systems)

| Epic | Layer | Module | GDD | TR-IDs | ADR Coverage | Stories | Status |
|------|-------|--------|-----|--------|--------------|---------|--------|
| [chess-board](chess-board/EPIC.md) | Foundation | ChessBoard | chess-board-and-move-system.md | 7 | 7/7 ✅ | 7 stories | Ready |
| [chess-engine](chess-engine/EPIC.md) | Foundation | ChessEngine | chess-engine-integration.md | 9 | 9/9 ✅ | 7 stories | Ready |
| [opening-id](opening-id/EPIC.md) | Foundation | OpeningIndex | opening-identification.md | 4 | 4/4 ✅ | 1 story | Ready |
| [app-router](app-router/EPIC.md) | Foundation | AppRouter | navigation-and-routing.md | 6 | 6/6 ✅ | 2 stories | Ready |
| [game-lifecycle](game-lifecycle/EPIC.md) | Core | GameLifecycle | game-lifecycle.md | 5 | 5/5 ✅ | 2 stories | Ready |
| [move-annotation](move-annotation/EPIC.md) | Core | MoveAnnotationDisplay | move-annotation-display.md | 5 | 5/5 ✅ | 2 stories | Ready |
| [post-game-review](post-game-review/EPIC.md) | Feature | PostGameReview | post-game-review.md | 7 | 7/7 ✅ | 5 stories | Ready |
| [game-export](game-export/EPIC.md) | Feature | GameExport | game-export-share.md | 4 | 4/4 ✅ | 2 stories | Ready |
| [opening-knowledge-cards](opening-knowledge-cards/EPIC.md) | Feature | (PostGameReview panel) | opening-knowledge-cards.md | 6 | 6/6 ✅ | 2 stories | **Complete** |
| [visual-identity](visual-identity/EPIC.md) | Presentation | BoardTheme | visual-identity.md *(pending)* | 2 | 0/2 — no ADR yet | 1 story | **Backlog** |

## MVP Epics

| Epic | Layer | Module | GDD | TR-IDs | ADR Coverage | Stories | Status |
|------|-------|--------|-----|--------|--------------|---------|--------|
| [supabase](supabase/EPIC.md) | Persistence | useAuthStore + useDataSyncStore | supabase-integration.md | 13 | 13/13 (ADR-0011) | 8 stories | **Complete (Sprint 7)** |
| [game-history](game-history/EPIC.md) | MVP Feature | useGameHistoryStore + HistoryView | game-history.md | 27 | ADR-0005 + ADR-0011 | 4 stories | **Ready (Sprint 8)** |

## Summary

- **Total epics**: 12
- **Ready**: 8 (v0) + 1 (MVP game-history)
- **Complete**: 2 (opening-knowledge-cards Sprint 6; supabase Sprint 7)
- **Blocked**: 0
- **Backlog**: 1 (visual-identity — GDD + ADR pending)
- **Total TR-IDs**: 89 (49 v0 + 13 MVP supabase + 27 MVP game-history)
- **ADR Coverage**: 44/44 v0 + 13/13 supabase + ADR-0005+ADR-0011 cover game-history (no new ADR required)

## Layer Order (implementation sequence)

```
v0 Foundation (Sprints 2–3):
  chess-board → chess-engine → opening-id → app-router

v0 Core (Sprint 3):
  game-lifecycle → move-annotation

v0 Feature (Sprints 4–6):
  post-game-review → game-export → opening-knowledge-cards ✅

MVP Persistence (Sprint 7):
  supabase (Auth #9 + Data Sync #11) ✅

MVP Feature (Sprint 8+):
  game-history (#12) ← Sprint 8 in progress
  → skill-scoring (#13) → level-progression (#14)

Presentation:
  visual-identity (board theme) — Sprint TBD
```

## Story Count Summary

| Layer | Epics | Total Stories |
|-------|-------|---------------|
| Foundation | chess-board (7), chess-engine (7), opening-id (1), app-router (2) | 17 |
| Core | game-lifecycle (2), move-annotation (2) | 4 |
| Feature | post-game-review (5), game-export (2), opening-knowledge-cards (2) ✅ | 9 |
| Persistence (MVP) | supabase (8) ✅ | 8 |
| MVP Feature | game-history (4) | 4 |
| **Total** | **11 epics active** | **42 stories** |

## Next Steps

Sprint 8 in progress — run `/story-readiness` on `game-history/story-001-data-layer.md` to begin S8-03 implementation.

**Last Updated**: 2026-06-01
