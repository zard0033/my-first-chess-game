# Story 002: Play Engine — play() Method with AbortSignal and Race Guard

> **Epic**: Chess Engine Integration
> **Status**: Ready
> **Layer**: Foundation (Core — engine workers)
> **Type**: Logic
> **Estimate**: M (3–4 hours)
> **Manifest Version**: 2026-05-29
> **Last Updated**: 2026-05-28

## Context

**GDD**: `design/gdd/chess-engine-integration.md`
**Requirement**: `TR-chess-engine-004`

**ADR Governing Implementation**: ADR-0002: Web Worker Isolation and UCI Protocol
**ADR Decision Summary**: Each `play()` call increments a monotonic `requestId`. The wrapper drops any `bestmove` whose `requestId` doesn't match the current latest. `AbortSignal` triggers cancel-replace: send `stop` → drain `info` lines until `bestmove` → if no `bestmove` within `stopDrainTimeout=2000ms`, terminate Worker and transition to CRASHED.

**Engine**: stockfish@16.0.0 WASM | **Risk**: HIGH

**Control Manifest Rules (Core layer)**:
- Required: Each `analyze()` call increments a monotonic `requestId`; drop `bestmove` if `requestId` doesn't match
- Required: Cancel-replace on new call while THINKING: send `stop` → drain → timeout=2000ms
- Required: `AbortSignal` as external cancellation API
- Forbidden: Never queue `play()` requests — cancel-replace only

---

## Acceptance Criteria

- [ ] `playEngine.play({ fen, skillLevel, movetimeMs, signal? }): Promise<PlayResult>` sends `position fen [fen]` + `go movetime [movetimeMs]` to the HCE worker.
- [ ] `PlayResult` type contains NO emotive/evaluative fields (`quality`, `label`, `judgment`, `brilliant`, `blunder`) — enforced by TypeScript interface.
- [ ] When `play()` is called while THINKING, the current search is canceled (UCI `stop` sent, drain until `bestmove` or 2s timeout) before the new search starts.
- [ ] `requestId` is incremented on each call; a stale `bestmove` (wrong requestId) is silently dropped.
- [ ] When `AbortSignal` fires, the same cancel-replace sequence runs and the Promise rejects with `CanceledError`.
- [ ] `skillLevel` maps to Stockfish `UCI_LimitStrength` + `UCI_Elo` (or skill level — per GDD mapping table).

---

## Implementation Notes

- `play()` sends: `position fen ${fen}` then `go movetime ${movetimeMs}`.
- State transitions: IDLE → THINKING (on call) → IDLE (on bestmove received with matching requestId).
- `requestId` is a module-level `let requestId = 0; requestId++` before each search.
- `onmessage` handler in wrapper checks `event.data.includes('bestmove')` — parse requestId from a custom header appended to the UCI `info` stream (not native UCI). Alternative: use a closure over `const localId = requestId` and compare.
- AbortSignal listener: `signal.addEventListener('abort', cancelSearch)`.
- `stopDrainTimeout`: start a 2s timer after sending `stop`. If `bestmove` arrives before timeout, transition normally. If timeout fires, terminate Worker → CRASHED.

---

## QA Test Cases

- **AC-1**: play() resolves with PlayResult
  - Given: worker in IDLE state, FEN = starting position
  - When: `playEngine.play({ fen, skillLevel: 10, movetimeMs: 100 })`
  - Then: resolves with `{ bestMove: string, depthReached: number, ... }` within 200ms (mock worker)

- **AC-2**: Race guard drops stale bestmove
  - Given: two consecutive `play()` calls (requestId 1, then 2)
  - When: worker returns bestmove for requestId 1 after requestId 2 search started
  - Then: the stale bestmove is dropped; only requestId 2 result resolves the Promise

- **AC-3**: AbortSignal → CanceledError
  - Given: play() in THINKING state
  - When: AbortController.abort() called
  - Then: Promise rejects with `CanceledError`; `stop` was sent to Worker

- **AC-4**: PlayResult has no emotive fields
  - When: TypeScript compiles `PlayResult` type
  - Then: No field named `quality`, `label`, `judgment`, `brilliant`, `blunder`, `mistake`, `rating`

---

## Test Evidence

**Story Type**: Logic
**Required evidence**: `tests/unit/chess-engine/play-engine-play.test.ts`

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 001 must be DONE (worker initialized)
- Unlocks: Story 003 (review engine follows same pattern)
