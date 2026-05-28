# ADR-0002: Web Worker Isolation and UCI Communication Protocol

## Status
Proposed

## Date
2026-05-28

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | Web APIs: Web Workers, WASM, postMessage — Web App project, no traditional game engine |
| **Domain** | Core / AI Engine Communication |
| **Knowledge Risk** | LOW — Web Worker API, postMessage, AbortSignal, and WASM loading are stable and well within LLM training data. iOS Safari 16+ behavior documented from GDD Edge Cases. |
| **References Consulted** | `design/gdd/chess-engine-integration.md` (Core Rules 2–12, States table, Edge Cases, ACs); `docs/architecture/adr-0001-stockfish-build-versioning.md` |
| **Post-Cutoff APIs Used** | None |
| **Verification Required** | All behavior verified by GDD acceptance criteria (Unit + Integration tests). No additional spike required. |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | ADR-0001 (Proposed) — build source and file names must be confirmed before Worker import paths can be finalized |
| **Enables** | Chess Engine implementation stories: state machine, UCI wrapper, cancellation, iOS resilience |
| **Blocks** | None beyond ADR-0001's HCE spike |
| **Ordering Note** | ADR-0001 must reach Accepted before Worker file paths are hardened in implementation; this ADR may be written/Accepted in parallel |

## Context

### Problem Statement

The Chess Engine GDD mandates a Stockfish wrapper that: runs in dedicated Web Workers to keep the UI thread free, communicates via UCI protocol over `postMessage`, supports AbortSignal cancellation, handles iOS Safari's Worker suspension/termination, and manages two distinct termination semantics (idle auto-termination vs. permanent disposal). Without a formal ADR, these seven interconnected design decisions could be implemented inconsistently — for example, a programmer might implement request queuing (instead of cancel-replace), or conflate IDLE_TERMINATED with DISPOSED, or omit the requestId race guard that prevents stale results from corrupting the UI.

This ADR formalizes the Worker communication model so that all seven decisions have documented rationale and are traceable to specific GDD requirements.

### Constraints

- **No SharedArrayBuffer** — GitHub Pages serves no COOP/COEP headers; iOS Safari 16.0–16.3 does not support cross-origin isolation. Multi-threaded Stockfish is therefore unavailable; single-threaded builds are the only option (established in ADR-0001).
- **UI thread must remain free** — Chess board animations (60fps target) and input event handling must not be delayed by engine computation.
- **iOS Safari Worker lifecycle** — iOS may suspend Workers when the PWA tab is backgrounded. The implementation must detect and recover from this transparently.
- **Memory budget** — Two simultaneous Workers at full load: ~145 MB (established in ADR-0001, Formula 4). The Review Worker must terminate when idle to free NNUE memory.

### Out-of-Scope Assumptions (v0)

- **Silent WASM OOM on iOS Safari (C5)**: iOS Safari can silently terminate a WASM Worker when the app exceeds the device memory limit. This termination produces no `Worker.error` event — the Worker simply stops responding. The liveness protocol (Decision §6) will detect this as a missed `readyok` response and respawn, but only after the 60s background threshold fires. **v0 assumes the ADR-0001 Formula 4 memory budget (≤ 150 MB) is sufficient to prevent silent OOM on the target device range (iPhone SE 2nd gen and newer).** Proactive WASM OOM detection (e.g., periodic isready pings during foreground use, device-RAM-aware NNUE loading) is deferred to post-v0. If the iPhone RSS spike from ADR-0001 Validation Criterion 2 exceeds 130 MB on an iPhone SE2, this assumption must be revisited before shipping.

### Requirements

- Main thread must never block on Stockfish computation
- Cancellation must be deterministic: second `analyze()` call always supersedes the first
- Race conditions between stale results and new requests must be impossible at the API boundary
- Review Worker must auto-terminate after 30s idle; auto-respawn on next `analyze()` call
- Engine errors must be surfaced as typed errors, not unhandled rejections
- iOS Worker suspension/death must be detected on `visibilitychange` resume; recovery must resume from a checkpoint, not restart from scratch

## Decision

### 1. Dedicated Worker per Engine Mode

Each engine mode (Play, Review) gets its own dedicated Web Worker instance. The Play Worker is created on first `init()` call and lives for the app's lifetime. The Review Worker is lazy-created on first `analyze()` call and is auto-terminated after 30 seconds of idle.

**Why dedicated, not shared**: A shared Worker would require multiplexing UCI streams between two callers, adding complexity and a new failure mode. Dedicated Workers provide clean isolation: each has its own UCI state machine, its own WASM memory, and its own termination lifecycle with no cross-contamination.

**Why not a Service Worker**: Service Workers are for network interception and offline caching (PWA ADR-0006 scope), not compute offloading. Using a Service Worker for Stockfish would tie engine lifecycle to fetch lifecycle — wrong model.

### 2. postMessage-Only IPC (No SharedArrayBuffer)

The only cross-thread communication mechanism is `Worker.postMessage()` / `Worker.onmessage`. No SharedArrayBuffer, no Atomics, no SIMD-parallel builds.

**Why**: GitHub Pages does not support the `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` headers required to enable SharedArrayBuffer. iOS Safari 16.0–16.3 does not support cross-origin isolation even when headers are present. The ~3× search speed advantage of multi-threaded Stockfish is not worth: (a) losing GitHub Pages deployment, (b) losing iOS Safari 16.0–16.3 support, (c) the added complexity of buffer synchronization.

### 3. Cancel-Replace Pattern (No Request Queuing)

When `analyze()` is called while a search is in flight, the in-flight search is canceled and the new search starts. Requests are never queued.

**Why**: The consumer (Game Lifecycle for Play; Post-Game Review for Review) always wants the freshest result for the current position. Queuing would allow stale analyses to accumulate, potentially delivering moves for positions the player has already left. Cancel-replace guarantees the consumer always gets the answer to its most recent question.

**Cancellation mechanics** (per GDD Core Rule 7):
1. Send UCI `stop` to the Worker
2. Drain incoming `info` lines until `bestmove` arrives (Stockfish always emits `bestmove` after `stop`)
3. Capture the `bestmove` value but reject the in-flight promise with `CanceledError`
4. State transitions: THINKING → STOPPING → IDLE → THINKING (new request)

**stopDrainTimeout**: A 2-second timer starts when STOPPING is entered. If `bestmove` does not arrive within 2s, the Worker is presumed hung: `worker.terminate()` is called and the state transitions STOPPING → CRASHED. The in-flight promise rejects with `EngineTimeoutError`. This guards against a Stockfish WASM crash or deadlock that prevents `bestmove` from ever being emitted.

**AbortSignal as the external cancellation API**: Consumers pass an `AbortSignal` to `analyze()`. The wrapper listens on the signal; if it fires, the same cancel-replace sequence executes. This integrates cleanly with Vue Router's `beforeRouteLeave` guard and any future React `useEffect` cleanup patterns.

### 4. requestId Race Guard

Each `analyze()` call increments a monotonically increasing `requestId`. When `bestmove` arrives from the Worker, it is tagged with the `requestId` of the originating `analyze()` call. The main-thread wrapper drops any `bestmove` whose `requestId` does not match the current latest.

**Why**: UCI `bestmove` is positionally keyed (it answers "what is the best move from the last `position` command?"), not request-keyed. Without `requestId` tagging, a race between a late-arriving `bestmove` from a canceled request and a new request's state machine could deliver the wrong answer. Using FEN comparison as an alternative is explicitly rejected: the same FEN can recur in a game (e.g., threefold repetition path), making FEN-equality an unsafe discriminant.

### 5. State Machine (Nine States)

Each engine instance runs the following state machine:

| State | Description | Entry condition | Exit conditions |
|-------|-------------|-----------------|-----------------|
| `UNINITIALIZED` | Wrapper instantiated; Worker not spawned | Constructor | → LOADING via `init()` |
| `LOADING` | Worker spawned; WASM downloading + compiling | `init()` called | → HANDSHAKING (WASM ready) / CRASHED (timeout, CSP, OOM) |
| `HANDSHAKING` | UCI handshake in progress (`uci` → `uciok` → `isready` → `readyok`) | WASM instantiated | → IDLE (handshake complete) / CRASHED (5s timeout) |
| `IDLE` | Engine ready; no search in flight | Handshake complete or `bestmove` received | → THINKING (`analyze()`) / IDLE_TERMINATED (30s idle timer, Review only) / DISPOSED (`dispose()`) |
| `THINKING` | `go` sent; `info` lines flowing | `analyze()` in IDLE | → STOPPING (cancel/abort) / IDLE (`bestmove` received) |
| `STOPPING` | `stop` sent; draining until `bestmove` | Cancel requested | → IDLE (`bestmove` received) / CRASHED (2s stopDrainTimeout — Worker hung) |
| `CRASHED` | Worker terminated abnormally | Worker `error`/`messageerror`/LOADING timeout, or STOPPING 2s stopDrainTimeout | → LOADING (`init()` to respawn manually). Any pending `analyze()` promise rejects with `EngineUnavailableError`. Callers must surface this to the UI (disable board input, show error banner). |
| `DISPOSED` | Worker terminated by explicit `dispose()` | `dispose()` called | *(terminal — no respawn)* |
| `IDLE_TERMINATED` | Review Worker terminated by 30s idle timer | 30s idle (Review only) | → LOADING (`analyze()` auto-respawns) |

**Critical distinction — IDLE_TERMINATED vs DISPOSED:**

> These two states look similar (both mean "Worker is dead") but have opposite respawn semantics:
> - `IDLE_TERMINATED`: entered *only* by the 30s idle timer on the Review Worker. Calling `analyze()` automatically respawns (LOADING → HANDSHAKING → IDLE → THINKING). The caller sees a one-time latency increase; the call succeeds.
> - `DISPOSED`: entered *only* by an explicit `dispose()` call. Calling `analyze()` from DISPOSED rejects **synchronously** with `EngineDisposedError` and does NOT trigger respawn. The wrapper is permanently unusable after `dispose()`.
>
> The implementation must track the termination reason (timer vs. explicit call) to select the correct path. Using a single "dead" boolean would conflate the two and introduce a subtle bug: DISPOSED wrappers would silently respawn instead of erroring.

**IDLE_TERMINATED → LOADING concurrency (C3):** When `analyze()` triggers respawn from IDLE_TERMINATED, the wrapper immediately transitions to LOADING and the `analyze()` call is held (pending the IDLE state). If a *second* `analyze()` call arrives while the wrapper is in LOADING (i.e., before the first respawn-triggered call begins executing), the cancel-replace policy applies: the first pending call is superseded, its promise is rejected with `CanceledError`, and the second call becomes the active request once IDLE is reached. This prevents two callers from simultaneously racing into the respawn path.

### 6. iOS Visibility Liveness Protocol

The iOS Safari runtime may suspend or kill Web Workers when the PWA tab is backgrounded. The wrapper implements a two-phase detection protocol on `visibilitychange` → `visible`:

**Phase 1 — Should we probe?**
```
shouldPingIsReady = (now - lastHeartbeatTs) >= backgroundThresholdMs
```
Default `backgroundThresholdMs = 60_000` ms. If the tab was hidden for less than 60s, trust the Worker is alive (most iOS suspensions shorter than this are pauses, not kills). No probe sent.

**Phase 2 — Is the Worker still alive?**
If Phase 1 fires: send `isready`, set a 1000ms timer. If `readyok` arrives → Worker alive, resume normally. If timer fires without `readyok` → Worker dead: `worker.terminate()`, respawn from checkpoint.

**Respawn checkpoint**: Maintained by the Review wrapper during analysis as `{ fen: string, requestId: number, lastForwardedDepth: number }`. On respawn, the new Worker resumes analysis from the same FEN at the same depth target.

**Post-respawn result contract**: The consumer's original promise is not rejected. The wrapper transparently re-issues the `analyze()` call against the new Worker using the same checkpoint FEN and the same pending promise. `onProgress` callbacks continue to fire for depths deeper than `lastForwardedDepth`. The consumer observes a latency gap (Worker boot time ~3–5s) in the progress stream but no API error. If the new Worker fails to reach IDLE within the handshake timeout (5s), the consumer's promise is rejected with `EngineUnavailableError` at that point — the caller is responsible for surfacing this to the UI. The `requestId` is preserved through respawn so that any stale result from the pre-respawn Worker (if it somehow delivers late) is dropped by the race guard.

**Why 60s threshold**: iOS typically kills suspended Worker threads after 30–120s depending on device memory pressure. The 60:1 ratio (tolerance:detection) is intentional (documented in GDD Formula 3 commentary): tolerate normal brief backgrounding without unnecessary handshakes; detect true kills quickly when they happen.

### 7. UCI Handshake and Option Protocol

Engine boot sequence (per GDD Core Rule 3):
1. Spawn Worker, load WASM (via `import wasmUrl from '*.wasm?url'`, passed via postMessage)
2. Send `uci` → await `uciok` (5s timeout → CRASHED)
3. Send `setoption name X value Y` for all configured options
4. Send `isready` → await `readyok` (2s timeout → CRASHED)
5. Engine is now IDLE

UCI options per engine (per GDD Core Rule 4):
- Play Worker: `Hash=16`, `Threads=1`, `Ponder=false`, `MultiPV=1`
- Review Worker: `Hash=32`, `Threads=1`, `Ponder=false`, `MultiPV=1`

Non-UCI banner lines from Stockfish (e.g., `"Stockfish 16 by T. Romstad et al."`) are discarded: parser only processes lines starting with a recognized UCI keyword (`uciok`, `readyok`, `bestmove`, `info`, `option`, `id`, `info string`).

### Architecture Diagram

```
Main Thread
  │
  ├─ ChessEngineWrapper (Play)                ChessEngineWrapper (Review)
  │   state: UNINITIALIZED..DISPOSED          state: UNINITIALIZED..IDLE_TERMINATED
  │   requestId: int (monotonic)              requestId: int (monotonic)
  │   checkpoint: null                        checkpoint: { fen, depth, requestId }
  │   │                                       │
  │   │ postMessage (UCI commands)            │ postMessage (UCI commands)
  │   │ onmessage (UCI responses)             │ onmessage (UCI responses)
  │   ▼                                       ▼
  │  [Web Worker: HCE build]                 [Web Worker: NNUE build]
  │   Emscripten WASM module                  Emscripten WASM module
  │   stdin: UCI text piped via postMessage   stdin: UCI text piped via postMessage
  │   stdout: UCI text emitted via postMessage stdout: UCI text emitted via postMessage
  │
  ├─ visibilitychange listener
  │   (fires liveness probe → triggers respawn on NNUE worker death)
  │
  └─ AbortSignal listeners (per analyze() call)
      (fires cancel sequence → THINKING → STOPPING → IDLE)
```

## Alternatives Considered

### Alternative 1: Run Stockfish on the Main Thread

- **Description**: Execute Stockfish WASM directly on the main thread, blocking the event loop during analysis. Simplest integration — no Worker, no postMessage.
- **Pros**: No Worker API complexity; simpler debugging (no cross-thread trace).
- **Cons**: Blocks all DOM rendering and input handling during analysis. A 6000ms Play Mode search renders the board unresponsive for 6 full seconds — violates the 60fps target and makes the app feel broken on any device.
- **Rejection Reason**: Fundamentally incompatible with a responsive UI. Not a viable option.

### Alternative 2: SharedArrayBuffer + Multi-Threaded Stockfish

- **Description**: Use Stockfish's native SIMD/multi-threaded WASM build with SharedArrayBuffer for cross-thread data sharing. Provides ~3× search speed vs. single-threaded.
- **Pros**: Significantly faster search depth at the same time budget.
- **Cons**: Requires COOP/COEP HTTP headers (`Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Embedder-Policy: require-corp`). GitHub Pages cannot set these headers. iOS Safari 16.0–16.3 does not support cross-origin isolation regardless. This alternative is incompatible with both the deployment target and the primary target platform.
- **Rejection Reason**: Deployment and platform incompatibility. Single-threaded WASM is the only viable WASM deployment model for this project.

### Alternative 3: Request Queuing Instead of Cancel-Replace

- **Description**: Instead of canceling the in-flight search when a new `analyze()` call arrives, queue the new request to execute after the current one completes.
- **Pros**: Simpler state machine (no STOPPING state; no mid-search `stop` command); avoids the latency of cancel + re-search.
- **Cons**: Creates stale result delivery: if a Play Mode user clicks a piece while the previous AI search is still finishing, the board would display a move response to the *previous* position. In Review Mode, sequential analysis already passes one position at a time so queuing would not cause visible problems — but the asymmetry between modes adds complexity. Queuing also means the wrapper cannot honor an AbortSignal that fires mid-queue.
- **Rejection Reason**: The GDD is explicit (Core Rule 7: "Never queue searches"). The freshness guarantee is a correctness requirement.

### Alternative 4: Shared Worker (Single Instance for Both Modes)

- **Description**: Use a single Shared Worker that multiplexes UCI streams for Play and Review modes. Saves one Worker thread.
- **Pros**: One less Worker to manage; theoretically saves memory overhead of a second Worker bootstrap.
- **Cons**: Shared Workers require complex request demultiplexing (which `port` gets which `bestmove`). The Play and Review engines have different WASM binaries, different UCI options, and different lifecycle (Review auto-terminates at idle). Sharing a Worker for two engines with different binaries is not practical. The memory saving (one Worker overhead vs. two) is negligible compared to the WASM binary sizes.
- **Rejection Reason**: Complexity exceeds any benefit. Dedicated Workers per mode are cleaner and directly expressed in the GDD design.

### Alternative 5: BroadcastChannel for Engine Results

- **Description**: Use `BroadcastChannel` instead of `postMessage` to deliver engine results back to the main thread.
- **Pros**: Decouples the Worker from a specific listener; allows multiple tabs to receive engine events.
- **Cons**: BroadcastChannel is session-global; multiple tabs of the same app would receive each other's engine results (a known GDD non-v0 concern). The direct `worker.onmessage` → wrapper callback chain is simpler and safer than broadcast.
- **Rejection Reason**: Adds the two-tab confusion problem with no benefit in v0. postMessage is sufficient.

## Consequences

### Positive

- Covers all 7 GDD requirements (TR-chess-engine-002..005, 008, 009) in a single ADR
- State machine is fully specified and traceable to the GDD; implementation stories can use the table directly as acceptance criteria
- The IDLE_TERMINATED / DISPOSED distinction is documented with explicit semantics, preventing the most common implementation error
- Cancel-replace pattern is justified; no risk of a "why does it queue?" question during code review

### Negative

- Nine-state machine is complex; implementation requires careful state tracking (mitigated by: GDD state table is complete; implementation story can use the state table as test scaffolding)
- Two Worker instances mean two UCI handshakes on first full-play+review session (Play boot ~1–2s, Review lazy boot ~3–5s on mobile)
- iOS liveness probe adds complexity to the visibility-change handler

### Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Worker suspend on iOS differs from documented behavior | Medium | Medium — liveness probe may not fire correctly | GDD AC for visibility/mobile section provides specific test scenarios; validate on real iPhone SE2 / iPhone 12 |
| `messageerror` (structured-clone failure) mistakenly triggers CRASHED | Low | Low | GDD Edge Case explicitly says `messageerror` → drop message, stay in current state (not CRASHED) |
| Checkpoint respawn re-delivers duplicate onProgress events | Low | Low | Worker checks `lastForwardedDepth` before forwarding; only deeper depths than checkpoint are forwarded |
| Silent WASM OOM on iOS causes Worker to stop with no error event | Low (if ADR-0001 budget held) | High — analysis silently hangs | Liveness probe (Decision §6) detects missing `readyok` on resume after 60s background; proactive foreground detection deferred to post-v0 (per Out-of-Scope Assumptions) |
| stopDrainTimeout (2s) too short for slow WASM on old iPhones | Low | Low — false CRASHED, but auto-recoverable | Tune timeout based on iPhone SE2 baseline measurement in ADR-0001 spike |

## GDD Requirements Addressed

| GDD System | Section / Requirement | How This ADR Addresses It |
|------------|----------------------|--------------------------|
| chess-engine-integration.md | Core Rule 2: Single-threaded WASM only | Decision §2: postMessage-only IPC; no SharedArrayBuffer; rationale documented |
| chess-engine-integration.md | Core Rule 3: UCI strict handshake | Decision §7: exact handshake sequence with timeout values |
| chess-engine-integration.md | Core Rule 4: UCI options at boot | Decision §7: exact options per engine listed |
| chess-engine-integration.md | Core Rule 7: Cancellation protocol | Decision §3: cancel-replace mechanics, STOPPING state draining |
| chess-engine-integration.md | Core Rule 8: requestId tagging | Decision §4: monotonic requestId + drop-on-mismatch rule |
| chess-engine-integration.md | Core Rule 11: Visibility handling | Decision §6: two-phase liveness protocol with checkpoint respawn |
| chess-engine-integration.md | Core Rule 12: Failure modes (TR-chess-engine-008) | Decision §5: CRASHED state → rejects pending `analyze()` with `EngineUnavailableError`; callers must disable board input and show error UI. LOADING/HANDSHAKING timeout → `EngineTimeoutError`. Cancellation → `CanceledError`. All error types are explicitly thrown (never unhandled rejection). |
| chess-engine-integration.md | States table | Decision §5: nine-state machine formalizes the GDD state table with entry/exit conditions |
| chess-engine-integration.md | Core Rule 1 / IDLE_TERMINATED vs DISPOSED | Decision §5: explicit semantics for each termination path |

## Performance Implications

- **CPU**: No change from ADR-0001 analysis. Worker model is the only viable pattern.
- **Memory**: Two dedicated Workers vs. one shared: ~negligible overhead (~1 MB per Worker bootstrap). The dominant memory cost is the WASM binary sizes (ADR-0001).
- **Latency**: Cancel-replace vs. queuing: cancel path adds ~50–200ms on fast hardware (UCI `stop` roundtrip). This is within the acceptable UX range for play-mode responsiveness.
- **iOS background resilience**: Checkpoint respawn after liveness failure adds a full handshake delay (~3–5s on iPhone). Documented in the GDD as accepted behavior (better than delivering a stale result).

## Migration Plan

No existing implementation to migrate. This ADR establishes the ground-truth communication model for new implementation.

## Validation Criteria

All validation is covered by the GDD's Acceptance Criteria section. Key tests:

1. **State machine completeness**: table-driven test exercising `dispose()` from each of LOADING, HANDSHAKING, IDLE, THINKING, STOPPING, CRASHED → all transition to DISPOSED within 500ms
2. **Cancel-replace**: second `analyze()` call before first resolves → first rejects with `CanceledError`, second resolves with valid move
3. **requestId drop**: stale `bestmove` with mismatched requestId → no callback fires, no unhandled rejection
4. **IDLE_TERMINATED vs DISPOSED**: `analyze()` from IDLE_TERMINATED → auto-respawn + success; `analyze()` from DISPOSED → synchronous `EngineDisposedError` (no respawn)
5. **iOS liveness (Formula 3)**: visibility hidden 65s → `isready` ping sent on resume; if `readyok` does not arrive within 1s → worker respawned, analysis resumes from checkpoint FEN

## Related Decisions

- [ADR-0001](adr-0001-stockfish-build-versioning.md) — establishes the WASM build files imported by the Workers
- Future implementation story: Chess Engine State Machine (implements this ADR in TypeScript)
- Future implementation story: Chess Engine Cancellation (AbortSignal + requestId)
- Future implementation story: Chess Engine iOS Resilience (visibility liveness protocol)
