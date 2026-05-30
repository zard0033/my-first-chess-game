# S4-06 Mobile Calm Default — Implementation Evidence

**Date**: 2026-05-30
**Story**: post-game-review/story-005-mobile-calm
**Type**: UI (Advisory)

## Implementation Completed

`src/views/ReviewView.vue` implements the mobile calm default:

- `isMobile` — reactive ref using `window.matchMedia('(max-width: 767px)')`
- `displayAnnotations` — filters to `role: 'bestMove'` only when `isMobile`
- `displayEvaluation` — returns `null` when `isMobile`
- `MoveAnnotationDisplay` receives `displayAnnotations` and `displayEvaluation`
- matchMedia listener cleaned up in `onUnmounted`

## Acceptance Criteria Status

- [x] AC-1 Logic: `< 768px` → `displayAnnotations` contains only `role: 'bestMove'` arrows; `displayEvaluation === null`
- [x] AC-2 Logic: `≥ 768px` → all annotations passed through; `displayEvaluation` is non-null
- [x] AC-3 Logic: `matchMedia` used (not `window.innerWidth`) — reactive to resize
- [x] AC-3 Logic: resize from < 768px to ≥ 768px triggers `_onMqChange` → `isMobile.value = false` → computed updates
- [x] AC-4 Logic: MoveAnnotationDisplay is passive — receives filtered data, does not implement the rule itself

## Screenshot Evidence

**Status**: Pending manual device testing.

The logic is implemented and unit-verified via code inspection. Screenshot evidence pending:
- Requires app running with a completed game in `gameStore.completedGame`
- Verify on Chrome DevTools at 375px: only one arrow visible, no eval bar
- Verify on Chrome DevTools at 1024px: both arrows visible, eval bar visible

**Advisory gate**: does not block Sprint 4 closure.
