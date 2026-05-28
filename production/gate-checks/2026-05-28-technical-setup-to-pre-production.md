# Gate Check: Technical Setup → Pre-Production

**Date**: 2026-05-28
**Reviewer**: `/gate-check` skill (Opus)
**Review mode**: full
**Verdict**: **CONCERNS** (advisory — user may proceed)
**Stage update**: NOT applied — `production/stage.txt` remains `Technical Setup`

---

## Required Artifacts (10 / 13 present)

| Status | Item | Notes |
|---|---|---|
| ✅ | Engine chosen | N/A — Web App (Vue 3 + TypeScript + vue3-chessboard + stockfish.wasm); documented in CLAUDE.md |
| ✅ | `.claude/docs/technical-preferences.md` populated | Naming, perf budgets, allowed libs all set |
| ❌ | `design/art/art-bible.md` | **Entire `design/art/` directory missing.** AD recommends Visual Identity Anchor in `game-concept.md` instead of full bible — not a hard block |
| ✅ | ≥3 Foundation-layer ADRs | 4 present (ADR-0003 opening, 0004 router, 0005 store, 0008 CSP) |
| ✅ | `docs/engine-reference/[engine]/` | N/A — Web App; godot/unity/unreal templates exist as scaffolding |
| ✅ | `tests/unit/` + `tests/integration/` directories | Created 2026-05-29 by `/test-setup`; also `e2e/`, `smoke/`, `evidence/` |
| ✅ | `.github/workflows/tests.yml` | Vitest + Playwright workflow defined |
| ❌ | Example test file | **Only README.md inside test dirs; no `.test.ts` files. Also no `package.json`** — first push will break CI |
| ✅ | `docs/architecture/architecture.md` | 638 lines, master document |
| ⚠️ | Traceability index | Path drift: `architecture-traceability.md` (skill expects `requirements-traceability.md`); content is correct (47 TRs, 43/3/0) |
| ✅ | `/architecture-review` run | Two reports: 2026-05-28 + 2026-05-29 re-run (CONCERNS, C1 resolved) |
| ⚠️ | Accessibility requirements doc | Path drift: `design/ux/accessibility-requirements.md` (skill expects `design/accessibility-requirements.md`); content present (WCAG 2.1 AA tier committed) |
| ✅ | `design/ux/interaction-patterns.md` | Initialized 2026-05-28 |

**Bonus artifacts present (not strictly required at this gate but accelerate next gate)**:
- ✅ `docs/architecture/control-manifest.md` — written 2026-05-29 (with provenance note: 10 source ADRs are Proposed pending 7 BLOCKING spikes; re-run after each spike resolves)

---

## Quality Checks (all pass)

- ✅ All 10 ADRs have **Engine Compatibility** + **GDD Requirements Addressed** sections
- ✅ All 10 ADRs reference the same engine version baseline (Stockfish 16.1, vue3-chessboard ^1.x, chessground 9.x)
- ✅ No circular ADR dependencies (verified in `architecture-review-2026-05-29.md`)
- ✅ Architecture traceability has **zero Foundation-layer gaps** (43/3/0)
- ✅ Performance budgets documented in `.claude/docs/technical-preferences.md` and `control-manifest.md`
- ✅ N/A — no engine, no deprecated-API check applicable

---

## Director Panel Assessment

**All four directors returned CONCERNS, zero returned NOT READY.**

### Creative Director — CONCERNS

- **Pillar 2 ("Knowledge Connects to Play") is structurally absent from v0, not just deferred.** game-concept.md frames bidirectional knowledge linking as the *unique hook*; in systems-index.md and the 8 v0 GDDs it is fully pushed to Phase 2. The v0 hero experience is "play → Stockfish review → export PGN to Claude" — a competent training tool, but not the differentiated product the concept promises. **Decision needed**: either (a) re-scope v0 with a minimum-viable knowledge link, or (b) explicitly accept v0 as a stockfish-review MVP with the hook proving itself only in MVP/Phase 2.
- Competing "anchor moments" across Game Lifecycle (result overlay), Post-Game Review (biggest swing), and Export → Claude (natural-language coaching) need a single named hero. Recommendation: biggest-swing in-app, Export as a deliberate handoff.
- ADR-0007 mobile calm default + ADR-0006 anti-emotive role enum (`bestMove`/`playedMove`/`alternateLine`/`threat`/`keySquare`/`from`/`to` only, enforced by static grep VC4) + ADR-0010 Pillar 3 fidelity are exemplary. Model for the rest of the project.
- Verify in-app Export copy reads as offering, not nudging (solo learner with no coach).

### Technical Director — CONCERNS

- **Proposed-status ADRs are acceptable for Pre-Production prototyping**; the 7 BLOCKING spikes are exactly what prototype work exists to resolve. Gate the Pre-Production → Production transition on Accepted status; do NOT gate entry.
- **Spikes block sprint inclusion, not prototype scaffolding.** Foundation work (Vite + Vue 3 + Pinia scaffold, vue3-chessboard integration smoke test, stockfish.wasm worker handshake) can start now because none depends on unresolved ADR decisions.
- **`package.json` missing + zero test files is a real blocker.** `.github/workflows/tests.yml` referencing Vitest+Playwright against a non-existent `package.json` will fail on first push and erode CI signal. Land minimal `package.json` + one passing smoke test in `tests/smoke/` as the first Pre-Production deliverable.
- **Add ADR re-attestation TODO to `control-manifest.md`** listing the 10 ADRs and their target-Accepted dates so the post-spike re-attestation debt is tracked, not silent.
- **145 MB / 150 MB ceiling is dangerously thin for unmeasured iPhone RSS.** 5 MB headroom assumes baseline iOS Safari overhead is already booked — ADR-0007 has not validated this. Recommend lowering implementation target to **~120 MB with 30 MB headroom** until ADR-0007 spike returns real RSS numbers, then re-baseline. Reversible — easier to relax later than tighten under pressure.

### Producer — CONCERNS

- **Critical-path bottleneck (spikes → ADRs Accepted → stories eligible) is the correct shape of the next 2-4 weeks, not a gate failure.** Treat 7 spikes as Sprint 0–1 deliverables; time-box 2-4 hrs each, ~1 spike/evening, ~2 weeks total for part-time solo.
- **Vertical slice, sprint plan, epics are *outputs* of Pre-Production, not entry prereqs.** Do not block on them.
- **Solo + part-time + 17 systems + 8 v0 GDDs in 3–6 months is aggressive but viable** — *only if* you skip epic/sprint ceremony. Run a lightweight "next 3 things" list in `active.md`; reserve formal sprints for when complexity demands it (likely never on this project).
- **Highest schedule risk = scope, not process.** Sequence the 3 highest-uncertainty spikes first (ADR-0001 HCE, ADR-0007 depth-22+RSS, ADR-0008 iOS CSP) so any GDD rework triggers happen early.
- **Re-gate to Production only after vertical slice exists AND ≥5 of 7 spikes Accepted.**

### Art Director — CONCERNS

- **Full `art-bible.md` is overkill for this project** (off-the-shelf chess board + Tailwind UI + ADR-0006 already locks per-role color contracts). The "Visual Identity Anchor + binding visual ADRs" alternative covers ~80% of the surface.
- **~1 hour fix to flip CONCERNS → READY**:
  1. Add `## Visual Identity Anchor` section to `design/gdd/game-concept.md` — reference: lichess-clean; principles: calm-default + role-neutral color; explicit deferrals: dark mode → Phase 2, custom piece art → never.
  2. Pick default piece SVG set (recommend **cburnett** — chessground default, highest forced-colors compatibility, familiar to chess.com/lichess migrants who are the target audience).
  3. Add eval-bar visual spec to `interaction-patterns.md` (gradient vs split bar, numeric overlay style, mobile hidden-state per ADR-0007).
- **"Default piece SVG set" is at the latest responsible moment.** Picking it after v0 stories start = re-screenshotting every UI test + revisiting accessibility contrast checks.
- **Dark mode is silently deferred.** No ADR or UX doc states "v0 = light only, dark mode = Phase 2." Make the deferral explicit, not implicit.

---

## Verdict: CONCERNS

No hard blockers. All flagged items are addressable within the first sprint of Pre-Production.

### Chain-of-Verification (5 questions, [TOOL ACTION] on 2)

1. **Could any CONCERN be elevated to a blocker?** Art bible nominally "required" by skill checklist, but AD explicitly says wrong gate for this project type. [TOOL ACTION] Re-read AD-PHASE-GATE definition — confirms verdict is advisory; downgrade justified.
2. **Resolvable within Pre-Production?** All four director punch lists total ~3-5 hours of pre-work + spike sequencing. Yes.
3. **Did I soften any FAIL?** Missing `package.json` + zero tests could be FAIL, but TD frames as "first deliverable of Pre-Production" not "must exist before entering." Reasonable softening.
4. **Artifacts I didn't check?** [TOOL ACTION] Verified no `prototypes/`, no `production/sprints/`, no `production/epics/`, no `src/` code. All expected at this transition.
5. **Together do they block?** No; they form a coherent prototype-first punch list with explicit ordering.

**Chain-of-Verification: 5 questions checked — verdict unchanged (CONCERNS).**

---

## Recommended Pre-Pre-Production Punch List

Rough order (~3 hours for items 1-5, then begin spikes):

1. **30 min** — Add `## Visual Identity Anchor` to `game-concept.md`. Reference: lichess-clean. Piece set: cburnett. Colors: Nippon Colors palette per Eason's preference (青磁色 bestMove, 利休鼠 playedMove, 浅葱色 alternateLine, 紅鬱金 threat, 山吹色 keySquare). Explicit deferrals: dark mode → Phase 2, custom piece art → never. [AD]
2. **30 min** — Add eval bar visual spec to `interaction-patterns.md` (gradient style, numeric overlay placement, mobile hidden-by-default per ADR-0007). [AD]
3. **15 min** — Add ADR re-attestation TODO list to `control-manifest.md` header (10 ADRs, target Accepted dates). [TD]
4. **15 min** — Revise memory guardrail in `control-manifest.md`: 120 MB working / 150 MB hard ceiling. [TD]
5. **30 min** — Resolve Pillar 2 question: either re-scope v0 with minimum-viable knowledge link OR explicitly note v0 as Stockfish-review MVP with unique hook proving in MVP/Phase 2. Update `game-concept.md` and `systems-index.md` accordingly. [CD]
6. **1–2 hrs** — Land minimal `package.json` + `tests/smoke/` smoke test that passes in CI. [TD] *(In progress this session)*
7. **Then** — Begin spike queue (suggested order: ADR-0001 HCE → ADR-0008 iOS CSP → ADR-0007 depth-22+RSS as highest-uncertainty trio). [TD/PR]

---

## Next Steps

This gate is CONCERNS, not PASS — `production/stage.txt` is NOT advanced. After punch-list items 1-6 complete, recommend re-running `/gate-check pre-production` to flip to PASS, then advance stage to `Pre-Production` and begin spike queue.
