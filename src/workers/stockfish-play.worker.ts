import stockfishSingleUrl from 'stockfish/src/stockfish-nnue-16-single.js?url'
import stockfishWasmUrl from 'stockfish/src/stockfish-nnue-16-single.wasm?url'
import type { IStockfishWorker } from './stockfish-worker'

/**
 * Creates the HCE Play Engine Web Worker.
 * ADR-0001: single build handles HCE/NNUE via UCI option `Use NNUE false/true`.
 * HCE options are applied by the main-thread wrapper (play-engine.ts), not here.
 * Cast is required: TypeScript DOM Worker.onmessage carries `this: Worker` which
 * is structurally incompatible with IStockfishWorker's narrower signature.
 *
 * The WASM URL is passed via the URL hash so stockfish-nnue-16-single.js can
 * resolve it correctly under Vite's dev and production asset pipelines.
 */
export function createPlayEngineWorker(): IStockfishWorker {
  return new Worker(`${stockfishSingleUrl}#${encodeURIComponent(stockfishWasmUrl)}`) as unknown as IStockfishWorker
}
