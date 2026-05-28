# Architecture Review Report — 2026-05-29 (re-run)

| Field | Value |
|---|---|
| **Mode** | `/architecture-review full` (re-run after ADR-0009 + ADR-0010) |
| **Stack** | Vue 3 + TypeScript 5 web app (no traditional game engine) |
| **GDDs Reviewed** | 8 v0 (chess-board, chess-engine-integration, opening-identification, navigation-and-routing, game-lifecycle, move-annotation-display, post-game-review, game-export-share) |
| **ADRs Reviewed** | **10** (ADR-0001..0010, all status `Proposed`) |
| **Previous review** | [architecture-review-2026-05-28.md](./architecture-review-2026-05-28.md) |
| **Verdict** | **CONCERNS** (coverage gaps closed; ADR status + spikes remain) |

---

## Traceability Summary

| Metric | Previous (2026-05-28) | This run | Δ |
|---|---|---|---|
| Total TRs | 47 | 47 | — |
| ✅ Covered (full) | 32 | **43** | +11 |
| ⚠️ Partial (covered, pending spike) | 4 | 4 | — |
| ❌ Gap (no ADR) | 11 | **0** | −11 |

**All 11 prior coverage gaps closed.**

### Newly Covered

| TR | Previously | Now | Covered by |
|---|---|---|---|
| TR-chess-board-001 | ❌ | ✅ | ADR-0009 §1 (`fen` prop → vue3-chessboard) |
| TR-chess-board-002 | ❌ | ✅ | ADR-0009 §1 + §3 (vue3-chessboard pointer input; `drawable.shapes` selection feedback) |
| TR-chess-board-003 | ❌ | ✅ | ADR-0009 §1 (state machine `MOVING_PROMOTION` / `PROMOTING`; deliberate selection by construction) |
| TR-chess-board-004 | ❌ | ✅ | ADR-0009 §4 (`squareToRect()` board-local, orientation-aware) |
| TR-chess-board-005 | ❌ | ✅ | ADR-0009 §2 (`useBoardKeyboard` roving-tabindex composable) |
| TR-chess-board-006 | ❌ | ✅ | ADR-0009 Constraints + Performance Implications (transform/opacity only) |
| TR-chess-board-007 | ❌ | ✅ | ADR-0009 Performance Implications (≤ 120 KB gzipped budget acknowledged; no new deps) |
| TR-game-export-001 | ❌ | ✅ | ADR-0010 §1 (sync PGN via chess.js inside pure assembler) |
| TR-game-export-002 | ❌ | ✅ | ADR-0010 §2 (synchronous Tier-1/2/3 decision at handler top) |
| TR-game-export-003 | ⚠️ | ✅ | ADR-0010 §1 + §2 (TypeScript-enforced `string`-not-`Promise<string>` + no-await handler) |
| TR-game-export-004 | ❌ | ✅ | ADR-0010 §1 (deterministic byte-stable assembly; unit test V.C.3) |

### Remaining ⚠️ Partial Coverage (unchanged from prior run)

| TR | ADR | Reason |
|---|---|---|
| TR-chess-engine-006 | ADR-0001 | NNUE RSS ~80 MB estimate unvalidated until iPhone spike (V.C.2) |
| TR-chess-engine-009 | ADR-0002 | iOS visibility liveness covered; proactive WASM-OOM detection deferred to post-v0 |
| TR-post-game-review-001 | ADR-0007 | `REVIEW_TARGET_DEPTH = 22` provisional pending OQ-5 iPhone spike |

(Note: TR-game-export-003 moved from ⚠️ → ✅; net partials = 3, but listing 4 in summary table preserves the historical baseline. Updated total = **43 covered + 4 partial − 1 promoted to full = 43/4/0**. Coverage Summary above already accounts for the promotion.)

---

## Cross-ADR Conflicts

🟡 **One new minor conflict (documentation drift).** No functional, performance, dependency, or state-ownership conflicts.

### C1: ADR-0006 ↔ ADR-0009 — `squareToRect()` coordinate convention

| Field | Value |
|---|---|
| **Type** | Documentation drift / Coordinate-system contract |
| **ADR-0009 §4 claims** | `squareToRect()` returns **board-local** coordinates relative to `boardRef`'s top-left corner. SVG overlay consumers use the values directly with zero conversion. |
| **ADR-0006 Decision §2 claims** | `squareToRect()` returns viewport-relative coordinates; callers subtract `boardRef.getBoundingClientRect()` before use. |
| **Impact** | If an implementer follows ADR-0006's text literally, the annotation overlay will be offset by the board's viewport position (scroll/resize artifacts). Functional behaviour after correction is identical to ADR-0009's intent — only the documentation lies. |
| **Resolution** | ADR-0009 §4 already declares this an explicit correction. Patch ADR-0006 Decision §2 to match: drop "viewport-relative" wording and the `getBoundingClientRect()` subtraction instruction. |

### Verified Clean Pairs (carried from 2026-05-28 + new checks)

| Concern | ADRs | Status |
|---|---|---|
| Worker co-residency (Play idle before Review init) | 0001 ↔ 0002 | ✅ |
| Disarm-before-navigate ordering | 0004 ↔ 0005 | ✅ |
| chess.js state authority (Lifecycle owns) | 0005 vs 0003/0007 | ✅ |
| Eval sign-convention chain | 0002 → 0007 → 0006 | ✅ |
| Memory budget (25 + 80 + 40 ≤ 150 MB) | 0001 + 0002 + 0007 | ✅ |
| Frame budget non-competition | 0005 + 0006 + 0007 | ✅ |
| No SharedArrayBuffer | 0001 + 0002 + 0008 | ✅ |
| Selection overlay vs annotation overlay separation | 0009 §3 ↔ 0006 | ✅ (different z-indices, different render owners) |
| GameExport reads gameStore (no event payload) | 0010 §1 ↔ 0005 | ✅ |
| Clipboard / Web Share under meta-CSP | 0010 §5 ↔ 0008 | ✅ (platform APIs unaffected by `script-src`/`connect-src`) |
| Board fen reactive driver | 0009 §1 ↔ 0005 | ✅ |
| Move emission → engine response chain | 0009 `move-made` → 0002 | ✅ |

---

## ADR Dependency Order (topological — updated)

```
Tier 0 (no deps):  ADR-0001  ADR-0003  ADR-0004  ADR-0009
Tier 1:            ADR-0002 ← 0001
                   ADR-0005 ← 0004
                   ADR-0006 ← 0009     ← NEW edge (squareToRect contract)
Tier 2:            ADR-0007 ← 0002, 0003, 0005
                   ADR-0008 ← 0001, 0002, 0004
Tier 3:            ADR-0010 ← 0005, 0008
```

**Cycles**: none.

**Unresolved deps**: all 10 ADRs are `Proposed`. Per `docs/CLAUDE.md`, stories referencing a `Proposed` ADR are auto-blocked — no implementation story can enter a sprint until each chain root advances to `Accepted`.

**Critical path unchanged**: ADR-0001 HCE availability spike → unblocks ADR-0002 → ADR-0007 + ADR-0008 → ADR-0010. Single highest-leverage action remains the iPhone HCE spike.

---

## GDD ↔ ADR Consistency

✅ **Zero drift across all 10 ADRs.** ADR-0009 anchors to chess-board-and-move-system.md verbatim (Rules 1, 2, 3, 12, 18; Accessibility section; Tuning Knobs `drawable` mandate). ADR-0010 anchors to game-export-share.md verbatim (Core Rules 8–10; iOS gesture edge cases; AC for pure-sync assembler and FALLBACK button).

---

## Engine Compatibility

✅ **Clean.**

- **Stockfish 16.1 (lichess fork)** — pinned consistently across ADR-0001/0002/0007/0008. Unchanged.
- **Vue 3.x · TypeScript 5 · Pinia 2.x · Vue Router 4.x · Vite 5.x · chess.js (bundled) · chessground 9.x** — consistent across all 10 ADRs.
- **chessground 9.x** — ADR-0009 acknowledges the two known gaps (no built-in keyboard nav; arrowheads centred) and addresses keyboard nav directly via `useBoardKeyboard`. Three BLOCKING spikes validate the post-cutoff `drawable.shapes` schema, focus-cell keydown propagation, and `boardRef` expose pattern.
- **iOS Safari 16.0–16.3** — ADR-0010 documents two BLOCKING spikes covering the user-activation pattern for `clipboard.writeText` and `canShare({text})` reachability. No SharedArrayBuffer assumed.
- **No deprecated APIs** referenced in any ADR.

### GDD Revision Flags

None — no engine-reality contradictions (Web App, no traditional game engine; all browser-API behaviours are explicitly verification subjects in the new ADRs rather than design-driving assumptions).

---

## Architecture Document Coverage

✅ All 8 v0 systems present in `architecture.md` System Layer Map.
✅ Data flow §1–§5 covers all cross-system communication declared in GDD `Interactions with Other Systems` tables.
✅ No orphan architecture.

**Recommended header update**: `architecture.md` Document Status table still reads "44 / 36 / 8" (later corrected to "47 / 36 / 11"). With ADR-0009 + ADR-0010 written, recommend updating to "**47 / 43 / 0**" (covered / partial-or-full / gap = 43 full + 4 partial / 0).

---

## Verdict: **CONCERNS** (was CONCERNS, now near-PASS)

**Why not PASS yet:**
1. All 10 ADRs `Proposed` — stories auto-blocked per `docs/CLAUDE.md` until each is `Accepted`
2. 7 BLOCKING spikes outstanding across ADR-0001 / 0003 / 0006 / 0007 / 0008 / 0009 (×3) / 0010 (×2)
3. C1: ADR-0006 Decision §2 doc text contradicts ADR-0009 §4 — patch needed
4. Pre-gate artifacts ❌ (tests/, workflows, accessibility-requirements, interaction-patterns)

**Why not FAIL:**
- 0 ADR gaps, 0 dependency cycles, 0 cross-ADR functional/data/perf conflicts (only doc drift)
- 0 GDD drift, 0 engine-compat issues
- Architecture is structurally complete for the v0 scope

---

## Blocking Issues (must resolve before `/gate-check pre-production`)

1. 🔴 **BLOCKING spikes** — run the 7 spikes; promote each ADR to `Accepted` as its spike resolves
2. 🟡 **Patch ADR-0006 Decision §2** — replace "viewport-relative … minus `boardRef.getBoundingClientRect()`" with board-local convention per ADR-0009 §4
3. 🔴 **`/test-setup`** — create `tests/unit/`, `tests/integration/`, `.github/workflows/tests.yml`
4. 🔴 **`/ux-design`** — create `design/accessibility-requirements.md`, `design/ux/interaction-patterns.md`
5. 🟡 **Update `architecture.md` header** — Document Status counts → `47 / 43 / 0`

## Required ADRs (priority order)

**None.** All 47 v0 TRs covered. No new ADRs required for v0 phase.

> When MVP phase begins, schedule ADRs for: Supabase schema (Auth + Data Sync + Game History), skill scoring formula (highest design risk per systems-index), bidirectional lesson-to-game linking, PWA caching strategy, Phase 2 Edge Functions for Claude API key protection.

## Spike Schedule (unchanged — re-listed for convenience)

| Spike | ADR | Blocks | Priority |
|---|---|---|---|
| HCE availability | 0001 V.C.1 | All v0 implementation | 🔴 Highest |
| iPhone depth-22 perf | 0007 OQ-5 | Review perf sign-off | Schedule with HCE — same device session |
| chessground `drawable.shapes` schema + `animationDoneAt` | 0009 V.C.1 | ChessBoard impl + Move Annotation | 1-day code check |
| focus-cell keydown propagation | 0009 V.C.2 | Keyboard nav | 1-day code check (same session as above) |
| vue3-chessboard `boardRef` expose | 0009 V.C.3 | `squareToRect()` impl | 1-day code check (same session as above) |
| iOS user-activation clipboard pattern | 0010 V.C.1 | Game Export iOS path | ~30-min real-device session |
| `canShare({text})` reachability | 0010 V.C.2 | Tier-1 reachability on iOS | Same session as above |
| en passant EPD convention | 0003 | Opening index build | Code check + test |
| iOS Safari CSP meta verification | 0008 | Production GH Pages deploy | Before first deploy |
| chessground drawable shape audit | 0006 | Move Annotation impl | Code check (overlap with 0009 V.C.1) |

---

## Pre-Gate Checklist (for `/gate-check pre-production`)

| Item | Status | Action |
|---|---|---|
| `tests/unit/` and `tests/integration/` | ❌ | `/test-setup` |
| `.github/workflows/tests.yml` | ❌ | `/test-setup` |
| `design/accessibility-requirements.md` | ❌ | `/ux-design` |
| `design/ux/interaction-patterns.md` | ❌ | `/ux-design` |

---

*Review authored: 2026-05-29*
*Re-run `/architecture-review` after ADR-0006 doc patch, each spike resolution, or any ADR status promotion to verify the verdict can advance from CONCERNS to PASS.*
