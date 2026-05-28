# Cross-GDD Review Report

**Date:** 2026-05-28
**GDDs Reviewed:** 8 v0 systems (+ game-concept, systems-index)
**Systems Covered:** Chess Board & Move System, Chess Engine Integration, Opening Identification, Navigation & Routing, Game Lifecycle, Move Annotation Display, Post-Game Review, Game Export / Share
**Method:** full mode — three parallel passes (cross-GDD consistency 2a–2f, game-design holism 3a–3g, cross-system scenario walkthrough 4a–4c)
**Registry:** `design/registry/entities.yaml` is empty (template only) — consistency relied on full reads. Run `/consistency-check` afterward to populate it.

> Every GDD is internally consistent. **All defects live at the boundaries between documents** — exactly what per-GDD review cannot catch. Findings converged across passes, raising confidence.

---

## Consistency Issues

### 🔴 Blocking

**B1 — `CompletedGame` contract broken at the play→review handoff** (consistency + scenario, converged) *(RESOLVED in-session)*
- **Shape:** `game-lifecycle.md` Rule 7 / AC-15 emit `CompletedGame` with exactly `{moves, playerColor, result, endReason, completedAt, aiSkillLevel, isTerminal}` — **no `playerMoveTimes`**. `post-game-review.md` (Dependencies, Interactions, F3, EC-10, AC-22) dereferences `completedGame.playerMoveTimes.length`. The EC-10 guard handles a *short* array, not a *missing* one → `undefined.length` throws. Game Lifecycle Rule 9 stores thinking times "alongside `moves[]`" and passes them "when requested" — a separate channel, not a field.
- **Transport:** three docs name three channels — Game Lifecycle "route entry payload + `game-completed` event"; Post-Game Review "route entry payload"; Navigation reads **the store** (`hasFinishedGameInStore`) and redirects to `/` if empty. Vue Router (history mode) does not carry object payloads → building to the "route payload" wording makes Navigation bounce the player back to Home on the Review tap.
- **Decision applied:** (a) `playerMoveTimes` added as a first-class `CompletedGame` field; AC-15 updated; Lifecycle Rule 9 reworded ("emit as field of CompletedGame, not sibling channel"). **Transport** standardized on the Pinia game store as the source of truth — Game Lifecycle Rule 7 writes `CompletedGame` to the store on terminal; Navigation guard and Post-Game Review both read from there; `game-completed` event kept for fire-and-forget consumers. AC-20 + Post-Game Review Rule 2 / Interactions / Dependencies all updated to reference the store.

**B2 — `endReason` / `result` enum mismatch (Export ⟷ Game Lifecycle)** *(RESOLVED in-session)*
`game-export-share.md`'s `CompletedGame` requires `endReason ∈ {…, draw-agreement, abandoned}` and `result ∈ {…, '*'}`, with live `RESULT_PLAIN`/`Termination` rows and an AC for `endReason:"abandoned"` + `result:"*"`. `game-lifecycle.md` Rule 7 never emits `draw-agreement`/`abandoned` in v0 and `result` has no `*`. Export ACs test states the producer cannot produce.
- **Decision applied:** (a) Export's preamble + `CompletedGame` interface now mark `draw-agreement`, `abandoned`, and `result: '*'` as **defensive-only (Phase 2 / not v0-reachable)**; the v0-emitted set (6 endReasons + 3 result tokens) is stated as the contractual subset. RESULT_PLAIN / Termination tables kept intact for Phase-2 readiness. "NOT YET DESIGNED" framing on Game Lifecycle removed.

**B3 — Stale move-classification labels in 4 GDDs** *(fixed in this session — mechanical)*
Post-Game Review removed the "best/good/inaccuracy/mistake/blunder" ladder in round-2, but `chess-engine-integration.md` (Cross-system notes, Bidirectional notes, OQ#2), `opening-identification.md`, and `move-annotation-display.md` still attribute that ladder to Post-Game Review. Engine behavior is unaffected (still returns raw `evalCp`/`evalMate`) — the ownership *prose* misdescribes the system. **Resolution applied:** prose updated to "neutral cpLoss / pawn-swing display (no classification ladder)."

**B4 — No owner for `ucinewgame` / handshake on the review engine** *(fixed in this session — mechanical)*
The review worker is lazy-loaded (separate NNUE). Post-Game Review's loop called `analyze()` with no `ucinewgame` at loop start → stale transposition-table state leaks between consecutive games' reviews; first-load latency excluded from the time budget. **Resolution applied:** `reviewEngine.analyze()` wrapper sends `ucinewgame` when the `gameId` changes (engine GDD); Post-Game Review notes first-load latency in the progress UI.

**B5 — Beginner attention overload on the review screen** (design-theory) *(RESOLVED in-session)*
The v0 payoff screen renders 9 elements / 5 systems at once on 390px — three arrow roles (the GDD admits "a beginner cannot decode three arrow types unaided"), eval bar, signed pawn number, `~` preliminary marker, opening-theory term. Highest risk of making the target user feel graded/overwhelmed — opposite of the "reading a map, not a report card" fantasy.
- **Decision applied:** (a) **calm default** specified as a binding new Visual Requirements subsection — on viewports < 768 px the default render is: best-move arrow only (no played-move arrow), eval bar off (badge only, with mate as `M±n` text), no preliminary `~` chips, biggest-swing anchor still shown; opt-in "Show detail" toggle reveals the rest. Desktop default keeps the full surface. The downstream UX spec inherits this as a hard contract.

**B6 — `normalize()` undefined** *(fixed in this session — mechanical)*
Post-Game Review compares `normalize(moves[i]) === normalize(bestMove)` (4×) but never defined it; blocked AC-6/AC-7 testability. Both operands are UCI. **Resolution applied:** defined as lowercase-UCI string compare.

### ⚠️ Warnings

- **W1 — `isGameInProgress` + disarm-before-navigate not acknowledged in Game Lifecycle** (converged) *(fixed)*: Navigation requires Game Lifecycle to expose `isGameInProgress=false` before the Play→Review push; Game Lifecycle never mentioned the flag or the ordering → false "Leave this game?" dialog on every Review tap. **Resolution applied:** Game Lifecycle now declares the flag, the `phase`→flag mapping, and honors disarm-before-navigate.
- **W2 — "Confirming arrow" three-way contradiction** (design) *(fixed)*: Post-Game Review Rule 20 (reuse best-move color) vs its Visual Requirements (distinct green) vs Move Annotation Display (no confirming role). Green="correct" is reward-hue drift against the no-judgment pillar. **Resolution applied:** adopted Rule 20 — confirming case reuses best-move color, green role deleted, AC-6/AC-7 reworded; Move Annotation role enum untouched.
- **W3 — `sideToMove` provenance undocumented** (converged) *(fixed)*: Move Annotation needs `sideToMove`; the engine result doesn't carry it. **Resolution applied:** Post-Game Review now states `sideToMove` is derived from the FEN/cursor parity at position `i`, not from the engine result.
- **W4 — Both engines resident**: play engine never disposed; play(25)+review(80)+app(40) ≈ 145MB, worst case 185MB (Jetsam risk). No system owns freeing the play engine during review. → folds into OQ-5 memory spike; needs a decision on disposal.
- **W5 — Export `openingName` vs `OpeningResult.name`** field-name mismatch (soft dep) — align Export to `name`/`eco` or document an adapter.
- **W6 — Skill-0 resign-wins**: low-skill Stockfish `bestmove 0000` gives unearned wins flowing into Export wording and later Skill Scoring. → set a v0 default skill floor; flag for MVP Difficulty GDD.
- **W7 — Pass-2 "Refining… X/N"** advertises a wait up to 90s → consider hiding after Pass 1.
- **W8 — systems-index progress tracker** rows ("MVP 8/14", "Polish 8/17") read as misleading — relabel as cumulative or fix to 0/6, 0/3.

---

## Game Design Issues

- **Blocking:** B5 (review-screen overload) — see above.
- **Warning — competing emotional anchors:** Game Lifecycle (result overlay), Post-Game Review (biggest swing), and Export→Claude (natural-language coaching) each claim an "anchor moment." Decide consciously whether the v0 hero is in-app Review or the Claude export hop, and subordinate the other.
- **Clean passes:** progression-loop (one coherent play→review loop), dominant-strategy (none; only the Skill-0 resign edge W6), difficulty-curve (correctly deferred to MVP), pillar-alignment (all 8 systems map to a pillar; no multiplayer/social/competition drift), fantasy-coherence (judgment-label removal consistent across Engine/MAD/Opening-ID/Lifecycle/Export — except the green confirming arrow, W2).

---

## Cross-System Scenario Issues

Scenarios walked: (1) player moves mid-game; (2) game-end → Review handoff; (3) Review analysis loop; (4) abort review mid-analysis; (5) export a just-finished game.

- **🔴 Blocker:** B1 (CompletedGame shape/transport), B4 (ucinewgame ownership) — see above.
- **⚠️ Warning:** W1 (isGameInProgress/disarm), W3 (sideToMove), W4 (both engines resident), W6 (Skill-0 resign), plus illegal-`moves[]` degradation handled three different ways across Opening ID / Export / Review (acceptable under "validated upstream", reconcile later).
- **ℹ️ Info:** endReason over-build in Export (B2); 0-based-cursor vs 1-based-ply boundary (correctly reconciled in Review F5 — add a test fixture); concurrency AC guards a path v0 UX never exposes (isolation is sound).

---

## GDDs Flagged for Revision

| GDD | Reason | Type | Priority | Status this session |
|-----|--------|------|----------|---------------------|
| game-lifecycle.md | CompletedGame shape/transport (B1), isGameInProgress (W1), stale "not yet designed" refs | Consistency | Blocking | **all fixed** |
| game-export-share.md | stale "Lifecycle not designed", endReason/result enum (B2), openingName (W5) | Consistency | Blocking | **B2 fixed**; W5 (openingName) tracked |
| chess-engine-integration.md | stale classification labels (B3), ucinewgame ownership (B4) | Consistency | Blocking | **B3 + B4 fixed** |
| opening-identification.md | stale classification labels (B3) | Consistency | Blocking | **B3 fixed** |
| move-annotation-display.md | stale classification labels (B3), confirming-arrow role (W2) | Consistency | Blocking | **B3 + W2 fixed** |
| post-game-review.md | normalize() (B6), sideToMove (W3), confirming-arrow color (W2), beginner overload (B5) | Consistency · Design | Blocking | **all fixed** (B5 added the calm-default subsection) |

---

## Verdict: FAIL → eligible for **PASS** after re-run

**All 6 blocking issues and the 3 converged warnings (W1/W2/W3) were resolved in-session** across game-lifecycle, game-export-share, chess-engine-integration, opening-identification, move-annotation-display, and post-game-review. The gate to `/create-architecture` is now functionally clear — but the verdict on this report remains FAIL until a confirming pass (re-run `/review-all-gdds` or, lighter, `/consistency-check`) verifies the alignment held.

### Remaining tracked follow-ups (non-blocking)
- **W4** — both engines resident memory (≈145–185 MB worst case) → folds into the existing OQ-5 device spike for measurement; needs a dispose-play-engine decision.
- **W5** — Export `openingName` vs `OpeningResult.name` field-name mismatch (soft dep) → align Export to `name`/`eco` or document an adapter at the boundary.
- **W6** — Skill-0 resign-wins → set a v0 default skill floor; flag for MVP Difficulty GDD.
- **W7** — Pass-2 "Refining… X/N" progress visibility → consider hiding after Pass 1 (UX spec call).
- **W8** — systems-index Progress Tracker rows are misleading ("MVP 8/14") → relabel as cumulative.
- **Registry** — `design/registry/entities.yaml` is empty; run `/consistency-check` to populate it.
