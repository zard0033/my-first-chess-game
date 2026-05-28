# ADR-0003: chess-openings Dataset Version Pin and EPD Index Build

## Status
Proposed

> **Next action to reach Accepted**: Complete the en passant EPD convention spike listed in
> Validation Criterion 1. Replace the en passant normalization note with the confirmed approach.

## Date
2026-05-28

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | Build tooling (Vite/Node.js) + chess.js runtime — Web App, no traditional game engine |
| **Domain** | Core / Opening Identification |
| **Knowledge Risk** | LOW for core logic. MEDIUM for the exact en passant EPD convention of the `chess-openings` dataset vs. `chess.js` output — requires a one-time code check to confirm. |
| **References Consulted** | `design/gdd/opening-identification.md` (Core Rules 1–10, Formulas, Edge Cases); `docs/architecture/tr-registry.yaml` |
| **Post-Cutoff APIs Used** | None |
| **Verification Required** | En passant EPD convention spike — see Validation Criterion 1 |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | None (Foundation layer, no upstream ADRs) |
| **Enables** | Opening Identification implementation stories |
| **Blocks** | Opening Index build step cannot be implemented without the pinned dataset version and confirmed EPD format |
| **Ordering Note** | En passant spike must resolve before the index build step is implemented |

## Context

### Problem Statement

The Opening Identification GDD specifies a compile-time-built `Map<epd, { eco, name, ply }>` derived from the lichess `chess-openings` dataset. Without pinning the dataset version: (a) any dataset update can silently change the EPD-to-name mappings, breaking the skill-level reproducibility of the opening identification AC; (b) the collision policy (longest-name-then-lexical-eco) is not formally documented. Additionally, GDD Open Question #4 requires verifying that `chess.js`'s EPD output for en passant positions matches the convention used in the dataset — a mismatch would cause lookup failures on any game that produces an en passant-eligible position.

### Constraints

- Index must be < 150 KB gzipped and < 1 MB resident (GDD Formula 4)
- Lookups must be synchronous once the index is loaded (GDD Core Rule 10)
- Dataset must be bundled at build time — no TSV parsing in the browser
- `chess.js` is the authoritative game engine and must be used for EPD derivation (already decided by Chess Board GDD)

### Requirements

- Dataset version pinned to a specific commit or release tag (not `@latest`)
- EPD derivation: exactly 4 FEN fields (piece placement, active color, castling rights, en passant target)
- Collision policy documented for duplicate ECO/name variants at the same EPD
- Build step output is a TypeScript `Map` constant (tree-shakeable, zero runtime parsing overhead)

## Decision

### 1. Dataset Source: lichess/chess-openings, npm package `chess-openings`

Use the `chess-openings` npm package maintained by the lichess organization. The GDD's allowed libraries table explicitly lists `chess-openings` from "lichess" as the approved package.

**Version pin strategy**: Pin to an exact version tag without `^` or `~` in `package.json` (e.g., `"chess-openings": "1.0.0"` or the equivalent release). If the package uses commit-only distribution, pin via a git commit hash. The exact version to use is determined at first-install time — what matters architecturally is that the pin mechanism is exact (no auto-upgrade).

**Why pin**: The opening names in the dataset are display copy visible to the player ("Italian Game: Giuoco Pianissimo"). A dataset update could change a name, breaking the acceptance criterion that compares opening name output against expected strings. Pinning protects test stability.

### 2. EPD Key Derivation: First Four FEN Fields via chess.js

Each dataset entry's PGN move sequence is replayed through `chess.js` at build time. After each move, the EPD is computed as:

```typescript
const fen = chess.fen();           // full FEN: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"
const epd = fen.split(' ').slice(0, 4).join(' ');  // "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3"
```

The halfmove clock and fullmove number (fields 5–6) are dropped. This matches the GDD's description of EPD as "the first four FEN fields" and ensures transposition handling: two different move orders reaching the same legal position produce the same EPD.

**En passant convention (critical — see Validation Criterion 1)**: The en passant field in a FEN is set to the target square only when the *previous* move was a double pawn push *and* the opponent has a pawn in the correct adjacent file to capture en passant. The question is whether the `chess-openings` dataset uses this strict convention (ep square only when capture is possible) or the loose convention (ep square whenever a double pawn push occurred, regardless of opponent pawn position). `chess.js` uses the strict convention. If the dataset uses the loose convention, EPD keys will not match for any position after a double pawn push where no capture is possible — and those are common opening positions.

**Resolution**: Validate with a code check during the spike (Validation Criterion 1). If a mismatch is found: add an EPD normalization step that strips the en passant field from both the dataset key and the lookup key. This normalization is a one-line change but it must be applied consistently to both sides (build step and runtime lookup).

### 3. Longest-Prefix Collision Policy

When multiple dataset entries map to the same EPD (rare but documented in the GDD), the collision policy is:

1. Keep the entry with the **longest name** (more specific = more useful to the player)
2. Tie-break on **lexically lower ECO code** (stable, deterministic)

This matches the GDD's stated "collision policy (`longest-name-then-lexical-eco`)" and ensures the index build is deterministic across runs.

### 4. Build Step Architecture

The index is built once at compile time via a Vite plugin or Node.js build script (`scripts/build-opening-index.ts`). Output: a TypeScript file exporting an immutable `Map<string, { eco: string; name: string; ply: number }>`.

```typescript
// generated/opening-index.ts (generated file, do not edit)
export const OPENING_INDEX: ReadonlyMap<string, { eco: string; name: string; ply: number }> =
  new Map([
    ["rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3", { eco: "B00", name: "King's Pawn", ply: 1 }],
    // ...~3,500 entries
  ]);
```

**Why build-time, not runtime**: The TSV files are ~200 KB raw. Parsing them in the browser adds startup latency and prevents tree-shaking. A generated TypeScript Map is tree-shaken automatically, compresses to < 150 KB gzip, and loads instantly as a module import.

**Why not a JSON blob**: A JSON blob requires `JSON.parse` at runtime (synchronous but non-trivial for ~3,500 entries). A `Map` literal in TypeScript is parsed by V8's JIT as part of the module evaluation — faster and type-safe.

### Architecture Diagram

```
Build Time:
  chess-openings@pinned (TSV files)
        │ Node.js build script (scripts/build-opening-index.ts)
        │ chess.js: replay each PGN → EPD derivation
        │ collision: longest-name-then-lexical-eco
        ▼
  src/generated/opening-index.ts (Map<epd, {eco,name,ply}> — immutable)

Runtime:
  identifyOpening(moves: string[]) → walks moves, computes EPD per ply → Map.get(epd)
  identifyPosition(fen: string) → extract EPD → Map.get(epd)
  Both are synchronous; the Map is loaded once as a module import
```

### Key Interfaces

```typescript
interface OpeningResult {
  eco: string | null;       // ECO code, e.g., "C53"
  name: string | null;      // full name, e.g., "Italian Game: Giuoco Pianissimo"
  matchedPly: number;       // 0 if no match
  bookExitPly: number | null; // first ply after deepest match; null if game never left book
  isUnknown: boolean;       // true if no position matched at all
  epd: string;              // EPD of matched position; "" if unknown
}

// Primary entry point (walk the full game):
function identifyOpening(moves: string[]): OpeningResult

// Secondary entry point (single position lookup):
function identifyPosition(fenOrEpd: string): { eco: string; name: string } | null
```

## Alternatives Considered

### Alternative 1: Parse TSV at Runtime

- **Description**: Bundle the raw TSV files and parse them in the browser on first access (or on module load). No build step.
- **Pros**: Simpler development setup — no build script to maintain.
- **Cons**: Adds ~200 KB uncompressed of raw TSV to the bundle. TSV parsing at module evaluation time adds ~50–100 ms of synchronous CPU work on mobile. Output is not tree-shakeable. Fails the < 150 KB gzip and sync-lookup requirements.
- **Rejection Reason**: Violates both the performance budget and the "no runtime parsing" requirement.

### Alternative 2: Pre-built JSON Blob

- **Description**: Build the index at CI time as a JSON file, fetch it lazily, and parse it in the browser.
- **Pros**: Decouples the index from the JS bundle; can be cached independently.
- **Cons**: Requires `JSON.parse` on a large blob (~150 KB JSON) at first use — adds a parsing hit. Requires a network request or cache read on first load. The TSV → JSON build step is just as complex as TSV → TypeScript Map. Loses type safety.
- **Rejection Reason**: No meaningful benefit over a generated TypeScript Map; adds async complexity for no gain.

### Alternative 3: Use a Different Opening Database (Scid, ECO5, etc.)

- **Description**: Use a manually curated ECO database (Scid's eco.epd, Jeroen Noomen's ECO5) instead of the lichess `chess-openings` dataset.
- **Pros**: Some databases have more complete coverage.
- **Cons**: Not available as a maintained npm package. The `chess-openings` dataset is actively maintained by lichess, is already listed in the project's allowed libraries, and is the established standard for browser-based chess apps. Switching would require ad-hoc data procurement and format conversion.
- **Rejection Reason**: `chess-openings` is already approved and is the industry standard for this use case.

## Consequences

### Positive

- Index build is deterministic and reproducible across CI runs (pinned dataset + deterministic collision policy)
- Synchronous lookup at runtime — no async overhead in Post-Game Review's opening identification step
- < 150 KB gzip easily achievable (~3,500 entries as a TypeScript Map constant)
- Type-safe interface with stable OpeningResult contract

### Negative

- Additional build step in `package.json` scripts — must re-run when `chess-openings` package is updated
- Generated file must be committed to the repository (or regenerated in CI before each build) — either approach adds a small process burden
- The en passant convention spike is a blocking prerequisite for confident test writing

### Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| chess.js EPD en passant ≠ dataset convention | Medium (pre-spike) | Medium — opening lookups fail for any post-double-pawn-push position | Spike confirms; normalization step is a one-liner if needed |
| Dataset update changes opening names between CI runs | Low (mitigated by pin) | Medium — AC strings break | Exact semver pin prevents auto-upgrade; Dependabot updates require ADR revision |
| Generated file drift (not regenerated after pin update) | Low | Low | CI should run build-opening-index script before tests; lint-staged check optional |

## GDD Requirements Addressed

| GDD System | Section / Requirement | How This ADR Addresses It |
|------------|----------------------|--------------------------|
| opening-identification.md | Core Rule 1: lichess chess-openings dataset | Pins the dataset; documents exact npm package source |
| opening-identification.md | Core Rule 2: Position-keyed EPD index | Documents EPD derivation as first-4-FEN-fields via chess.js |
| opening-identification.md | Core Rule 3: Move encoding is UCI long-algebraic | Key Interface documents moves: string[] parameter; chess.js normalizes UCI |
| opening-identification.md | Core Rule 4: Longest-prefix match | Documented as part of the walk-the-game algorithm (not a build step) |
| opening-identification.md | Core Rule 5: Last-known-opening lock | Documented as part of the walk-the-game algorithm |
| opening-identification.md | Formula 4: Index ≤ 150 KB gzip, ≤ 1 MB resident | Build step generates TypeScript Map — expected ~100–120 KB gzip |
| opening-identification.md | Open Question #4: chess.js EPD en passant convention | Documents spike requirement as blocking Validation Criterion |

## Performance Implications

- **CPU**: Zero runtime parsing cost. `Map.get()` is O(1). Walking a 40-ply game = 40 hash lookups = < 1 ms on any device.
- **Memory**: ~3,500 Map entries × ~80 bytes average = ~280 KB resident. Within the < 1 MB resident requirement.
- **Load Time**: Generated TypeScript Map is part of the app bundle. Contributes ~100–120 KB gzip to the total bundle. Loaded once as a module import — no lazy loading needed.
- **Network**: Zero (bundled at build time).

## Migration Plan

No existing implementation. This ADR establishes the initial opening index architecture.

## Validation Criteria

1. **[BLOCKING before Accepted — en passant spike]**
   Run the en passant EPD convention check:
   - Create a minimal test that plays `1.e4 e5 2.Nf3 Nc6` (a position where White just played a double-pawn push) via `chess.js`
   - Extract the EPD using `chess.fen().split(' ').slice(0, 4).join(' ')`
   - Compare to the EPD of the same position in the `chess-openings` dataset for that move sequence
   - If they match → no normalization needed; mark ADR Accepted
   - If they differ only in en passant field → add normalization: strip the ep field if no capture is possible; update the Key Interfaces section
   - If they differ in another field → investigate and resolve before proceeding

2. **[CI integration]**
   Add a `build:opening-index` script to `package.json` that runs before `build` and `test` scripts. CI must regenerate the index from the pinned dataset on every run (or check that the committed generated file is up to date with the pinned dataset version).

3. **[Bundle size CI gate]**
   Assert that the generated `opening-index.ts` compresses to < 150 KB gzip. Fail the build if exceeded.

4. **[Unit test coverage]**
   - `identifyOpening(['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4'])` returns `{ eco: 'C50', name: includes 'Italian', matchedPly: 5, isUnknown: false }`
   - `identifyOpening([])` returns `{ isUnknown: true }`
   - A transposition test: two move orders reaching the same Italian position return the same `eco` and `name`

## Related Decisions

- [ADR-0001](adr-0001-stockfish-build-versioning.md) — parallel concern (pinning a chess analysis asset)
- `design/gdd/opening-identification.md` — the GDD this ADR implements
- Future Post-Game Review implementation story — consumes `identifyOpening(completedGame.moves)`
