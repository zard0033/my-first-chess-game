/**
 * Unit tests for computeBiggestSwingCursor pure function.
 * Story: post-game-review/story-003-biggest-swing
 * AC-1..AC-6
 */
import { describe, it, expect } from 'vitest'
import { computeBiggestSwingCursor } from '../../../src/modules/post-game-review/use-post-game-review'
import type { StoredAnalysisEntry } from '../../../src/modules/post-game-review/use-post-game-review'

// ---- Fixtures ----

function deepEntry(evalCp: number, bestMove: string | null = 'e2e4'): StoredAnalysisEntry {
  return { bestMove, evalCp, evalMate: undefined, depthReached: 22, pass: 'deep', pv: [] }
}

function previewEntry(evalCp: number): StoredAnalysisEntry {
  return { bestMove: 'e2e4', evalCp, evalMate: undefined, depthReached: 12, pass: 'preview', pv: [] }
}

// White player: even indices are player moves
const whiteIsPlayer = (i: number) => i % 2 === 0

// ---- AC-1: picks highest cpLoss player move ----

describe('computeBiggestSwingCursor — AC-1: picks highest cpLoss', () => {
  it('test_computeBiggestSwingCursor_picksHighestCpLoss_returnsIndex2', () => {
    // 4 positions: player moves at 0 and 2
    // cpLoss[0] = 50, cpLoss[2] = 120
    const results: Array<StoredAnalysisEntry | null> = [
      deepEntry(0),   // pos 0 (player)
      deepEntry(0),   // pos 1 (opponent)
      deepEntry(0),   // pos 2 (player)
      deepEntry(0),   // pos 3 (opponent)
    ]
    const cpLossValues = [50, null, 120, null]
    expect(computeBiggestSwingCursor(results, whiteIsPlayer, cpLossValues)).toBe(2)
  })
})

// ---- AC-2: tie-break — lowest index wins ----

describe('computeBiggestSwingCursor — AC-2: tie-break lowest index', () => {
  it('test_computeBiggestSwingCursor_tiedCpLoss_returnsLowestIndex', () => {
    const results: Array<StoredAnalysisEntry | null> = [
      deepEntry(0),
      deepEntry(0),
      deepEntry(0),
      deepEntry(0),
    ]
    const cpLossValues = [100, null, 100, null]
    expect(computeBiggestSwingCursor(results, whiteIsPlayer, cpLossValues)).toBe(0)
  })
})

// ---- AC-3: non-player moves excluded ----

describe('computeBiggestSwingCursor — AC-3: non-player moves excluded', () => {
  it('test_computeBiggestSwingCursor_opponentMoveHasHighestLoss_ignoresIt', () => {
    // Index 1 is opponent (black) with very high cpLoss — should be ignored
    const results: Array<StoredAnalysisEntry | null> = [
      deepEntry(0),
      deepEntry(0),
      deepEntry(0),
    ]
    const cpLossValues = [50, 999, null]
    // Only index 0 is a player move; index 1 is opponent → pick 0
    expect(computeBiggestSwingCursor(results, whiteIsPlayer, cpLossValues)).toBe(0)
  })
})

// ---- AC-4: preview results excluded ----

describe('computeBiggestSwingCursor — AC-4: preview results excluded', () => {
  it('test_computeBiggestSwingCursor_previewAtIndex0_excludesIt', () => {
    // Index 0: preview (ineligible); index 2: deep (eligible)
    const results: Array<StoredAnalysisEntry | null> = [
      previewEntry(0),  // pos 0: preview
      previewEntry(0),  // pos 1: preview (adjacent must also be deep)
      deepEntry(0),     // pos 2: deep (player)
      deepEntry(0),     // pos 3: deep (adjacent is deep → eligible)
    ]
    const cpLossValues = [999, null, 50, null]
    expect(computeBiggestSwingCursor(results, whiteIsPlayer, cpLossValues)).toBe(2)
  })

  it('test_computeBiggestSwingCursor_nextEntryIsPreview_excludesPair', () => {
    // pos 0 is deep, pos 1 is preview → pair (0,1) ineligible
    const results: Array<StoredAnalysisEntry | null> = [
      deepEntry(0),     // pos 0: deep (player)
      previewEntry(0),  // pos 1: preview → pair ineligible
      deepEntry(0),     // pos 2: deep (player, no next entry)
    ]
    const cpLossValues = [999, null, null]
    expect(computeBiggestSwingCursor(results, whiteIsPlayer, cpLossValues)).toBeNull()
  })
})

// ---- AC-5: no eligible positions → null ----

describe('computeBiggestSwingCursor — AC-5: no eligible positions', () => {
  it('test_computeBiggestSwingCursor_allPreview_returnsNull', () => {
    const results: Array<StoredAnalysisEntry | null> = [
      previewEntry(0),
      previewEntry(0),
    ]
    const cpLossValues = [100, null]
    expect(computeBiggestSwingCursor(results, whiteIsPlayer, cpLossValues)).toBeNull()
  })

  it('test_computeBiggestSwingCursor_noPlayerMoves_returnsNull', () => {
    // All are opponent moves (black player → only odd indices are player)
    const blackIsPlayer = (i: number) => i % 2 === 1
    const results: Array<StoredAnalysisEntry | null> = [
      deepEntry(0),
      deepEntry(0),
    ]
    const cpLossValues = [100, null]
    expect(computeBiggestSwingCursor(results, blackIsPlayer, cpLossValues)).toBeNull()
  })

  it('test_computeBiggestSwingCursor_allCpLossZeroOrNull_returnsNull', () => {
    const results: Array<StoredAnalysisEntry | null> = [
      deepEntry(0),
      deepEntry(0),
    ]
    const cpLossValues = [0, null]
    expect(computeBiggestSwingCursor(results, whiteIsPlayer, cpLossValues)).toBeNull()
  })

  it('test_computeBiggestSwingCursor_emptyResults_returnsNull', () => {
    expect(computeBiggestSwingCursor([], whiteIsPlayer, [])).toBeNull()
  })
})

// ---- nextBestMove === null → terminal position excluded ----

describe('computeBiggestSwingCursor — terminal position excluded', () => {
  it('test_computeBiggestSwingCursor_nextBestMoveNull_excludesPair', () => {
    // pos 1's bestMove is null (terminal) → pair (0,1) ineligible
    const results: Array<StoredAnalysisEntry | null> = [
      deepEntry(0),          // pos 0: player
      deepEntry(0, null),    // pos 1: terminal
    ]
    const cpLossValues = [100, null]
    expect(computeBiggestSwingCursor(results, whiteIsPlayer, cpLossValues)).toBeNull()
  })
})

// ---- Null analysis results excluded ----

describe('computeBiggestSwingCursor — null slots excluded', () => {
  it('test_computeBiggestSwingCursor_nullCurrEntry_excludesPair', () => {
    const results: Array<StoredAnalysisEntry | null> = [null, deepEntry(0)]
    const cpLossValues = [100, null]
    expect(computeBiggestSwingCursor(results, whiteIsPlayer, cpLossValues)).toBeNull()
  })
})
