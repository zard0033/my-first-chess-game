import { ref, readonly } from 'vue'
import type { IStockfishWorker } from '../../workers/stockfish-worker'
import { createPlayEngineWorker } from '../../workers/stockfish-play.worker'

export type { IStockfishWorker }
export type WorkerFactory = () => IStockfishWorker

/** Nine engine states per ADR-0002 §5. */
export type EngineState =
  | 'UNINITIALIZED'
  | 'LOADING'
  | 'HANDSHAKING'
  | 'IDLE'
  | 'THINKING'
  | 'STOPPING'
  | 'CRASHED'
  | 'DISPOSED'
  | 'IDLE_TERMINATED'

/** Emitted when the engine fails to initialise or crashes during handshake. */
export class EngineUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EngineUnavailableError'
  }
}

/** ADR-0002 §5: AbortSignal cancellation API. */
export class CanceledError extends Error {
  constructor() {
    super('play() canceled via AbortSignal')
    this.name = 'CanceledError'
  }
}

/** ADR-0002 §5: stopDrainTimeout → Worker hung. */
export class EngineTimeoutError extends Error {
  constructor() {
    super('Stockfish did not emit bestmove within stopDrainTimeout')
    this.name = 'EngineTimeoutError'
  }
}

/** play() input. movetimeMs ∈ [3000,8000] per GDD tuning knobs (not enforced here — caller's responsibility). */
export interface PlayInput {
  fen: string
  skillLevel: number
  movetimeMs: number
  signal?: AbortSignal
}

/**
 * play() result per GDD AC-8 / ADR-0002 §4.
 * MUST NOT contain any emotive/evaluative fields (quality, label, judgment, brilliant, blunder, etc.)
 * This is enforced at the type level: only objective chess data.
 */
export interface PlayResult {
  bestMove: string
  kind?: 'move' | 'resign' | 'gameOver'
  evalCp?: number
  evalMate?: number
  depthReached?: number
  pv?: string[]
  ponder?: string
}

/**
 * HCE UCI options per ADR-0002 §7 and control manifest Core layer.
 * All setoption lines are sent BEFORE isready (AC-5 invariant).
 */
const HCE_OPTIONS = [
  'setoption name Hash value 16',
  'setoption name Threads value 1',
  'setoption name Use NNUE value false',
  'setoption name Ponder value false',
  'setoption name MultiPV value 1',
] as const

/** ADR-0002 §3: max wait for bestmove after UCI stop before CRASHED. */
const STOP_DRAIN_TIMEOUT_MS = 2_000

/** ADR-0002 §7: maximum wait for uciok before CRASHED. */
const UCIOK_TIMEOUT_MS = 5_000

/** ADR-0002 §7: maximum wait for readyok after isready before CRASHED. WASM first-load needs up to ~8s. */
const READYOK_TIMEOUT_MS = 10_000

/**
 * Runs the strict two-phase UCI handshake.
 * Phase 1: send `uci`, await `uciok` within UCIOK_TIMEOUT_MS.
 * Phase 2: send setoptions + `isready`, await `readyok` within READYOK_TIMEOUT_MS.
 * Rejects with EngineUnavailableError on either timeout.
 */
function runHandshake(worker: IStockfishWorker): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    let uciokSeen = false
    let uciokTimer: ReturnType<typeof setTimeout>
    let readyokTimer: ReturnType<typeof setTimeout> | undefined

    const fail = (message: string): void => {
      worker.onmessage = null
      clearTimeout(uciokTimer)
      clearTimeout(readyokTimer)
      reject(new EngineUnavailableError(message))
    }

    uciokTimer = setTimeout(
      () => fail(`uciok not received within ${UCIOK_TIMEOUT_MS}ms`),
      UCIOK_TIMEOUT_MS,
    )

    worker.onmessage = (ev: MessageEvent<string>) => {
      const line = ev.data.trim()

      if (!uciokSeen && line === 'uciok') {
        clearTimeout(uciokTimer)
        uciokSeen = true
        for (const opt of HCE_OPTIONS) worker.postMessage(opt)
        worker.postMessage('isready')
        readyokTimer = setTimeout(
          () => fail(`readyok not received within ${READYOK_TIMEOUT_MS}ms`),
          READYOK_TIMEOUT_MS,
        )
        return
      }

      if (uciokSeen && line === 'readyok') {
        clearTimeout(readyokTimer)
        worker.onmessage = null
        resolve()
      }
    }

    worker.postMessage('uci')
  })
}

const defaultFactory: WorkerFactory = createPlayEngineWorker

/**
 * HCE Play Engine composable.
 * ADR-0001: stockfish@16.0.0 single-threaded build, HCE via `Use NNUE false`.
 * ADR-0002: postMessage-only IPC; nine-state machine.
 * This story implements: UNINITIALIZED / LOADING / HANDSHAKING / IDLE / CRASHED.
 * Remaining states (THINKING, STOPPING, DISPOSED, IDLE_TERMINATED) are added in Story 002+.
 *
 * @param factory - Worker constructor, injectable for unit testing.
 */
export function usePlayEngine(factory: WorkerFactory = defaultFactory) {
  const state = ref<EngineState>('UNINITIALIZED')
  let _worker: IStockfishWorker | null = null

  /**
   * Spawns the HCE worker and completes the UCI handshake.
   * Idempotent: IDLE returns immediately. Concurrent calls during LOADING or
   * HANDSHAKING are no-ops; callers should observe state to know when ready.
   * State transitions: UNINITIALIZED → LOADING → HANDSHAKING → IDLE (happy path)
   *                    HANDSHAKING → CRASHED (timeout, either phase)
   */
  async function init(): Promise<void> {
    if (state.value !== 'UNINITIALIZED' && state.value !== 'CRASHED') return

    state.value = 'LOADING'
    try {
      _worker = factory()
    } catch (err) {
      state.value = 'CRASHED'
      throw err
    }
    state.value = 'HANDSHAKING'

    try {
      await runHandshake(_worker)
      state.value = 'IDLE'
    } catch (err) {
      state.value = 'CRASHED'
      _worker.terminate()
      _worker = null
      throw err
    }
  }

  let _requestId = 0

  /**
   * Request the HCE engine to find the best move for the given position.
   * ADR-0002: cancel-replace pattern — concurrent call cancels any in-flight search.
   * State transitions: IDLE → THINKING → IDLE (bestmove received)
   *                    THINKING → STOPPING → IDLE → THINKING (cancel-replace)
   *                    STOPPING → CRASHED (stopDrainTimeout)
   */
  function play(input: PlayInput): Promise<PlayResult> {
    if (state.value !== 'IDLE') {
      throw new EngineUnavailableError(`play() called in state ${state.value} — must be IDLE`)
    }

    const worker = _worker!
    const localId = ++_requestId

    // Combined promise: resolves with PlayResult or rejects with CanceledError/EngineTimeoutError.
    // Built as a single promise so that abort handler can immediately switch worker.onmessage
    // to the drain handler (synchronously on abort), avoiding the race where simulateResponse
    // fires before the cancelSearch handler is installed.
    return new Promise<PlayResult>((resolve, reject) => {
      let abortHandler: (() => void) | null = null
      let drainTimer: ReturnType<typeof setTimeout> | null = null

      let lastEvalCp: number | undefined
      let lastEvalMate: number | undefined
      let lastDepth: number | undefined
      let lastPv: string[] | undefined
      let lastPonder: string | undefined

      function cleanup(): void {
        if (abortHandler && input.signal) {
          input.signal.removeEventListener('abort', abortHandler)
          abortHandler = null
        }
      }

      function startDrain(): void {
        // Transition THINKING → STOPPING, send stop, install drain handler
        state.value = 'STOPPING'
        worker.postMessage('stop')

        drainTimer = setTimeout(() => {
          worker.onmessage = null
          worker.terminate()
          _worker = null
          state.value = 'CRASHED'
          cleanup()
          reject(new EngineTimeoutError())
        }, STOP_DRAIN_TIMEOUT_MS)

        worker.onmessage = (ev: MessageEvent<string>) => {
          if (ev.data.startsWith('bestmove ')) {
            clearTimeout(drainTimer!)
            drainTimer = null
            worker.onmessage = null
            state.value = 'IDLE'
            // cancelSearch completed — but we still reject with CanceledError (already set)
            // resolve/reject already called above; the drain is a side-effect only.
            // The promise was rejected in the abort handler; nothing more to do here.
          }
        }
      }

      // Set up abort handling — synchronously installs drain machinery on abort
      if (input.signal?.aborted) {
        // Already aborted before play() was called: send UCI commands anyway for clean state,
        // then immediately start drain and reject.
        state.value = 'THINKING'
        worker.postMessage(`setoption name Skill Level value ${input.skillLevel}`)
        worker.postMessage(`position fen ${input.fen}`)
        worker.postMessage(`go movetime ${input.movetimeMs}`)
        reject(new CanceledError())
        startDrain()
        return
      }

      if (input.signal) {
        abortHandler = () => {
          cleanup()
          reject(new CanceledError())
          startDrain()
        }
        input.signal.addEventListener('abort', abortHandler)
      }

      state.value = 'THINKING'
      worker.postMessage(`setoption name Skill Level value ${input.skillLevel}`)
      worker.postMessage(`position fen ${input.fen}`)
      worker.postMessage(`go movetime ${input.movetimeMs}`)

      worker.onmessage = (ev: MessageEvent<string>) => {
        const line = ev.data

        if (line.startsWith('info ') && !line.includes('lowerbound') && !line.includes('upperbound')) {
          const cpMatch = line.match(/\bscore cp (-?\d+)/)
          const mateMatch = line.match(/\bscore mate (-?\d+)/)
          const depthMatch = line.match(/\bdepth (\d+)/)
          const pvMatch = line.match(/\bpv (.+)$/)
          const ponderMatch = line.match(/\bponder (\S+)/)
          if (cpMatch) lastEvalCp = parseInt(cpMatch[1], 10)
          if (mateMatch) lastEvalMate = parseInt(mateMatch[1], 10)
          if (depthMatch) lastDepth = parseInt(depthMatch[1], 10)
          if (pvMatch) lastPv = pvMatch[1].trim().split(/\s+/)
          if (ponderMatch) lastPonder = ponderMatch[1]
          return
        }

        if (line.startsWith('bestmove ')) {
          worker.onmessage = null
          // Race guard: drop if stale requestId (superseded by newer play() call)
          if (_requestId !== localId) return

          const bestMoveToken = line.split(/\s+/)[1]
          const kind = bestMoveToken === '0000' ? 'resign' : 'move'
          state.value = 'IDLE'
          cleanup()
          resolve({
            bestMove: bestMoveToken,
            kind,
            evalCp: lastEvalCp,
            evalMate: lastEvalMate,
            depthReached: lastDepth,
            pv: lastPv,
            ponder: lastPonder,
          })
        }
      }
    })
  }

  return {
    /** Reactive engine state — readonly on the outside. */
    state: readonly(state),
    init,
    play,
  }
}
