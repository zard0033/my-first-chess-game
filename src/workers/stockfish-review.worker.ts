import type { IStockfishWorker } from './stockfish-worker'

/**
 * Creates the NNUE Review Engine Web Worker.
 * ADR-0001: same single build; NNUE enabled via `Use NNUE true` setoption (applied by review-engine.ts).
 * Files served from public/stockfish/ so Vite does not transform them.
 */
export function createReviewEngineWorker(): IStockfishWorker {
  return new Worker('/stockfish/stockfish-nnue-16-single.js') as unknown as IStockfishWorker
}
