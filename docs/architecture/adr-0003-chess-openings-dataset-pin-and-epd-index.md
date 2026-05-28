# ADR-0003: chess-openings Dataset Version Pin and EPD Index Build

## Status
Accepted

> **Accepted 2026-05-28** — en passant spike complete (S1-03). No normalization needed.
> API simplified: `ECO.lookupSync(fen)` replaces build-time Map approach. See Validation Criterion 1 for full spike results.

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

**En passant convention (spike confirmed 2026-05-28)**: chess.js uses the **strict** ep convention — the ep target square is set only when the opponent has a pawn that can actually capture en passant. Positions without a capturing pawn show `ep="-"`. The `chess-openings` `ECO.lookupSync(fen)` accepts the full FEN and handles EPD derivation internally; it matches chess.js's strict convention with zero mismatch.

**Result: no normalization step needed.** `ECO.lookupSync(chess.fen())` can be called directly after each move.

**API simplification (spike finding)**: The `chess-openings` library exposes `ECO.lookupSync(fen)` that returns `{ _code, _name, _epd, _continuations } | undefined`. No build-time index generation script is needed — the library contains a pre-compiled opening book. The `identifyOpening(moves)` wrapper replays moves via chess.js and calls `lookupSync` after each move, tracking the last non-undefined result (longest-prefix match).

### 3. Longest-Prefix Collision Policy

When multiple dataset entries map to the same EPD (rare but documented in the GDD), the collision policy is:

1. Keep the entry with the **longest name** (more specific = more useful to the player)
2. Tie-break on **lexically lower ECO code** (stable, deterministic)

This matches the GDD's stated "collision policy (`longest-name-then-lexical-eco`)" and ensures the index build is deterministic across runs.

### 4. Runtime Lookup Architecture (revised from spike findings)

The `chess-openings` library ships a pre-compiled opening book internally. **No build-time index generation script is needed.** The opening identification composable calls `ECO.lookupSync(fen)` directly:

```typescript
// src/composables/use-opening-id.ts
import { ECO } from 'chess-openings'

const eco = new ECO()   // instantiate once (module-level singleton)

function identifyOpening(moves: string[]): OpeningResult {
  const chess = new Chess()
  let lastMatch: { eco: string; name: string; matchedPly: number } | null = null

  for (let i = 0; i < moves.length; i++) {
    chess.move(moves[i])
    const entry = eco.lookupSync(chess.fen())   // returns { _code, _name, ... } | undefined
    if (entry) {
      lastMatch = { eco: entry._code, name: entry._name, matchedPly: i + 1 }
    } else if (lastMatch) {
      break  // exited opening book — stop walking (optimization, not required for correctness)
    }
  }

  return lastMatch
    ? { eco: lastMatch.eco, name: lastMatch.name, matchedPly: lastMatch.matchedPly,
        bookExitPly: /* first ply after lastMatch where lookup returns undefined */ null,
        isUnknown: false, epd: chess.fen().split(' ').slice(0, 4).join(' ') }
    : { eco: null, name: null, matchedPly: 0, bookExitPly: null, isUnknown: true, epd: '' }
}
```

**Why runtime is fine**: The library's pre-compiled book is loaded once as a module import and held in memory. `lookupSync` is a synchronous O(1) hash probe per move — for a 40-move game, 40 probes < 1 ms. This meets the sync-lookup requirement without a custom build step.

**Version pin**: `"chess-openings": "0.1.1"` (exact pin in package.json, confirmed in package-lock.json). Display names are version-sensitive; exact pin protects test stability.

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

1. **[DONE 2026-05-28 — en passant spike complete]**
   - Played `1.e4` via chess.js. FEN: `rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1` — ep=`-` (strict, no Black pawn adjacent)
   - Played `1.e4 d5 2.e5 f5`. FEN ep=`f6` — ep target set correctly when capture IS possible
   - `ECO.lookupSync(chess.fen())` matched both positions correctly
   - **Conclusion**: chess.js strict convention = chess-openings strict convention. Zero mismatch. No normalization needed.
   - **API finding**: `lookupSync` returns `{ _code, _name, _epd, _continuations } | undefined`. Out-of-book returns `undefined`.
   - Spike script: `scripts/spike-adr0003-ep-convention.mjs` (kept for reference)

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
