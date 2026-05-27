# Review Log — Chess Board & Move System

## Review — 2026-05-27 (round 2) — Verdict: APPROVED
Scope signal: L
Mode: lean (final round per `feedback_design_review_max_rounds`)
Specialists: none spawned (focused self-audit against round-1 blocker list + user's named focus areas)
Blocking items: 1 (fixed inline) | Recommended: 4 (backlog) | Nice-to-have: 2

Summary: All 10 round-1 blockers verified resolved. New Rule 15 (drag/tap threshold), Rule 16 (disabled visual), Rule 17 (overlay z-order), MOVING_PROMOTION state + move-made timing, aria-live templates + 100ms merge, reconcile animation + queue depth 1, three-layer performance ACs, and experiential playtest AC are all coherent and implementable. One blocker found: Lighthouse-CI TTI ≤1.5s on `Mobile - Slow 4G` was mathematically unsatisfiable (120KB bundle exceeds the 400Kbps × 1.5s envelope) — fixed inline by relaxing to ≤3s aligned with `technical-preferences.md` budget. Round 2 closed; 4 Recommended items deferred to pre-implementation owners.

Prior verdict resolved: Yes — all 10 blockers from round 1 closed.

### Required fix applied inline this round
- **AC L390 Lighthouse-CI TTI**: relaxed from ≤1.5s to ≤3s on Slow 4G to match the project's own "< 3s on mobile 4G" budget. Note added that tighter ≤1.5s target becomes viable on Fast 4G profile once bundle is < 60KB gzipped.

### Recommended (backlog — assign before v0 implementation)
1. **`boardSizeMinPx` safe range vs non-conformant band contradiction** (Tuning Knobs) — safe range 320-400 overlaps the documented 280-351 non-conformant band. Tighten safe range to 352-400 or annotate. Owner: ux-designer.
2. **`disabledPieceOpacity` 0.85 default may be too subtle** — 15% opacity drop is barely perceptible. Consider 0.65-0.75 default, or pair with second visual cue (e.g., desaturated board border). Owner: ux-designer + playtest.
3. **aria-live merge policy doesn't cover ≥3-way collisions** — only capture+check example given. Add explicit template for promote-with-check (`"e8=Q, check"`) and general merge ordering rule. Owner: accessibility-specialist.
4. **`move-made` event timing not reflected in ACs** — Detailed Design splits normal-move emission (at slide start) vs promotion emission (after PROMOTING resolves), but input ACs don't distinguish. Add dedicated timing AC using `animationDoneAt: Promise`. Owner: gameplay-programmer.

### Nice-to-have
- Rule 15 ambiguous-phase wording could clarify behaviour when drag-classified pointer releases on illegal destination during the still-ambiguous window.
- Add edge case AC for re-selecting a different piece mid-drag during the ambiguous window.

---

## Review — 2026-05-27 (round 1) — Verdict: MAJOR REVISION NEEDED → REVISED (awaiting re-review)
Scope signal: L
Specialists: game-designer, ux-designer, gameplay-programmer, qa-lead, performance-analyst, accessibility-specialist, creative-director
Blocking items: 10 | Recommended: 9 | Nice-to-have: 9
Summary: Foundation GDD was structurally complete (8/8 sections) but had load-bearing issues clustered around input model (drag/tap threshold undefined), state machine (promotion ordering inverted), mid-animation FEN reconciliation (self-contradicting + unbounded queue), promotion ritual (gold glow + 3-note chime violated the explicit "no celebratory burst" pillar), accessibility (chessground keyboard nav assumed, no screen-reader model, no focus trap), and performance ACs (50fps vs 60fps budget, untestable TTI). creative-director adjudicated three specialist disagreements: reduced-motion = 0ms, promotion = warm tint + persistent non-color symbol + drop chime, dismiss = cancel move (not auto-Queen).
Prior verdict resolved: First review

### Blockers resolved in this revision
1. B1 Promotion ritual — gold glow + 3-note chime removed; replaced with warm tint matching `lastMoveHighlightColor` + optional single low tone; dismiss = cancel move (snap pawn back), no auto-Queen.
2. B2 Drag-vs-tap discriminator — added Rule 15 with `tapMaxMovementPx` (default 5) and `tapMaxHoldMs` (default 250) as tuning knobs.
3. B3 Mid-animation FEN — rewrote Data edge case: cancel in-flight, run short `reconcileAnimationMs` (100ms) from current visual position; `pendingFen` queue depth capped at 1 (latest wins).
4. B4 State machine — split MOVING into MOVING (non-promotion) and MOVING_PROMOTION (slide to back rank); PROMOTING now correctly sits between MOVING_PROMOTION and a final MOVING swap. Notes section added clarifying `move-made` event timing (logical commit, after PROMOTING resolves for promotion moves).
5. B5 Keyboard nav — full spec written (roving tabindex, arrow / Home / End / PgUp / PgDn / Enter / Space / Escape); chessground 9.x NOT relied on; added Open Question #7 for ui-programmer feasibility verification.
6. B6 Screen-reader announcements — `aria-live` model defined: assertive region for moves/illegal/check/checkmate/promotion-open, polite region for turn change / opponent move. Live-region collision policy added (merge within 100ms window).
7. B7 Promotion dialog focus — focus trap, initial focus on Queen, arrow + digit-key navigation, `role="dialog" aria-modal="true"`, return-focus on close. Anchored to promotion file; centered fallback only if clipping.
8. B8 Performance ACs — split into measurable layers: CDP trace `@perf` test (no frame > 20ms, p95 ≤ 16.6ms), Lighthouse-CI mobile slow 4G TTI ≤ 1.5s including bundle, real-device manual evidence, subsystem bundle ≤ 120KB gz, mid-animation reconciliation AC, queue-depth-1 memory AC.
9. B9 prefers-reduced-motion — deterministic: all animations collapse to `reducedMotionDurationMs` (default 0). Removed "80% or skipped" ambiguity. Specified that check border ring survives reduced-motion (non-color cue persists).
10. B10 Check indicator — added persistent thick border ring (`checkBorderRingPx`) alongside the red glow; glow fades to `checkGlowResidualOpacity` after the initial pulse. Border alone must achieve ≥3:1 contrast (glow is supplementary).

### Recommended also addressed in this pass
- Overlay z-order (Rule 17 added)
- Disabled-state visual (Rule 16: `disabledPieceOpacity` 0.85)
- Missing ACs added: tap opponent piece, tap outside board, resize during PIECE_SELECTED, capturable ring vs dot, event payload `promotion: undefined` for non-promotion, no event in DISABLED, axe-core, contrast measurement, forced-colors, reduced-motion
- 44×44 touch target: `boardSizeMinPx` raised to 352; 280–351 documented as non-conformant band
- Animations restricted to `transform`/`opacity` only (no `box-shadow` animation); selection overlays must use chessground native drawable API
- Per-theme dot opacity (defaults 0.4 light / 0.55 dark)
- Forced-colors / Windows High Contrast Mode fallback
- Experiential playtest AC (5 beginners, calm-family vs celebratory-family vocabulary)
- New Open Questions: #7 keyboard impl, #8 drag/tap threshold tuning, #9 per-theme opacity, #10 forced-colors verification
