import { STOCKFISH_WORKER_URL, type IStockfishWorker } from './stockfish-worker'

/**
 * Creates the Review Engine Web Worker (Stockfish 18 Lite single-threaded, ADR-0001).
 * NNUE is embedded in the WASM (no external network file); the engine is always NNUE.
 * Shared with the play engine — same single-threaded build, base-path aware URL.
 */
export function createReviewEngineWorker(): IStockfishWorker {
  return new Worker(STOCKFISH_WORKER_URL) as unknown as IStockfishWorker
}
