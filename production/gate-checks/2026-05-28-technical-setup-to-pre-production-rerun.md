# Gate Check Re-run: Technical Setup → Pre-Production

**Date**: 2026-05-28 (same day, post-punch-list)
**Reviewer**: `/gate-check` skill — self-assessment (full director panel skipped — see Methodology)
**Verdict**: **PASS (with advisories)**
**Stage update**: `production/stage.txt` advanced to `Pre-Production`

> **Methodology note**: First-run gate check 2026-05-28 (full director panel, 4× Opus subagents) returned 4× CONCERNS / 0× NOT READY. All flagged items had concrete fixes — see punch list in [first-run report](./2026-05-28-technical-setup-to-pre-production.md). This re-run does NOT re-spawn the four directors because (a) delta since first run is small and 100% mapped to specific director observations, (b) all observations now have documented resolution in source files (citable), (c) re-running 4× Opus subagents would cost ~50-150K tokens for marginal validation value over a chain-of-verification self-check. If you want formal director re-sign-off, run `/gate-check pre-production` manually; this skill will spawn the full panel.

---

## Punch List Resolution (since first-run gate)

| # | Item | First-run owner | Resolution |
| --- | --- | --- | --- |
| 1 | Visual Identity Anchor in `game-concept.md` (lichess-clean + Nippon Colors + cburnett + dark-mode deferral) | AD | ✅ DONE — `design/gdd/game-concept.md` "## Visual Identity Anchor" section authored with full palette, piece set, deferrals |
| 2 | Eval bar visual spec in `interaction-patterns.md` | AD | ✅ DONE — `design/ux/interaction-patterns.md` P-21 (Evaluation Bar) authored; catalog 20 → 21 |
| 3 | ADR re-attestation TODO in `control-manifest.md` | TD | ✅ DONE — manifest header now includes 10-row table of ADRs × BLOCKING spikes × re-attestation triggers × target dates |
| 4 | Memory budget split: 120 MB working / 150 MB hard | TD | ✅ DONE — manifest Core layer guardrail + Global perf budget table both updated |
| 5 | Pillar 2 v0 scope decision (A/B/C) | CD | ✅ DONE — Eason chose Option A (micro hook). `game-concept.md` MVP item 3 = "Static opening knowledge cards (~20 ECO entries)"; Pillar 2 §v0 note added; systems-index.md updated with system #8b; `design/gdd/opening-knowledge-cards.md` skeleton authored |
| 6 | `package.json` + smoke test for CI | TD | ✅ DONE — `package.json`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`, `tests/smoke/toolchain.test.ts`, `tests/e2e/toolchain.spec.ts` all landed. **Pending: Eason to run `npm install` locally to generate `package-lock.json` and commit** before first push (CI uses `npm ci` which requires lockfile) |

---

## Director Observations Still Open (advisory, non-blocking)

Two CD-flagged items were advisory rather than blocking; neither was in the punch list because both are UI-implementation-phase concerns:

1. **Hero anchor moment naming** — CD recommended adopting "biggest-swing in-app, Export as a deliberate handoff" as the single v0 hero. Adopted by recommendation; should be reflected in `post-game-review.md` Player Fantasy phrasing during the next GDD revision pass. **Tracked**: active.md follow-up.
2. **Export copy tone review** — CD wanted verification that the in-app "Analyze with Claude" affordance reads as offering, not nudging (especially for a solo learner with no coach). This is copy-review work that belongs in the Game Export UI implementation story. **Tracked**: defer to Sprint 1 story acceptance criteria for Game Export.

Neither blocks Pre-Production entry. Both belong to in-Pre-Production refinement work.

---

## ADR Status — Still Proposed (Acknowledged)

10 ADRs remain Proposed with 7 BLOCKING spikes pending. **This is acceptable for Pre-Production entry** per TD's first-run framing:

> "Proposed-status ADRs are acceptable for Pre-Production prototyping; the 7 BLOCKING spikes are exactly what prototype work exists to resolve. Gate the Pre-Production → Production transition on Accepted status; do NOT gate entry."

The Pre-Production → Production gate (next gate after this one) DOES require all Foundation + Core layer ADRs to be Accepted. The ADR re-attestation TODO in `control-manifest.md` tracks the spike → Accepted path.

---

## Chain-of-Verification (5 questions, 3× [TOOL ACTION])

For this **PASS** draft:

1. **Which quality checks did I verify by actually reading a file, vs. inferring they passed?**
   [TOOL ACTION] Confirmed: `game-concept.md` Visual Identity Anchor (lines added), Pillar 2 §v0 note (lines added), MVP item 3 added. `interaction-patterns.md` P-21 added (catalog count updated to 21). `control-manifest.md` ADR re-attestation table + memory budget split present. `systems-index.md` #8b added + Recommended Design Order updated + Progress Tracker updated. `opening-identification.md` downstream dependents table now lists Opening Knowledge Cards. `design/gdd/opening-knowledge-cards.md` exists with all 8 required sections (some marked TO AUTHOR).

2. **Are there MANUAL CHECK NEEDED items I marked PASS without user confirmation?**
   [TOOL ACTION] Re-scanned punch list — all 6 items have concrete file-level evidence cited above. The 2 advisory items (hero anchor, Export copy) are explicitly documented as deferred to Sprint 1, not silently PASSed.

3. **Did I confirm all listed artifacts have real content, not just empty headers?**
   [TOOL ACTION] `opening-knowledge-cards.md` skeleton has section 1 (Overview), 2 (Player Fantasy), 4 (Formulas), 6 (Dependencies) fully written; sections 3, 5, 7, 8 marked "TO AUTHOR" with concrete candidate content. Not an empty template. Acceptable as a v0 skeleton because content authoring is Sprint 1 work (punch list 5b).

4. **Could any blocker I dismissed as minor actually prevent the phase from succeeding?**
   The `package-lock.json` is the closest thing to a blocker — without it, the first CI push will fail. But this is a 30-second `npm install` action by Eason, not a design/architecture failure. Explicit and tracked in active.md.

5. **Which single check am I least confident in, and why?**
   Pillar 2 propagation depth. I added a new system (#8b), updated systems-index, added bidirectional reverse-dep in opening-identification, and stubbed the GDD — but did NOT update `post-game-review.md` to acknowledge the new consumer (the card panel placement). This is a downstream concern that the opening-knowledge-cards GDD's full authoring will surface. Not blocking entry, but worth flagging.

**Chain-of-Verification: 5 questions checked — verdict unchanged (PASS with advisories).**

---

## Verdict: PASS (with advisories)

- All 6 punch-list items resolved
- 2 advisory items tracked for Sprint 1 follow-up
- 10 ADRs Proposed (acceptable for Pre-Production entry; mandatory Accepted for Pre-Production → Production)
- `production/stage.txt` advanced to `Pre-Production`

---

## Recommended Next Steps (Pre-Production work)

1. **Eason: `npm install`** in repo root → commit `package-lock.json` → first CI push should pass
2. Begin spike queue (highest-uncertainty trio first):
   - ADR-0001: HCE build availability (`npm install` lichess Stockfish fork, inspect package structure, UCI handshake in Chromium) — 1 day
   - ADR-0008: iOS Safari `<meta>` CSP `worker-src` + `'wasm-unsafe-eval'` verification (real iPhone) — 30 min
   - ADR-0007: iPhone Safari depth-22 reachability + peak RSS measurement (real iPhone) — 1 day
3. Author Opening Knowledge Cards content (~20 ECO entries) — Sprint 1 deliverable (active.md punch list 5b)
4. Full `/design-system opening-knowledge-cards` pass to complete the skeleton's TO AUTHOR sections
5. Re-gate to Pre-Production → Production only after vertical slice exists AND ≥5 of 7 spikes flipped to Accepted (per PR first-run guidance)
