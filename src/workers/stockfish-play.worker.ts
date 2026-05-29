import type { IStockfishWorker } from './stockfish-worker'

/**
 * Creates the HCE Play Engine Web Worker.
 * ADR-0001: single build handles HCE/NNUE via UCI option `Use NNUE false/true`.
 * HCE options are applied by the main-thread wrapper (play-engine.ts), not here.
 * Cast is required: TypeScript DOM Worker.onmessage carries `this: Worker` which
 * is structurally incompatible with IStockfishWorker's narrower signature.
 *
 * Files served from public/stockfish/ so Vite does not transform them.
 * WASM resolves relative to the JS URL automatically (same directory).
 */
export function createPlayEngineWorker(): IStockfishWorker {
  return new Worker('/stockfish/stockfish-nnue-16-single.js') as unknown as IStockfishWorker
}
