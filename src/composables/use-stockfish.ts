import { ref, readonly } from 'vue'
import { createStockfishWorker } from '../workers/stockfish-worker'
import type { IStockfishWorker } from '../workers/stockfish-worker'

export type EngineState = 'UNINITIALIZED' | 'LOADING' | 'HANDSHAKING' | 'IDLE' | 'DISPOSED'

export type WorkerFactory = () => IStockfishWorker

// ADR-0001 (amended 2026-06-02): SF18 Lite is always-NNUE (no `Use NNUE` switch); only Hash is set.
const HANDSHAKE_OPTIONS = [
  'setoption name Hash value 16',
] as const

// ADR-0002 §5: 5s to receive uciok/readyok before transitioning to CRASHED
const HANDSHAKE_TIMEOUT_MS = 5_000

function runHandshake(worker: IStockfishWorker): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Stockfish handshake timeout (${HANDSHAKE_TIMEOUT_MS}ms)`)),
      HANDSHAKE_TIMEOUT_MS,
    )

    let uciokSeen = false

    worker.onmessage = (ev: MessageEvent<string>) => {
      const line = ev.data.trim()

      if (!uciokSeen && line === 'uciok') {
        uciokSeen = true
        for (const opt of HANDSHAKE_OPTIONS) worker.postMessage(opt)
        worker.postMessage('isready')
        return
      }

      if (uciokSeen && line === 'readyok') {
        clearTimeout(timer)
        resolve()
      }
    }

    // Send after setting onmessage to avoid missing early responses
    worker.postMessage('uci')
  })
}

/**
 * Manages the Stockfish Web Worker lifecycle and UCI handshake.
 * ADR-0001: stockfish@16.0.0 single-threaded build.
 * ADR-0002: postMessage-only IPC; nine-state machine (skeleton: four states).
 * Sprint 2: add THINKING, STOPPING, CRASHED, IDLE_TERMINATED states + analyze().
 */
export function useStockfish(factory: WorkerFactory = createStockfishWorker) {
  const state = ref<EngineState>('UNINITIALIZED')
  let _worker: IStockfishWorker | null = null

  async function init(): Promise<void> {
    if (state.value !== 'UNINITIALIZED') return
    state.value = 'LOADING'
    _worker = factory()
    state.value = 'HANDSHAKING'
    await runHandshake(_worker)
    state.value = 'IDLE'
  }

  function dispose(): void {
    if (state.value === 'DISPOSED') return
    _worker?.terminate()
    _worker = null
    state.value = 'DISPOSED'
  }

  return { state: readonly(state), init, dispose }
}
