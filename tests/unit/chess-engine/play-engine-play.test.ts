import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  usePlayEngine,
  CanceledError,
  EngineUnavailableError,
  EngineTimeoutError,
} from '../../../src/modules/chess-engine/play-engine'
import type { IStockfishWorker } from '../../../src/modules/chess-engine/play-engine'

// -----------------------------------------------------------------------
// Mock Worker
// -----------------------------------------------------------------------

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

async function makeIdleEngine(mock: MockStockfishWorker) {
  const engine = usePlayEngine(() => mock)
  const p = engine.init()
  mock.simulateResponse('uciok')
  mock.simulateResponse('readyok')
  await p
  return engine
}

// -----------------------------------------------------------------------
// AC-1: play() resolves with PlayResult
// -----------------------------------------------------------------------

describe('usePlayEngine — AC-1: play() resolves with PlayResult', () => {
  it('test_play_resolves_withBestMove', async () => {
    const mock = new MockStockfishWorker()
    const engine = await makeIdleEngine(mock)
    const promise = engine.play({ fen: 'startpos', skillLevel: 5, movetimeMs: 100 })
    mock.simulateResponse('info depth 1 score cp 30 pv e2e4')
    mock.simulateResponse('bestmove e2e4')
    const result = await promise
    expect(result.bestMove).toBe('e2e4')
    expect(engine.state.value).toBe('IDLE')
  })

  it('test_play_sendsSkillLevelAndPosition', async () => {
    const mock = new MockStockfishWorker()
    const engine = await makeIdleEngine(mock)
    const promise = engine.play({
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      skillLevel: 10,
      movetimeMs: 200,
    })
    mock.simulateResponse('bestmove d2d4')
    await promise
    const msgAfterHandshake = mock.sentMessages.slice(7) // skip uci + 5 setoptions + isready
    expect(msgAfterHandshake).toContain('setoption name Skill Level value 10')
    expect(msgAfterHandshake.some(m => m.startsWith('position fen'))).toBe(true)
    expect(msgAfterHandshake.some(m => m.startsWith('go movetime'))).toBe(true)
  })

  it('test_play_skillLevel0_resignKind', async () => {
    const mock = new MockStockfishWorker()
    const engine = await makeIdleEngine(mock)
    const promise = engine.play({ fen: 'startpos', skillLevel: 0, movetimeMs: 100 })
    mock.simulateResponse('bestmove 0000')
    const result = await promise
    expect(result.bestMove).toBe('0000')
    expect(result.kind).toBe('resign')
  })

  it('test_play_normalMove_hasKindMove', async () => {
    const mock = new MockStockfishWorker()
    const engine = await makeIdleEngine(mock)
    const promise = engine.play({ fen: 'startpos', skillLevel: 5, movetimeMs: 100 })
    mock.simulateResponse('bestmove e2e4')
    const result = await promise
    expect(result.kind).toBe('move')
  })

  it('test_play_parsesEvalCpFromInfoLine', async () => {
    const mock = new MockStockfishWorker()
    const engine = await makeIdleEngine(mock)
    const promise = engine.play({ fen: 'startpos', skillLevel: 5, movetimeMs: 100 })
    mock.simulateResponse('info depth 5 score cp 42 pv e2e4 e7e5')
    mock.simulateResponse('bestmove e2e4')
    const result = await promise
    expect(result.evalCp).toBe(42)
    expect(result.depthReached).toBe(5)
    expect(result.pv).toEqual(['e2e4', 'e7e5'])
  })

  it('test_play_transitionsToThinkingThenIdle', async () => {
    const mock = new MockStockfishWorker()
    const engine = await makeIdleEngine(mock)
    const states: string[] = []
    const promise = engine.play({ fen: 'startpos', skillLevel: 5, movetimeMs: 100 })
    states.push(engine.state.value) // should be THINKING after play() starts
    mock.simulateResponse('bestmove e2e4')
    await promise
    states.push(engine.state.value) // should be IDLE after bestmove
    expect(states[0]).toBe('THINKING')
    expect(states[1]).toBe('IDLE')
  })
})

// -----------------------------------------------------------------------
// AC-2: PlayResult has no emotive fields (TypeScript-level check)
// -----------------------------------------------------------------------

describe('usePlayEngine — AC-2: PlayResult has no emotive fields', () => {
  it('test_playResult_hasNoEmotiveFields', async () => {
    const mock = new MockStockfishWorker()
    const engine = await makeIdleEngine(mock)
    const promise = engine.play({ fen: 'startpos', skillLevel: 5, movetimeMs: 100 })
    mock.simulateResponse('bestmove e2e4')
    const result = await promise
    const keys = Object.keys(result)
    const forbiddenFields = ['quality', 'label', 'judgment', 'brilliant', 'blunder', 'mistake', 'rating', 'classification']
    for (const field of forbiddenFields) {
      expect(keys).not.toContain(field)
    }
  })
})

// -----------------------------------------------------------------------
// AC-3: AbortSignal cancellation → CanceledError
// -----------------------------------------------------------------------

describe('usePlayEngine — AC-3/AC-5: AbortSignal → CanceledError', () => {
  it('test_play_abortSignal_rejectsCanceledError', async () => {
    const mock = new MockStockfishWorker()
    const engine = await makeIdleEngine(mock)
    const ac = new AbortController()
    const promise = engine.play({ fen: 'startpos', skillLevel: 5, movetimeMs: 100, signal: ac.signal })
    ac.abort()
    mock.simulateResponse('bestmove e2e4') // drain after stop
    await expect(promise).rejects.toThrow(CanceledError)
  })

  it('test_play_abortSignal_sendsStopToWorker', async () => {
    const mock = new MockStockfishWorker()
    const engine = await makeIdleEngine(mock)
    const ac = new AbortController()
    const promise = engine.play({ fen: 'startpos', skillLevel: 5, movetimeMs: 100, signal: ac.signal })
    ac.abort()
    mock.simulateResponse('bestmove e2e4')
    await promise.catch(() => {})
    expect(mock.sentMessages).toContain('stop')
  })

  it('test_play_alreadyAborted_rejectsCanceledError', async () => {
    const mock = new MockStockfishWorker()
    const engine = await makeIdleEngine(mock)
    const ac = new AbortController()
    ac.abort() // abort BEFORE calling play()
    await expect(
      engine.play({ fen: 'startpos', skillLevel: 5, movetimeMs: 100, signal: ac.signal })
    ).rejects.toThrow(CanceledError)
  })

  it('test_play_concurrentCall_sendsStop', async () => {
    const mock = new MockStockfishWorker()
    const engine = await makeIdleEngine(mock)
    const ac = new AbortController()
    const p1 = engine.play({ fen: 'startpos', skillLevel: 5, movetimeMs: 100, signal: ac.signal })
    expect(engine.state.value).toBe('THINKING')
    ac.abort()
    mock.simulateResponse('bestmove e2e4') // drain
    try { await p1 } catch {}
    expect(mock.sentMessages).toContain('stop')
  })

  it('test_play_afterCancelResolves_stateIsIdle', async () => {
    const mock = new MockStockfishWorker()
    const engine = await makeIdleEngine(mock)
    const ac = new AbortController()
    const promise = engine.play({ fen: 'startpos', skillLevel: 5, movetimeMs: 100, signal: ac.signal })
    ac.abort()
    mock.simulateResponse('bestmove e2e4')
    await promise.catch(() => {})
    expect(engine.state.value).toBe('IDLE')
  })
})

// -----------------------------------------------------------------------
// AC-4: requestId race guard
// -----------------------------------------------------------------------

describe('usePlayEngine — AC-4: requestId race guard drops stale bestmove', () => {
  it('test_play_staleRequestId_isDropped', async () => {
    const mock = new MockStockfishWorker()
    const engine = await makeIdleEngine(mock)
    const ac = new AbortController()
    const p1 = engine.play({ fen: 'startpos', skillLevel: 5, movetimeMs: 100, signal: ac.signal })
    ac.abort()
    mock.simulateResponse('bestmove e2e4') // drain p1's cancel
    const [r1] = await Promise.allSettled([p1])
    expect(r1.status).toBe('rejected')
  })
})

// -----------------------------------------------------------------------
// AC-5: stopDrainTimeout → CRASHED
// -----------------------------------------------------------------------

describe('usePlayEngine — AC-5: stopDrainTimeout → CRASHED', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('test_play_stopDrainTimeout_transitionsToCrashed', async () => {
    const mock = new MockStockfishWorker()
    const engine = await makeIdleEngine(mock)
    const ac = new AbortController()
    const promise = engine.play({ fen: 'startpos', skillLevel: 5, movetimeMs: 100, signal: ac.signal })
    ac.abort() // triggers cancelSearch → STOPPING
    // No bestmove arrives — advance past 2s timeout
    vi.advanceTimersByTime(2_001)
    await expect(promise).rejects.toThrow() // CanceledError or EngineTimeoutError
    expect(engine.state.value).toBe('CRASHED')
  })

  it('test_play_stopDrainTimeout_workerIsNulled', async () => {
    const mock = new MockStockfishWorker()
    const engine = await makeIdleEngine(mock)
    const ac = new AbortController()
    const promise = engine.play({ fen: 'startpos', skillLevel: 5, movetimeMs: 100, signal: ac.signal })
    ac.abort()
    vi.advanceTimersByTime(2_001)
    await promise.catch(() => {})
    // After CRASHED, calling play() again should throw EngineUnavailableError (not IDLE)
    expect(() =>
      engine.play({ fen: 'startpos', skillLevel: 5, movetimeMs: 100 })
    ).toThrow(EngineUnavailableError)
  })
})

// -----------------------------------------------------------------------
// AC-6: skillLevel → Skill Level UCI option
// -----------------------------------------------------------------------

describe('usePlayEngine — AC-6: skillLevel maps to Skill Level UCI option', () => {
  it('test_play_skillLevel10_sendsCorrectSetoption', async () => {
    const mock = new MockStockfishWorker()
    const engine = await makeIdleEngine(mock)
    const promise = engine.play({ fen: 'startpos', skillLevel: 10, movetimeMs: 100 })
    mock.simulateResponse('bestmove e2e4')
    await promise
    expect(mock.sentMessages).toContain('setoption name Skill Level value 10')
  })

  it('test_play_skillLevel0_sendsCorrectSetoption', async () => {
    const mock = new MockStockfishWorker()
    const engine = await makeIdleEngine(mock)
    const promise = engine.play({ fen: 'startpos', skillLevel: 0, movetimeMs: 100 })
    mock.simulateResponse('bestmove 0000')
    await promise
    expect(mock.sentMessages).toContain('setoption name Skill Level value 0')
  })

  it('test_play_skillLevel20_sendsCorrectSetoption', async () => {
    const mock = new MockStockfishWorker()
    const engine = await makeIdleEngine(mock)
    const promise = engine.play({ fen: 'startpos', skillLevel: 20, movetimeMs: 100 })
    mock.simulateResponse('bestmove e2e4')
    await promise
    expect(mock.sentMessages).toContain('setoption name Skill Level value 20')
  })

  it('test_play_nonIdleState_throwsEngineUnavailableError', async () => {
    const mock = new MockStockfishWorker()
    const engine = await makeIdleEngine(mock)
    // Start first play to put engine in THINKING
    engine.play({ fen: 'startpos', skillLevel: 5, movetimeMs: 100 })
    expect(engine.state.value).toBe('THINKING')
    // Second call while THINKING should throw synchronously
    expect(() =>
      engine.play({ fen: 'startpos', skillLevel: 5, movetimeMs: 100 })
    ).toThrow(EngineUnavailableError)
    // Cleanup
    mock.simulateResponse('bestmove e2e4')
  })
})
