# Interaction Pattern Library

> **Status**: Draft
> **Author**: Eason + Claude
> **Last Updated**: 2026-05-28
> **Template**: Interaction Pattern Library

---

## Overview

This library documents the reusable interaction patterns for Chess Training Companion v0.
Each pattern establishes the canonical behavior for its category across all screens.
Implementers reference these patterns to keep UI behavior consistent.

**Scope**: Cross-screen, reusable UI behaviors. Chess-board-specific mechanics (piece animations,
board keyboard model) are documented here for completeness but are owned by `ChessBoard.vue` and
ADR-0009. Screen-specific layout details live in per-screen UX specs under `design/ux/`.

**Total patterns**: 21 (6 categories)

---

## Pattern Catalog

| # | Pattern | Category | Used In |
| - | ------- | -------- | ------- |
| P-01 | [Touch Target Minimum](#p-01-touch-target-minimum) | Accessibility | All screens |
| P-02 | [Focus Reset on Route Change](#p-02-focus-reset-on-route-change) | Navigation | All routes |
| P-03 | [Scroll Reset on Route Change](#p-03-scroll-reset-on-route-change) | Navigation | All routes |
| P-04 | [Navigation Leave Guard](#p-04-navigation-leave-guard) | Navigation | Play screen |
| P-05 | [Lazy Route Loading](#p-05-lazy-route-loading) | Navigation | Play, Review |
| P-06 | [Chunk-Load Failure Auto-Reload](#p-06-chunk-load-failure-auto-reload) | Navigation | All lazy routes |
| P-07 | [Confirmation Dialog (Destructive)](#p-07-confirmation-dialog-destructive) | Dialog & Modal | Resign, Leave Guard |
| P-08 | [Non-Dismissable End-State Modal](#p-08-non-dismissable-end-state-modal) | Dialog & Modal | Game Over |
| P-09 | [Focus Trap in Modal](#p-09-focus-trap-in-modal) | Dialog & Modal | All modals |
| P-10 | [Promotion Dialog](#p-10-promotion-dialog) | Dialog & Modal | Chess board |
| P-11 | [Boundary-Disabled Navigation Control](#p-11-boundary-disabled-navigation-control) | Buttons & Controls | Post-Game Review |
| P-12 | [In-Flight Button Disabled](#p-12-in-flight-button-disabled) | Buttons & Controls | Game Export |
| P-13 | [Timed Success Feedback](#p-13-timed-success-feedback) | Feedback & Status | Game Export |
| P-14 | [aria-live Assertive Announcement](#p-14-aria-live-assertive-announcement) | Feedback & Status | Chess board |
| P-15 | [aria-live Polite Announcement](#p-15-aria-live-polite-announcement) | Feedback & Status | Chess board |
| P-16 | [100ms Announcement Merge](#p-16-100ms-announcement-merge) | Feedback & Status | Chess board |
| P-17 | [3-Tier Export Delivery](#p-17-3-tier-export-delivery) | Delivery | Game Export |
| P-18 | [Manual Textarea Fallback](#p-18-manual-textarea-fallback) | Delivery | Game Export |
| P-19 | [Tap-to-Select (Primary Mobile Input)](#p-19-tap-to-select-primary-mobile-input) | Input & Selection | Chess board |
| P-20 | [Roving Tabindex Widget](#p-20-roving-tabindex-widget) | Accessibility | Chess board |
| P-21 | [Evaluation Bar](#p-21-evaluation-bar) | Feedback & Status | Post-Game Review |

---

## Patterns

---

### P-01: Touch Target Minimum

**Category**: Accessibility
**Used In**: All screens — every interactive element

**Description**: All interactive elements must have an effective hit area of at least 44×44 CSS pixels
on mobile viewports. This applies to buttons, links, form controls, and any tappable UI element.

**Specification**:
- Minimum effective hit area: **44×44px** (technical-preferences.md binding requirement)
- Elevation above minimum: promotion dialog piece buttons use **56×56px** (critical, irreversible action)
- Minimum edge-to-edge spacing between adjacent targets: **8px** (prevents mis-taps)
- Visual size may be smaller than hit area (padding compensates); never make hit area smaller than visual
- Applies to both `pointer: fine` (mouse) and `pointer: coarse` (touch)

**When to Use**: Every interactive element without exception.

**When NOT to Use**: N/A — this is a universal floor, not a situational choice.

**Implementation note**: Use Tailwind `min-h-[44px] min-w-[44px]` or a shared `btn` utility class that
enforces the minimum. Never rely on icon-only defaults being large enough.

---

### P-02: Focus Reset on Route Change

**Category**: Navigation
**Used In**: All routes (via router `afterEach` hook)

**Description**: After each successful SPA route transition, focus programmatically moves to the
new screen's primary heading or landmark. This prevents focus from dropping to `<body>` after
navigation — a known screen-reader accessibility failure in SPAs.

**Specification**:
- Hook: Vue Router `afterEach`
- Target: the new route's `<h1>` element (or the first landmark `<main>` if `<h1>` is absent)
- Timing: fires after the route commit, before any data fetching
- Applies to: all successful route changes (not aborted/redirected transitions)
- Implementation: `document.querySelector('h1')?.focus()` with `tabindex="-1"` on `<h1>` (allows
  programmatic focus without appearing in natural Tab order)

**When to Use**: All SPA route transitions — wired once in `router.afterEach`.

**When NOT to Use**: Do not suppress when the navigation is a same-route no-op (P-03 handles scroll;
focus stays on current element).

---

### P-03: Scroll Reset on Route Change

**Category**: Navigation
**Used In**: All routes (via Vue Router `scrollBehavior`)

**Description**: On every confirmed route change, scroll position resets to `{ top: 0 }`. Prevents
a new screen from loading mid-scroll from the previous screen's position.

**Specification**:
- `scrollBehavior` in router config: return `{ top: 0 }` on all successful navigations
- Fires ONLY on guard-confirmed navigations — NOT when a guard cancels navigation (P-04)
- Same-route navigations are no-ops and do not trigger scroll reset

**When NOT to Use**: Hash-link navigation within a single screen (scroll to anchor, not reset).
Not applicable in this v0 product (no long-scroll screens with anchor links).

---

### P-04: Navigation Leave Guard

**Category**: Navigation
**Used In**: Play screen → any exit while `isGameInProgress === true`

**Description**: Navigating away from the Play screen mid-game requires user confirmation.
Cancelling the dialog restores the URL to `/play` without reloading. Confirming proceeds.

**Specification**:
- Guard: Vue Router `beforeRouteLeave` on `PlayView`
- Condition: guard fires only when `isGameInProgress === true` (Pinia game store)
- Dialog: `<ConfirmDialog>` — "Leave this game? Your progress will be lost." — Confirm / Cancel
- On Confirm: game store sets `isGameInProgress = false` before navigation resolves
  (prevents false re-trigger on the resulting navigation)
- On Cancel: `next(false)` — URL restores to `/play` without page reload
- Browser back/forward (popstate): `history.pushState()` called synchronously **before** awaiting
  the dialog, then dialog shown — prevents double URL restoration (Vue Router guard + manual)
- `beforeunload`: independent listener armed/disarmed with `isGameInProgress` —
  fires browser-native "Leave site?" on tab close or external navigation (no Vue Router involvement)

**When to Use**: Any screen that owns unsaved in-progress state that would be lost on navigation.
In v0, only the Play screen uses this.

**When NOT to Use**: Review screen (review can be safely abandoned; no progress at risk).

---

### P-05: Lazy Route Loading

**Category**: Navigation
**Used In**: Play view, Post-Game Review view (all routes except Home)

**Description**: Non-Home routes are loaded via dynamic `import()` to keep the initial bundle small
and support the < 3s mobile load budget.

**Specification**:
- Implementation: `component: () => import('./views/PlayView.vue')` in route definition
- Only `HomeView` is eager-loaded (it's the entry point and must paint immediately)
- On chunk-load failure, see P-06

**When NOT to Use**: Entry-point screens that must render before any JS chunk loading begins.

---

### P-06: Chunk-Load Failure Auto-Reload

**Category**: Navigation
**Used In**: All lazy routes

**Description**: When a dynamic import fails (stale chunk hash after a deploy), the app auto-reloads
once to fetch fresh `index.html` and new chunk hashes. Prevents the user from seeing a blank screen
after a deploy.

**Specification**:
- Hook: `router.onError(error => { ... })`
- Condition: error is a chunk-load failure (import rejection, typically `Loading chunk X failed`)
- Action: `window.location.reload()`
- Guard against reload loops: one-shot flag (`reloadAttempted: boolean`); if flag is already set,
  do NOT reload again — surface the error instead
- Flag stored in `sessionStorage` to survive the reload

**When NOT to Use**: Non-chunk-load errors (network timeouts, API errors — handled separately).

---

### P-07: Confirmation Dialog (Destructive)

**Category**: Dialog & Modal
**Used In**: Resign action, Navigation Leave Guard (P-04)

**Description**: Before any irreversible or progress-destroying action, show a modal dialog
requiring explicit confirmation. The dialog is non-dismissable by clicking outside — only the
Confirm and Cancel buttons act.

**Specification**:
- Layout: centered overlay; headline states the consequence, not the action; two buttons: Cancel (default focus) and Confirm (destructive styling)
- Dismiss method: only Confirm or Cancel buttons — clicking outside does nothing
- Escape key: treated as Cancel (dismiss without action)
- Default focus: Cancel button (protects against accidental confirm via Enter/Space immediately after dialog opens)
- ARIA: `role="dialog" aria-modal="true" aria-labelledby="dialog-title"`; focus trap (P-09)
- Buttons: each ≥ 44×44px

**Wording pattern**:
- Headline: "[Consequence], not "[Action]" — e.g., "Your progress will be lost", not "Confirm resign"
- Cancel: "Cancel" (default)
- Confirm: specific action — "Resign", "Leave game"

**When to Use**: Any action that destroys user progress or is irreversible and non-trivial.

**When NOT to Use**: Low-stakes reversible actions. Closing a settings panel does not need confirmation.

---

### P-08: Non-Dismissable End-State Modal

**Category**: Dialog & Modal
**Used In**: Game Over (result overlay)

**Description**: When a game reaches a terminal state, a modal overlay appears showing the outcome.
The player cannot dismiss it by clicking outside — they must choose a deliberate next action.

**Specification**:
- Appearance: no entrance animation, no auto-dismiss, no click-outside-to-close
- Content: result headline + plain-language end reason + two action buttons
- Action buttons: "New Game" (→ Setup) and "Review" (→ Post-Game Review); both ≥ 44×44px
- ARIA: `role="dialog" aria-modal="true"`; focus on first button
- Focus trap (P-09): Tab cycles between the two action buttons
- Escape: does nothing (this modal intentionally has no passive dismiss)

**Rationale**: The player has just finished a game. Forcing them to choose the next step prevents
accidental dismissal and makes "Review" a prominent equal option alongside "New Game".

**When NOT to Use**: Intermediate states that do not require a decision (use a toast or status
indicator instead).

---

### P-09: Focus Trap in Modal

**Category**: Dialog & Modal
**Used In**: All modal dialogs (P-07, P-08, P-10)

**Description**: When a modal dialog is open, keyboard Tab focus cycles only within the dialog's
interactive elements. Focus cannot escape to the page behind the modal.

**Specification**:
- On modal open: move focus to the dialog's first focusable element (or the designated default)
- Tab: cycles forward through dialog's focusable elements only
- Shift-Tab: cycles backward
- Focus cannot reach elements outside the modal while it is open
- On modal close: return focus to the element that triggered the modal

**Implementation**: Use a `useFocusTrap` composable or `<dialog>` element's native focus management.
Do not reimplement per-dialog.

**When to Use**: Every modal dialog without exception.

**When NOT to Use**: Inline panels, drawers, or dropdowns that are non-modal and allow background interaction.

---

### P-10: Promotion Dialog

**Category**: Dialog & Modal
**Used In**: Chess board — pawn reaching the back rank

**Description**: A modal dialog appears anchored to the promotion file's destination square,
presenting four piece options. Escape or tap-outside cancels the entire move (pawn snaps back).
This is a specialized instance of P-09 (Focus Trap in Modal).

**Specification**:
- Anchor: promotion file's destination square; falls back to centered above the board if anchoring would clip the viewport
- Layout: vertical column of four buttons — Queen / Rook / Bishop / Knight (player's color)
- Each button: piece SVG + name label; ≥ **56×56px** (elevated per P-01)
- Default focus: Queen button
- Keyboard: Tab cycles Queen ↔ Rook ↔ Bishop ↔ Knight; digit keys 1/2/3/4 select directly; Enter commits; Escape cancels entire move
- On Escape or tap-outside: pawn snaps back to origin (same as illegal-move snap-back); does NOT auto-promote to Queen
- ARIA: `role="dialog" aria-modal="true" aria-label="Promote pawn"`; each button `aria-label="Promote to [piece name]"`
- Appearance: 300ms fade-in with 0.95 → 1.0 scale; respects `prefers-reduced-motion`

**Rationale**: A stray tap must never silently auto-promote. Beginners learn underpromotion is possible.
Irreversible actions need deliberate confirmation (P-07 principle applied to in-game flow).

---

### P-11: Boundary-Disabled Navigation Control

**Category**: Buttons & Controls
**Used In**: Post-Game Review — Previous/Next cursor navigation; Jump button

**Description**: Navigation controls that move a cursor through a bounded sequence (previous /
next / jump) are visible and disabled at the boundaries — never hidden. Disabled state communicates
the boundary without removing the affordance from the UI.

**Specification**:
- At minimum boundary (cursor = 0): Previous button visible + `disabled` attribute + disabled visual style
- At maximum boundary (cursor = N): Next button visible + `disabled` attribute + disabled visual style
- Jump button: visible + `disabled` when `biggestSwingCursor === null`; visible + enabled otherwise
- `disabled` attribute prevents Tab focus; still accessible to screen readers as "dimmed"
- Disabled style: reduced opacity (e.g., 40%); keep same size and position (no layout shift)
- Touch target: ≥ 44×44px even in disabled state

**When to Use**: Any cursor-based or paginated navigation where position determines reachability.

**When NOT to Use**: Features gated by user action (lock/unlock UX) — those warrant a different
visual treatment (lock icon, tooltip), not a plain disabled state.

---

### P-12: In-Flight Button Disabled

**Category**: Buttons & Controls
**Used In**: Game Export — while clipboard write or share is in-flight

**Description**: While an async action is processing, the triggering button is immediately
disabled to prevent double-submission. The button re-enables on completion (success or error).

**Specification**:
- On action trigger: set `disabled` immediately (synchronous, before any await)
- While in-flight: button shows original label (no loading spinner required in v0)
- On success: transition to Timed Success Feedback (P-13)
- On error: re-enable button with original label; optionally show brief error message
- Touch target: ≥ 44×44px in both enabled and disabled states

**When to Use**: Any button triggering a network call, clipboard write, or share sheet that must
not be double-triggered.

**When NOT to Use**: Synchronous actions (button press → instant result) — disabled state flicker
is worse than nothing.

---

### P-13: Timed Success Feedback

**Category**: Feedback & Status
**Used In**: Game Export — after successful copy or share

**Description**: After a successful irreversible action, the triggering button transitions to a
success state for a fixed duration, then reverts to the idle state. The player sees confirmation
that the action worked without requiring a separate toast or banner.

**Specification**:
- On success: button label changes to "Copied!" or "Shared!" + checkmark icon
- Duration: `feedbackDurationMs` (default 2000ms)
- After duration: button reverts to original idle label and style
- During success state: button is enabled (not disabled) — player may retrigger if desired
- ARIA: `aria-live="polite"` region announces the success message (non-visual feedback)
- Visual: color change to success-green (Tailwind `text-green-600` or project theme success) is
  supplementary to label change — not the only signal (SC 1.4.1)

**When to Use**: After any one-shot irreversible action where the player needs confirmation but
a modal would be excessive.

**When NOT to Use**: For long-running background operations (use a progress indicator instead).

---

### P-14: aria-live Assertive Announcement

**Category**: Feedback & Status
**Used In**: Chess board — move feedback, errors, game events

**Description**: Screen reader announcements for events that require immediate attention are
broadcast via an `aria-live="assertive"` region. This interrupts any current reading to deliver
the update.

**Specification**:
- Region: `<div id="board-assertive" aria-live="assertive" aria-atomic="true" />`
- Mounted **outside** the chess board's DOM subtree (avoids re-announcement on board re-renders)
- Used for: legal move text (`"e4"`, `"Nxe5, capturing knight"`, `"O-O"`, `"e8=Q"`), illegal
  rejection (`"Illegal move, knight returned to g1"`), check, checkmate, stalemate,
  promotion dialog open (`"Promote pawn — choose Queen, Rook, Bishop, or Knight"`)
- Implementation: set `element.textContent = message` (not append — overwrite forces re-announcement
  even for repeated identical messages)

**When to Use**: Move feedback, errors, critical game state changes that demand immediate attention.

**When NOT to Use**: Non-urgent status updates — use P-15 instead. Overuse of assertive disrupts
the reading flow and trains users to ignore it.

---

### P-15: aria-live Polite Announcement

**Category**: Feedback & Status
**Used In**: Chess board — ambient state changes; Game Export — success feedback

**Description**: Screen reader announcements for non-urgent updates are broadcast via an
`aria-live="polite"` region. This waits for any current reading to complete before delivering the update.

**Specification**:
- Region: `<div id="board-polite" aria-live="polite" aria-atomic="false" />`
- Mounted outside the chess board's DOM subtree
- Used for: turn changes (`"Black to move"`), opponent's move (`"Black plays Nxe5"`) — fired after
  animation completes; success feedback from export actions (`"Copied to clipboard"`)
- Implementation: set `element.textContent = message`

**When to Use**: Status changes the user should know about but do not require interrupting the
current reading context.

**When NOT to Use**: Time-sensitive move feedback or errors — use P-14.

---

### P-16: 100ms Announcement Merge

**Category**: Feedback & Status
**Used In**: Chess board — when rapid game events fire multiple announcements

**Description**: If two assertive announcements would fire within 100ms of each other, they are
merged into a single concatenated announcement. This prevents announcement queue overflow on
rapid events (capture + check) and avoids the screen reader repeating the live-region trigger.

**Specification**:
- Threshold: 100ms debounce window
- Merge: concatenate with `", "` separator — e.g., `"Nxe5, capturing knight, check"`
- Priority: both messages are included (no message is dropped)
- Two announcements more than 100ms apart fire separately
- Implemented in `useBoardAnnouncer` composable

**When to Use**: Any component that may emit multiple `aria-live` updates in rapid succession.

**When NOT to Use**: When each announcement is semantically independent and users need to hear
them as distinct events (e.g., turn change followed by opponent's long move description — these
are not rapid and should be separate).

---

### P-17: 3-Tier Export Delivery

**Category**: Delivery
**Used In**: Game Export — "Analyze with Claude" action

**Description**: The export payload is delivered through three tiers in priority order, detected
synchronously at tap time to stay within iOS's user-activation window.

**Specification**:
- Detection: synchronous feature detect **at tap** (not deferred), before any async work
- Tier 1 (Web Share): `navigator.share && navigator.canShare({text}) === true` → call
  `navigator.share({ text: payload })` — routes to iOS/Android native share sheet
- Tier 2 (Clipboard): Web Share unavailable → `navigator.clipboard.writeText(payload)` —
  requires user-activation window (synchronous decision into async write preserves this)
- Tier 3 (Manual Textarea): both Tier 1 & 2 fail (permission denied, insecure context, API absent)
  → reveal pre-selected `<textarea>` with instructions (P-18)
- **No SHARING→COPYING fallthrough**: tier is decided at tap and committed; mid-delivery failures
  go to error state, not silently retry a lower tier
- Success in any tier → P-13 (Timed Success Feedback)

**When to Use**: Any export/share action targeting both iOS (Web Share) and desktop (Clipboard)
simultaneously, where the clipboard must be written synchronously to preserve user-activation.

**When NOT to Use**: Actions where only one delivery method is needed or where async pre-detection
is acceptable (not on iOS).

---

### P-18: Manual Textarea Fallback

**Category**: Delivery
**Used In**: Game Export — when Tier 1 and Tier 2 both fail (P-17 Tier 3)

**Description**: A read-only textarea containing the export payload, pre-selected for easy copying,
with a visible instructions label and a Dismiss button.

**Specification**:
- Reveal: shown only when P-17 Tier 3 is reached (never shown proactively)
- Content: full export payload, pre-selected (`textarea.select()`) on reveal
- Label: visible `<label>` ("Copy this text and paste into claude.ai") — associated via `for`/`id`
- Dismiss button: ≥ 44×44px; not hover-only; tapping transitions back to IDLE (hides textarea)
- Textarea stays visible until explicitly dismissed — no auto-hide timeout
- `readonly` attribute: prevents accidental editing
- ARIA: `aria-label` on textarea if label association is insufficient; `aria-live="polite"` announces
  fallback activation to screen readers

**When NOT to Use**: As a primary delivery mechanism. Always attempt P-17 Tier 1 and 2 first.

---

### P-19: Tap-to-Select (Primary Mobile Input)

**Category**: Input & Selection
**Used In**: Chess board — primary piece selection and move input on touch

**Description**: A two-step tap interaction: tap an own piece to select it (first tap), then tap
a legal destination to commit the move (second tap). This is the complete-feature equivalent of
drag-and-drop for touch users and switch/voice-control users.

**Specification**:
- First tap: own piece → enters PIECE_SELECTED state; legal destinations highlighted with dots (empty) and rings (capturable)
- Second tap: legal destination → commits move; illegal destination → no action (piece stays selected); same piece → cancels selection
- Drag-vs-tap discriminator: tap classified if pointer movement ≤ 5px AND hold ≤ 250ms; otherwise classified as drag
- Classification final on pointer release — no ambiguous intermediate state visible to user
- On illegal destination tap: no error message, no animation — piece simply stays selected
- On cancel (tap empty non-destination): PIECE_SELECTED → IDLE; piece returns to un-selected state
- Keyboard equivalent: P-20 (Roving Tabindex Widget)

**When to Use**: Any grid-based selection widget on touch where drag is also supported.
The tap-tap path must always be available as a complete equivalent to drag.

**When NOT to Use**: Non-spatial selections (list items, radio buttons) — use standard tap-to-toggle.

---

### P-20: Roving Tabindex Widget

**Category**: Accessibility
**Used In**: Chess board keyboard navigation (ADR-0009 `useBoardKeyboard` composable)

**Description**: A composite widget (grid, menu, list) is presented as a single Tab stop. Internal
navigation uses arrow keys instead of Tab. Only one cell has `tabindex="0"` at a time — all others
have `tabindex="-1"`. This is the standard ARIA authoring pattern for keyboard-accessible grids.

**Specification**:
- Wrapper element: `tabindex="-1"` with a programmatic `focus()` that sets focus to the last-visited
  or default cell (making it a single entry point)
- Active cell: `tabindex="0"`; all other cells: `tabindex="-1"`
- Arrow keys: move the active cell in the widget's logical direction
- Home/End: jump to first/last cell in the current row
- PgUp/PgDn: jump to first/last cell in the current column
- Enter/Space: activate the focused cell (widget-specific behavior)
- Escape: cancel selection / exit interaction mode; return to single-tab-stop state
- On Tab from anywhere in the widget: Tab exits to the next focusable element outside the widget
  (not the next cell inside)

**Chess board specifics** (ADR-0009):
- Single transparent `<div class="focus-cell">` repositioned absolutely to the focused square via `squareToRect()`
- Board wrapper `role="grid"`; focus cell `role="gridcell"` with `aria-rowindex`/`aria-colindex`
- Arrow direction is orientation-aware (Black perspective flips left/right)

**When to Use**: Any custom widget where the user navigates among many cells with arrow keys
(date pickers, data grids, chess boards, carousels).

**When NOT to Use**: Simple linear lists where Tab is the natural navigation (navigation menus,
button groups) — use standard Tab navigation, not roving tabindex.

---

### P-21: Evaluation Bar

**Category**: Feedback & Status
**Used In**: Post-Game Review — engine evaluation visualization beside the board

**Description**: A vertical strip beside the board that shows engine evaluation as a fill ratio
between two solid colors. Quiet, ambient, never animated mid-position. Hidden by default on
mobile per ADR-0007's calm default; toggleable via "Show detail".

**Specification**:

*Layout*:
- Orientation: vertical strip, full board height, ~12px wide on desktop, ~16px on mobile (when shown)
- Placement: layout element **outside** the annotation SVG (per ADR-0006 §1) — beside the board, not overlaid
- Two solid color fills, no gradient:
  - White-favorable region: 胡粉色 gofun-iro `#fffffc` (matches light squares)
  - Black-favorable region: 桑染 kuwazome `#946259` (matches dark squares)
- Fill ratio = `fillRatioWhite ∈ [0, 1]`; computed from current cursor's `evalCp` (clamped to ±1000cp) or `evalMate` (clamped to ±1)
- Direction: White's region grows from board orientation's "white side"; flips with board orientation
- No 50-50 dividing line at rest; the meeting point of the two fills IS the boundary

*Numeric badge (separate element, beside the bar)*:
- Compact pill containing the textual evaluation, format per ADR-0007 §6:
  - `+1.2` / `−0.7` — pawn units, one decimal
  - `M3` / `−M5` — forced mate in N
  - `—` — not applicable (terminal position, missing result)
  - `…` — pending (analysis in flight)
- Color: neutral text on transparent background — does NOT inherit the bar's fill colors (avoids reinforcing emotive valence)
- Tap target: ≥ 44×44px (the badge itself is the touch surface)

*Peak marker (biggestSwingCursor)*:
- A 山吹色 yamabuki-iro `#f8b500` horizontal tick at the bar position corresponding to the
  biggest-swing player move (see ADR-0007 §4)
- Visible only after analysis state = COMPLETE; never moves once placed
- Same gold as P-keySquare highlights — consistent "this is the moment" signal across the UI

*Animation*:
- Bar fill: 300ms `ease-out` transition on `transform: scaleY(...)` only — no `height`/`top` animation (60fps budget, ADR-0009 constraint)
- Peak marker: appears with 200ms fade-in on COMPLETE entry; no movement afterward
- Respects `prefers-reduced-motion`: instant transitions when set

*Mobile (< 768px) default*:
- Bar: **hidden** (binding per ADR-0007 §5 mobile calm default)
- Badge: **shown** (compact pill remains visible, gives essential information without the bar's visual weight)
- "Show detail" toggle reveals the bar

*Accessibility*:
- Bar element: `aria-hidden="true"` (decorative — the badge carries the information)
- Badge: `aria-label="Evaluation: White plus 1.2 pawns"` (or appropriate phrasing per state)
- Updates announced via P-15 polite region on cursor change, not the bar element itself
- Forced-colors fallback: bar uses `Canvas`/`CanvasText` system colors; peak marker uses `Highlight`

*Independence from annotation layer (ADR-0006 §1 + §VC5)*:
- Bar contains **zero text nodes** (the badge is a separate element)
- Bar contains **zero `aria-label` strings containing "eval"** (the badge owns that)
- This independence is verified by P-21's CI test (per ADR-0006 §VC5)

**When to Use**: Position-evaluation visualization beside a chess board. Sole consumer in v0 is Post-Game Review.

**When NOT to Use**:
- Play mode — no eval bar during a live game (avoids real-time judgment pressure per Pillar 3 "No Pressure")
- Mobile by default — hidden unless "Show detail" is toggled
- For move-by-move qualitative feedback — that lives in P-14/P-15 announcements, not in the bar

---

## Gaps & Patterns Needed

The following interaction patterns were identified in GDDs as needed but are not yet formalized:

| Gap | Source | Priority |
| --- | ------- | -------- |
| Progressive Detail Toggle (mobile calm default → "Show detail") | Post-Game Review GDD | High — needed before Review UX spec |
| Thinking Indicator (AI thinking state) | Game Lifecycle GDD | Medium — needed before Play UX spec |
| Persistent Progress Indicator (two-phase "Analyzing… X/N") | Post-Game Review GDD | Medium — needed before Review UX spec |
| Preliminary Value Treatment ("~" prefix, depth mismatch) | Post-Game Review GDD | Low — UX detail, Review spec can own this |
| 404 / Not-Found Calm Screen | Navigation GDD | Low — simple, no bespoke pattern needed |

These gaps should be formalized when their screen's UX spec is authored.

---

## Open Questions

1. **Progressive Detail Toggle**: mobile < 768px shows calm default; "Show detail" toggle reveals
   advanced content. Should toggle state persist across sessions (per Game Lifecycle GDD, "Settings,
   Polish phase")? Needs decision before Post-Game Review UX spec.

2. **Thinking Indicator placement**: Game Lifecycle GDD defers placement to the UX spec. Must not
   overlap board or resign button. To be resolved in Setup/Play UX spec.

3. **Error state for Export (P-17)**: Tier 1 and Tier 2 can fail mid-delivery (permission revoked,
   navigator.share throws). Re-enable button or fall through to Tier 3? Current spec says
   "go to error state, not silently retry." What does the error state look like? Needs decision.
