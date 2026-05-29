# Sprint 3 — 2026-06-26 to 2026-07-09

> **PR-SPRINT Gate**: Skipped — Lean mode.
> **QA Plan**: ⚠️ NONE — run `/qa-plan sprint` before the first implementation story begins.

## Sprint Goal

Implement the Core layer critical path (GameLifecycle state machine + CompletedGame transport,
MoveAnnotationDisplay SVG overlay + rAF resize) to close the first full game loop: moves →
terminal detection → CompletedGame assembled → navigates to Review screen with annotations
visible. Also resolves Sprint 2 retrospective action items (FEN dev tool, CSS fix, favicon,
UCI CI smoke test).

## Capacity

- Total calendar days: 14 (part-time solo developer)
- Effective hours: ~30h (2–3h/weekday; 3–4h/weekend)
- Buffer (20%): 6h reserved for unplanned work
- Available: ~24h ≈ 3.0 equivalent working days

## Tasks

### Must Have (Critical Path)

| ID | Task | Story File | Est. | Dependencies | Acceptance Criteria |
|----|------|------------|------|--------------|---------------------|
| S3-01 | Sprint 3 Housekeeping — FEN dev tool + CSS min-width fix + favicon + UCI handshake CI smoke | *(retro action items — no story file)* | 0.5d / 4h | S2 done ✅ | FEN injection UI works in `/play` dev mode; board visible at ≤768px viewport; `public/favicon.ico` present; CI asserts readyok within 10s |
| S3-02 | game-lifecycle: State Machine & Terminal Detection | [story-001](../epics/game-lifecycle/story-001-state-machine.md) | 0.5d / 4h | S2-01 ✅ S2-04 ✅ | 4-phase FSM (SETUP→PLAYER_TURN→AI_THINKING→GAME_OVER); 5-priority terminal detection in fixed order; chess.js non-reactive const |
| S3-03 | game-lifecycle: CompletedGame Assembly & Pinia Transport | [story-002](../epics/game-lifecycle/story-002-completed-game.md) | 0.31d / 2.5h | S3-02 | CompletedGame frozen + shallowRef; playerMoveTimes player-only index; disarm-before-navigate order enforced |
| S3-04 | move-annotation: Custom SVG Overlay — Arrows, Highlights, Eval Bar | [story-001](../epics/move-annotation/story-001-svg-overlay.md) | 0.5d / 4h | S2-03 ✅ | `pointer-events:none` SVG; arrows center-to-square-edge; highlights; Formula 1 fillRatio; sign normalization internal |
| S3-05 | move-annotation: rAF-Coalesced Resize Throttle | [story-002](../epics/move-annotation/story-002-resize-throttle.md) | 0.25d / 2h | S3-04 | ResizeObserver + rAF coalesce; annotations pixel-accurate after resize; observer disconnected on unmount |

**Must Have total: ~2.06 days / ~16.5h** (within 24h budget — 7.5h margin)

### Should Have (Stretch Goals)

| ID | Task | Story File | Est. | Dependencies | Acceptance Criteria |
|----|------|------------|------|--------------|---------------------|
| S3-06 | chess-engine: Review Engine — Lazy Load + analyze() + 30s Auto-Terminate | [story-003](../epics/chess-engine/story-003-review-engine.md) | 0.5d / 4h | S2-04 ✅ | NNUE worker lazy-loads; 30s idle auto-terminate → IDLE_TERMINATED; auto-respawn; DISPOSED rejects sync; co-residency guard |
| S3-07 | chess-board: Visual Feedback — Check Indicator + Reduced Motion | [story-006](../epics/chess-board/story-006-visual-feedback.md) | 0.5d / 4h | S2-01 ✅ S2-03 ✅ | Check glow + border ring; last-move highlight ≥3:1 contrast; prefers-reduced-motion instant; forced-colors fallback; transform/opacity only |

**Should Have total: ~1.0 day / ~8h**

### Nice to Have (If Ahead of Schedule)

| ID | Task | Story File | Est. | Dependencies | Acceptance Criteria |
|----|------|------------|------|--------------|---------------------|
| S3-08 | chess-board: Keyboard Navigation — useBoardKeyboard composable | [story-005](../epics/chess-board/story-005-keyboard-nav.md) | 0.81d / 6.5h | S2-01 ✅ S2-02 ✅ | Roving tabindex; arrow keys no-wrap; Enter selects/commits; Escape cancels; ARIA live regions; axe-core 0 serious/critical violations |

## Carryover from Sprint 2

| Task | Reason | New Position |
|------|--------|-------------|
| S2-11 Keyboard Navigation | Deliberately backlogged (Nice-to-Have) | S3-08 (Nice to Have) |
| S2-12 Review Engine | Deliberately backlogged (Nice-to-Have) | S3-06 (Should Have — needed to unlock PostGameReview epic) |
| S2-13 Visual Feedback | Deliberately backlogged (Nice-to-Have) | S3-07 (Should Have) |
| S2-08 QA sign-off pending | Blocked — FEN injection tool missing | Unblocked by S3-01 |

## Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| GameLifecycle integration harder than estimated (wiring move-made + PlayEngine) | Medium | Medium | S3-02/03 build on known composable pattern from S2; interfaces well-defined in ADR-0005 |
| NNUE weight download (~40MB) causes CI timeout for S3-06 | Medium | Low | Review Engine uses lazy-load; CI tests mock worker transport layer |
| S3-07 Visual Feedback manual QA time-consuming | Low | Low | Visual/Feel story — advisory evidence only, not blocking CI gate |
| iPhone spike (ADR-0007 + ADR-0008) still pending | Certain | Low (Sprint 3) | PostGameReview stories won't enter Sprint 3; no dependency here |

## Dependencies on External Factors

- **iPhone device session** (ADR-0007 Stockfish depth-22 RSS + ADR-0008 iOS Safari CSP): deferred. Must be completed before PostGameReview stories can be scheduled.
- **S2-08 QA sign-off**: unblocked once S3-01 FEN tool is complete.

## Definition of Done for this Sprint

- [ ] All Must Have tasks (S3-01 through S3-05) completed and tests passing
- [ ] A completed chess game triggers correct terminal detection and transitions to GAME_OVER with correct endReason and result
- [ ] CompletedGame assembled, frozen, written to Pinia; Review navigation fires in correct disarm order
- [ ] SVG overlay renders arrows and eval bar correctly; rAF throttle prevents layout thrash on resize
- [ ] All Logic stories have passing unit tests in `tests/unit/`
- [ ] S2-08 Promotion Dialog manual QA sign-off completed (via S3-01 FEN tool)
- [ ] No S2 bugs in delivered features
- [ ] QA plan exists (`production/qa/qa-plan-sprint-3.md`) — run `/qa-plan sprint` before first implementation story
- [ ] Smoke check passed (`/smoke-check sprint`)
- [ ] QA sign-off report: APPROVED or APPROVED WITH CONDITIONS (`/team-qa sprint`)
- [ ] `production/sprint-status.yaml` updated at sprint close
- [ ] `production/session-state/active.md` updated with sprint outcomes

> ⚠️ **No QA Plan**: This sprint contains implementation stories. Run `/qa-plan sprint`
> before the first story (S3-01) begins. QA sign-off requires a QA plan — the
> Production → Polish gate will block without one.

---

**Scope check:** Sprint 3 stories stay within their epic boundaries (game-lifecycle, move-annotation, chess-board, chess-engine). If any story expands beyond its epic, run `/scope-check [epic]` before implementation continues.
