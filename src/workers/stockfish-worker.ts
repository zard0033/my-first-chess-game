/** Minimal Worker interface used by useStockfish — enables mocking in unit tests. */
export interface IStockfishWorker {
  postMessage(data: string): void
  onmessage: ((ev: MessageEvent<string>) => void) | null
  terminate(): void
}

/** Public URL of the Stockfish 18 Lite (single-threaded) engine, base-path aware. */
export const STOCKFISH_WORKER_URL = `${import.meta.env.BASE_URL}stockfish/stockfish-18-lite-single.js`

/**
 * Creates a classic Web Worker running Stockfish 18 Lite (single-threaded, ADR-0001).
 * NNUE is embedded in the ~7MB WASM (no external network file); the engine is always NNUE.
 *
 * Files are served from public/stockfish/. The WASM resolves relative to the JS URL
 * automatically (same directory), so no URL hash is required. The URL is built from
 * import.meta.env.BASE_URL so it is correct under the GitHub Pages base path.
 */
export function createStockfishWorker(): IStockfishWorker {
  return new Worker(STOCKFISH_WORKER_URL) as unknown as IStockfishWorker
}
