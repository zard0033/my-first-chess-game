# Sprint 2 — 2026-06-12 to 2026-06-25

> **PR-SPRINT Gate**: Self-assessed (full mode, autonomous session) — **REALISTIC** for Must Have (22h vs 24h available). Should Have is a stretch goal; defer to Sprint 3 if Must Have runs long.
> **QA Plan**: ⚠️ NONE — run `/qa-plan sprint` before the first implementation story begins.

## Sprint Goal

Implement the Foundation layer critical path (ChessBoard input + FEN rendering, Play Engine UCI + play(), AppRouter routes) to the point where a human can make moves against a Stockfish opponent in a browser — the first end-to-end playable game loop.

## Capacity

- Total calendar days: 14 (part-time solo developer)
- Effective hours: ~30h (2–3h/weekday; 3–4h/weekend)
- Buffer (20%): 6h reserved for unplanned work
- Available: ~24h ≈ 3.0 equivalent working days

## Tasks

### Must Have (Critical Path)

| ID | Task | Story File | Est. | Dependencies | Acceptance Criteria |
|----|------|------------|------|--------------|---------------------|
| S2-01 | chess-board: FEN Rendering and Position Sync | [story-001](../epics/chess-board/story-001-fen-rendering.md) | 2.5h | S1-09 (skeleton exists) | Board renders from FEN within 100ms; invalid FEN → starting position + console.error; Black perspective flips |
| S2-02 | chess-board: Dual Input — Drag + Tap-Tap + move-made | [story-002](../epics/chess-board/story-002-input.md) | 5h | S2-01 | move-made fires with correct payload; illegal drag snaps back; DISABLED blocks input; dots/rings via drawable.shapes |
| S2-03 | chess-board: squareToRect() Geometry Contract | [story-004](../epics/chess-board/story-004-square-to-rect.md) | 2h | S2-01 | Returns board-local {x,y,w,h}; null on invalid; orientation-aware; live values |
| S2-04 | chess-engine: Play Engine — Worker Scaffold + UCI Handshake | [story-001](../epics/chess-engine/story-001-play-engine-uci.md) | 4.5h | S1-12 (worker wrapper init exists) | HCE worker spawns; UCI handshake completes → IDLE; timeout → CRASHED + EngineUnavailableError |
| S2-05 | chess-engine: play() Method with AbortSignal + Race Guard | [story-002](../epics/chess-engine/story-002-play-engine-play.md) | 3.5h | S2-04 | play() resolves with PlayResult; race guard drops stale bestmove; AbortSignal → CanceledError |
| S2-06 | chess-engine: CSP Headers + WASM Deployment Config | [story-006](../epics/chess-engine/story-006-csp-wasm-deployment.md) | 1.5h | S1-02 (Vite scaffold) | CSP meta tag correct + precedes scripts; CI awk check passes; WASM loads without CSP errors |
| S2-07 | app-router: Route Table, Lazy Loading, SPA Fallback | [story-001](../epics/app-router/story-001-route-table.md) | 2.5h | S1-10 (routing skeleton) | createWebHistory; Play/Review lazy; 404.html shim; Playwright deep-link test passes |

**Must Have total: ~21.5h** (within 24h budget — 2.5h margin)

### Should Have (Stretch Goals)

| ID | Task | Story File | Est. | Dependencies | Acceptance Criteria |
|----|------|------------|------|--------------|---------------------|
| S2-08 | chess-board: Promotion Dialog — Deliberate Selection | [story-003](../epics/chess-board/story-003-promotion.md) | 3.5h | S2-02 | Dialog anchored to promotion file; Queen focused; cancel → snap-back; focus trap; no auto-queen |
| S2-09 | app-router: Navigation Guards (in-game + beforeunload + popstate) | [story-002](../epics/app-router/story-002-navigation-guards.md) | 3.5h | S2-07 | beforeRouteLeave blocks navigation; beforeunload arms/disarms; popstate synchronous pushState |
| S2-10 | opening-id: ECO.lookupSync + identifyOpening() | [story-001](../epics/opening-id/story-001-opening-lookup.md) | 2.5h | none | identifyOpening returns correct ECO; lookup ≤ 20ms for 40-move game; chess-openings pinned 0.1.1 |

**Should Have total: ~9.5h** (pursue only if Must Have finishes before day 10)

### Nice to Have (If Ahead of Schedule)

| ID | Task | Story File | Est. | Dependencies | Acceptance Criteria |
|----|------|------------|------|--------------|---------------------|
| S2-11 | chess-board: Keyboard Navigation (useBoardKeyboard) | [story-005](../epics/chess-board/story-005-keyboard-nav.md) | 6.5h | S2-02 | Arrow keys move focus; Enter on own piece → PIECE_SELECTED; axe-core 0 serious/critical violations |
| S2-12 | chess-engine: Review Engine — Lazy Load + analyze() + 30s Auto-Terminate | [story-003](../epics/chess-engine/story-003-review-engine.md) | 4.5h | S2-04 | NNUE worker lazy-loads; auto-terminates after 30s; IDLE_TERMINATED vs DISPOSED distinct |
| S2-13 | chess-board: Visual Feedback — Check Indicator + Reduced Motion | [story-006](../epics/chess-board/story-006-visual-feedback.md) | 4.5h | S2-01, S2-03 | Check indicator (glow + ring); prefers-reduced-motion instant; no layout/paint animations |

## Carryover from Sprint 1

None — all S1 tasks completed 2026-05-28. Sprint 1 Should Have items (S1-08 through S1-11) and Nice to Have (S1-12) all delivered.

Note: S1-09 (chess-board skeleton) and S1-12 (engine worker wrapper init) are partial implementations that Sprint 2 stories build on top of — not carryover.

## Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| chess-board input (S2-02) takes longer than 5h — vue3-chessboard event API surprises | Medium | Medium | Sprint 1 ADR-0009 spikes confirmed the API surface; 5h estimate includes ramp-up buffer |
| chess-engine Worker debugging on Windows takes longer than estimated | Low | Medium | S1-12 already established the worker handshake pattern; S2-04 builds on known baseline |
| CSP meta tag (S2-06) needs per-browser verification | Low | Low | ADR-0008 spike confirms Chromium path; defer Firefox/Edge verification to Sprint 3 |
| Should Have (S2-08–S2-10) crowd out Must Have if S2-02 runs long | Medium | Low | S2-02 is a hard gate — start Should Have only after S2-01+02+03+04+05+06+07 all green |
| No QA plan → developers don't know test spec for each AC | High | Medium | Run `/qa-plan sprint` IMMEDIATELY before starting S2-01 |

## Dependencies on External Factors

- **iPhone device session** (ADR-0007 iPhone depth-22, ADR-0008 iOS Safari CSP): still not in scope. Must happen before Sprint 3. PostGameReview implementation cannot be finalized until ADR-0007 is Accepted.
- **opening-knowledge-cards GDD**: sections 3/5/7/8 still TO AUTHOR. Story creation for that epic blocked. Does not block Sprint 2.

## Definition of Done for this Sprint

- [ ] All Must Have tasks (S2-01 through S2-07) completed and tests passing
- [ ] A human can start a game, make moves, receive AI responses (Stockfish HCE) in the browser
- [ ] All Logic stories have passing unit tests in `tests/unit/`
- [ ] CSP verified in Chrome DevTools (no console CSP violations)
- [ ] Playwright SPA deep-link test passes for `/play` and `/review`
- [ ] No S1 or S2 bugs in delivered features
- [ ] `production/sprint-status.yaml` updated at sprint close
- [ ] `production/session-state/active.md` updated with sprint outcomes
- [ ] Should Have stories (S2-08–S2-10) documented as Done or Carryover in sprint close

> ⚠️ **No QA Plan**: This sprint contains implementation stories. Run `/qa-plan sprint`
> before the first story (S2-01) begins. QA sign-off requires a QA plan — the
> Production → Polish gate will block without one.

---

**Scope check**: Foundation epics are in scope. If any story expands beyond its epic boundary, run `/scope-check chess-board` or `/scope-check chess-engine` to detect creep before it compounds.
