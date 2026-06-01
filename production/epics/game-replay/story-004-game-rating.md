# Story 004: Game-Level Rating / Notes UI

> **Epic**: game-replay
> **Sprint**: S10-04 (Should Have)
> **Status**: Ready for Dev
> **Layer**: Feature / User Data
> **Type**: UI + LocalStorage
> **Estimate**: S (4 hours)
> **Manifest Version**: 2026-06-01
> **Last Updated**: 2026-06-01

## Context

**Depends on**: S10-03 (analysis overlay complete)
**Purpose**: Let players rate/annotate replayed games for personal learning tracking

---

## Acceptance Criteria

- [ ] **AC-01**: Rating panel appears below replay controls (stars or emoji: 😞 😐 😊 😄 😍)
- [ ] **AC-02**: User can click to rate; rating persists to localStorage key `pgr:rating:${gameId}`
- [ ] **AC-03**: On reload, previously saved rating loads and displays
- [ ] **AC-04**: Optional notes field (text area, max 200 chars)
- [ ] **AC-05**: Mobile touch-friendly: tap star to rate, tap notes to edit

---

## Implementation

### Data Model

```typescript
interface GameReplay {
  gameId: string
  rating: 1 | 2 | 3 | 4 | 5  // 1=poor, 5=excellent
  notes: string               // <= 200 chars
}

// Store in localStorage as: pgr:replay:${gameId}
```

### UI

- Rating: 5 star icons (SVG or emoji)
- Notes: `<textarea>` below rating, placeholder text
- No validation errors (optional field)

---

## QA Test Cases

- Rate a game, reload → rating persists
- Edit notes, navigate away, return → notes persist
- Clear rating (click again to deselect)

---

## Test Evidence

**Required**: Unit test `tests/unit/components/game-replay-rating.test.ts` (4+ tests)

---

## Notes

- Defer: Sync to Supabase (Phase 2b)
- Defer: Stats aggregation (best/worst games, learning trends)
