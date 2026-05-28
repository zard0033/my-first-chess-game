# Architecture Review Report — 2026-05-28

| Field | Value |
|---|---|
| **Mode** | `/architecture-review full` |
| **Stack** | Vue 3 + TypeScript 5 web app (no traditional game engine) |
| **GDDs Reviewed** | 8 v0 (chess-board, chess-engine-integration, opening-identification, navigation-and-routing, game-lifecycle, move-annotation-display, post-game-review, game-export-share) |
| **ADRs Reviewed** | 8 (ADR-0001..0008, all status `Proposed`) |
| **Verdict** | **CONCERNS** |

---

## Traceability Summary

| Metric | Count |
|---|---|
| Total technical requirements | **47** |
| ✅ Covered (with ⚠️ partials counted as covered) | 36 |
| ⚠️ Partial (covered but pending spike) | 4 |
| ❌ Gap (no ADR) | 11 |

> Note: `architecture.md` v1.0 header states "44 requirements / 36 covered / 8 ADR-TBD" — the matrix actually contains 47 rows with 11 gaps. The 8 figure undercounts game-export TR-001..003 (only listed TR-game-export-004). Recommend updating architecture.md header to match.

### ⚠️ Partial Coverage

| TR | ADR | Reason |
|---|---|---|
| TR-chess-engine-006 | ADR-0001 | Memory budget (Formula 4 / 145MB) covered, but NNUE RSS ~80MB estimate unvalidated until iPhone spike (Validation Criterion 2). |
| TR-chess-engine-009 | ADR-0002 | iOS visibility liveness covered in Decision §6; proactive WASM-OOM detection explicitly deferred to post-v0. |
| TR-post-game-review-001 | ADR-0007 | Two-pass loop fully covered; `REVIEW_TARGET_DEPTH = 22` provisional pending OQ-5 iPhone spike. |
| TR-game-export-003 | (none) | iOS user-activation invariant documented in architecture.md GameExport Module Ownership, but no ADR formalizes the sync-gesture contract. |

### ❌ Coverage Gaps (no ADR exists)

| TR | System | Suggested ADR |
|---|---|---|
| TR-chess-board-001..007 | Chess Board | **ADR-0009 "Chess Board substrate + vue3-chessboard integration + custom roving-tabindex keyboard model"** — Domain: UI substrate · Engine Risk: 🟡 (chessground 9.x keyboard nav extensibility) |
| TR-game-export-001..004 | Game Export | **ADR-0010 "Game Export Tier-1/2/3 delivery + sync-gesture clipboard contract"** — Domain: Browser API integration · Engine Risk: 🟡 (iOS user-activation gesture semantics) |

---

## Cross-ADR Conflicts

🟢 **None blocking.** Pairwise compared across data ownership, integration contracts, performance budgets, dependency cycles, communication patterns, state authority. Findings:

### Verified Clean Pairs

| Concern | ADRs | Status |
|---|---|---|
| Worker co-residency (Play idle before Review init) | 0001 ↔ 0002 | ✅ Aligned |
| Disarm-before-navigate ordering | 0004 ↔ 0005 | ✅ Aligned |
| chess.js state authority (GameLifecycle owns) | 0005 vs 0003, 0007 (local-replay only) | ✅ No double ownership |
| Eval sign convention (side-to-move → Annotation normalises to White) | 0002 → 0007 → 0006 | ✅ Aligned chain |
| Memory budget (HCE 25 + NNUE 80 + App 40 = 145 ≤ 150) | 0001 + 0002 + 0007 | ✅ Within ceiling (5 MB margin acknowledged) |
| Frame budget (rAF coalescing, shallowRef+freeze) | 0005 + 0006 + 0007 | ✅ Non-competing |
| No SharedArrayBuffer constraint | 0001 + 0002 + 0008 | ✅ Mutually reinforcing |

### 🟡 Minor: GameExport sync-gesture contract under-specified at ADR layer

- Architecture.md GameExport Module Ownership states the payload assembler must be a pure synchronous function (no async boundary before clipboard write), but no ADR formalises this.
- **Impact**: If MVP `GameHistory` later returns `Promise<CompletedGame>` from Supabase, the sync invariant breaks silently — TypeScript will not catch it without an explicit contract.
- **Resolution**: Author ADR-0010 (see Gaps) — codify the synchronous-payload-assembler interface.

---

## ADR Dependency Order (topological)

```
Tier 0 (no deps):          ADR-0001   ADR-0003   ADR-0004   ADR-0006
Tier 1 (after Tier 0):     ADR-0002 ← ADR-0001
                           ADR-0005 ← ADR-0004
Tier 2 (after Tier 1):     ADR-0008 ← ADR-0001, ADR-0002, ADR-0004
                           ADR-0007 ← ADR-0002, ADR-0003, ADR-0005
```

**Cycles**: none.

**Unresolved deps**: every "Depends On" entry currently points at an ADR with status `Proposed`. Per `docs/CLAUDE.md` ("Stories referencing a Proposed ADR are auto-blocked"), **no implementation story can enter a sprint until each chain root advances to Accepted**.

**Critical path**: ADR-0001 HCE availability spike unblocks ADR-0002 → ADR-0007 + ADR-0008. Single highest-leverage action.

---

## GDD ↔ ADR Consistency

✅ **Zero drift across all 8 ADRs.** Each ADR Decision section anchors to verbatim GDD rules/ACs/edge-cases. Verified Decision-section excerpts (Core Rules, Formulas, Edge Cases, Open Questions) match GDD source text exactly.

---

## Engine Compatibility

✅ **All checks clean.**

- **Stockfish 16.1 (lichess fork)** pinned consistently across ADR-0001 (authoritative pin), ADR-0002 (references "ADR-0001 establishes the WASM build files"), ADR-0007 (review engine), ADR-0008 (HCE + NNUE per ADR-0001). No version drift.
- **Vue 3.x · TypeScript 5 · Pinia 2.x · Vue Router 4.x · Vite 5.x · chess.js (bundled) · chessground 9.x**: consistent across all ADRs.
- **chessground 9.x limitations**: architecture.md flags two gaps (no built-in keyboard nav; arrowheads always centred). No ADR contradicts — ADR-0006 explicitly avoids `drawable` arrowhead-edge use; no ADR yet for keyboard nav (covered by ADR-0009 gap above).
- **No deprecated APIs** referenced.
- **No traditional game engine**: `docs/engine-reference/godot/` template explicitly waived per architecture.md and confirmed in every ADR's Engine Compatibility section.

### GDD Revision Flags

None — no engine-reality contradictions exist (no engine).

---

## Architecture Document Coverage

✅ **All 8 v0 systems present** in `architecture.md` System Layer Map (Foundation: ChessBoard, ChessEngine, OpeningIndex, AppRouter · Core: GameLifecycle, MoveAnnotationDisplay · Feature: PostGameReview, GameExport).

✅ **Data flow §1–§5** covers all cross-system communication declared in GDD `Interactions with Other Systems` tables.

✅ **No orphan architecture** — module ownership maps 1-to-1 to v0 GDDs; MVP/Polish systems correctly listed as future-tier with no claimed GDDs.

---

## Verdict: **CONCERNS**

**Not PASS** because:
- 11 TRs are ADR-TBD (chess-board 7, game-export 4)
- All 8 existing ADRs still `Proposed` (stories auto-blocked per `docs/CLAUDE.md`)
- ADR-0001 HCE spike unresolved (TD sign-off conditioned v0 coding on this)

**Not FAIL** because:
- No cross-ADR conflicts
- No dependency cycles
- No GDD drift
- No engine-compat issues
- Architecture document internally consistent and complete for what it covers

---

## Blocking Issues (must resolve before PASS / pre-production gate)

1. 🔴 **ADR-0001 HCE availability spike** — TD sign-off explicit condition.
2. 🔴 **ADR-0009 missing** (Chess Board) — 7 TRs uncovered.
3. 🔴 **ADR-0010 missing** (Game Export) — 4 TRs uncovered.
4. 🔴 **`tr-registry.yaml` empty** — needs all 47 TR-IDs populated for stories.
5. 🔴 **architecture.md header counts off** — change "44 requirements / 36 covered / 8 ADR-TBD" to "47 / 36 / 11" in `## Document Status` table.

## Required ADRs (priority order)

1. **ADR-0009 Chess Board substrate + keyboard model** (Foundation, blocks chess-board stories)
2. **ADR-0010 Game Export Tier delivery + sync-gesture contract** (Feature, blocks game-export stories)
3. ADR-0009 (existing — deferred MVP) renumber → ADR-0011 if author MVP Supabase ADR

## Recommended Spike Schedule

| Spike | Blocks | Target |
|---|---|---|
| HCE availability (ADR-0001 V.C.1) | All v0 implementation | 🔴 Highest priority |
| iPhone Safari depth-22 (ADR-0007 OQ-5) | Review perf sign-off | Schedule with HCE — same device session |
| chessground `drawable` (ADR-0006) | MoveAnnotation impl | 1-day code check |
| en passant EPD (ADR-0003) | Opening index build | Code check + test |
| iOS Safari CSP meta (ADR-0008) | Production deploy | Before first GH Pages deploy |

---

## Pre-Gate Checklist (for `/gate-check pre-production`)

| Item | Status | Action |
|---|---|---|
| `tests/unit/` and `tests/integration/` | ❌ missing | Run `/test-setup` |
| `.github/workflows/tests.yml` | ❌ missing | Run `/test-setup` |
| `design/accessibility-requirements.md` | ❌ missing | Run `/ux-design` |
| `design/ux/interaction-patterns.md` | ❌ missing | Run `/ux-design` |

---

*Review authored: 2026-05-28*
*Re-run `/architecture-review` after each new ADR or spike resolution to verify coverage improves.*
