# Active Session State

**Last updated**: 2026-05-28 (Sprint 1 execution started)

## Current Task

**Sprint 1 in progress** (2026-05-29 ~ 06-11). Next task: S1-04 ADR-0006 spike.

### Sprint 1 Task Status

| ID | Task | Status |
| --- | --- | --- |
| S1-01 | npm install → package-lock.json | ✅ DONE (already existed) |
| S1-02 | Vite project scaffold | ✅ DONE 2026-05-28 |
| S1-03 | ADR-0003 spike → Accepted | ✅ DONE 2026-05-28 |
| S1-04 | ADR-0006 spike + C1 patch → Accepted | ⬜ next |
| S1-05 | ADR-0009 spikes ×3 → Accepted | ⬜ |
| S1-06 | ADR-0010 spikes ×2 → Accepted | ⬜ |
| S1-07 | ADR-0002 + ADR-0004 + ADR-0005 → Accepted | ⬜ |
| S1-08 | Opening Knowledge Cards GDD (Should Have) | ⬜ |
| S1-09..12 | Component/Router/Store/Engine (Should/Nice) | ⬜ |

### Key findings this session
- `chess-openings@0.1.1` (not 3.x) — version corrected in package.json
- chess.js **strict** ep convention confirmed (ep=`-` when no capture possible)
- chess-openings `ECO.lookupSync(fen)` aligns exactly — **no normalization needed**
- API simpler than ADR assumed: no build-time Map needed; runtime `lookupSync` is the interface
- ADR-0003 updated + marked **Accepted**
- chessground@9.2.1 has deprecation warning (npm) — relevant for S1-04/S1-05 spikes
- Spike script kept at `scripts/spike-adr0003-ep-convention.mjs`

### Session history (older)
`/create-control-manifest` complete (2026-05-29): `docs/architecture/control-manifest.md` written.
`/gate-check pre-production` complete (2026-05-28): **PASS (with advisories)**.
**ADR-0001 spike complete (2026-05-28)**: HCE confirmed. `stockfish@16.0.0` installed. ADR-0001 → **Accepted**.
**Stage**: `Pre-Production` (advanced 2026-05-28).
**Sprint 1 created (2026-05-28)**: `production/sprints/sprint-1.md` + `production/sprint-status.yaml`.

## Stage

**Pre-Production** (advanced 2026-05-28 after gate PASS with advisories). Re-gate to Production requires: vertical slice exists + ≥5 of 7 spikes flipped to Accepted (per first-run PR guidance).

## Recent Milestones

- [x] Game concept written
- [x] Technology stack pinned (Web App: Vue 3 + TypeScript + chessground)
- [x] Systems decomposition (17 systems, v0/MVP/Polish tiers)
- [x] 8 MVP-tier GDDs written + cross-reviewed (PASS-eligible)
- [x] 10 ADRs written (ADR-0001..0010, all Proposed)
- [x] `/architecture-review` 2026-05-28 + 2026-05-29 re-run (CONCERNS, C1 resolved)
- [x] `/test-setup` 2026-05-29 — `tests/` structure + `.github/workflows/tests.yml`
- [x] `/ux-design` 2026-05-28 — `design/ux/accessibility-requirements.md` + `interaction-patterns.md`
- [x] `/create-control-manifest` 2026-05-29 — `docs/architecture/control-manifest.md`
- [x] `/gate-check pre-production` 2026-05-28 — CONCERNS verdict, 4-director panel
- [x] `package.json` + smoke tests scaffolded — CI will pass once `package-lock.json` is committed
- [x] `/sprint-plan` 2026-05-28 — Sprint 1 created (`production/sprints/sprint-1.md`); PR-SPRINT gate REALISTIC after scope revision

## Pre-Pre-Production Punch List (from gate-check 2026-05-28)

| # | Item | Owner | Status |
| --- | --- | --- | --- |
| 1 | Add `## Visual Identity Anchor` to `game-concept.md` (lichess-clean + Nippon Colors palette + cburnett piece set + dark-mode → Phase 2 deferral) | AD | **DONE 2026-05-28** — palette + cburnett used per Eason's Nippon Colors preference |
| 2 | Add eval bar visual spec to `interaction-patterns.md` (P-21) | AD | **DONE 2026-05-28** |
| 3 | Add ADR re-attestation TODO list to `control-manifest.md` header (10 ADRs + spike triggers) | TD | **DONE 2026-05-28** |
| 4 | Revise memory guardrail in `control-manifest.md`: 120 MB working / 150 MB hard ceiling | TD | **DONE 2026-05-28** |
| 5 | Resolve Pillar 2 question: re-scope v0 with min-viable knowledge link OR explicitly accept v0 = Stockfish-review MVP (hook in Phase 2) | CD | **DONE 2026-05-28** — Eason chose A (micro hook). `game-concept.md` updated: MVP item 3 = static opening knowledge cards (~20 entries, hand-authored); Pillar 2 §v0 note added explaining it as the knowledge→game half. **Follow-ups below.** |
| 5a | Propagate Pillar 2 decision: update `design/gdd/systems-index.md` to add knowledge-cards entry; update `design/gdd/opening-identification.md` to add AC for surfacing the card; consider new GDD `design/gdd/opening-knowledge-cards.md` or fold into post-game-review | CD | **PENDING** — recommend `/propagate-design-change` then `/quick-design "opening knowledge cards"` |
| 5b | Author the ~20 opening knowledge cards (hand content task; markdown blurbs per ECO code) | content | **PENDING** — Sprint 1 deliverable |
| 6 | Land `package.json` + smoke test that passes CI | TD | DONE 2026-05-28 — pending `npm install` to generate lockfile |
| 7 | Spike queue | TD/PR | IN PROGRESS — ADR-0001 ✅ Accepted 2026-05-28; ADR-0008 + ADR-0007 need real iPhone |

## Open Questions (cross-cutting)

- ~~**Pillar 2 / unique hook v0 scope**~~ — **RESOLVED 2026-05-28**: Option A (micro hook via static opening knowledge cards). Triggers items 5a + 5b in punch list.
- ~~**Nippon Colors palette confirmation**~~ — **RESOLVED 2026-05-28**: Option A (和茶系) confirmed.
- ~~**Default piece SVG set**~~ — **RESOLVED 2026-05-28**: cburnett confirmed.
- iPhone Safari Stockfish performance — prototype before Chess Engine GDD finalized (still pending; ADR-0007 spike)
- Premove future-proofing — flag for future ADR
- Keyboard navigation feasibility in chessground 9.x — verify before v0 implementation (Chess Board OQ #7)
- Drag-vs-tap threshold tuning on real iPhone (Chess Board OQ #8)

## Spike Queue (6 remaining)

Suggested order from TD/PR (highest-uncertainty trio first):

1. ~~ADR-0001 HCE build availability~~ — **DONE 2026-05-28** (`stockfish@16.0.0`, single-threaded, HCE via `Use NNUE false`)
2. ADR-0008 iOS Safari meta-CSP `worker-src 'self' blob:` + `'wasm-unsafe-eval'` verification — real iPhone device
3. ADR-0007 iPhone Safari depth-22 reachability + peak RSS measurement — real iPhone device
4. ADR-0003 en passant EPD convention check (chess.js vs chess-openings dataset)
5. ADR-0006 chessground 9.x `drawable.shapes` audit (arrowhead geometry + per-shape brush colors)
6. ADR-0009 (×3): drawable.shapes schema, focus-cell keydown propagation, vue3-chessboard `boardRef` expose
7. ADR-0010 (×2): iOS user-activation pattern + `canShare({text})` reachability

## ADR Summary (ADR-0001..0010 all Proposed)

- ADR-0001: Stockfish build versioning (HCE/NNUE split)
- ADR-0002: Web Worker isolation and UCI protocol
- ADR-0003: chess-openings dataset pin and EPD index
- ADR-0004: Vue Router history mode and GitHub Pages SPA fallback
- ADR-0005: Pinia store boundaries and CompletedGame transport
- ADR-0006: Move Annotation rendering substrate (custom SVG overlay)
- ADR-0007: Post-Game Review analysis loop and sessionStorage schema
- ADR-0008: CSP headers and WASM deployment configuration
- ADR-0009: Chess Board substrate, vue3-chessboard integration, roving-tabindex keyboard model
- ADR-0010: Game Export Tier-1/2/3 delivery and sync-gesture clipboard contract

## Files Modified This Session (2026-05-28)

- `docs/architecture/control-manifest.md` — NEW + UPDATED (Control Manifest with 10 ADRs, all layers, TD-MANIFEST fixes; ADR re-attestation TODO added; memory budget split into 120 MB working / 150 MB hard)
- `production/gate-checks/2026-05-28-technical-setup-to-pre-production.md` — NEW (Gate check report, CONCERNS verdict, 4-director panel)
- `package.json` — NEW (minimum: vitest + playwright + typescript)
- `tsconfig.json` — NEW (strict TypeScript, ES2022, bundler resolution)
- `vitest.config.ts` — NEW (unit + integration + smoke include globs)
- `playwright.config.ts` — NEW (chromium + webkit projects)
- `tests/smoke/toolchain.test.ts` — NEW (3 trivial assertions to validate Vitest)
- `tests/e2e/toolchain.spec.ts` — NEW (Playwright launch test + skipped app placeholder)
- `design/gdd/game-concept.md` — UPDATED (added `## Visual Identity Anchor` section: lichess-clean + Nippon Colors palette 和茶系 + cburnett + explicit dark-mode/custom-art deferrals; updated Technical Considerations Art Style row; Pillar 2 §v0 note + MVP item 3 = static opening knowledge cards per Eason's Option A decision)
- `design/ux/interaction-patterns.md` — UPDATED (added P-21 Evaluation Bar; catalog count 20 → 21)
- `design/gdd/systems-index.md` — UPDATED (added #8b Opening Knowledge Cards v0 Feature; Progress Tracker 17 → 18 systems, 8 → 9 GDDs started; Recommended Design Order updated)
- `design/gdd/opening-identification.md` — UPDATED (downstream dependents table now lists Opening Knowledge Cards as a reverse dependency consuming `OpeningResult.eco`)
- `design/gdd/opening-knowledge-cards.md` — NEW (8-section skeleton, sections 1/2/4/6 complete, 3/5/7/8 marked TO AUTHOR with candidate content)
- `production/gate-checks/2026-05-28-technical-setup-to-pre-production-rerun.md` — NEW (PASS-with-advisories self-assessment + chain-of-verification)
- `C:\Users\Administrator\.claude\projects\d--Personal\memory\project_chess_training.md` — REWRITTEN (full v0 lock-in, palette, ADR list, critical-path notes, propagation pointers)
- `production/session-state/active.md` — UPDATED (this file)

## Session Extract — /create-control-manifest 2026-05-29

- Verdict: COMPLETE — manifest written to `docs/architecture/control-manifest.md`
- ADRs sourced: 10 (treated as Accepted per Eason's decision; all currently Proposed; provenance noted in manifest header)
- TD-MANIFEST gate (full mode): CONCERNS — 5 genuine rule gaps + 3 attribution refinements identified; all incorporated into final manifest
- Rule counts: Foundation 21r/13f/4g, Core 23r/12f/7g, Feature 22r/12f/7g, Presentation 12r/8f/3g, Global (8 naming, 6 perf budgets, 12 approved libs, 8 forbidden APIs, 5 cross-cutting)
- Notable manifest content: TypeScript-enforced `assembleExportPayload` sync contract; AbortController `markRaw` requirement; `squareToRect()` board-local convention with ADR-0006 doc-drift correction; selection overlay vs annotation SVG coexistence rule; mobile calm default declared BINDING

## Session Extract — /gate-check pre-production 2026-05-28

- Verdict: CONCERNS (advisory)
- Artifacts: 10/13 present (path-drift on 2, genuinely missing: art bible, example test files)
- Director Panel (full mode, all 4 returned CONCERNS, 0 NOT READY):
  - Creative: Pillar 2 deferred to Phase 2 — needs explicit v0 scope decision; otherwise pillar fidelity is exemplary
  - Technical: Proposed-status ADRs OK for prototype; spikes block sprint inclusion not scaffold; package.json + smoke test needed; tighten 145→120 MB memory budget
  - Producer: critical-path bottleneck is the correct shape of next 2-4 weeks; skip epic/sprint ceremony for solo dev; vertical slice is output not prereq
  - Art: full art bible overkill; needs Visual Identity Anchor (~30min) + piece set decision + dark-mode deferral statement (~1hr total)
- Chain-of-Verification: 5 questions checked, verdict unchanged
- Report: `production/gate-checks/2026-05-28-technical-setup-to-pre-production.md`
- Stage NOT advanced — `production/stage.txt` remains `Technical Setup`
- Recommended re-gate after punch-list items 1-5 resolved
