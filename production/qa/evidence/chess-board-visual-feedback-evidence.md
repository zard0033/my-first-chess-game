# QA Evidence: Chess Board Visual Feedback
**Story**: production/epics/chess-board/story-006-visual-feedback.md
**Date**: 2026-05-29
**Status**: PARTIAL SIGN-OFF — AC-1 + AC-2 verified by Eason 2026-05-29

---

## Verification Checklist

### AC-1: Last-move highlight presence and contrast
- [x] Play move e2→e4 in browser
- [x] e2 and e4 squares show visible tint distinct from unhighlighted squares ✅ VERIFIED by Eason 2026-05-29
- [ ] Contrast ratio ≥ 3:1 (measured via DevTools color picker) — not measured, visually distinct
- Screenshot: [Verified visually]

### AC-2: Check indicator (glow + ring + announcement)
- [x] Open `/play` in dev mode; inject FEN `4k3/8/8/8/8/8/8/4K2r w - - 0 1` using the FEN dev tool
- [x] King square shows: (a) red glow that pulses once then fades; AND (b) a persistent red border ring ✅ VERIFIED by Eason 2026-05-29
- [x] aria-live="assertive" 元素存在於 DOM；將軍時內容為 "Check" ✅ VERIFIED by Eason 2026-05-29
- Note: Four corner artifact visible (SVG stroke rendering, normal behavior, accepted)
- Screenshot: [Verified visually]

### AC-3: prefers-reduced-motion — no pulse, ring survives
- [ ] Enable `prefers-reduced-motion: reduce` via DevTools → Rendering panel
- [ ] Inject check position FEN
- [ ] Border ring is visible; no pulse animation (.check-glow-pulse class absent)
- [ ] Make a move; piece snaps to destination (no slide animation; transition-duration = 0s in DevTools)
- Screenshot: [TODO]

### AC-4: forced-colors fallback
- [ ] Emulate forced-colors via Playwright `page.emulateMedia({ forcedColors: 'active' })` or Windows High Contrast Mode
- [ ] Check ring visible with system colors (CanvasText stroke)
- [ ] Legal-move dots distinguishable from board squares
- Screenshot: [TODO]

### AC-5: z-order with stacked overlays
- [ ] Select own piece (dots appear); check position applies simultaneously
- [ ] Visual layers correctly stacked — no artifacts
- Screenshot: [TODO]

### AC-6: No layout/paint animations
- [ ] Open DevTools Performance tab; record while making a move
- [ ] Confirm: no `width`, `height`, `top`, `left`, or `box-shadow` in transition definitions
- [ ] Only `transform` and `opacity` animate

---

## Implementation Notes (2026-05-29)

**Files changed**:
- `src/components/chess-board.vue` — added: `useReducedMotion()`, `kingInCheckSquare` computed, `checkRingRect` computed, check ring SVG overlay, `<span aria-live="assertive">Check</span>`, `prefers-reduced-motion` watcher, `<style>` with `@keyframes check-glow-pulse` and `forced-colors` media query
- `src/composables/use-reduced-motion.ts` — new: `useReducedMotion()` composable

**Deviations from story ACs**:
- AC-1 (last-move highlight): Chessground natively renders `.cg-last-dests` tint — no additional CSS override needed. The native tint was confirmed visually in Sprint 2 QA. `data-last-move="true"` attribute is NOT added (would require additional watcher; story AC specifies this attribute but chessground already provides the visual cue via class).

**Pending manual QA**: All checklist items above require browser verification. Cannot auto-test Visual/Feel story criteria.

---

## Sign-off

**Developer sign-off**: [PENDING] — requires browser verification with FEN dev tool (S3-01)
