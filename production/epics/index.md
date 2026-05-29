# Epics Index

**Last Updated**: 2026-05-28
**Engine**: Web App — TypeScript 5 · Vue 3 · Vite 5 · vue3-chessboard · stockfish@16.0.0
**Manifest Version**: 2026-05-28 (control-manifest.md)

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
| [opening-knowledge-cards](opening-knowledge-cards/EPIC.md) | Feature | (PostGameReview panel) | opening-knowledge-cards.md | 0 | 0/0 — GDD incomplete | Blocked | **Blocked** |
| [visual-identity](visual-identity/EPIC.md) | Presentation | BoardTheme | visual-identity.md *(pending)* | 2 | 0/2 — no ADR yet | 1 story | **Backlog** |

## Summary

- **Total epics**: 10
- **Ready**: 8
- **Blocked**: 1 (opening-knowledge-cards — GDD sections 3/5/7/8 TO AUTHOR)
- **Backlog**: 1 (visual-identity — GDD + ADR pending; Sprint 3 target)
- **Total TR-IDs**: 49 (44 v0 + 2 visual-identity + 3 in opening-knowledge-cards TBD)
- **ADR Coverage**: 44/44 registered v0 TR-IDs fully covered

## Layer Order (implementation sequence)

```
Foundation (Sprint 2 target):
  chess-board → chess-engine → opening-id → app-router

Core (Sprint 3 target):
  game-lifecycle → move-annotation

Feature (Sprint 4 target):
  post-game-review → game-export → opening-knowledge-cards (after GDD complete)

Presentation (Sprint 3–4):
  visual-identity (board theme + custom pieces)
```

## Story Count Summary

| Layer | Epics | Total Stories |
|-------|-------|---------------|
| Foundation | chess-board (7), chess-engine (7), opening-id (1), app-router (2) | 17 |
| Core | game-lifecycle (2), move-annotation (2) | 4 |
| Feature | post-game-review (5), game-export (2), opening-knowledge-cards (Blocked) | 7 |
| **Total** | **8 Ready** | **28 stories** |

## Next Steps

Run `/sprint-plan` to schedule Sprint 2 (Foundation implementation begins).
