# Story 002: ReplayView UI + Navigation

> **Epic**: game-replay
> **Sprint**: S10-02 (Must Have)
> **Status**: Ready for Dev
> **Layer**: Feature / UI
> **Type**: View Component + Navigation
> **Estimate**: L (8 hours)
> **Manifest Version**: 2026-06-01
> **Last Updated**: 2026-06-01

## Context

**Depends on**: S10-01 pgn-viewer wrapper (PgnViewer component available)
**Purpose**: Create the main Replay view where users can step through a saved game

---

## Acceptance Criteria

- [ ] **AC-01**: ReplayView renders with board (PgnViewer) + move list + controls
- [ ] **AC-02**: User can navigate to ReplayView from History row (route: `/replay/:gameId`)
- [ ] **AC-03**: Controls work: play/pause, next/prev move, jump to move slider
- [ ] **AC-04**: Move list shows highlighted current move; scrolls to keep in view
- [ ] **AC-05**: Back button returns to History view; game state not persisted across revisits
- [ ] **AC-06**: Mobile responsive (<768px): board full width, controls below
- [ ] **AC-07**: No console errors; keyboard nav (arrows = move, esc = back)

---

## Implementation Plan

### Layout (Desktop/Mobile)

```
ReplayView
├── Header (back button + game meta)
├── Board + PgnViewer (flex container)
├── Move list (right panel on desktop, below on mobile)
└── Controls (play/pause/next/prev/slider)
```

### Route Integration

```typescript
// Update router:
path: '/replay/:gameId',
component: ReplayView,
beforeEnter: ensureAuth  // Reuse S7-05 guard
```

### Move Navigation

```typescript
interface ReplayState {
  moveIndex: number      // 0 = initial position, N = after move N
  isPlaying: boolean
}

// Methods:
nextMove() / prevMove() / jumpToMove(index)
```

---

## QA Test Cases

- Route navigation: History → ReplayView
- Move step through: all 10+ moves in a game
- Control responsiveness: play/pause timing
- Mobile layout: board responsive, controls accessible
- Back navigation: returns to History, doesn't persist state

---

## Test Evidence

**Required**: `tests/unit/views/replay-view.test.ts` (≥8 tests)

---

## Notes

- Reuse move-annotation.vue from S3 (show best move arrow)
- Defer: Game comments, position evaluation popup (Phase 2b)
