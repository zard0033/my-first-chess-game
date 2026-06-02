# Chess Training Companion — Master Architecture

> **⚠️ Engine superseded (2026-06-02, S10-06):** This 2026-05-28 blueprint describes the SF16
> two-build engine model (HCE Play + NNUE Review, separate WASM builds, Formula-4 memory split).
> The engine was migrated to **Stockfish 18 Lite single-threaded** (one build, NNUE embedded in the
> ~7.3 MB WASM, no external network, no COOP/COEP). Engine-specific rows/risks below (HCE spike,
> two-build model, `stockfish-nnue-16` paths) are historical. Current engine of record:
> ADR-0001 (amendment 2026-06-02); current registry: `docs/registry/architecture.yaml`.

## Document Status

| Field | Value |
|-------|-------|
| **Version** | 1.0 |
| **Last Updated** | 2026-05-28 |
| **Stage** | Systems Design → Technical Setup |
| **Stack** | TypeScript 5 · Vue 3 · Pinia 2 · Vue Router 4 · Vite 5 · Tailwind 3 |
| **GDDs Covered** | chess-board-and-move-system, chess-engine-integration, opening-identification, navigation-and-routing, game-lifecycle, move-annotation-display, post-game-review, game-export-share (all 8 v0 GDDs) |
| **ADRs Referenced** | ADR-0001 (Proposed — HCE spike pending), ADR-0002 (Proposed), ADR-0003 (Proposed — en passant spike pending), ADR-0004 (Proposed), ADR-0005 (Proposed), ADR-0006 (Proposed — drawable spike pending), ADR-0007 (Proposed — iPhone depth spike pending), ADR-0008 (Proposed — iOS Safari CSP spike pending) |
| **TR Coverage** | 44 requirements extracted, 36 covered by ADRs (ADR-0001: 2, ADR-0002: 6, ADR-0003: 4, ADR-0004: 5, ADR-0005: 6, ADR-0006: 5, ADR-0007: 7, ADR-0008: 1); remaining 8 ADR-TBD: TR-chess-board-001..007, TR-game-export-004 |

> **Technical Director Sign-Off**: 2026-05-28 — APPROVED WITH CONDITIONS (C-1..C-7 addressed; ADR-0001 HCE spike must resolve before v0 coding begins)
> **Lead Programmer Feasibility**: 2026-05-28 — FEASIBLE WITH CONCERNS ACCEPTED (C-1/C-2/C-3/C-5/C-7 applied to document; C-4 to ADR-0007 exit criteria; C-6 to ADR-0008 iOS Safari CSP verification requirement)

---

## Engine Knowledge Gap Summary

> **Note**: This project does NOT use a traditional game engine (Godot/Unity/Unreal).
> The `docs/engine-reference/godot/` directory is a CCGS template default and is **not
> applicable**. Knowledge gap analysis covers the actual web technology stack.

| Risk | Domain | Implication |
|------|--------|-------------|
| 🔴 HIGH | **stockfish.wasm on iPhone Safari 16+** | iOS Web Worker lifecycle, WASM perf, suspend/resume behavior are implementation unknowns. Tuning knobs in Chess Engine GDD (reviewTargetDepth, reviewMaxMoveTimeMs) are provisional. Real-device spike required before finalizing defaults. |
| 🔴 HIGH | **HCE build availability (lichess fork)** | Engine GDD OQ#6: both HCE + NNUE builds must be confirmed as separate distributions. If HCE is unavailable, Formula 4 memory budget and Play Mode architecture must be revised. Blocks v0 implementation of Chess Engine. |
| 🔴 HIGH | **iOS Safari PWA + WASM caching** | `Cache Storage` ~50MB per-origin limit on some iOS configs. NNUE weights (~40MB) may hit `QuotaExceededError`. Edge Case M5 in Engine GDD documents the fallback (in-memory fetch, no caching). |
| 🟡 MEDIUM | **vue3-chessboard `drawable` API** | Move Annotation OQ#1: whether chessground's native drawable API can express per-role neutral colors + edge-terminated arrowheads requires a 1-day spike. Determines ADR-0006. |
| 🟡 MEDIUM | **chessground 9.x keyboard navigation** | Chess Board OQ#7: chessground 9.x does NOT provide keyboard nav. Custom roving-tabindex focus manager required. Must verify API surface before WCAG ACs can pass. |
| 🟡 MEDIUM | **chess.js EPD en passant convention** | Opening ID OQ#4: must confirm chess.js EPD output matches lichess dataset convention, or normalize both sides consistently. Blocks opening index build. |
| 🟢 LOW | Vue 3, TypeScript 5, Pinia 2, Vue Router 4, Vite 5, chess.js, Supabase SDK v2 | All stable, well within training data. |

---

## System Layer Map

```
┌──────────────────────────────────────────────────────────────────┐
│  FEATURE LAYER                                                   │
│  PostGameReview                  GameExport                      │
├──────────────────────────────────────────────────────────────────┤
│  CORE LAYER                                                      │
│  GameLifecycle                   MoveAnnotationDisplay           │
├──────────────────────────────────────────────────────────────────┤
│  FOUNDATION LAYER                                                │
│  ChessBoard    ChessEngine 🔴    OpeningIndex    AppRouter       │
├──────────────────────────────────────────────────────────────────┤
│  PLATFORM LAYER                                                  │
│  Browser APIs: Web Workers, WASM, Clipboard API, Web Share API   │
│  iOS Safari 16+  ·  GitHub Pages  ·  Supabase (MVP)             │
└──────────────────────────────────────────────────────────────────┘

MVP Layer (GDDs not yet authored):
  Authentication  ·  DifficultySystem  ·  DataSync  ·  GameHistory
  SkillScoring  ·  LevelProgression

Polish Layer (GDDs not yet authored):
  PWASupport  ·  AudioSystem  ·  Settings
```

### Layer Definitions

| Layer | Purpose | Rule |
|-------|---------|------|
| **Feature** | Gameplay systems that produce the player's learning experience | May depend on Core and Foundation; never depended on by Core |
| **Core** | Orchestration and rendering systems that combine Foundation primitives | May depend on Foundation; depended on by Feature |
| **Foundation** | Primitives with no internal dependencies; bottlenecks for everything above | Depend on nothing inside the app; depended on by Core and Feature |
| **Platform** | Browser APIs, OS constraints, deployment target | Never depended on directly — accessed only through Foundation wrappers |

### v0 System → Layer Assignment

| System | Layer | Bottleneck? | Notes |
|--------|-------|------------|-------|
| Chess Board & Move System | Foundation | Yes — every visual system depends on it | 🟡 chessground 9.x keyboard nav spike needed |
| Chess Engine Integration | Foundation | Yes — Play and Review both depend on it | 🔴 HCE availability spike needed |
| Opening Identification | Foundation | No | Pure sync lookup; no dependents except PostGameReview |
| Navigation & Routing | Foundation | Yes — app shell for all screens | Soft coupling to gameStore only |
| Game Lifecycle | Core | Yes — terminal detection + CompletedGame | Coordinates ChessBoard + ChessEngine |
| Move Annotation Display | Core | No | Rendering-only; depends on ChessBoard |
| Post-Game Review | Feature | No (terminal feature in v0) | Heaviest system on iPhone — 🔴 depth spike |
| Game Export / Share | Feature | No (leaf feature) | PGN + prompt assembly only |

---

## Module Ownership

### Foundation Layer

#### Module: ChessBoard
- **Owns**: Board rendering, input state machine (IDLE → PIECE_SELECTED → MOVING → MOVING_PROMOTION → PROMOTING → DISABLED), FEN display, drag/tap interaction, promotion dialog, check indicator, overlay z-order contract
- **Exposes**:
  - Props: `fen: string`, `playerColor: 'white' | 'black'`, `disabled: boolean`
  - Event: `move-made({ from, to, promotion?, fen, animationDoneAt: Promise<void> })`
  - Ref: `boardRef: HTMLElement`
  - Method: `squareToRect(square: Square): { x, y, width, height } | null` — orientation-aware, relative to boardRef top-left
- **Consumes**: FEN + playerColor + disabled props from GameLifecycle
- **Does NOT own**: game state, move history, engine analysis, annotation rendering
- **External libs**: `vue3-chessboard`, `chessground` (bundled), `chess.js` (bundled)
- **Bundle constraint**: ≤ 120 KB gzipped

#### Module: ChessEngine 🔴
- **Owns**: Two stockfish Web Workers, UCI protocol state machines, AbortSignal cancellation, requestId race guard, idle-terminate timer (Review worker), visibility-change liveness probe
- **Exposes**:
  - `playEngine.init(): Promise<void>`
  - `playEngine.play({ fen, skillLevel, movetimeMs, signal? }): Promise<PlayResult>`
  - `reviewEngine.analyze({ fen, targetDepth?, movetimeMs?, signal? }, onProgress?): Promise<ReviewResult>`
  - `playEngine.dispose()` / `reviewEngine.dispose()`
  - Events: `engine-thinking-started`, `engine-thinking-finished` (for future Audio System)
- **Consumes**: Nothing (Foundation)
- **Does NOT own**: skill-level-to-difficulty mapping (Difficulty System), move-quality classification (PostGameReview), opening detection (OpeningIndex)
- **External libs**: `stockfish` HCE build (Play), `stockfish-nnue-16.wasm` lichess fork (Review) 🔴
- **Thread model**: `postMessage` only — no SharedArrayBuffer 🔴 (deployment constraint: GitHub Pages, no COOP/COEP)
- **Memory budget**: peak ≤ 150 MB (Play 25 MB + Review 80 MB + App 40 MB = 145 MB)

#### Module: OpeningIndex
- **Owns**: Pre-built EPD → `{ eco, name, ply }` Map (compiled at build time from chess-openings TSV), `identifyOpening()` walk algorithm, `identifyPosition()` single-lookup
- **Exposes**:
  - `identifyOpening(moves: Move[]): OpeningResult` — sync, O(N) hash lookups
  - `identifyPosition(fenOrEpd: string): { eco: string; name: string } | null` — sync, single Map.get
- **Consumes**: Nothing (build-time only after index compilation)
- **Does NOT own**: move-quality evaluation, opening coaching, repertoire recommendations
- **External libs**: `chess-openings` (build-time data source, must be pinned — see ADR-0003 🟡), `chess.js` (runtime: replays current game's moves for EPD derivation)
- **Bundle constraint**: index ≤ 150 KB gzipped, ≤ 1 MB resident

#### Module: AppRouter
- **Owns**: Route table, `beforeRouteLeave` guard on PlayView, `beforeunload` listener lifecycle, scroll/focus reset on navigation, 404 catch-all, popstate restoration via `history.pushState`
- **Exposes**: Routes, guards (consumed by Vue Router internally)
- **Consumes**: `gameStore.isGameInProgress` (Pinia reactive, soft coupling — not a build-time dependency)
- **Does NOT own**: game state, persistence, auth (MVP guards reserved)
- **External libs**: `vue-router ^4.x`, `vue ^3.x`, `pinia ^2.x`

### Core Layer

#### Module: GameLifecycle
- **Owns**: Single `chess.js` instance (authoritative game state), `moves[]` (UCI long-algebraic), phase state machine (SETUP → PLAYER_TURN → AI_THINKING → GAME_OVER), `playerMoveTimes[]` (indexed against player moves only), `CompletedGame` assembly
- **Exposes**:
  - `gameStore.isGameInProgress: boolean` (reactive, Pinia)
  - `gameStore.completedGame: CompletedGame | null` (written at terminal, immutable after assembly)
  - Event: `game-completed(CompletedGame)` (fire-and-forget for leaf consumers)
- **Consumes**: ChessBoard `move-made` event, ChessEngine `playEngine.play()`
- **Invariants**:
  - `isGameInProgress` must be set `false` **before** `router.push('/review')` (disarm-before-navigate — see Navigation GDD)
  - `completedGame` is the canonical handoff channel to PostGameReview (not event payload, which cannot survive a route change)
- **External libs**: `chess.js` (bundled via vue3-chessboard)

#### Module: MoveAnnotationDisplay
- **Owns**: SVG overlay positioned over ChessBoard, arrow/highlight rendering (Formula 2 geometry), eval bar + eval badge (Formula 1 + Formula 3), rAF resize throttle (Formula 4), sign normalization to White's perspective
- **Exposes**: Props `annotations: Annotation[]`, `evaluation: { evalCp?, evalMate?, sideToMove } | null`
- **Consumes**: ChessBoard `boardRef` + `squareToRect()` (geometry source — never computes its own square coordinates)
- **Invariants**:
  - `pointer-events: none` — zero game state side effects
  - Consumer (PostGameReview) must **not** pre-flip `evalCp`/`evalMate` — this module normalizes internally
  - `lastMove` is NOT a managed role — Chess Board owns last-move tint in all modes
  - Emotive labels (`quality`, `judgment`, `brilliant`, `blunder`, etc.) are structurally excluded from `Annotation.role`
- **External libs**: chessground `drawable` API OR custom SVG (resolved by ADR-0006 spike 🟡)

### Feature Layer

#### Module: PostGameReview 🔴
- **Owns**: Two-pass analysis loop (preview depth-12 → deep depth-22), cursor state, `analysisResults[]` (written progressively), `biggestSwingCursor` (computed once at COMPLETE), F2 cpLoss formula, F2b mate transition labels, depth-comparability guard (Rule 22a), `sessionStorage` persistence schema, mobile calm default presentation
- **Exposes**: Review screen UI (no public API — terminal feature in v0)
- **Consumes**: `gameStore.completedGame` (Pinia), `reviewEngine.analyze()`, `identifyOpening()`, MoveAnnotationDisplay props, ChessBoard FEN prop
- **Invariants**:
  - `AbortController` MUST be created with `markRaw(new AbortController())` — NEVER wrapped in `ref()` or `reactive()` (C-7 fix: this is a typed-interface-level constraint, not just an implementation note — Vue reactive proxy on AbortController causes signal replacement on `.value` assignment, breaking cancellation silently)
  - `analysisResults[i]` written immediately on completion (progressive disclosure)
  - `biggestSwingCursor` computed **once** at COMPLETE — never moves while player is reading
  - Pass 1 (preview) is never cut by the time budget; Pass 2 may be cut at `REVIEW_TOTAL_TIME_BUDGET_MS`
  - `pv` field is NOT persisted to sessionStorage (size guard — only `{ bestMove, evalCp?, evalMate?, depthReached, pass }` stored)
- **External libs**: chess.js (sideToMove derivation from position)

#### Module: GameExport
- **Owns**: PGN serialization (chess.js `.pgn()`), Seven Tag Roster generation, `RESULT_PLAIN` natural-language mapping, Claude.ai prompt template assembly, Tier-1/2/3 clipboard delivery state machine (Web Share → Clipboard API → textarea fallback)
- **Exposes**: "Analyze with Claude" button + state machine (IDLE → SHARING/COPYING → SUCCESS → FALLBACK)
- **Consumes**: `gameStore.completedGame` (Pinia) or `game-completed` event
- **Invariants**:
  - `clipboardWriteText()` must be called **synchronously** inside the tap gesture (iOS user-activation requirement)
  - Payload assembler must be a **pure synchronous function** (no async boundary before clipboard write)
  - On iOS: once `navigator.share()` is called, the gesture is spent — SHARING → COPYING retry is forbidden; use FALLBACK instead
  - C-5 fix: FALLBACK trigger conditions — transition to FALLBACK on ANY of: (a) `navigator.share()` rejects with a non-AbortError (system error); (b) `navigator.share()` resolves but the platform cannot confirm delivery (acceptable — treat as SUCCESS). AbortError (user dismissed sheet) → return to IDLE, no FALLBACK. Clipboard write `NotAllowedError` → FALLBACK. This prevents the FALLBACK from appearing on intentional cancels while still catching genuine failures.
- **External libs**: chess.js, Clipboard API (platform), Web Share API (platform)

### Dependency Graph

```
PostGameReview ──► GameLifecycle ──► ChessBoard
       │                 │
       │           ChessEngine
       │
       ├──► OpeningIndex
       │
       └──► MoveAnnotationDisplay ──► ChessBoard

GameExport ──────► GameLifecycle

AppRouter ────────► gameStore (GameLifecycle)
```

---

## Data Flow

### 1. Play Turn Cycle (Frame Update Path)

```
User input (drag or tap)
  → ChessBoard state machine transitions
  → ChessBoard emits: move-made({ from, to, fen, animationDoneAt })
  → GameLifecycle:
      1. append UCI string to moves[]
      2. apply chess.js.move({ from, to, promotion })
      3. await animationDoneAt   ← wait for board animation
      4. run terminal detection
      5. if terminal → assemble CompletedGame → write to gameStore → emit game-completed
      6. else → transition AI_THINKING
  → playEngine.play({ fen, skillLevel, movetimeMs })
      → [Web Worker 1: stockfish HCE] UCI computation
      → resolves: { bestMove }
  → GameLifecycle:
      1. min-display pad (max(0, 500 - elapsed))
      2. chess.js.move(bestMove)
      3. append to moves[]
      4. push updated FEN prop to ChessBoard
      5. run terminal detection
      6. start playerThinkingTimer
      7. transition PLAYER_TURN
```

### 2. Post-Game Analysis Path

```
Player taps "Review" on GAME_OVER screen
  → GameLifecycle: isGameInProgress = false (disarm-before-navigate)
  → router.push('/review')
  → PostGameReview mounts, loads gameStore.completedGame
  → identifyOpening(completedGame.moves) [sync, one-time]
  → new AbortController (markRaw)
  → reviewEngine: send ucinewgame for this gameId

  Pass 1 (positions 0..N-1):
    loop i in 0..N-1:
      check abortController.signal.aborted → exit if true
      reviewEngine.analyze({ fen[i], targetDepth: 12, movetimeMs: 1500 })
        → [Web Worker 2: stockfish NNUE — lazy-loaded on first call]
      → write analysisResults[i] = { ...result, pass: 'preview' }
      → flush to sessionStorage (throttled, pv stripped)
      → update UI progressively

  Pass 2 (positions 0..N-1, bounded by REVIEW_TOTAL_TIME_BUDGET_MS):
    loop i in 0..N-1:
      check abortController.signal.aborted → exit if true
      check elapsed >= REVIEW_TOTAL_TIME_BUDGET_MS → stop (retain preview results)
      reviewEngine.analyze({ fen[i], targetDepth: 22, movetimeMs: 10000 })
      → write analysisResults[i] = { ...result, pass: 'deep' }
      → flush sessionStorage

  → store.state = COMPLETE
  → compute biggestSwingCursor (deep pairs only, lowest index on tie)
```

### 3. Navigation Guard Flow

```
isGameInProgress = true (game active on /play)
  → Any navigation away from /play:

  [In-SPA navigation — router beforeRouteLeave / beforeEach]
    → show ConfirmDialog (or window.confirm in v0)
    → Confirm: router.push(target); removeEventListener('beforeunload')
    → Cancel: stay on /play (do NOT reset scroll/focus — not a completed transition)

  [Popstate — browser Back/swipe]
    → synchronously: history.pushState('/play')  ← restore before any await
    → then: show ConfirmDialog
    → Confirm: router.push(original-target)
    → Cancel: do nothing (URL already restored to /play)

  [Full-page exit — beforeunload]
    → handler sets event.returnValue (browser-native prompt only)
    → disarmed when isGameInProgress = false
```

### 4. Thread Boundaries

| Thread | Contents | Communication |
|--------|---------|---------------|
| Main thread | Vue app, Pinia, GameLifecycle, PostGameReview, AppRouter, all component rendering | — |
| Web Worker 1 (Play) | stockfish HCE — long-lived, spawned at first game start | `postMessage` only |
| Web Worker 2 (Review) | stockfish NNUE — lazy-loaded, auto-terminates after 30s idle | `postMessage` only |

**Cross-thread invariant**: No `SharedArrayBuffer`. No `COOP/COEP` headers. Single-threaded WASM only. 🔴 (GitHub Pages deployment constraint)

### 5. Initialization Order

```
1. Vite build → chess-openings index compiled to src/data/openings-index.generated.ts
2. App shell mounts (AppRouter, AppShell) — eager load
3. HomeView lazy-loaded on first /
4. User starts game → PlayView lazy-loaded → ChessBoard + GameLifecycle initialize
5. First game.start() → playEngine.init() → Web Worker 1 spawned, HCE downloaded
6. Game ends → user taps Review → ReviewView lazy-loaded → PostGameReview initializes
7. First reviewEngine.analyze() call → Web Worker 2 spawned, NNUE downloaded (~40 MB) 🔴
```

---

## API Boundaries

### ChessBoard Component

```typescript
// Props (parent → component)
props: {
  fen: string                           // current position (FEN)
  playerColor: 'white' | 'black'        // human's assigned side
  disabled: boolean                     // true during opponent turn or GAME_OVER
}

// Events (component → parent)
emit('move-made', {
  from: Square                          // UCI from-square, e.g. 'e2'
  to: Square                            // UCI to-square, e.g. 'e4'
  promotion?: 'q' | 'r' | 'b' | 'n'   // undefined for non-promotion moves
  fen: string                           // FEN *after* move is applied
  animationDoneAt: Promise<void>        // resolves when piece animation completes
                                        // C-1 fix: resolved by a CSS transitionend listener on the
                                        // moving piece element, with a rAF-aligned setTimeout fallback
                                        // (pieceMoveAnimationMs + 16ms buffer); never resolves from a
                                        // fixed setTimeout alone — must be tied to actual paint completion
})

// Exposed interface (consumed by MoveAnnotationDisplay)
boardRef: HTMLElement                   // DOM anchor for SVG overlay
squareToRect(square: Square):           // orientation-aware pixel coordinates
  { x: number; y: number; width: number; height: number } | null
  // C-2 fix: VIEWPORT-RELATIVE coordinates (boardRef.getBoundingClientRect() origin at call time)
  // MoveAnnotationDisplay must use the same origin when positioning its SVG overlay.
  // Do NOT use offsetLeft/offsetTop — they diverge on scroll or CSS transforms.
  // orientation-aware: already corrected for Black-perspective flip
  // returns null for invalid square identifiers

// Invariants
// - move-made fires only AFTER PROMOTING resolves (never optimistically)
// - move-made is never fired while disabled = true
// - squareToRect returns live values (not cached from previous render)
```

### ChessEngine Module

```typescript
// Play Engine
interface PlayEngineAPI {
  init(): Promise<void>
  play(opts: {
    fen: string
    skillLevel: number      // 0–20 (mapping to human difficulty: Difficulty System, MVP)
    movetimeMs: number      // 3000–8000; default 6000
    signal?: AbortSignal
  }): Promise<PlayResult>
  dispose(): void
}

// Review Engine
interface ReviewEngineAPI {
  // C-3 fix: explicit init() for lazy NNUE worker load — idempotent if already initialized.
  // PostGameReview calls init() on entry to show "loading engine…" state BEFORE the first analyze() call.
  // Without this, the first analyze() combines init (~40 MB NNUE download) + analysis in one opaque Promise.
  init(): Promise<void>
  analyze(
    opts: {
      fen: string
      targetDepth?: number  // default 22 🔴 (provisional — OQ-5 spike)
      movetimeMs?: number   // default 10000
      signal?: AbortSignal
    },
    onProgress?: (depth: number) => void
  ): Promise<ReviewResult>
  dispose(): void
}

// Result types — Pillar 3 structural enforcement:
// These types must NOT contain: quality, label, judgment, rating,
// classification, brilliant, blunder, mistake, or any emotive field.
interface PlayResult {
  bestMove: string | null           // UCI long-algebraic; null = terminal position
  kind?: 'move' | 'resign' | 'gameOver'
  evalCp?: number                   // side-to-move convention (positive = side-to-move wins)
  evalMate?: number                 // side-to-move convention; 0 = terminal position
  depthReached: number
  pv: string[]
  ponder?: string
}

interface ReviewResult {
  bestMove: string | null
  evalCp?: number
  evalMate?: number
  depthReached: number
  pv: string[]
}

// Error types
class EngineUnavailableError extends Error {}   // WASM blocked, network fail, WebAssembly undefined
class EngineTimeoutError extends Error {}        // no bestmove within 2 × movetimeMs
class CanceledError extends Error {}             // AbortSignal fired or superseded
class EngineDisposedError extends Error {}       // called after explicit dispose()
```

### OpeningIndex Module

```typescript
// Sync — no async boundary
function identifyOpening(moves: Move[]): OpeningResult     // O(N) hash lookups
function identifyPosition(fenOrEpd: string): { eco: string; name: string } | null  // O(1)

// Result type — Pillar 3 structural enforcement:
// Must NOT contain: quality, rating, score, goodness, winRate,
// recommendation, judgment, accuracy, or any evaluative/comparative field.
interface OpeningResult {
  eco: string | null            // e.g. "C53"; null if no match
  name: string | null           // e.g. "Italian Game: Giuoco Pianissimo"; null if no match
  matchedPly: number            // 0 if no match
  bookExitPly: number | null    // 1-based; null if never entered book or still in book at game end
  isUnknown: boolean            // true if matchedPly === 0
  epd: string                   // EPD of matched position; "" if unknown
}
```

### Pinia gameStore

```typescript
// Canonical cross-module state — sole handoff channel between GameLifecycle and consumers
interface GameStore {
  isGameInProgress: boolean         // read by AppRouter guard; owned by GameLifecycle
  completedGame: CompletedGame | null  // written by GameLifecycle on terminal; read by PostGameReview + GameExport
}

interface CompletedGame {
  moves: string[]                   // UCI long-algebraic, e.g. ["e2e4", "e7e5", "g1f3"]
  playerColor: 'white' | 'black'
  result: '1-0' | '0-1' | '1/2-1/2'
  endReason: 'checkmate' | 'resignation' | 'stalemate' |
             'threefold' | 'fifty-move' | 'insufficient-material'
  completedAt: number               // epoch ms
  aiSkillLevel: number              // 0–20
  playerMoveTimes: number[]         // ms per player move, indexed against player moves ONLY
                                    // (NOT the global move index — see Game Lifecycle EC-11)
  isTerminal: true
}
// Invariant: completedGame is immutable after assembly (frozen snapshot, not live array)
// Invariant: isGameInProgress is set false BEFORE any router.push('/review') call
```

### MoveAnnotationDisplay Component

```typescript
// Props (parent → component)
props: {
  annotations: Annotation[]
  evaluation: {
    evalCp?: number     // side-to-move convention — NOT pre-flipped by consumer
    evalMate?: number   // side-to-move convention — NOT pre-flipped by consumer
    sideToMove: 'w' | 'b'
  } | null
}

// Annotation type — Pillar 3 structural enforcement:
// role must be navigational ONLY — must NOT be: lastMove, quality, judgment, brilliant, blunder…
interface Annotation {
  kind: 'arrow' | 'highlight'
  role: 'bestMove' | 'playedMove' | 'alternateLine' | 'threat' | 'keySquare' | 'from' | 'to'
  from?: Square   // for kind: 'arrow'
  to?: Square     // for kind: 'arrow'
  square?: Square // for kind: 'highlight'
}

// Invariants
// - pointer-events: none (zero game state side effects)
// - Sign normalization to White's perspective is internal to this component
// - lastMove role does NOT exist — ChessBoard owns last-move tint in all modes
// - evalMate === 0 → badge shows "—", no best-move arrow (terminal position)
```

---

## Technical Requirements Baseline

> 44 requirements extracted from 8 v0 GDDs. ADR coverage: 0 of 44 (all pending).

| Req ID | GDD | Requirement | Risk | ADR |
|--------|-----|-------------|------|-----|
| TR-chess-board-001 | chess-board | Render FEN string to board within 100ms of mount | 🟢 | ADR-TBD |
| TR-chess-board-002 | chess-board | Dual input: drag-drop + tap-tap, both always active | 🟢 | ADR-TBD |
| TR-chess-board-003 | chess-board | Promotion dialog: deliberate selection only (no auto-queen) | 🟢 | ADR-TBD |
| TR-chess-board-004 | chess-board | `squareToRect()` — orientation-aware pixel geometry for overlay | 🟢 | ADR-TBD |
| TR-chess-board-005 | chess-board | WCAG 2.1 AA keyboard nav (custom roving tabindex — chessground 9.x does not provide) | 🟡 | ADR-TBD |
| TR-chess-board-006 | chess-board | 60fps budget: transform + opacity only (no layout/paint animations) | 🟢 | ADR-TBD |
| TR-chess-board-007 | chess-board | Bundle ≤ 120 KB gzipped (board + chess.js + piece SVGs) | 🟢 | ADR-TBD |
| TR-chess-engine-001 | chess-engine | Two engines: HCE Play + NNUE Review (separate WASM builds) | 🔴 | ADR-0001 |
| TR-chess-engine-002 | chess-engine | Single-threaded WASM only — no SharedArrayBuffer, no COOP/COEP | 🔴 | ADR-0002 |
| TR-chess-engine-003 | chess-engine | UCI protocol: strict uci→uciok→setoption→isready→readyok handshake | 🟢 | ADR-0002 |
| TR-chess-engine-004 | chess-engine | AbortSignal cancellation + requestId race guard | 🟢 | ADR-0002 |
| TR-chess-engine-005 | chess-engine | Review worker auto-terminates after 30s idle | 🟢 | ADR-0002 |
| TR-chess-engine-006 | chess-engine | Memory budget: peak ≤ 150 MB (Formula 4) | 🔴 | ADR-0001 |
| TR-chess-engine-007 | chess-engine | CSP: `script-src 'wasm-unsafe-eval'; worker-src 'self' blob:` | 🟢 | ADR-0008 |
| TR-chess-engine-008 | chess-engine | EngineUnavailableError → degrade to two-human local play | 🟢 | ADR-0002 |
| TR-chess-engine-009 | chess-engine | iOS visibility change: liveness ping on resume, respawn if dead | 🔴 | ADR-0002 |
| TR-opening-id-001 | opening-id | EPD-keyed Map, built at compile time (no TSV parsing in browser) | 🟢 | ADR-0003 |
| TR-opening-id-002 | opening-id | Longest-prefix match: O(N) hash lookups only (no full-table scan) | 🟢 | ADR-0003 |
| TR-opening-id-003 | opening-id | Lookup ≤ 5ms desktop, ≤ 20ms iPhone (Formula 3) | 🟢 | ADR-0003 |
| TR-opening-id-004 | opening-id | Index ≤ 150 KB gzipped, ≤ 1 MB resident (Formula 4) | 🟢 | ADR-0003 |
| TR-nav-routing-001 | nav-routing | Vue Router HTML5 history mode (createWebHistory) | 🟢 | ADR-0004 |
| TR-nav-routing-002 | nav-routing | In-game guard: beforeRouteLeave + isGameInProgress check | 🟢 | ADR-0005 |
| TR-nav-routing-003 | nav-routing | `window.beforeunload` listener for full-page exit | 🟢 | ADR-0004 |
| TR-nav-routing-004 | nav-routing | Route-level lazy loading (Play + Review chunks deferred) | 🟢 | ADR-0004 |
| TR-nav-routing-005 | nav-routing | GitHub Pages SPA fallback: 404.html → index.html shim | 🟢 | ADR-0004 |
| TR-nav-routing-006 | nav-routing | Popstate guard with deterministic history.pushState restore | 🟢 | ADR-0004 |
| TR-game-lifecycle-001 | game-lifecycle | chess.js is sole authoritative state — board is renderer only | 🟢 | ADR-0005 |
| TR-game-lifecycle-002 | game-lifecycle | 5-priority terminal detection (checkmate → 50-move, priority order) | 🟢 | ADR-0005 |
| TR-game-lifecycle-003 | game-lifecycle | CompletedGame written to Pinia gameStore as canonical transport | 🟢 | ADR-0005 |
| TR-game-lifecycle-004 | game-lifecycle | isGameInProgress: set false BEFORE router.push('/review') | 🟢 | ADR-0005 |
| TR-game-lifecycle-005 | game-lifecycle | playerMoveTimes[]: indexed against player moves only (not global index) | 🟢 | ADR-0005 |
| TR-move-annotation-001 | move-annotation | Declarative annotations prop — no imperative "add arrow" API | 🟡 | ADR-0006 |
| TR-move-annotation-002 | move-annotation | SVG overlay positioned via boardRef + squareToRect (no own geometry) | 🟡 | ADR-0006 |
| TR-move-annotation-003 | move-annotation | Neutral role semantics — no emotive labels anywhere in rendering | 🟢 | ADR-0006 |
| TR-move-annotation-004 | move-annotation | Eval bar: Formula 1 fillRatio + sign normalization to White's perspective | 🟢 | ADR-0006 |
| TR-move-annotation-005 | move-annotation | rAF-coalesced resize throttle (Formula 4) | 🟢 | ADR-0006 |
| TR-post-game-review-001 | post-game-review | Two-pass analysis: preview depth-12 → deep depth-22 (v0 requirement) | 🔴 | ADR-0007 |
| TR-post-game-review-002 | post-game-review | F2 cpLoss = max(0, E[i] + E[i+1]) — both evals in side-to-move convention | 🟢 | ADR-0007 |
| TR-post-game-review-003 | post-game-review | biggestSwingCursor: computed once at COMPLETE, never moves | 🟢 | ADR-0007 |
| TR-post-game-review-004 | post-game-review | Depth-comparability guard: |depth[i] - depth[i+1]| ≤ DEPTH_MISMATCH_TOLERANCE | 🟢 | ADR-0007 |
| TR-post-game-review-005 | post-game-review | sessionStorage persistence: pv stripped, key `pgr:analysis:<gameId>`, throttled write | 🔴 | ADR-0007 |
| TR-post-game-review-006 | post-game-review | Mobile calm default: best-move arrow only; no played-move arrow, no eval bar (< 768px) | 🟢 | ADR-0007 |
| TR-post-game-review-007 | post-game-review | REVIEW_TOTAL_TIME_BUDGET_MS = 90s hard ceiling on Pass 2 | 🟢 | ADR-0007 |
| TR-game-export-001 | game-export | PGN serialization via chess.js; valid per PGN standard (round-trip) | 🟢 | ADR-TBD |
| TR-game-export-002 | game-export | Tier-1/2/3 delivery: Web Share → Clipboard API → textarea fallback | 🟢 | ADR-TBD |
| TR-game-export-003 | game-export | Clipboard write synchronous in tap gesture (iOS user-activation) | 🟡 | ADR-TBD |
| TR-game-export-004 | game-export | Claude.ai prompt template: deterministic, pure synchronous assembly | 🟢 | ADR-TBD |

---

## ADR Audit

> **Current state**: ADR-0001..0008 all authored (2026-05-28) — 36 of 44 TR-IDs covered. Remaining 8 ADR-TBD: TR-chess-board-001..007, TR-game-export-004.

| ADR | Status | TR-IDs Covered | Notes |
|-----|--------|----------------|-------|
| ADR-0001 | ✅ Proposed (2026-05-28) | TR-chess-engine-001, TR-chess-engine-006 | HCE spike required before → Accepted; file: `docs/architecture/adr-0001-stockfish-build-versioning.md` |
| ADR-0002 | ✅ Proposed (2026-05-28) | TR-chess-engine-002..005, TR-chess-engine-008, TR-chess-engine-009 | TD concerns C1–C5 applied; file: `docs/architecture/adr-0002-web-worker-isolation-and-uci-protocol.md` |
| ADR-0003 | ✅ Proposed (2026-05-28) | TR-opening-id-001..004 | En passant spike required before → Accepted; file: `docs/architecture/adr-0003-chess-openings-dataset-pin-and-epd-index.md` |
| ADR-0004 | ✅ Proposed (2026-05-28) | TR-nav-routing-001, TR-nav-routing-003..006 | TD review PASS ✅; file: `docs/architecture/adr-0004-vue-router-history-mode-and-github-pages-spa-fallback.md` |
| ADR-0005 | ✅ Proposed (2026-05-28) | TR-game-lifecycle-001..005, TR-nav-routing-002 | TD review PASS ✅; file: `docs/architecture/adr-0005-pinia-store-boundaries-and-completed-game-transport.md` |
| ADR-0006 | ✅ Proposed (2026-05-28) | TR-move-annotation-001..005 | TD review PASS ✅; 🟡 drawable spike still pending before → Accepted; file: `docs/architecture/adr-0006-move-annotation-rendering-substrate.md` |
| ADR-0007 | ✅ Proposed (2026-05-28) | TR-post-game-review-001..007 | TD review PASS ✅ (tie-break test note added to story AC); 🔴 iPhone depth spike pending before → Accepted; file: `docs/architecture/adr-0007-post-game-review-analysis-loop-and-sessionstorage-schema.md` |
| ADR-0008 | ✅ Proposed (2026-05-28) | TR-chess-engine-007 | TD review PASS ✅; 🟡 iOS Safari CSP spike pending before → Accepted; file: `docs/architecture/adr-0008-csp-headers-and-wasm-deployment-configuration.md` |
| ADR-0009 | ❌ Deferred (MVP) | Supabase schema, sync conflict resolution | Not needed until Auth + DataSync GDDs authored |

---

## Required ADRs

### Foundation Layer — must author before any v0 code is written

**1. `/architecture-decision "Stockfish build versioning and HCE/NNUE split"` → ADR-0001** 🔴 BLOCKING
Confirm HCE build availability from lichess fork (OQ#6). Pin exact Stockfish version + WASM file hashes. Define fallback if HCE is unavailable (use NNUE for both + revise Formula 4 memory budget). Covers: TR-chess-engine-001, TR-chess-engine-006.

**2. `/architecture-decision "Web Worker isolation and UCI communication protocol"` → ADR-0002**
Formalize two-worker model, `postMessage`-only cross-thread comms (no SharedArrayBuffer), AbortSignal cancellation pattern, requestId race guard, IDLE_TERMINATED vs DISPOSED distinction, iOS visibility change liveness protocol. Covers: TR-chess-engine-002..005, TR-chess-engine-008, TR-chess-engine-009.

**3. `/architecture-decision "chess-openings dataset version pin and EPD index build"` → ADR-0003** 🟡
Pin dataset commit. Confirm chess.js EPD en passant convention vs dataset (OQ#4 — must match or normalize both sides). Define collision policy (`longest-name-then-lexical-eco`). Specify build step and output artifact. Covers: TR-opening-id-001..004.

**4. `/architecture-decision "Vue Router history mode and GitHub Pages SPA fallback"` → ADR-0004**
Lock `createWebHistory`. Specify `404.html → index.html` shim (content + redirect logic). Document known limitations (iOS PWA standalone close, mid-game refresh). Covers: TR-nav-routing-001, TR-nav-routing-003..006.

**5. `/architecture-decision "Pinia store module boundaries and CompletedGame transport"` → ADR-0005**
Define v0 stores: `gameStore` (isGameInProgress, completedGame). Formalize CompletedGame as store-canonical transport (not event payload). Declare `isGameInProgress` ownership and disarm-before-navigate ordering. Covers: TR-game-lifecycle-001..005, TR-nav-routing-002.

### Core Layer — author before relevant system is built

**6. `/architecture-decision "Move Annotation rendering substrate"` → ADR-0006** 🟡
Run 1-day spike: can chessground `drawable` API express (a) per-role neutral colors, (b) arrowheads at square edge not center, (c) operate alongside a separate eval bar? If yes: use drawable. If no: use custom `pointer-events:none` SVG over boardRef. Document decision with evidence. Covers: TR-move-annotation-001..005.

**7. `/architecture-decision "Post-Game Review analysis loop and sessionStorage schema"` → ADR-0007** 🔴
Document two-pass loop parameters. Finalize `REVIEW_TARGET_DEPTH` default after iPhone Safari spike (OQ-5 — may need to be lowered from 22). Define sessionStorage key schema, size guard (pv stripped), quota failure fallback. Covers: TR-post-game-review-001..007.

**8. `/architecture-decision "CSP headers and WASM deployment configuration"` → ADR-0008**
Specify exact Content-Security-Policy directives required for stockfish.wasm in GitHub Pages environment. Document `_headers` file approach or meta http-equiv. Verify iOS Safari compatibility. Covers: TR-chess-engine-007.

### Deferred (create before relevant MVP system):

**9. `/architecture-decision "Supabase schema design and sync conflict resolution"` → ADR-0009**
Tables for users, games, skill_scores. Conflict resolution policy. RLS policies. Deferred until Authentication + Data Sync GDDs are authored (MVP tier).

---

## Architecture Principles

Derived from game pillars, all 8 GDDs, and technical-preferences.md.

### Principle 1: No shared mutable state across module boundaries
Each module owns its data exclusively. Cross-module reads go through defined interfaces: Pinia reactive state (`gameStore`), Vue props, typed events. No module may write to state owned by another module. This prevents hidden coupling that breaks when component ordering changes.

### Principle 2: UI thread stays free
All Stockfish computation runs in Web Workers. The main thread receives only structured `postMessage` results. No blocking WASM execution in the main context — the board must remain responsive at 60fps while the engine thinks.

### Principle 3: Graceful degradation over hard failure
- `EngineUnavailableError` → degrade to two-human local play (Review unavailable)
- `sessionStorage` unavailable/full → restart analysis from position 0 (no error to player)
- iOS PWA kill mid-analysis → cold-start at Home (no crash, no corrupt state)
- Failed NNUE caching → in-memory fetch (slower, but analysis still works)

### Principle 4: Pillar 3 enforced at the type system boundary
`PlayResult`, `ReviewResult`, `OpeningResult`, and `Annotation` TypeScript types must be statically inspectable to contain zero emotive/evaluative field names (`quality`, `label`, `judgment`, `brilliant`, `blunder`, `mistake`, `rating`, etc.). Move quality computation lives exclusively in PostGameReview. This is verified by `expect-type` / tsc assertions in the test suite — not just a convention.

### Principle 5: Config modules, not magic numbers
All tuning knobs (`src/config/board-tuning.ts`, `engine-tuning.ts`, `annotation-tuning.ts`, `export-tuning.ts`) are named TypeScript exports. Tunable values are never hardcoded inline. Settings (Polish tier) reads these for theme presets but cannot exceed Safe Range bounds defined in the config.

---

## Open Questions

| ID | Summary | Priority | Resolution Path |
|----|---------|----------|-----------------|
| QQ-01 | HCE build availability from lichess fork (Engine OQ#6) | 🔴 High — BLOCKS v0 | 1-day spike → ADR-0001 |
| QQ-02 | iPhone Safari depth-22 reachability within 10s per position (Review OQ-5) | 🔴 High — blocks finalizing REVIEW_TARGET_DEPTH | Real-device spike → finalize ADR-0007 |
| QQ-03 | chessground `drawable` API vs custom SVG for annotations (Annotation OQ#1) | 🟡 Medium | 1-day spike → ADR-0006 |
| QQ-04 | chess.js EPD en passant convention vs lichess dataset (Opening OQ#4) | 🟡 Medium — blocks index build | Code check + test → ADR-0003 |
| QQ-05 | chessground 9.x keyboard nav extensibility (Chess Board OQ#7) | 🟡 Medium — affects WCAG compliance | API research → Chess Board story |
| QQ-06 | Default piece SVG set selection (Chess Board OQ#1) | 🟢 Low | Design decision before v0 prototype |
| QQ-07 | iOS Safari PWA + WASM caching quota (50 MB limit) (Engine OQ#8) | 🟡 Medium | Real-device test → ADR-0008 + PWA GDD |

---

*Architecture authored by: Eason + Claude (2026-05-28)*
*ADR-0001..0008 all written 2026-05-28 (all Proposed). Next: complete spikes to advance ADRs to Accepted — HCE availability (ADR-0001), en passant EPD convention (ADR-0003), chessground drawable fallback test (ADR-0006), iPhone Safari depth-22 reachability (ADR-0007), iOS Safari CSP meta tag verification (ADR-0008). Then run `/architecture-review` in a fresh session.*
