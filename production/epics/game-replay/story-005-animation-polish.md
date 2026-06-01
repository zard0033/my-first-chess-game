# Story 005: Animation Polish for Replay Navigation

> **Epic**: game-replay
> **Sprint**: S10-05 (Nice to Have)
> **Status**: Ready for Dev
> **Layer**: Feature / Polish
> **Type**: Animation
> **Estimate**: S (4 hours)
> **Manifest Version**: 2026-06-01
> **Last Updated**: 2026-06-01

## Context

**Depends on**: S10-03 (analysis overlay complete)
**Purpose**: Smooth transitions when stepping between moves during replay

---

## Acceptance Criteria

- [ ] **AC-01**: Eval bar fade-in/out as move changes (100ms)
- [ ] **AC-02**: Best move arrow slide-in from previous arrow location (200ms)
- [ ] **AC-03**: Move highlight in list crossfade (100ms)
- [ ] **AC-04**: All animations 60fps; no jank during rapid stepping

---

## Implementation

### CSS Transitions

```css
.eval-bar { transition: opacity 100ms ease-out; }
.arrow-overlay { transition: transform 200ms ease-out; }
.move-highlight { transition: background 100ms ease; }
```

### Performance

- Use `transform` + `opacity` only (no layout reflows)
- Test with `will-change: transform` if needed
- Profile on iPhone to ensure 60fps

---

## QA Test Cases

- Animations play smoothly during rapid move stepping
- No visual stuttering or delayed updates

---

## Test Evidence

**Required**: Manual visual test (screenshot comparison)

---

## Notes

- Defer: Piece animation during move (requires chessground API extension)
