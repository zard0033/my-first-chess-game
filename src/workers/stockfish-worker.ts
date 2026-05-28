import stockfishSingleUrl from 'stockfish/src/stockfish-nnue-16-single.js?url'

/** Minimal Worker interface used by useStockfish — enables mocking in unit tests. */
export interface IStockfishWorker {
  postMessage(data: string): void
  onmessage: ((ev: MessageEvent<string>) => void) | null
  terminate(): void
}

/**
 * Creates a classic Web Worker running the single-threaded Stockfish 16 build.
 * HCE mode (no NNUE) by default; switch via UCI `setoption name Use NNUE value true`.
 * ADR-0001: stockfish-nnue-16-single handles both modes via UCI option switch.
 */
export function createStockfishWorker(): IStockfishWorker {
  return new Worker(stockfishSingleUrl)
}
