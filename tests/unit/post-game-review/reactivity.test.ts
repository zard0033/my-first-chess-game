/**
 * Regression tests for usePostGameReview reactivity.
 *
 * Bug: `_completedGame` was a plain (non-reactive) `let`, but `totalPositions`
 * (and downstream canGoNext/canGoPrev/biggestSwingCursor) depend on it. A computed
 * with no reactive dependency caches its first value forever — once `totalPositions`
 * was read as 0 before init(), it stayed 0 even after a game was loaded, freezing
 * navigation. Most visible on the restore→COMPLETE path where init() resolves
 * synchronously.
 */
import { describe, it, expect } from 'vitest'
import { usePostGameReview } from '../../../src/modules/post-game-review/use-post-game-review'
import type { AnalyzeFn } from '../../../src/modules/post-game-review/use-post-game-review'
import type { CompletedGame } from '../../../src/stores/game-store'

function makeMemoryStorage(): Storage {
  const data = new Map<string, string>()
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, val: string) => { data.set(key, val) },
    removeItem: (key: string) => { data.delete(key) },
    clear: () => { data.clear() },
    key: (index: number) => [...data.keys()][index] ?? null,
    get length() { return data.size },
  }
}

function makeGame(moves = ['e2e4', 'e7e5', 'g1f3'], completedAt = 1716900000000): CompletedGame {
  return {
    moves: Object.freeze(moves),
    playerColor: 'white',
    result: '1-0',
    endReason: 'checkmate',
    completedAt,
    aiSkillLevel: 10,
    playerMoveTimes: Object.freeze(moves.map(() => 1000)),
    isTerminal: true,
  }
}

const deepFn: AnalyzeFn = async ({ targetDepth }) => ({
  bestMove: 'e2e4',
  evalCp: 30,
  depthReached: targetDepth,
  pv: ['e2e4'],
})

describe('usePostGameReview — reactivity regression', () => {
  it('test_totalPositions_readBeforeInit_updatesAfterInit', async () => {
    // Arrange — read totalPositions while no game is loaded, forcing the
    // computed to cache its 0 value.
    const review = usePostGameReview({ storage: makeMemoryStorage() })
    expect(review.totalPositions.value).toBe(0)

    // Act
    await review.init(makeGame(['e2e4', 'e7e5', 'g1f3']), deepFn)

    // Assert — must reflect the loaded game, not the cached 0.
    expect(review.totalPositions.value).toBe(3)
    expect(review.canGoNext.value).toBe(true)
  })

  it('test_totalPositions_restoreCompletePath_isReactive', async () => {
    // Arrange — prime storage with a fully-deep analysis so a second session
    // takes the synchronous restore→COMPLETE path.
    const storage = makeMemoryStorage()
    const game = makeGame(['e2e4', 'e7e5'])
    const first = usePostGameReview({ storage })
    await first.init(game, deepFn)
    await new Promise(r => setTimeout(r, 600)) // let debounced flush write

    // Act — fresh composable, read totalPositions before init (caches 0), then restore.
    const second = usePostGameReview({ storage })
    expect(second.totalPositions.value).toBe(0)
    await second.init(game, deepFn)

    // Assert — restore path resolves synchronously to COMPLETE; nav must work.
    expect(second.phase.value).toBe('COMPLETE')
    expect(second.totalPositions.value).toBe(2)
    expect(second.canGoNext.value).toBe(true)
  })
})
