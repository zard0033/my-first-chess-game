import { STOCKFISH_WORKER_URL, type IStockfishWorker } from './stockfish-worker'

/**
 * Creates the Play Engine Web Worker (Stockfish 18 Lite single-threaded, ADR-0001).
 * Beginner difficulty is controlled by UCI `Skill Level` / `UCI_LimitStrength`
 * (applied by play-engine.ts), independent of the eval (SF18 is always NNUE).
 *
 * Cast is required: TypeScript DOM Worker.onmessage carries `this: Worker` which
 * is structurally incompatible with IStockfishWorker's narrower signature.
 */
export function createPlayEngineWorker(): IStockfishWorker {
  return new Worker(STOCKFISH_WORKER_URL) as unknown as IStockfishWorker
}
