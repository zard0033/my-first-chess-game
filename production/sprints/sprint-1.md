# Sprint 1 — 2026-05-29 to 2026-06-11

> **PR-SPRINT Gate**: CONCERNS (capacity ceiling) → resolved by moving S1-08 to Should Have.
> Producer verdict after revision: **REALISTIC**.
> **QA Plan**: None — pre-implementation sprint (spikes + scaffold). QA plan required before Sprint 2 implementation stories begin.

## Sprint Goal

Resolve all non-iPhone ADR spikes (ADR-0002 through ADR-0010 minus iPhone-only ADRs) to unlock
implementation stories, and scaffold the Vue project to a clean dev-server baseline — clearing
every blocker that doesn't require real-device hardware so Sprint 2 can begin Foundation
system implementation immediately.

## Capacity

- Total calendar days: 14 (part-time solo developer)
- Effective hours: ~30h (2–3h/weekday; 3–4h/weekend)
- Buffer (20%): 6h reserved for unplanned work
- Available: ~24h ≈ 3.0 equivalent working days

## Tasks

### Must Have (Critical Path)

| ID | Task | Agent/Owner | Est. Days | Dependencies | Acceptance Criteria |
|----|------|-------------|-----------|--------------|---------------------|
| S1-01 | `npm install` → commit `package-lock.json` | TD | 0.1 | none | Lock file committed; `npm ci` runs clean |
| S1-02 | Vite project scaffold (Vue 3 + TS + Tailwind + Router + Pinia; `src/` per directory-structure.md) | TD/LP | 0.4 | S1-01 | `npm run dev` renders; `npm run build` passes; smoke tests pass |
| S1-03 | ADR-0003 spike: en passant EPD convention check (chess.js vs chess-openings) → Accepted | TD | 0.2 | S1-01 | EPD convention confirmed; ADR-0003 status = Accepted |
| S1-04 | ADR-0006 spike: `drawable.shapes` arrowhead geometry + brush colors + C1 doc patch → Accepted | TD | 0.3 | S1-01 | Arrowhead geometry + brush colour support documented; ADR-0006 Decision §2 patched to board-local coords; status = Accepted |
| S1-05 | ADR-0009 spikes ×3: `drawable.shapes` schema, focus-cell keydown propagation, `boardRef` expose → Accepted | TD | 0.5 | S1-01 | All 3 API questions answered; ADR-0009 = Accepted |
| S1-06 | ADR-0010 spikes ×2: clipboard user-activation pattern + `canShare({text})` reachability → Accepted | TD | 0.2 | S1-01 | Desktop verification complete; iOS caveat noted; ADR-0010 = Accepted |
| S1-07 | ADR-0002 (Worker isolation + UCI protocol) + ADR-0004 (Vue Router / GH Pages SPA fallback) + ADR-0005 (Pinia store boundaries) review → Accepted | TD | 0.2 | ADR-0001 ✅ | No blocking gaps confirmed; all three = Accepted |

**Must Have total: ~1.9 days / ~15h**

### Should Have

| ID | Task | Agent/Owner | Est. Days | Dependencies | Acceptance Criteria |
|----|------|-------------|-----------|--------------|---------------------|
| S1-08 | Opening Knowledge Cards GDD: all 8 sections authored + 8–10 priority ECO blurbs | CD | 0.4 | none | All 8 GDD sections present; ≥8 ECO blurbs authored; remaining blurbs logged as Sprint 2 content backlog in the GDD |
| S1-09 | Chess Board component skeleton (`src/components/chess-board.vue` + `src/composables/use-chess-board.ts`) | LP | 0.5 | ADR-0009 ✅ | Renders chessground 9.x with `fen` prop; legal moves highlight on click/tap; TypeScript strict passes |
| S1-10 | Navigation / Routing skeleton (`src/App.vue` + `src/router/index.ts` + 3 route placeholder screens: Play / Review / History) | LP | 0.3 | ADR-0004 ✅ | Dev-server navigates all 3 stubs without error; history-mode routing confirmed |
| S1-11 | Pinia store shells (`src/stores/game-store.ts`, `src/stores/ui-store.ts`) | LP | 0.2 | S1-02 | Stores importable; TypeScript strict clean; basic unit test shell present in `tests/unit/stores/` |

**Should Have total: ~1.4 days / ~11h**

### Nice to Have

| ID | Task | Agent/Owner | Est. Days | Dependencies | Acceptance Criteria |
|----|------|-------------|-----------|--------------|---------------------|
| S1-12 | Chess Engine Worker wrapper init (`src/workers/stockfish-worker.ts` + `src/composables/use-stockfish.ts`) | LP | 0.5 | ADR-0001 ✅, ADR-0002 ✅ | Worker spawns; `uciok` received; `isready` / `readyok` handshake completes; unit test asserts handshake message sequence |

## Carryover from Previous Sprint

None — Sprint 1.

## Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| ADR-0009 spikes reveal breaking API change in vue3-chessboard 1.x | Medium | High | Fallback: wrap raw chessground 9.x directly; adds ~0.5 day |
| ADR-0007 + ADR-0008 (iPhone spikes) remain blocked — cannot reach Production gate yet | Certain | Low (Sprint 1) | Expected; must schedule iPhone device session before Sprint 3 |
| Tailwind v3 + Vite 5 PostCSS config friction | Low | Low | Follow official vue-ts template; defer `vite-plugin-pwa` to Sprint 3 |
| Opening Knowledge Cards ECO blurbs harder to time-box than expected | Low | Low | Hard cap at 10 blurbs if running over; rest = content backlog |

## Dependencies on External Factors

- **iPhone device session** (ADR-0007: depth-22 RSS measurement; ADR-0008: iOS Safari CSP `worker-src blob:` + `wasm-unsafe-eval`): NOT in this sprint. Must be scheduled before Sprint 3. Production gate requires ≥5 of 7 spikes Accepted.
- **No formal milestones, epics, or stories yet**: run `/create-epics` + `/create-stories` between Sprint 1 and Sprint 2 to prepare implementation stories.

## Definition of Done for this Sprint

- [ ] All Must Have tasks completed
- [ ] ≥6 ADRs promoted: Proposed → Accepted (ADR-0002, -0003, -0004, -0005, -0006, -0009, -0010; target all 7)
- [ ] `npm run dev`, `npm run build`, and smoke tests all green
- [ ] Opening Knowledge Cards GDD has all 8 sections + ≥8 ECO blurbs (if S1-08 reached)
- [ ] Logic stories (S1-12 if implemented) have passing unit tests
- [ ] No S1 or S2 bugs in delivered features
- [ ] `production/sprint-status.yaml` updated at sprint close
- [ ] `production/session-state/active.md` updated with sprint outcomes

> ⚠️ **No QA Plan**: This sprint was started without a QA plan — acceptable because Sprint 1 contains no implementation stories (only spikes, scaffolding, and design work). Run `/qa-plan sprint` before Sprint 2's first implementation story begins. The Production → Polish gate requires a QA sign-off report, which requires a QA plan.
