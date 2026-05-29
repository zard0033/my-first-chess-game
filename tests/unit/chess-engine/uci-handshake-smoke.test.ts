/**
 * CI smoke tests for the UCI handshake timeout values.
 * Sprint 2 retro action #4: READYOK_TIMEOUT_MS was increased from 2s → 10s to fix
 * WASM init timeouts. These tests verify the correct boundary is enforced.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { usePlayEngine, EngineUnavailableError } from '../../../src/modules/chess-engine/play-engine'
import type { IStockfishWorker } from '../../../src/modules/chess-engine/play-engine'

class MockStockfishWorker implements IStockfishWorker {
  onmessage: ((ev: MessageEvent<string>) => void) | null = null
  readonly sentMessages: string[] = []
  terminated = false

  postMessage(data: string): void {
    this.sentMessages.push(data)
  }

  terminate(): void {
    this.terminated = true
  }

  simulateResponse(line: string): void {
    this.onmessage?.({ data: line } as MessageEvent<string>)
  }
}

function factoryFor(mock: MockStockfishWorker): () => IStockfishWorker {
  return () => mock
}

// -----------------------------------------------------------------------
// readyok timeout boundary: READYOK_TIMEOUT_MS = 10_000 (Sprint 2 fix)
// -----------------------------------------------------------------------

describe('UCI handshake smoke — readyok timeout boundary (Sprint 2 fix: 2s → 10s)', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('test_handshake_readyokAt9900ms_succeeds', async () => {
    // Arrange — worker delays readyok to 9900ms (just under the 10s boundary)
    const mock = new MockStockfishWorker()
    const { state, init } = usePlayEngine(factoryFor(mock))

    const promise = init()
    mock.simulateResponse('uciok')

    // Advance to just before 10s timeout — readyok has NOT arrived yet
    vi.advanceTimersByTime(9_900)
    expect(state.value).toBe('HANDSHAKING')

    // Now deliver readyok — should succeed
    mock.simulateResponse('readyok')
    await promise

    // Assert
    expect(state.value).toBe('IDLE')
  })

  it('test_handshake_readyokNeverArrives_failsAt10001ms', async () => {
    // Arrange — worker never emits readyok (simulates slow WASM init beyond 10s)
    const mock = new MockStockfishWorker()
    const { state, init } = usePlayEngine(factoryFor(mock))

    const promise = init()
    mock.simulateResponse('uciok')

    // Advance past the 10s readyok window
    vi.advanceTimersByTime(10_001)

    // Assert
    await expect(promise).rejects.toThrow(EngineUnavailableError)
    expect(state.value).toBe('CRASHED')
    expect(mock.terminated).toBe(true)
  })

  it('test_handshake_nonUciLinesIgnored_handshakeCompletes', async () => {
    // Arrange — worker emits Stockfish banner lines before uciok
    const mock = new MockStockfishWorker()
    const { state, init } = usePlayEngine(factoryFor(mock))

    const promise = init()

    // Non-UCI banner lines (common in Stockfish 16 output)
    mock.simulateResponse('Stockfish 16 by T. Romstad, M. Costalba...')
    mock.simulateResponse('info string NNUE evaluation using...')
    mock.simulateResponse('uciok')
    mock.simulateResponse('readyok')
    await promise

    // Assert — parser skips unknown lines and reaches IDLE
    expect(state.value).toBe('IDLE')
  })

  it('test_handshake_readyokConstant_is10000ms', async () => {
    // Regression guard: verify the timeout boundary is exactly 10s (not the old 2s).
    // Advancing by 2001ms should NOT cause a timeout (readyok still has 8s remaining).
    const mock = new MockStockfishWorker()
    const { state, init } = usePlayEngine(factoryFor(mock))

    const promise = init()
    mock.simulateResponse('uciok')

    // Old timeout was 2000ms — advance just past it
    vi.advanceTimersByTime(2_001)

    // State must still be HANDSHAKING (not CRASHED)
    expect(state.value).toBe('HANDSHAKING')

    // Clean up: deliver readyok so the promise settles
    mock.simulateResponse('readyok')
    await promise
    expect(state.value).toBe('IDLE')
  })
})
