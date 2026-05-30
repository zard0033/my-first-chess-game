/**
 * Unit tests for assembleExportPayload.
 * Story: game-export/story-001-pgn-prompt-assembly
 * AC-1..AC-5
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { Chess } from 'chess.js'
import { assembleExportPayload } from '../../../src/modules/game-export/assembler'
import type { ExportConfig } from '../../../src/modules/game-export/types'
import type { CompletedGame } from '../../../src/stores/game-store'

// ---- Fixtures ----

function makeGame(
  moves: string[] = ['e2e4', 'e7e5', 'g1f3'],
  playerColor: 'white' | 'black' = 'white',
): CompletedGame {
  return {
    moves: Object.freeze(moves),
    playerColor,
    result: '1-0',
    endReason: 'checkmate',
    completedAt: new Date('2026-05-30T00:00:00Z').getTime(),
    aiSkillLevel: 10,
    playerMoveTimes: Object.freeze(moves.map(() => 1000)),
    isTerminal: true,
  }
}

const defaultConfig: ExportConfig = {
  playerName: 'Alice',
  aiSkillLevel: 10,
  includeAnnotations: false,
}

/** Extract the PGN block from the assembled prompt string. */
function extractPgn(output: string): string {
  const start = output.indexOf('```pgn\n')
  const end = output.indexOf('\n```', start + 1)
  if (start === -1 || end === -1) throw new Error('No PGN block found in output')
  return output.slice(start + '```pgn\n'.length, end)
}

// ---- AC-1: pure synchronous return ----

describe('assembleExportPayload — AC-1: pure synchronous', () => {
  it('test_assembleExportPayload_returnType_isString', () => {
    const result = assembleExportPayload(makeGame(), defaultConfig)
    // If the function were async, result would be a Promise — not a string
    expect(typeof result).toBe('string')
    expect(result).not.toBeInstanceOf(Promise)
  })
})

// ---- AC-2: PGN round-trips via chess.js ----

describe('assembleExportPayload — AC-2: PGN round-trips', () => {
  it('test_assembleExportPayload_pgn_loadsWithoutError', () => {
    const game = makeGame(['e2e4', 'e7e5', 'g1f3'])
    const output = assembleExportPayload(game, defaultConfig)
    const pgn = extractPgn(output)

    const chess = new Chess()
    expect(() => chess.loadPgn(pgn)).not.toThrow()
  })

  it('test_assembleExportPayload_pgn_historyLengthMatchesMoves', () => {
    const moves = ['e2e4', 'e7e5', 'g1f3', 'b8c6']
    const game = makeGame(moves)
    const output = assembleExportPayload(game, defaultConfig)
    const pgn = extractPgn(output)

    const chess = new Chess()
    chess.loadPgn(pgn)
    expect(chess.history().length).toBe(moves.length)
  })

  it('test_assembleExportPayload_emptyGame_roundTrips', () => {
    const game = makeGame([])
    const output = assembleExportPayload(game, defaultConfig)
    const pgn = extractPgn(output)

    const chess = new Chess()
    expect(() => chess.loadPgn(pgn)).not.toThrow()
    chess.loadPgn(pgn)
    expect(chess.history().length).toBe(0)
  })
})

// ---- AC-3: Seven Tag Roster present ----

describe('assembleExportPayload — AC-3: Seven Tag Roster', () => {
  it('test_assembleExportPayload_pgn_containsAllSevenTags', () => {
    const output = assembleExportPayload(makeGame(), defaultConfig)
    const pgn = extractPgn(output)

    expect(pgn).toMatch(/\[Event "/)
    expect(pgn).toMatch(/\[Site "/)
    expect(pgn).toMatch(/\[Date "/)
    expect(pgn).toMatch(/\[Round "/)
    expect(pgn).toMatch(/\[White "/)
    expect(pgn).toMatch(/\[Black "/)
    expect(pgn).toMatch(/\[Result "/)
  })

  it('test_assembleExportPayload_whitePlayer_setsWhiteToPlayerName', () => {
    const game = makeGame(['e2e4'], 'white')
    const output = assembleExportPayload(game, { ...defaultConfig, playerName: 'Bob' })
    const pgn = extractPgn(output)

    expect(pgn).toMatch(/\[White "Bob"\]/)
    expect(pgn).toMatch(/\[Black "Stockfish"\]/)
  })

  it('test_assembleExportPayload_blackPlayer_setsBlackToPlayerName', () => {
    const game = makeGame(['e2e4', 'e7e5'], 'black')
    const output = assembleExportPayload(game, { ...defaultConfig, playerName: 'Carol' })
    const pgn = extractPgn(output)

    expect(pgn).toMatch(/\[White "Stockfish"\]/)
    expect(pgn).toMatch(/\[Black "Carol"\]/)
  })

  it('test_assembleExportPayload_dateFormat_isYYYYMMDD', () => {
    const game = makeGame()
    const output = assembleExportPayload(game, defaultConfig)
    const pgn = extractPgn(output)
    // Date must be YYYY.MM.DD format
    expect(pgn).toMatch(/\[Date "\d{4}\.\d{2}\.\d{2}"\]/)
  })

  it('test_assembleExportPayload_result_matchesGameResult', () => {
    const game = makeGame()
    const output = assembleExportPayload(game, defaultConfig)
    const pgn = extractPgn(output)
    expect(pgn).toMatch(/\[Result "1-0"\]/)
  })
})

// ---- AC-4: determinism ----

describe('assembleExportPayload — AC-4: deterministic', () => {
  it('test_assembleExportPayload_calledTwiceSameInput_identicalOutput', () => {
    const game = makeGame()
    const first = assembleExportPayload(game, defaultConfig)
    const second = assembleExportPayload(game, defaultConfig)
    expect(first).toBe(second)
  })
})

// ---- AC-5: no forbidden imports ----

describe('assembleExportPayload — AC-5: no forbidden imports', () => {
  it('test_assemblerSource_containsNoFetchSupabaseOrSessionStorage', () => {
    const src = readFileSync(
      fileURLToPath(new URL('../../../src/modules/game-export/assembler.ts', import.meta.url)),
      'utf8',
    )
    expect(src).not.toMatch(/\bfetch\b/)
    expect(src).not.toMatch(/\bsupabase\b/)
    expect(src).not.toMatch(/\bsessionStorage\b/)
  })
})

// ---- Prompt structure ----

describe('assembleExportPayload — prompt structure', () => {
  it('test_assembleExportPayload_containsOpeningLine', () => {
    const output = assembleExportPayload(makeGame(), defaultConfig)
    expect(output).toContain('Here is my chess game for analysis:')
  })

  it('test_assembleExportPayload_containsClosingInstruction', () => {
    const output = assembleExportPayload(makeGame(), defaultConfig)
    expect(output).toContain('Please review my moves and identify my biggest mistakes')
  })

  it('test_assembleExportPayload_containsPgnFenceBlock', () => {
    const output = assembleExportPayload(makeGame(), defaultConfig)
    expect(output).toContain('```pgn')
    expect(output).toContain('```')
  })
})
