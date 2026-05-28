# ADR-0005: Pinia Store Module Boundaries and CompletedGame Transport

## Status
Proposed

## Date
2026-05-28

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | Web APIs: Pinia 2, Vue 3, chess.js — Web App, no traditional game engine |
| **Domain** | Core / Game Lifecycle & State Management |
| **Knowledge Risk** | LOW — Pinia 2, Vue 3 Composition API, and chess.js are all well within LLM training data and stable. |
| **References Consulted** | `design/gdd/game-lifecycle.md` (Core Rules 2–10, States, Edge Cases EC-01..EC-14, AC-15..AC-20); `design/gdd/navigation-and-routing.md` (Predicate 1, Bidirectional Consistency); `docs/architecture/architecture.md` (Pinia gameStore API, Module Ownership) |
| **Post-Cutoff APIs Used** | None |
| **Verification Required** | None — all APIs are stable; verification is behavioral (test suite) |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | ADR-0004 (Proposed) — the in-game guard in this ADR reads `gameStore.isGameInProgress` via the router configuration established in ADR-0004 |
| **Enables** | Game Lifecycle implementation stories; PostGameReview implementation stories (both read `completedGame` from this store) |
| **Blocks** | None — can be written and initially implemented in parallel with ADR-0004 |
| **Ordering Note** | Must be implemented before any Game Lifecycle or Post-Game Review story begins |

## Context

### Problem Statement

The Game Lifecycle GDD requires several cross-module invariants that touch multiple systems: chess.js must be the sole authoritative game state (board is renderer only), `CompletedGame` must be transported from GameLifecycle to PostGameReview across a route change without using a Vue Router history-mode payload (which cannot carry objects), and `isGameInProgress` must become `false` before `router.push('/review')` or the navigation guard will falsely prompt. Without a formal ADR, a programmer could: (a) put `completedGame` into a route payload (wrong — lost on history-mode navigation), (b) let PostGameReview read chess.js state directly (wrong — coupling violation), or (c) set `isGameInProgress = false` *after* `router.push` (wrong — triggers the leave guard on the intended transition).

### Constraints

- **Vue Router history mode cannot carry object payloads** — `router.push({ name: 'review', params: {...} })` with an object payload is lost on any route that uses `history.pushState` (the state is not serializable to query params). Established in ADR-0004.
- **No circular dependencies** — GameLifecycle must not read from PostGameReview; PostGameReview must not write to gameStore.
- **Pinia 2 + Vue 3 Composition API** — the project standard (pinned in technical-preferences.md).
- **`chess.js` instance must not be reactive** — wrapping a `chess.js` instance in `ref()` or `reactive()` would trigger deep Vue reactivity proxying of its large internal state object, causing significant performance overhead. The chess.js instance lives as a plain `const` inside GameLifecycle.

### Requirements

- One canonical game store (`gameStore`) for v0 — no per-screen stores
- `isGameInProgress` is the single boolean that the navigation guard (ADR-0004) reads
- `completedGame` is the immutable, cross-route snapshot written by GameLifecycle on terminal and read by PostGameReview on entry
- The terminal detection priority order is formally documented (to prevent re-ordering bugs)
- `playerMoveTimes[]` indexing against player moves only (not global move index) must be contractually documented so PostGameReview's Formula F3 is implemented correctly

## Decision

### 1. v0 Pinia Store Inventory: Single `gameStore`

v0 has exactly one Pinia store: `gameStore` (defined in `src/stores/gameStore.ts`). No other stores are created in v0.

**Why one store, not per-system stores**: In v0, only two pieces of state cross system boundaries: `isGameInProgress` (read by the navigation guard and potentially by the result overlay) and `completedGame` (written by GameLifecycle, read by PostGameReview and GameExport). Everything else — the chess.js instance, the current phase, the AI skill level, the cursor in PostGameReview — is local component/composable state, not shared. A store per feature would add boilerplate for no benefit at this scale.

**Future MVP stores**: Difficulty System (skillLevel/movetimeMs per preset), GameHistory (persisted game records), Authentication (session) — all deferred. When they are added, each gets its own store file in `src/stores/`. The gameStore does not expand to hold non-game-lifecycle data.

### 2. `gameStore` Interface

```typescript
// src/stores/gameStore.ts
export const useGameStore = defineStore('game', () => {
  // Reactive state (cross-system)
  const isGameInProgress = ref(false)
  const completedGame = shallowRef<CompletedGame | null>(null)

  // Actions
  function setGameInProgress(value: boolean) {
    isGameInProgress.value = value
  }

  function setCompletedGame(game: CompletedGame) {
    completedGame.value = Object.freeze(game)   // immutable snapshot
  }

  function clearCompletedGame() {
    completedGame.value = null
  }

  return { isGameInProgress, completedGame, setGameInProgress, setCompletedGame, clearCompletedGame }
})
```

**Why `shallowRef` for `completedGame`**: `CompletedGame` contains a `moves: string[]` array and `playerMoveTimes: number[]` array. Using `ref()` would create a deep reactive proxy over these arrays, adding overhead for no benefit (PostGameReview reads `completedGame` once on mount, then reads its fields). `shallowRef` makes the store reactive at the top level (the store updates when the ref is replaced) without proxying the object's internals. Combined with `Object.freeze`, this enforces immutability at both the Vue and JavaScript layers.

**Why `Object.freeze` on `completedGame`**: The `CompletedGame` record is a closed ledger — it describes a finished game and must not change after assembly. `Object.freeze` prevents any system from accidentally writing to `completedGame.moves.push(...)` or similar. Any attempt to mutate it will throw in strict mode (silently no-op in sloppy mode — TypeScript `readonly` provides the compile-time enforcement; `Object.freeze` provides the runtime enforcement).

### 3. chess.js is Sole Authoritative Game State — Board is Renderer Only

GameLifecycle (in `src/composables/useGameLifecycle.ts` or `src/views/PlayView.vue`) owns a **single `chess.js` instance** as a non-reactive constant inside the composable. The ChessBoard component receives `fen`, `playerColor`, and `disabled` as props and emits `move-made` events. It never holds or mutates game state.

**The board is a rendering surface.** This means:
- No other system (PostGameReview, OpeningIndex, GameExport) reads the live chess.js instance — they read `completedGame.moves` from the store or derive FEN from a local replay
- The `fen` prop from the ChessBoard's `move-made` event is for sanity verification only — GameLifecycle derives the authoritative FEN from `chess.fen()` after applying the move to its chess.js instance

**Why**: Coupling any secondary system to the live chess.js instance creates a hidden dependency on GameLifecycle's internal state. PostGameReview replays the game from scratch via `completedGame.moves`; OpeningIndex receives `completedGame.moves` as a parameter; neither needs a reference to the live engine.

### 4. CompletedGame as Canonical Cross-Route Transport

`CompletedGame` is assembled by GameLifecycle at terminal detection and immediately written to `gameStore.completedGame` (via `setCompletedGame`). It is the **sole canonical source** for:
- PostGameReview's analysis loop (reads `completedGame.moves` on entry)
- GameExport's PGN serialization (reads `completedGame.moves`, `result`, `endReason`, etc.)
- Navigation guard's `hasFinishedGameInStore` check (reads `gameStore.completedGame !== null`)

**Why the store and NOT a route payload**: Vue Router history mode uses `pushState` for navigation. Object payloads passed via `router.push({ state: { game: completedGame } })` are serialized as part of the history entry — they survive within the same session but the pattern is fragile and non-standard. More critically, if PostGameReview is deep-linked directly (`/review`), the route payload is absent. The store is always present and consistent regardless of how the route was entered.

**CompletedGame is immutable after assembly**: `Object.freeze` at write time (Decision §2) plus TypeScript `Readonly<CompletedGame>` typing ensures no consumer can modify it. The `moves[]` array is a cloned snapshot (not the live internal array) — GameLifecycle must copy `moves` before writing to the store.

### 5. Disarm-Before-Navigate Invariant

The sequence when a game ends naturally is:

```
1. GameLifecycle detects terminal → assemble CompletedGame
2. setCompletedGame(completedGame)      ← write to store
3. isGameInProgress = false             ← MUST come before step 4
4. router.push('/review')
```

**Why this order is mandatory**: The navigation guard (ADR-0004) fires synchronously on `router.push`. At the moment it evaluates `isGameInProgress`, the value must already be `false` — otherwise the guard sees an in-progress game and shows the "Leave this game?" dialog on the intended, correct transition. Setting `isGameInProgress = false` *before* `router.push` is what disarms the guard for this transition without any extra `isNaturalGameEndTransition` flag.

**Who enforces this**: This ADR declares it as a hard implementation requirement. The unit test for AC-20 (Game Lifecycle GDD) verifies it: a spy on `router.push` asserts it is called only after `isGameInProgress.value === false`.

### 6. Terminal Detection Priority Order

GameLifecycle evaluates terminal conditions after every move in this fixed order. The order matters — `isStalemate()` and `isDraw()` overlap in some chess.js versions; always evaluate `isCheckmate()` first:

| Priority | chess.js check | `endReason` |
|---|---|---|
| 1 | `isCheckmate()` | `"checkmate"` |
| 2 | `isStalemate()` | `"stalemate"` |
| 3 | `isThreefoldRepetition()` | `"threefold"` |
| 4 | `isInsufficientMaterial()` | `"insufficient-material"` |
| 5 | `isDraw()` (fallthrough) | `"fifty-move"` |

Stop at the first match. The fallthrough label assumption for priority 5 (`isDraw()` → `"fifty-move"`) is valid only because priorities 2–4 already handle every other draw type. If chess.js is updated, re-verify this.

### 7. `playerMoveTimes[]` Indexing Contract

`playerMoveTimes[j]` is the thinking time for the *j*-th player move (0-indexed), NOT the *j*-th ply in the full game. PostGameReview Formula F3 maps ply index `i` to the correct `playerMoveTimes` slot:

```typescript
// from post-game-review GDD Formula F3
isPlayerMove[i] =
  (playerColor === 'white' && i % 2 === 0) ||
  (playerColor === 'black' && i % 2 === 1)

playerMoveIndex[i] =
  playerColor === 'white' ? i / 2 : (i − 1) / 2
```

**Why this matters**: A game with N total plies will have `moves.length = N` but `playerMoveTimes.length = ceil(N/2)` or `floor(N/2)` depending on who played last. PostGameReview must guard `playerMoveIndex[i] < completedGame.playerMoveTimes.length` before reading.

### Architecture Diagram

```
GameLifecycle (PlayView composable)
  │
  ├─ chess.js instance (non-reactive, authoritative)
  ├─ phase: 'SETUP' | 'PLAYER_TURN' | 'AI_THINKING' | 'GAME_OVER'
  │
  │  On terminal:
  │    1. assembleCompletedGame() → Object.freeze(completedGame)
  │    2. gameStore.setCompletedGame(completedGame)
  │    3. gameStore.setGameInProgress(false)     ← disarm guard
  │    4. router.push('/review')                 ← guard evaluates false → allows
  │
  ├─ ChessBoard (renderer)    ← props: fen, playerColor, disabled
  │                           → events: move-made
  │
  └─ playEngine.play()        ← Chess Engine Integration (ADR-0001/0002)

gameStore (Pinia)
  ├─ isGameInProgress: ref<boolean>(false)
  └─ completedGame: shallowRef<CompletedGame | null>(null)   ← frozen

PostGameReview (ReviewView)
  └─ reads gameStore.completedGame on mount
     → replays moves via local chess.js instance
     → calls reviewEngine.analyze() per position

GameExport (Play/ReviewView)
  └─ reads gameStore.completedGame
     → chess.pgn() serialization

AppRouter (ADR-0004)
  └─ reads gameStore.isGameInProgress for guard
```

### Key Interfaces

```typescript
// CompletedGame — cross-module transport type
interface CompletedGame {
  readonly moves: readonly string[]          // UCI long-algebraic, e.g. ["e2e4", "e7e5"]
  readonly playerColor: 'white' | 'black'
  readonly result: '1-0' | '0-1' | '1/2-1/2'
  readonly endReason: 'checkmate' | 'resignation' | 'stalemate' |
                      'threefold' | 'fifty-move' | 'insufficient-material'
  readonly completedAt: number               // epoch ms
  readonly aiSkillLevel: number              // 0–20
  readonly playerMoveTimes: readonly number[] // ms per player move; indexed against PLAYER moves only
  readonly isTerminal: true
}

// gameStore — Pinia store
interface GameStore {
  isGameInProgress: boolean                  // default false; set true at game start, false before navigate-to-review
  completedGame: Readonly<CompletedGame> | null
  setGameInProgress(value: boolean): void
  setCompletedGame(game: CompletedGame): void
  clearCompletedGame(): void
}

// GameLifecycle phase state machine — local, not in store
type GamePhase = 'SETUP' | 'PLAYER_TURN' | 'AI_THINKING' | 'GAME_OVER'
```

## Alternatives Considered

### Alternative 1: Route Payload for CompletedGame Transport

- **Description**: Pass `CompletedGame` as a Vue Router navigation state: `router.push({ name: 'review', state: { game: completedGame } })`. PostGameReview reads it from `route.state.game` on mount.
- **Pros**: Feels natural — the data travels with the navigation event. No store required for this one piece of data.
- **Cons**: Vue Router history mode cannot carry non-serializable objects in query params. Navigation state (`history.state`) technically supports objects but: (a) the data is lost if the user refreshes or the history entry is evicted, (b) PostGameReview cannot deep-link to `/review` without the state, (c) this pattern is fragile and not the idiomatic Vue 3 + Pinia approach. The architecture doc explicitly calls out this pitfall.
- **Rejection Reason**: The store is the canonical cross-route transport channel in a Pinia-based app. Route state is for transient UI hints (scroll position, etc.), not domain objects.

### Alternative 2: Global EventBus for CompletedGame

- **Description**: Emit a `game-completed` event on a global EventBus. PostGameReview subscribes on mount and receives the payload.
- **Pros**: Decoupled — GameLifecycle doesn't need to know about the store.
- **Cons**: The event fires before PostGameReview mounts (it fires at the `GAME_OVER` transition; PostGameReview mounts only after `router.push` completes). A subscriber that isn't yet alive cannot receive the event. PostGameReview would need a fallback (check the store if event was missed), which re-introduces the store anyway.
- **Rejection Reason**: Event delivery races with component mount in SPA routing. The `game-completed` event is still emitted (for fire-and-forget consumers like GameExport), but it is NOT the transport mechanism for PostGameReview — the store is.

### Alternative 3: Per-Feature Pinia Stores (reviewStore, gameStore, etc.)

- **Description**: Each feature system gets its own Pinia store: `usePlayStore`, `useReviewStore`, `useExportStore`, etc.
- **Pros**: Strict module boundaries; each store is smaller and simpler to reason about.
- **Cons**: In v0, only two pieces of state genuinely cross module boundaries. Creating five stores to house two cross-boundary fields and many local-only fields is premature — it adds indirection without benefit. Post-MVP, when Difficulty System, GameHistory, and Authentication each have real cross-boundary state, per-system stores become appropriate.
- **Rejection Reason**: Over-engineered for v0 scope. One store handles the two cross-boundary needs; additional stores land when additional cross-boundary state exists.

### Alternative 4: chess.js in the Pinia Store (Reactive Game State)

- **Description**: Put the chess.js instance in a `gameStore` ref so all systems can reactively observe the current position.
- **Pros**: PostGameReview, OpeningIndex, etc. could access the live chess.js state without receiving it via `completedGame`.
- **Cons**: chess.js has a large internal object graph. Wrapping it in a Vue reactive proxy causes every `chess.move()` call to trigger deep reactive updates across the entire component tree — significant performance hit on a 60fps board. Additionally, PostGameReview and OpeningIndex need the *completed* game's history, not the *live* game state — they replay from `moves[]` anyway.
- **Rejection Reason**: Performance regression + architectural mismatch. chess.js stays as a non-reactive `const` inside GameLifecycle; PostGameReview replays from the frozen `completedGame.moves` snapshot.

## Consequences

### Positive

- Single source of truth for cross-module game state; no duplicate copies or sync issues
- `completedGame` survives route changes and direct navigation to `/review` (no route-payload race)
- `Object.freeze` provides runtime immutability enforcement; no system can accidentally corrupt the record
- Disarm-before-navigate invariant prevents false-alarm leave guards on the intended game-end transition
- `chess.js` as a non-reactive instance prevents deep-proxy overhead on every move

### Negative

- gameStore is a shared global — any system can technically read both fields. Convention (and TypeScript types) must discourage PostGameReview from writing to `isGameInProgress`.
- `shallowRef` + `Object.freeze` are non-obvious to a programmer unfamiliar with the pattern — requires code comment and ADR reference in the store implementation

### Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| `router.push('/review')` called before `isGameInProgress = false` (disarm-before-navigate violated) | Low | High — leave dialog appears on the correct end-game transition, confusing the player | Unit test asserts the order: spy on `router.push` and assert `isGameInProgress.value === false` at call time |
| `completedGame.moves` mutated by a consumer after assembly | Low | Medium — corrupts all subsequent reads | `Object.freeze` + `readonly string[]` TypeScript type; runtime freeze throws in strict mode |
| Post-Game Review reads `completedGame` before `setCompletedGame` is called (timing race) | Very Low | Medium — null ref error | `/review` route guard redirects to `/` if `completedGame === null`; PostGameReview can assume it is non-null on mount |
| Future store fields added directly to gameStore instead of a dedicated store | Low | Low — gameStore grows unwieldy | Architecture review (run `/architecture-review` when a new store candidate emerges in MVP) |

## GDD Requirements Addressed

| GDD System | Section / Requirement | How This ADR Addresses It |
|------------|----------------------|--------------------------|
| game-lifecycle.md | Core Rule 2: chess.js is sole authoritative state — board is renderer only | Decision §3: chess.js instance non-reactive in composable; board receives only FEN prop |
| game-lifecycle.md | Core Rule 6: 5-priority terminal detection order | Decision §6: terminal detection table with fixed priority order documented |
| game-lifecycle.md | Core Rule 7: CompletedGame written to Pinia store as canonical transport | Decision §4: `shallowRef<CompletedGame>` in gameStore; Object.freeze on write |
| game-lifecycle.md | Core Rule 8: `isGameInProgress = false` before `router.push('/review')` (disarm-before-navigate) | Decision §5: ordering invariant with enforcement mechanism documented |
| game-lifecycle.md | Core Rule 9: `playerMoveTimes[]` indexed against player moves only | Decision §7: contract documented with F3 formula reference and guard requirement |
| navigation-and-routing.md | Predicate 1: `shouldGuardNavigation = isGameInProgress AND (target ≠ current)` | Decision §2: `isGameInProgress` is the sole boolean the guard reads from gameStore |

## Performance Implications

- **CPU**: `shallowRef` + `Object.freeze` on `completedGame` eliminates deep-reactive traversal of a 40-move game's arrays. Impact: negligible per call, but avoiding deep proxy on every move is worth the pattern.
- **Memory**: gameStore holds at most one `CompletedGame` snapshot at a time. At ~80 bytes/move × 40 moves + 5 scalars ≈ 3.5 KB. Negligible.
- **Load Time**: Not applicable.
- **Network**: Not applicable.

## Migration Plan

No existing implementation. This ADR establishes the initial store architecture for new implementation.

## Validation Criteria

1. **[Unit — disarm-before-navigate]** Test asserts that the call sequence is: `setCompletedGame()` → `setGameInProgress(false)` → `router.push('/review')` — in this exact order. No synchronous gap.

2. **[Unit — completedGame immutability]** Test asserts that `completedGame.moves.push('a2a3')` throws (or silently no-ops in non-strict mode but is typed readonly). TypeScript compilation with `readonly string[]` must pass without a cast.

3. **[Unit — terminal detection priority]** Test exercises positions where multiple terminal conditions could match simultaneously (e.g., a stalemate position that `isDraw()` also matches) and asserts the correct `endReason` based on priority order.

4. **[Unit — playerMoveTimes indexing]** Test with a 5-ply game (White: moves 0, 2, 4; Black: moves 1, 3) asserts `playerMoveTimes.length === 3` and `playerMoveTimes[2]` is the time for ply index 4, not ply index 2.

5. **[Unit — store clearing on new game]** Test asserts that `clearCompletedGame()` sets `completedGame` to `null`, and that a new game's `isGameInProgress` starts at `false`.

6. **[E2E — review deeplink redirect]** Playwright: direct navigation to `/review` with no game in store → redirected to `/` + HomeView rendered (no null-ref error, no empty review screen).

## Related Decisions

- [ADR-0004](adr-0004-vue-router-history-mode-and-github-pages-spa-fallback.md) — the in-game guard reads `gameStore.isGameInProgress` from this store
- [ADR-0002](adr-0002-web-worker-isolation-and-uci-protocol.md) — `playEngine.play()` called by GameLifecycle; AbortController pattern used for resign mid-AI-turn
- `design/gdd/game-lifecycle.md` — the GDD this ADR implements
- `design/gdd/navigation-and-routing.md` — bidirectional note on disarm-before-navigate ordering
