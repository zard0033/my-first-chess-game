# Architecture Traceability Index

> **Last Updated**: 2026-05-29
> **Stack**: Vue 3 + TypeScript 5 web app (no traditional game engine)
> **Source review**: [architecture-review-2026-05-29.md](./architecture-review-2026-05-29.md)
> **Previous review**: [architecture-review-2026-05-28.md](./architecture-review-2026-05-28.md)

## Coverage Summary

| Status | Count | % |
|---|---|---|
| ✅ Covered (full) | 43 | 91% |
| ⚠️ Partial (covered but pending spike) | 3 | 6% |
| ❌ Gap (no ADR) | 0 | 0% |
| (TR-game-export-003 promoted ⚠️→✅ via ADR-0010) | — | — |
| **Total** | **47** | **100%** |

> Coverage moved from 32 ✅ / 4 ⚠️ / 11 ❌ (2026-05-28) to 43 ✅ / 3 ⚠️ / 0 ❌ (2026-05-29). All v0 ADR coverage gaps closed.

---

## Full Traceability Matrix

| TR-ID | GDD | System | Requirement (short) | ADR | Status |
|---|---|---|---|---|---|
| TR-chess-board-001 | chess-board-and-move-system | Chess Board | Render FEN to board ≤100ms of mount | ADR-0009 | ✅ |
| TR-chess-board-002 | chess-board-and-move-system | Chess Board | Dual input: drag-drop + tap-tap, both always active | ADR-0009 | ✅ |
| TR-chess-board-003 | chess-board-and-move-system | Chess Board | Promotion: deliberate selection only (no auto-queen) | ADR-0009 | ✅ |
| TR-chess-board-004 | chess-board-and-move-system | Chess Board | `squareToRect()` orientation-aware pixel geometry (board-local) | ADR-0009 | ✅ |
| TR-chess-board-005 | chess-board-and-move-system | Chess Board | WCAG 2.1 AA keyboard nav (custom roving tabindex) | ADR-0009 | ✅ |
| TR-chess-board-006 | chess-board-and-move-system | Chess Board | 60fps budget: transform + opacity only | ADR-0009 | ✅ |
| TR-chess-board-007 | chess-board-and-move-system | Chess Board | Bundle ≤ 120 KB gzipped | ADR-0009 | ✅ |
| TR-chess-engine-001 | chess-engine-integration | Chess Engine | Two engines: HCE Play + NNUE Review | ADR-0001 | ✅ |
| TR-chess-engine-002 | chess-engine-integration | Chess Engine | Single-threaded WASM only, no SAB, no COOP/COEP | ADR-0002 | ✅ |
| TR-chess-engine-003 | chess-engine-integration | Chess Engine | UCI handshake: uci→uciok→setoption→isready→readyok | ADR-0002 | ✅ |
| TR-chess-engine-004 | chess-engine-integration | Chess Engine | AbortSignal cancellation + requestId race guard | ADR-0002 | ✅ |
| TR-chess-engine-005 | chess-engine-integration | Chess Engine | Review worker auto-terminates after 30s idle | ADR-0002 | ✅ |
| TR-chess-engine-006 | chess-engine-integration | Chess Engine | Memory budget peak ≤ 150 MB (Formula 4) | ADR-0001 | ⚠️ |
| TR-chess-engine-007 | chess-engine-integration | Chess Engine | CSP: `script-src 'wasm-unsafe-eval'; worker-src 'self' blob:` | ADR-0008 | ✅ |
| TR-chess-engine-008 | chess-engine-integration | Chess Engine | EngineUnavailableError → degrade to two-human local play | ADR-0002 | ✅ |
| TR-chess-engine-009 | chess-engine-integration | Chess Engine | iOS visibility: liveness ping on resume, respawn if dead | ADR-0002 | ⚠️ |
| TR-opening-id-001 | opening-identification | Opening ID | EPD-keyed Map, built at compile time | ADR-0003 | ✅ |
| TR-opening-id-002 | opening-identification | Opening ID | Longest-prefix match, O(N) hash lookups only | ADR-0003 | ✅ |
| TR-opening-id-003 | opening-identification | Opening ID | Lookup ≤ 5ms desktop, ≤ 20ms iPhone | ADR-0003 | ✅ |
| TR-opening-id-004 | opening-identification | Opening ID | Index ≤ 150 KB gzipped, ≤ 1 MB resident | ADR-0003 | ✅ |
| TR-nav-routing-001 | navigation-and-routing | Nav & Routing | Vue Router HTML5 history (createWebHistory) | ADR-0004 | ✅ |
| TR-nav-routing-002 | navigation-and-routing | Nav & Routing | In-game guard: beforeRouteLeave + isGameInProgress | ADR-0005 | ✅ |
| TR-nav-routing-003 | navigation-and-routing | Nav & Routing | window.beforeunload listener for full-page exit | ADR-0004 | ✅ |
| TR-nav-routing-004 | navigation-and-routing | Nav & Routing | Route-level lazy loading (Play + Review deferred) | ADR-0004 | ✅ |
| TR-nav-routing-005 | navigation-and-routing | Nav & Routing | GitHub Pages SPA fallback: 404.html → index.html shim | ADR-0004 | ✅ |
| TR-nav-routing-006 | navigation-and-routing | Nav & Routing | Popstate guard with deterministic history.pushState restore | ADR-0004 | ✅ |
| TR-game-lifecycle-001 | game-lifecycle | Game Lifecycle | chess.js sole authoritative state | ADR-0005 | ✅ |
| TR-game-lifecycle-002 | game-lifecycle | Game Lifecycle | 5-priority terminal detection (checkmate→50-move) | ADR-0005 | ✅ |
| TR-game-lifecycle-003 | game-lifecycle | Game Lifecycle | CompletedGame in Pinia gameStore as canonical transport | ADR-0005 | ✅ |
| TR-game-lifecycle-004 | game-lifecycle | Game Lifecycle | isGameInProgress = false BEFORE router.push('/review') | ADR-0005 | ✅ |
| TR-game-lifecycle-005 | game-lifecycle | Game Lifecycle | playerMoveTimes[]: indexed against player moves only | ADR-0005 | ✅ |
| TR-move-annotation-001 | move-annotation-display | Move Annotation | Declarative annotations prop (no imperative API) | ADR-0006 | ✅ |
| TR-move-annotation-002 | move-annotation-display | Move Annotation | SVG overlay via boardRef + squareToRect (no own geometry) | ADR-0006 | ✅ |
| TR-move-annotation-003 | move-annotation-display | Move Annotation | Neutral role semantics, no emotive labels in rendering | ADR-0006 | ✅ |
| TR-move-annotation-004 | move-annotation-display | Move Annotation | Eval bar: F1 fillRatio + sign normalisation to White | ADR-0006 | ✅ |
| TR-move-annotation-005 | move-annotation-display | Move Annotation | rAF-coalesced resize throttle (Formula 4) | ADR-0006 | ✅ |
| TR-post-game-review-001 | post-game-review | Post-Game Review | Two-pass analysis: preview d12 → deep d22 | ADR-0007 | ⚠️ |
| TR-post-game-review-002 | post-game-review | Post-Game Review | F2 cpLoss = max(0, E[i] + E[i+1]) (side-to-move) | ADR-0007 | ✅ |
| TR-post-game-review-003 | post-game-review | Post-Game Review | biggestSwingCursor computed once at COMPLETE | ADR-0007 | ✅ |
| TR-post-game-review-004 | post-game-review | Post-Game Review | Depth-comparability guard (DEPTH_MISMATCH_TOLERANCE) | ADR-0007 | ✅ |
| TR-post-game-review-005 | post-game-review | Post-Game Review | sessionStorage: pv stripped, throttled, key `pgr:analysis:<gameId>` | ADR-0007 | ✅ |
| TR-post-game-review-006 | post-game-review | Post-Game Review | Mobile calm default (<768px): best-move arrow only | ADR-0007 | ✅ |
| TR-post-game-review-007 | post-game-review | Post-Game Review | REVIEW_TOTAL_TIME_BUDGET_MS = 90s hard ceiling on Pass 2 | ADR-0007 | ✅ |
| TR-game-export-001 | game-export-share | Game Export | PGN serialisation via chess.js (round-trip valid) | ADR-0010 | ✅ |
| TR-game-export-002 | game-export-share | Game Export | Tier-1/2/3 delivery (Web Share → Clipboard → textarea) | ADR-0010 | ✅ |
| TR-game-export-003 | game-export-share | Game Export | Clipboard write synchronous in tap gesture (iOS UA) | ADR-0010 | ✅ |
| TR-game-export-004 | game-export-share | Game Export | Claude.ai prompt template: deterministic sync assembly | ADR-0010 | ✅ |

---

## Known Gaps

**None.** All v0 TRs covered by an ADR.

### Partial — Spike-Pending (unchanged from 2026-05-28)

- **TR-chess-engine-006** — NNUE RSS ~80 MB estimate awaits ADR-0001 Validation Criterion 2 (iPhone device test).
- **TR-chess-engine-009** — Proactive WASM-OOM detection deferred to post-v0.
- **TR-post-game-review-001** — `REVIEW_TARGET_DEPTH = 22` provisional pending ADR-0007 OQ-5 iPhone spike.

### ADR Documentation Conflict (not a TR gap)

- ~~**C1 — ADR-0006 ↔ ADR-0009**~~ — **RESOLVED 2026-05-29**: ADR-0006 Decision §2 patched to describe `squareToRect()` as **board-local** per ADR-0009 §4 (authoritative contract). Doc-drift correction note added inline.

---

## Superseded Requirements

None.

## History

| Date | Coverage % | Notes |
|---|---|---|
| 2026-05-28 | 32 ✅ + 4 ⚠️ + 11 ❌ (47) | Initial index. ADR-0001..0008 all Proposed. |
| 2026-05-29 | 43 ✅ + 3 ⚠️ + 0 ❌ (47) | ADR-0009 + ADR-0010 written; 11 gaps closed; TR-game-export-003 promoted ⚠️→✅. ADR-0006 doc-text drift flagged (C1). |
