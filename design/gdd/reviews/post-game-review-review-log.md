# Review Log: Post-Game Review

---

## Review — 2026-05-28 — Verdict: NEEDS REVISION (round-2; 3 blockers resolved in-session)

**Scope signal:** L
**Depth:** full (5 adversarial specialist agents + creative-director synthesis)
**Specialists:** game-designer, systems-designer, qa-lead, performance-analyst, ux-designer, creative-director
**Blocking items:** 3 (all resolved in-session) | **Recommended:** ~8 (cheap ones folded in; rest tracked below) | **Nice-to-have:** several
**Prior verdict resolved:** Round-1 MAJOR REVISION NEEDED → round-2 re-review. AC-9 off-by-one confirmed fixed (math correct; systems-designer flagged then retracted). AC-1 wall-clock confirmed removed. F2 core addition re-ratified.

**Three blockers (creative-director gated), all fixed:**
1. **Anchor moved while the player read it** (game-designer B1 + systems-designer F4 + ux-designer R2 + performance-analyst R1 — 4-way convergence). Biggest-swing marker recomputed during the ≤90 s deep pass and could relocate under the player's finger; pairwise depth guard (22a) didn't protect the *global* ranking, so a budget-cut game could rank a preview artifact as the anchor. → **Rules 30–32 rewritten**: anchor computed once at COMPLETE, ranked only among deep-pass pairs (preview fallback flagged preliminary), lowest-index tiebreak, marker/tag/jump-button hidden during ANALYZING. AC-24 rewritten for COMPLETE + stability + unique-max fixture.
2. **Magnitude word-ladder = report-card relabeled** (game-designer B2). "Minimal/Minor/Moderate/Major" on every move reintroduced the per-move grade the ethos bans; "Major (−4.1)" = "Blunder" in disguise. → **F2 labels table replaced**: chip shows the pawn number alone; a single "Biggest swing" tag only on the anchor; mate transitions keep F2b labels. (Also resolved game-designer R3 — hardcoded thresholds gone.)
3. **Two correctness defects** (systems-designer F1 + F2). F1: Rule 11 claimed `analyze()` returns `pass`, but the engine GDD + this GDD's dep table don't — the store owns `pass`. F2: F2b had no stated precedence over the F2 number and no double-mate tiebreaker → "Major (600.0)" (the round-1 "60000 cp" bug) could resurface. → **Rule 11 reworded** (store stamps `pass`); **Rule 22 rebuilt as an ordered precedence ladder** (null → terminal/EC-8 → mate/F2b → depth-guard/22a → number), tie resolves to "Missed forced mate."

**Cheap advisory folded in this pass:** F4 `evalMate===0` branch; Rule 25 cursor↔ply identity sentence (AC-9 nit); Performance Notes memory clarification (markRaw = CPU win; stockfish.wasm Hash is the real consumer); EC-3 throttled-write cadence; OQ-5 expanded (memory measurement + Hash knob; blocks finalization not implementation); Rule 9 / knob text corrected to "≤1.5 s/position"; UX layout sketch corrected (jump button + legend restored); AC-17 per-pass depth assertion; new AC-27 (zero-move), AC-28 (in-book suppression), AC-29 (Pass-2 resume branch), AC-30 (whole-review error state + Retry). **`technical-preferences.md` "≤5s" line fixed to "per position."**

**Tracked follow-ups (NOT blocking; ship under 2-round cap):**
- **OQ-5 device spike** (iPhone Safari) must run before implementation *finalization*: confirm `REVIEW_TARGET_DEPTH` reachability + measure peak memory + pin stockfish.wasm Hash size. Store/UI implementation may proceed against the provisional default.
- **Pass-1 wall-time** is still uncapped by design ("complete preview guaranteed"); worst case ~1.5N s. Wording now honest; whether to add a Pass-1 sub-budget is a deferred design tradeoff.
- **UX spec** `design/ux/post-game-review.md` still unwritten (directory absent). Downstream `/ux-design` → `/ux-review` gate before `/team-ui`: must prove the 9-element 390 px layout, arrow-count/overlap rule, legend-vs-coachmark decision, and eval-bar 4-state distinguishability (incl. mate-vs-strong-eval ambiguity) on-device.
- **ux R3** two-pass progress double-count ("Analyzing…0/N" → "Refining…0/N") microcopy; **qa** EC-3 QuotaExceeded write-path AC, Rule 12 "Refining…" label AC, Rule 18 scrub-while-analyzing AC, cold-start resume messaging — for the QA test plan.

Per the 2-round cap: blockers resolved → eligible for APPROVED without a round 3 (pending Eason's accept / re-review choice).

---

## Review — 2026-05-28 — Verdict: MAJOR REVISION NEEDED (round-1 revision applied in-session)

**Scope signal:** L
**Depth:** full (5 adversarial specialist agents + creative-director synthesis)
**Specialists:** game-designer, systems-designer, qa-lead, performance-analyst, ux-designer, creative-director
**Blocking items:** 7 (all addressed in round-1 revision) | **Recommended:** ~8 (addressed/folded) | **Nice-to-have:** several
**Prior verdict resolved:** First real review — index status was "Designed" with no prior review log; this was effectively the document's first adversarial scrutiny.

**Key findings (specialist convergence):**
1. **Anchor moment had no mechanic + landed on depth artifacts** (game-designer + ux + systems + performance) — button-only nav buried the Player Fantasy's headline moment; F2 pairing of two `analyze()` calls at possibly different depths (EC-11) fabricated phantom swings.
2. **Labels violated the no-judgment ethos** (game-designer + creative-director) — "Mistake"/"Blunder" contradicted the GDD's own "no Blunder! badges" exclusion.
3. **F2 + F4 mate boundary produced absurd numbers** (systems-designer) — "Blunder (29200 cp)", "60000 cp"; lost/mating positions shown as "best".
4. **Centipawns illegible to beginners** (game-designer + ux) — OQ-4 shipped the known-risky unit.
5. **AC-9 off-by-one** (unanimous) — `Math.ceil((bookExitPly+1)/2)` contradicted F5/Rule 25; F5 correct.
6. **Performance budget unreconciled** (performance-analyst) — "≤5s/review" vs engine GDD's "8 min"; no total-time cap; OQ-2 two-pass needed in v0; depth 22 likely unreachable on iPhone.
7. **QA coverage gaps** (qa-lead) — no ACs for EC-8, Rule 22 pending, COMPLETE-but-null; AC-1 non-deterministic; AC-14 underspecified.

**Disagreement (resolved):** systems-designer initially flagged then *validated* the core F2 addition — arithmetically sound for equal-depth, non-mate, exact evals. Net: F2 math approved; F2 boundary handling rejected. Core formula NOT rewritten.

**Round-1 revision applied (Eason approved all 4 design decisions, 2026-05-28):**
- Labels → neutral magnitude words (Minimal/Minor/Moderate/Major change); "Mistake"/"Blunder" removed (F2 labels table).
- cpLoss unit → pawns primary ("−0.7"), cp secondary on tap (resolves OQ-4).
- Anchor → biggest-swing peak marker + "Jump to biggest swing" button into v0 (Rules 30–32, OQ-1 partially resolved).
- Analysis → two-pass (preview depth-12 → deep depth-22) into v0 + depth-comparability guard (Group 3 rewrite, Rule 22a, OQ-2 resolved).
- AC-9 corrected to `Math.ceil(bookExitPly/2)`; AC-1 → call-ordering (deterministic); AC-14 → sessionStorage schema/key specified.
- F2b mate-transition display labels added (no cp number for mate swings).
- Rule 22 rewritten: chip omission keyed on move equality (not cpLoss=0); preview/preliminary state added.
- Added ACs AC-19..AC-26 (terminal/EC-8, COMPLETE-but-null, sessionStorage fallback, EC-10 guard, chip-omission, biggest-swing/jump, depth-guard preliminary, total-time budget).
- EC-3 size guard + QuotaExceeded catch; EC-10/EC-11 reframed; Performance Notes section added (budget reconciliation, markRaw, fps batching); Pillar 2 demoted from "primary" to "prepares for"; Player Fantasy item 2 rescoped to single-game.
- New tuning knobs: REVIEW_PREVIEW_DEPTH, REVIEW_PREVIEW_MOVE_TIME_MS, REVIEW_TOTAL_TIME_BUDGET_MS, DEPTH_MISMATCH_TOLERANCE.

**Open before Approved:** Re-review required (round 2). OQ-5 added — iPhone Safari depth-reachability spike (engine GDD OQ#6/OQ-7) must run before implementation to confirm `REVIEW_TARGET_DEPTH` default. UX spec `design/ux/post-game-review.md` still unwritten (mobile 390px layout + arrow legend/CVD must be proven on-device). Action item outside this GDD: clarify technical-preferences "≤5s" wording to "per position".
