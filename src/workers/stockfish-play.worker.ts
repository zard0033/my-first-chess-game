import stockfishSingleUrl from 'stockfish/src/stockfish-nnue-16-single.js?url'
import type { IStockfishWorker } from './stockfish-worker'

/**
 * Creates the HCE Play Engine Web Worker.
 * ADR-0001: single build handles HCE/NNUE via UCI option `Use NNUE false/true`.
 * HCE options are applied by the main-thread wrapper (play-engine.ts), not here.
 * Cast is required: TypeScript DOM Worker.onmessage carries `this: Worker` which
 * is structurally incompatible with IStockfishWorker's narrower signature.
 */
export function createPlayEngineWorker(): IStockfishWorker {
  return new Worker(stockfishSingleUrl) as unknown as IStockfishWorker
}
