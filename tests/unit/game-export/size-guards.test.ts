/**
 * Unit tests for export payload size/budget guards.
 * Story: S11-02 (game-export GDD alignment — Formula 1/2 verification)
 * game-export-share.md "Size / budget (Formula verification)" ACs.
 */
import { describe, it, expect } from 'vitest'
import {
  assembleExportPayload,
  estimatePayloadTokens,
  isOversizePayload,
  isLongGame,
} from '../../../src/modules/game-export/assembler'
import type { ExportConfig } from '../../../src/modules/game-export/types'
import type { CompletedGame } from '../../../src/stores/game-store'

const config: ExportConfig = { playerName: 'Alice', aiSkillLevel: 10, includeAnnotations: false }

/** Build a legal game of `targetPly` plies by shuffling knights back and forth. */
function makeLongGame(targetPly: number): CompletedGame {
  // Knights out and back: g1f3 f3g1 (White), g8f6 f6g8 (Black) — repeats legally.
  const cycle = ['g1f3', 'g8f6', 'f3g1', 'f6g8']
  const moves: string[] = []
  for (let i = 0; i < targetPly; i++) moves.push(cycle[i % cycle.length])
  return {
    moves: Object.freeze(moves),
    playerColor: 'white',
    result: '1/2-1/2',
    endReason: 'threefold',
    completedAt: new Date('2026-05-30T00:00:00Z').getTime(),
    aiSkillLevel: 10,
    playerMoveTimes: Object.freeze(moves.map(() => 1000)),
    isTerminal: true,
  }
}

describe('export size guards — Formula 1/2', () => {
  it('test_estimatePayloadTokens_100MoveGame_belowBudget', () => {
    // 200-ply game with default template should sit well under the 4000-token budget.
    const game = makeLongGame(200)
    const payload = assembleExportPayload(game, config)

    expect(estimatePayloadTokens(payload)).toBeLessThan(4000)
    expect(isOversizePayload(payload)).toBe(false)
  })

  it('test_isLongGame_600Ply_exceedsThreshold', () => {
    expect(isLongGame(600)).toBe(true) // 600 > maxPlyBeforeWarn (200)
    expect(isLongGame(200)).toBe(false) // boundary: not strictly greater
  })

  it('test_assembleExportPayload_300MoveGame_stillProducesPayload', () => {
    // Export must never be blocked, even for a pathological long game.
    const game = makeLongGame(600)
    const payload = assembleExportPayload(game, config)
    expect(payload).toContain('```pgn')
    expect(payload.length).toBeGreaterThan(0)
  })
})
