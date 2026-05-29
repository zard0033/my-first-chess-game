import stockfishSingleUrl from 'stockfish/src/stockfish-nnue-16-single.js?url'
import stockfishWasmUrl from 'stockfish/src/stockfish-nnue-16-single.wasm?url'

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
 *
 * The WASM URL is passed via the URL hash (#encodedWasmUrl) because stockfish-nnue-16-single.js
 * reads `self.location.hash` to locate its WASM file. Without this, it falls back to the
 * bare filename "stockfish-nnue-16-single.wasm" which resolves incorrectly under Vite.
 */
export function createStockfishWorker(): IStockfishWorker {
  return new Worker(`${stockfishSingleUrl}#${encodeURIComponent(stockfishWasmUrl)}`)
}
