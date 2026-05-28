# Story 001: Play Engine — Worker Scaffold and UCI Handshake

> **Epic**: Chess Engine Integration
> **Status**: Ready
> **Layer**: Foundation (Core — engine workers)
> **Type**: Logic
> **Estimate**: M (4–5 hours)
> **Manifest Version**: 2026-05-29
> **Last Updated**: 2026-05-28

## Context

**GDD**: `design/gdd/chess-engine-integration.md`
**Requirements**: `TR-chess-engine-001`, `TR-chess-engine-002`, `TR-chess-engine-003`

**ADR Governing Implementation**: ADR-0001 (Stockfish Build Versioning) + ADR-0002 (Web Worker Isolation and UCI Protocol)
**ADR Decision Summary**: Two engine workers — HCE (Play) using `stockfish@16.0.0` with `Use NNUE false`, NNUE (Review) using lichess fork. `postMessage`-only cross-thread communication. Strict UCI handshake: spawn → `uci` → `uciok` (5s timeout, else CRASHED) → `setoption ...` → `isready` → `readyok` (2s timeout, else CRASHED) → IDLE. Nine-state state machine.

**Engine**: Web App — stockfish@16.0.0 WASM | **Risk**: HIGH
**Engine Notes**: HCE build confirmed by Sprint 1 spike (ADR-0001). `stockfish@16.0.0` npm package confirmed single-threaded, HCE via `Use NNUE false` UCI option. Play worker is long-lived (spawned at first game start).

**Control Manifest Rules (Core layer)**:
- Required: Two engine workers, one per mode; HCE: `Hash=16, Threads=1, Ponder=false, MultiPV=1`
- Required: UCI handshake sequence (exact) with 5s/2s timeouts
- Required: Nine-state state machine: UNINITIALIZED, LOADING, HANDSHAKING, IDLE, THINKING, STOPPING, CRASHED, DISPOSED, IDLE_TERMINATED
- Required: All cross-thread communication via `postMessage`/`onmessage` only
- Forbidden: Never run Stockfish on the main thread
- Forbidden: Never enable SharedArrayBuffer or multi-threaded Stockfish

---

## Acceptance Criteria

- [ ] `playEngine.init(): Promise<void>` spawns the HCE Web Worker with `stockfish@16.0.0`.
- [ ] On init, the UCI handshake completes in order: `uci` → `uciok` → `setoption Hash 16` + `setoption Threads 1` + `setoption Use NNUE false` → `isready` → `readyok` → IDLE state.
- [ ] If `uciok` is not received within 5s, state transitions to CRASHED and `init()` rejects with `EngineUnavailableError`.
- [ ] If `readyok` is not received within 2s after `isready`, state transitions to CRASHED and `init()` rejects with `EngineUnavailableError`.
- [ ] No SharedArrayBuffer is used; all communication is `postMessage`/`onmessage` only (verified by grep).
- [ ] State machine transitions are correct: UNINITIALIZED → LOADING → HANDSHAKING → IDLE (happy path).

---

## Implementation Notes

- Create `src/modules/chess-engine/play-engine.ts` exporting `usePlayEngine()` composable.
- Web Worker file: `src/workers/stockfish-play.worker.ts` — imports from `stockfish` npm package.
- UCI handshake is sequential via `onmessage` listener with a small state machine inside the worker wrapper.
- Use `requestId` counter initialized to 0 (incremented per `play()` call in Story 002).
- State machine: `Ref<EngineState>` (or a plain reactive signal) tracking the nine states.
- `init()` is idempotent — calling it when already IDLE returns a resolved Promise.
- All `setoption` lines must be sent BEFORE `isready`.

---

## QA Test Cases

- **AC-1**: Handshake completes → IDLE
  - Given: mock Worker that responds with `uciok` then `readyok`
  - When: `playEngine.init()` called
  - Then: state === 'IDLE', Promise resolves, no error

- **AC-2**: uciok timeout → CRASHED + EngineUnavailableError
  - Given: mock Worker that never responds
  - When: `playEngine.init()` called, advance fake timers by 5001ms
  - Then: state === 'CRASHED', Promise rejects with `EngineUnavailableError`

- **AC-3**: No SharedArrayBuffer
  - When: grep `src/` for `SharedArrayBuffer`
  - Then: 0 matches

---

## Test Evidence

**Story Type**: Logic
**Required evidence**: `tests/unit/chess-engine/play-engine-uci.test.ts`

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: None (first engine story)
- Unlocks: Story 002 (play method uses the initialized worker)
