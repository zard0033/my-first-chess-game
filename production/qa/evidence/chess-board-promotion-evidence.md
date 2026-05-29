# QA Evidence: Promotion Dialog (S2-08)

**Story**: `production/epics/chess-board/story-003-promotion.md`
**Date**: 2026-05-29
**Tester**: Eason Lee
**Environment**: Dev server (`npm run dev`) — Chrome

---

## Test Cases

### AC-1: Dialog appears anchored to promotion square, Queen focused

**Setup**: Open `npm run dev`. Set FEN to `4k3/P7/8/8/8/8/8/4K3 w - - 0 1` in dev console (or maneuver a pawn).
Move the pawn `a7→a8` by drag or tap-tap.

| Check | Result |
|-------|--------|
| Dialog appears after pawn animation | [ ] Approved |
| Dialog is anchored to column of promotion square | [ ] Approved |
| Queen button has visible focus ring | [ ] Approved |
| Dialog appears within ~300ms of pawn reaching back rank | [ ] Approved |

---

### AC-2: Selection emits correct move-made payload

**Setup**: Open promotion dialog (see AC-1). Open browser console. Monitor for `move-made` event.

| Check | Result |
|-------|--------|
| Click "Rook" → console shows `promotion: 'r'` | [ ] Approved |
| Board shows rook on promotion square | [ ] Approved |
| Brief warm tint appears on promotion square | [ ] Approved |

---

### AC-3: Cancel (Escape) — snap-back, no event

**Setup**: Open promotion dialog.

| Check | Result |
|-------|--------|
| Press Escape → pawn returns to origin square | [ ] Approved |
| No `move-made` event in console | [ ] Approved |
| Focus returns to origin square area | [ ] Approved |

---

### AC-4: Focus trap (Tab cycles within 4 buttons)

**Setup**: Open promotion dialog. Focus on Queen button.

| Check | Result |
|-------|--------|
| Tab × 4 → focus cycles Queen→Rook→Bishop→Knight→Queen | [ ] Approved |
| Shift+Tab reverses cycle | [ ] Approved |
| Focus never escapes to background | [ ] Approved |

---

### AC-5: Screen reader announcement (ADVISORY — requires screen reader)

**Setup**: Enable macOS VoiceOver or NVDA. Open promotion dialog.

| Check | Result |
|-------|--------|
| Assertive region announces "Promote pawn — choose Queen, Rook, Bishop, or Knight" | [ ] Approved |
| Each button has descriptive label (e.g. "Promote to queen") | [ ] Approved |

---

### AC-6: Touch target size ≥ 56×56px

**Setup**: Open browser DevTools → Inspect each promotion button.

| Check | Result |
|-------|--------|
| Computed width ≥ 56px | [ ] Approved |
| Computed height ≥ 56px | [ ] Approved |

---

### Digit shortcut keys (AC-2 extension)

**Setup**: Open promotion dialog.

| Check | Result |
|-------|--------|
| Press '1' → promotes to Queen | [ ] Approved |
| Press '2' → promotes to Rook | [ ] Approved |
| Press '3' → promotes to Bishop | [ ] Approved |
| Press '4' → promotes to Knight | [ ] Approved |

---

### Tap outside dialog — cancel

**Setup**: Open promotion dialog. Tap anywhere outside the 4 buttons but within the board.

| Check | Result |
|-------|--------|
| Pawn snaps back to origin | [ ] Approved |
| No `move-made` event | [ ] Approved |

---

## Notes

- AC-5 (screen reader) is ADVISORY — requires real screen reader software
- Warm tint animation (AC-2) requires visual verification; CSS class `promotion-tint` should appear briefly
- Manual verification pending until dev server is confirmed working end-to-end with a real game
