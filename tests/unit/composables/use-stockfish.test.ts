import { describe, it, expect, vi } from 'vitest'
import { useStockfish } from '@/composables/use-stockfish'
import type { IStockfishWorker } from '@/workers/stockfish-worker'

/** Simulates Stockfish's UCI responses over the postMessage channel. */
class MockStockfishWorker implements IStockfishWorker {
  public commands: string[] = []
  public onmessage: ((ev: MessageEvent<string>) => void) | null = null

  postMessage(data: string): void {
    this.commands.push(data)
    if (data === 'uci') {
      queueMicrotask(() => {
        this.onmessage?.({ data: 'id name Stockfish 16' } as MessageEvent<string>)
        this.onmessage?.({ data: 'uciok' } as MessageEvent<string>)
      })
    } else if (data === 'isready') {
      queueMicrotask(() => {
        this.onmessage?.({ data: 'readyok' } as MessageEvent<string>)
      })
    }
  }

  terminate(): void {}
}

function makeMock() {
  const mock = new MockStockfishWorker()
  return { mock, factory: () => mock }
}

describe('useStockfish', () => {
  it('starts in UNINITIALIZED state', () => {
    const { factory } = makeMock()
    const { state } = useStockfish(factory)
    expect(state.value).toBe('UNINITIALIZED')
  })

  it('resolves to IDLE after init() completes handshake', async () => {
    const { factory } = makeMock()
    const { state, init } = useStockfish(factory)
    await init()
    expect(state.value).toBe('IDLE')
  })

  it('sends uci as the first command', async () => {
    const { mock, factory } = makeMock()
    const { init } = useStockfish(factory)
    await init()
    expect(mock.commands[0]).toBe('uci')
  })

  it('sends HCE setoptions after uciok and before isready', async () => {
    const { mock, factory } = makeMock()
    const { init } = useStockfish(factory)
    await init()
    const uciIdx = mock.commands.indexOf('uci')
    const isreadyIdx = mock.commands.indexOf('isready')
    const nnueIdx = mock.commands.indexOf('setoption name Use NNUE value false')
    const hashIdx = mock.commands.indexOf('setoption name Hash value 16')
    expect(nnueIdx).toBeGreaterThan(uciIdx)
    expect(hashIdx).toBeGreaterThan(uciIdx)
    expect(nnueIdx).toBeLessThan(isreadyIdx)
    expect(hashIdx).toBeLessThan(isreadyIdx)
  })

  it('isready is the last command sent during handshake', async () => {
    const { mock, factory } = makeMock()
    const { init } = useStockfish(factory)
    await init()
    expect(mock.commands.at(-1)).toBe('isready')
  })

  it('init() is idempotent — second call is a no-op', async () => {
    const { mock, factory } = makeMock()
    const { init } = useStockfish(factory)
    await init()
    const countBefore = mock.commands.length
    await init()
    expect(mock.commands.length).toBe(countBefore)
  })

  it('dispose() terminates the worker and sets state to DISPOSED', async () => {
    const { mock, factory } = makeMock()
    const terminateSpy = vi.spyOn(mock, 'terminate')
    const { state, init, dispose } = useStockfish(factory)
    await init()
    dispose()
    expect(terminateSpy).toHaveBeenCalledOnce()
    expect(state.value).toBe('DISPOSED')
  })
})
