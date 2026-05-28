# ADR-0001: Stockfish Build Source, Version, and HCE/NNUE Split

## Status
Proposed

> **Next action to reach Accepted**: Complete the 1-day spike listed in Validation
> Criterion 1. Once HCE build availability and NNUE RSS are confirmed, update
> Status to Accepted and replace all placeholder file names with confirmed values.
> A second TD-ADR review is NOT required unless the spike triggers Fallback Option A or B.

## Date
2026-05-28

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | Stockfish WASM (lichess fork) — Web App project; no traditional game engine (Godot/Unity/Unreal) |
| **Domain** | Core / AI Engine Integration |
| **Knowledge Risk** | MEDIUM — exact lichess fork npm package structure and HCE build availability unverified at ADR authoring time; NNUE resident memory estimate (80 MB) is not yet measured. Both unknowns resolved by the 1-day spike. |
| **References Consulted** | `design/gdd/chess-engine-integration.md` (Core Rule 1–4, OQ#5–6, Formula 4, External Dependencies table); `.claude/docs/technical-preferences.md`; `docs/architecture/architecture.md` (TD sign-off conditions) |
| **Post-Cutoff APIs Used** | None — Stockfish 16.1 UCI protocol is stable and within LLM training data. No Godot/Unity/Unreal APIs. |
| **Verification Required** | 1-day spike: confirm HCE build file name + size + UCI handshake; measure NNUE RSS on iPhone Safari. See Validation Criteria. |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | None (ADR-0001 is the first ADR in this project) |
| **Enables** | All Chess Engine implementation stories: Play Mode Worker, Review Mode Worker, UCI wrapper, engine state machine |
| **Blocks** | v0 implementation of Chess Engine Integration — per `architecture.md` TD sign-off: "ADR-0001 HCE spike must resolve before v0 coding begins" |
| **Ordering Note** | This ADR must reach Accepted status (post-spike) before any Chess Engine story enters a sprint. Stories may be written against Proposed status, but sprint inclusion is blocked until Accepted. |

## Context

### Problem Statement

The chess-engine-integration GDD (Core Rule 1) mandates two separate Stockfish WASM
builds: a lightweight HCE build (~1–2 MB) for Play Mode and an NNUE build (~40 MB)
for Review Mode. Without pinning the exact build source and version:

- The skill-level differential AC (≥ 100 cp spread between skill 0 and skill 20 on
  a fixed position) cannot have a reproducible baseline
- WASM bundle sizes cannot be locked in CI — any npm update could silently change
  the Formula 4 memory model
- The HCE/NNUE split itself is assumed, not confirmed — Open Question #6 requires
  a 1-day spike to verify the lichess fork distributes both builds separately

GDD Open Questions #5 and #6 explicitly require this ADR before v0 implementation
begins. The architecture.md Technical Director sign-off makes this a blocking condition.

### Constraints

- **Single-threaded WASM only** — no SharedArrayBuffer, no COOP/COEP headers
  (GitHub Pages deployment + iOS Safari 16.0–16.3 compatibility)
- **Memory ceiling ≤ 150 MB** — total resident memory including both engine workers
  and app overhead, per GDD Formula 4
- **HCE build must be behaviorally distinct from NNUE** — not NNUE with network
  zeroed; skill-level calibration (0–20) must match the GDD's acceptance criteria
- **Vite + Web Worker bundling**: WASM files must be importable as Vite asset URLs
  (`import wasmUrl from '...?url'`) and loadable from a Worker without COOP/COEP

### Requirements

- Standalone HCE (no NNUE weights) WASM build — target file size (gzip): [1, 3] MB
- NNUE-enabled WASM build with the SF16 network — target file size (gzip): [38, 45] MB
- Both builds expose the full UCI protocol over Worker `postMessage`
- Version pinned (no `^` or `~` semver range) for reproducible test baselines
- Source actively maintained with confirmed single-threaded WASM support

## Decision

Pin **Stockfish 16.1** (lichess WASM fork) as the chess engine for both Play Mode
and Review Mode.

### Build split

**Play Mode — HCE build:**
The no-NNUE, single-threaded WASM build from the lichess fork. No neural network
weights are embedded; the engine uses Hand-Crafted Evaluation (classical material +
positional terms). Estimated resident memory: ~25 MB (WASM linear memory + 16 MB
hash table + JS glue heap). The exact npm artifact name and file path are placeholders
until the 1-day spike confirms them.

**Review Mode — NNUE build:**
The NNUE-enabled, single-threaded WASM build from the lichess fork, with the Stockfish
16 NNUE network weights embedded. Referred to in the GDD as `stockfish-nnue-16.wasm`.
Estimated resident memory: ~80 MB (WASM linear memory + ~40 MB NNUE weight tensor +
32 MB hash table + JS glue heap). **This 80 MB estimate is unvalidated at authoring
time** — see Gap 1 below and Validation Criterion 2.

### Source

The lichess fork of Stockfish (the same project used by lichess.org), distributed
via npm. The GDD's allowed libraries table lists `stockfish (WASM)` from "lichess fork"
as the approved package. The 1-day spike must confirm the exact npm package name,
file structure, and Vite import path before implementation begins.

### Version

Stockfish 16.1 — latest stable release of the SF16 series.

**Rationale**: The GDD acceptance criteria were written against SF16 skill-level
behavior, particularly the ≥ 100 cp spread test between skill 0 and skill 20. Stockfish
17 (released June 2025) recalibrated the skill level curve; all skill-level ACs would
need re-validation. SF17 adoption is deferred to Phase 2 with a dedicated ADR.

### Worker co-residency invariant

The memory budget in Formula 4 assumes the two Workers are not simultaneously active
at full load. This invariant must be enforced at the application level:

> **Invariant**: The Review Worker is not instantiated until the Play Worker has
> completed its current search and entered the IDLE state. The two Workers are never
> in the THINKING state simultaneously.

In practice, Review Mode is only accessible from the post-game results screen, at
which point Play Mode has ended and the Play Worker is idle. The app's navigation
flow (Play → Results → Review) naturally enforces this. If a future feature ever
allows mid-game review, this invariant must be explicitly re-evaluated with a new
memory measurement.

### Fallback plan (if HCE build is unavailable from lichess fork)

**Option A — Preferred fallback**: Use the `stockfish` npm package (nmrugg/stockfish.js)
for the HCE build; keep the NNUE build on the lichess fork. nmrugg's package provides
a vanilla single-threaded WASM build without NNUE and is architecturally compatible
with this ADR's interface contracts. No Formula 4 revision required.

**Option B — Last resort**: Accept NNUE for Play Mode as well, using a single build
for both modes. **This requires a Formula 4 revision** — NNUE resident for Play Mode
raises `playEngineMB` from ~25 MB to ~80 MB, pushing Play-only total to ~120 MB and
peak (both modes active) to ~185 MB, exceeding the 150 MB ceiling. Option B may not
be chosen unilaterally during implementation — it requires a new spike to measure
actual peak RSS with dual NNUE on iPhone, explicit TD sign-off, and a revision to
this ADR's Decision section before any sprint work begins.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  App Main Thread                                                │
│  ┌──────────────────┐         ┌──────────────────────────────┐  │
│  │  Game Lifecycle  │         │  Post-Game Review            │  │
│  └────────┬─────────┘         └──────────┬───────────────────┘  │
│           │ playEngine.play(...)          │ reviewEngine.         │
│           │  → Promise<PlayResult>        │  analyze(...)         │
│           ▼                              │  → Promise<ReviewResult>│
│  ┌──────────────────────────────────┐   ▼                        │
│  │  ChessEngine Play wrapper         ──► ChessEngine Review wrapper│
│  │  (state machine: UCI lifecycle)  │   (state machine: lazy-load)│
│  └────────┬─────────────────────────┘   └───────────┬───────────┘ │
└───────────┼────────────────────────────────────────┼─────────────┘
            │ postMessage (UCI)                      │ postMessage (UCI)
            ▼                                        ▼
┌──────────────────────────┐   ┌──────────────────────────────────────┐
│  Web Worker              │   │  Web Worker                          │
│  HCE build               │   │  NNUE build (stockfish-nnue-16.js)   │
│  ~1–2 MB (file)          │   │  ~40 MB (file, NNUE weights embedded) │
│  ~25 MB (resident)       │   │  ~80 MB (resident) — spike TBC       │
│  Persistent for app      │   │  Lazy-loaded on first Review call    │
│  lifetime once init'd    │   │  Terminated after 30s idle           │
└──────────────────────────┘   └──────────────────────────────────────┘

Memory model (Formula 4):
  Play-only:        ~25 (HCE) + 0 (Review not loaded) + ~40 (app) = ~65 MB
  Play + Review:    ~25 (HCE) + ~80 (NNUE) + ~40 (app) = ~145 MB  ← ceiling: 150 MB
  (NNUE figure is an estimate; spike must measure actual RSS on iPhone)
```

### Key Interfaces

The UCI protocol interface is unchanged between HCE and NNUE builds. Both workers
receive the same command set; the difference is purely in evaluation quality and
memory footprint. Exact file import paths are placeholders until the spike confirms
the npm package structure.

```typescript
// Representative import pattern (file names to be confirmed by spike):
import hceWasmUrl from 'stockfish-hce.wasm?url';   // Play Mode worker
import nnueWasmUrl from 'stockfish-nnue-16.wasm?url'; // Review Mode worker
// URLs are passed to workers via postMessage; Emscripten Module.locateFile is
// overridden to return these URLs (per GDD Core Rule 9).

// UCI options set once at boot (per GDD Core Rule 4):
// HCE:  Hash=16, Threads=1, Ponder=false, MultiPV=1
// NNUE: Hash=32, Threads=1, Ponder=false, MultiPV=1

// Public wrapper interface (defined in Chess Engine implementation story, not here):
// playEngine.play({ fen, skillLevel: 0–20, movetimeMs }) → Promise<PlayResult>
// reviewEngine.analyze({ fen, targetDepth?, movetimeMs? }, onProgress?) → Promise<ReviewResult>
```

## Alternatives Considered

### Alternative 1: nmrugg/stockfish.js for both builds

- **Description**: Use the `stockfish` npm package by nmrugg for both Play and Review
  modes. nmrugg's package provides a single-threaded WASM build without NNUE weights;
  Review Mode would analyze at higher depth but without the neural network evaluation.
- **Pros**: Single npm dependency; no NNUE complexity; confirmed npm publication history.
- **Cons**: No NNUE for Review Mode directly contradicts GDD Core Rule 1
  ("Review Engine: stockfish NNUE (lichess fork)"). NNUE evaluation produces
  meaningfully better positional assessments for the post-game review pillar
  (Pillar 2: Knowledge Connects to Play). nmrugg's package may be less actively
  maintained against current Stockfish releases.
- **Rejection Reason**: Removes the quality benefit of NNUE analysis from post-game
  review, contradicting the GDD's core architecture and Pillar 2.

### Alternative 2: Self-build from Stockfish source via emscripten

- **Description**: Clone the Stockfish GitHub repository, write a custom emscripten
  WASM build script, output both HCE and NNUE builds, commit them to the repo or host
  on a CDN. Gives full control over build flags, optimization levels, and exact version.
- **Pros**: Full control; can target SF16.1 or SF17 at any time; no dependency on
  third-party npm publication cadence.
- **Cons**: Requires emscripten toolchain setup, CI pipeline for WASM compilation,
  and ongoing maintenance. ~40 MB WASM binary commits inflate repo size. License and
  attribution must be manually managed. Significant overhead for a solo v0 project
  when the lichess fork already provides production-grade builds used by lichess.org at scale.
- **Rejection Reason**: Out of scope for v0. The complexity-to-benefit ratio is
  unfavorable; the lichess fork is battle-tested and sufficient.

### Alternative 3: Stockfish 17 (if lichess fork has published a build)

- **Description**: Target SF17 instead of SF16.1. Stockfish 17 (released June 2025)
  features a significantly stronger NNUE network and improved evaluation. If the lichess
  fork has a stable SF17 WASM build, it would provide better analysis quality.
- **Pros**: Stronger evaluation; updated NNUE network; ongoing upstream support.
- **Cons**: The GDD's acceptance criteria were written against SF16 skill-level
  behavior — particularly the ≥ 100 cp spread test between skill levels 0 and 20.
  SF17 recalibrated the skill level curve; all skill-level ACs would need re-validation
  before SF17 can be trusted for Play Mode. The lichess fork's SF17 WASM build
  availability is unconfirmed as of this ADR.
- **Rejection Reason**: Conservative choice for v0. SF17 adoption is a Phase 2
  decision with a dedicated ADR to cover the AC re-validation.

### Alternative 4: Single NNUE build for both Play and Review

- **Description**: Use only the NNUE build for both modes, eliminating the HCE build
  dependency entirely. Play Mode uses NNUE at low depth; Review Mode uses NNUE at high
  depth.
- **Pros**: Single WASM asset to manage; no HCE build spike needed; potentially
  stronger Play Mode evaluation.
- **Cons**: Violates Formula 4's memory budget. With NNUE resident during Play Mode,
  `playEngineMB` rises from ~25 MB to ~80 MB. Play-only total: ~120 MB.
  Peak (Play + Review active): ~185 MB — exceeding the 150 MB ceiling and entering
  the iPhone Jetsam kill zone (~200–280 MB on 3 GB iPhones).
- **Rejection Reason**: Formula 4 is a hard design constraint established by the GDD.
  The HCE/NNUE split is the mechanism that keeps the memory budget within the 150 MB
  ceiling. This alternative invalidates the entire memory model.

## Consequences

### Positive

- Resolves GDD Open Questions #5 and #6 before v0 implementation begins
- Memory budget is maintainable: Play-only ~65 MB; peak (both active) ~145 MB —
  within the 150 MB ceiling with a ~5 MB margin (pending spike confirmation)
- Skill-level differential ACs have a reproducible baseline anchored to pinned SF16.1
- Single source for both builds simplifies version management and cache key strategy
- Fallback paths (A and B) are documented before implementation begins — no
  undocumented decisions under time pressure

### Negative

- Two separate WASM assets to bundle, serve, and cache in the Service Worker
- HCE build file name and exact import path are unknown until the spike —
  implementation stories cannot be completed until spike resolves Validation Criterion 1
- CI bundle size verification cannot be configured until spike confirms actual file sizes
- The ~5 MB margin between peak estimated memory (~145 MB) and the ceiling (150 MB)
  is thin; if NNUE RSS exceeds 85 MB on iPhone, the ceiling is violated and the
  memory model must be revised

### Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| HCE build unavailable from lichess fork | Medium (pre-spike) | High — requires fallback | Fallback Option A (nmrugg HCE) is architecturally compatible; resolve in spike |
| NNUE resident RSS > 85 MB on iPhone | Unknown (pre-spike) | High — violates ceiling | Spike measures actual RSS; if exceeded, Option B or ceiling revision required |
| Lichess fork version drift (npm update) | Low | Medium — baseline shifts | Pin exact semver without `^` or `~`; Dependabot updates require ADR revision |
| SF17 build from lichess fork released mid-v0 | Low | Low — does not affect pinned version | Ignore until Phase 2; do not upgrade without re-validating skill-level ACs |

## GDD Requirements Addressed

| GDD System | Section / Requirement | How This ADR Addresses It |
|------------|----------------------|--------------------------|
| chess-engine-integration.md | Core Rule 1: Two engine instances, two builds (HCE for Play, NNUE for Review) | Locks both builds to the lichess fork; confirms the HCE/NNUE split as the implementation target |
| chess-engine-integration.md | Core Rule 2: Single-threaded WASM only, no SharedArrayBuffer | Both builds selected are single-threaded; no SharedArrayBuffer dependency; GitHub Pages compatible |
| chess-engine-integration.md | Core Rule 4: Per-engine UCI options set at boot | Key Interfaces section documents the `Hash`, `Threads`, `Ponder`, `MultiPV` values per build |
| chess-engine-integration.md | Open Question #5: Exact version pinning required before v0 | Pins Stockfish 16.1; documents rationale for rejecting SF17 for v0 |
| chess-engine-integration.md | Open Question #6: HCE build availability must be confirmed before v0 | Defines the 1-day spike as Validation Criterion 1; specifies fallback options A and B |
| chess-engine-integration.md | Formula 4: peakMemoryMB ≤ 150 MB | Locks `playEngineMB ≈ 25 MB` (HCE) and `reviewEngineMB ≈ 80 MB` (NNUE, pending spike) as design targets; worker co-residency invariant enforces that the formula holds |
| chess-engine-integration.md | External Dependencies table: `stockfish` (lichess fork) + `stockfish-nnue-16.wasm` | Converts the informal "lichess fork, stockfish 16+" reference to a versioned, sourced decision with fallback documentation |

## Performance Implications

- **CPU**: HCE is ~3× faster than NNUE for the same search depth (no neural network
  inference). Play Mode latency is well within the `playMaxMoveTimeMs = 6000 ms` budget.
  Formula 1 (`errorTimeoutMs = 2 × movetimeMs`) has adequate headroom.
- **Memory**: Play-only: ~65 MB. Peak (Play + Review both active): ~145 MB — within
  the 150 MB ceiling provided the worker co-residency invariant holds and NNUE RSS is
  confirmed at ≤ 85 MB by the spike. If the invariant is violated or the estimate is
  wrong, the ceiling may be breached.
- **Load Time**: HCE WASM (~1–2 MB) loads during app initialization with negligible
  impact on the < 3s mobile 4G cold-start budget. NNUE (~40 MB) is lazy-loaded only
  on first Review invocation; Service Worker Cache Storage caches it for subsequent
  sessions (see Edge Case M5 in the GDD for `QuotaExceededError` fallback).
- **Network**: NNUE first-load adds ~40 MB on 4G — documented in architecture.md as
  HIGH risk and explicitly accepted in the GDD for v0. Phase 2 PWA caching ADR will
  govern the pre-caching strategy for returning users.

## Migration Plan

No existing implementation to migrate. This ADR establishes the ground-truth build
decisions for a new implementation.

## Validation Criteria

1. **[BLOCKING — required before status moves to Accepted]**
   Run the 1-day spike (GDD OQ#6 owner: ui-programmer):
   - Install the lichess Stockfish WASM npm package in an isolated test repo
   - Confirm the package contains **both** a standalone HCE build (no NNUE weights)
     AND an NNUE build as separately importable files
   - Confirm HCE build file size (gzip): within [1, 3] MB
   - Confirm NNUE build file size (gzip): within [38, 45] MB
   - Confirm both builds complete UCI handshake (`uci` → `uciok`) within 5s in a
     bare browser Worker in Chromium
   - Confirm Vite `?url` WASM import pattern works without COOP/COEP headers in Chromium
   - Update this ADR: replace placeholder file names with confirmed values; update
     status to Accepted.

2. **[BLOCKING — required before NNUE-dependent stories enter a sprint]**
   Smoke test on real iPhone Safari 16+:
   - Instantiate the NNUE Worker in a minimal test page (no app overhead)
   - Confirm `readyok` arrives within 5s (no WASM exceptions, no CSP block)
   - **Measure actual Worker RSS** using Safari Web Inspector memory timeline;
     record the peak RSS after `readyok` and after first `bestmove`
   - If measured RSS > 85 MB: open a follow-up decision — the 150 MB ceiling may
     need to be revised, or the `reviewEngineHashMb` tuning knob reduced

3. **[CI gate — set up after spike confirms file names]**
   Add bundle size assertions in `vite.config.ts`:
   - HCE chunk ≤ 3 MB
   - NNUE chunk ≤ 45 MB
   - CI fails on any update that exceeds these bounds

4. **[Sprint 1 acceptance — anchors skill level to pinned version]**
   Skill-level differential integration test (GDD AC for Play Mode):
   - Run `play({ skillLevel: 0 })` and `play({ skillLevel: 20 })` each 10 times
     on a fixed mid-game position (to be defined in test fixtures)
   - Mean centipawn-loss differential (skill 20 vs skill 0) must be ≥ 100 cp
   - This test is the reproducibility anchor for the pinned SF16.1 build;
     if a future version upgrade changes the result, the ADR must be revised

## Related Decisions

- `design/gdd/chess-engine-integration.md` — the GDD this ADR implements; Core Rules,
  Formulas, and Open Questions are the primary source of requirements
- Future ADR: Stockfish UCI Wrapper Architecture — will define the TypeScript state
  machine, error handling, and public API surface in detail
- Future ADR: PWA Caching Strategy — will govern how the NNUE ~40 MB asset is
  pre-cached for offline use and handle iOS `QuotaExceededError`
- `docs/architecture/architecture.md` — the master architecture document that
  references this ADR's blocking status
