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
    const game = makeGame(['e2e4'], 'white') // makeGame aiSkillLevel = 10
    const output = assembleExportPayload(game, { ...defaultConfig, playerName: 'Bob' })
    const pgn = extractPgn(output)

    expect(pgn).toMatch(/\[White "Bob"\]/)
    expect(pgn).toMatch(/\[Black "Stockfish \(level 10\)"\]/)
  })

  it('test_assembleExportPayload_blackPlayer_setsBlackToPlayerName', () => {
    const game = makeGame(['e2e4', 'e7e5'], 'black')
    const output = assembleExportPayload(game, { ...defaultConfig, playerName: 'Carol' })
    const pgn = extractPgn(output)

    expect(pgn).toMatch(/\[White "Stockfish \(level 10\)"\]/)
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

// ---- Prompt structure (Coach template, game-export-share.md §3) ----

describe('assembleExportPayload — Coach prompt structure', () => {
  it('test_assembleExportPayload_containsCoachRoleFraming', () => {
    const output = assembleExportPayload(makeGame(), defaultConfig)
    expect(output).toContain('review it like a patient coach')
    expect(output).toContain("adult learner working through fundamentals")
  })

  it('test_assembleExportPayload_containsNumberedAskList', () => {
    const output = assembleExportPayload(makeGame(), defaultConfig)
    expect(output).toContain('1. Name the opening')
    expect(output).toContain('2. Walk me through')
    expect(output).toContain('3. Point out one or two recurring habits')
    expect(output).toContain('4. Suggest one specific thing to study')
  })

  it('test_assembleExportPayload_containsAntiPatternGuidance', () => {
    const output = assembleExportPayload(makeGame(), defaultConfig)
    expect(output).toContain('Use move numbers')
    expect(output).toContain("Don't just list every move")
  })

  it('test_assembleExportPayload_containsPgnFenceBlock', () => {
    const output = assembleExportPayload(makeGame(), defaultConfig)
    expect(output).toContain('```pgn')
    expect(output).toContain('```')
  })

  it('test_assembleExportPayload_containsContextLines', () => {
    const game = makeGame(['e2e4'], 'white')
    const output = assembleExportPayload(game, defaultConfig)
    expect(output).toContain('- I played white against Stockfish (skill level 10).')
    expect(output).toContain('- Result:')
  })
})

// ---- PGN tags aligned to GDD Core Rules 4-5 ----

describe('assembleExportPayload — GDD-aligned PGN tags', () => {
  it('test_assembleExportPayload_siteTag_isLocalLabelNotUrl', () => {
    const pgn = extractPgn(assembleExportPayload(makeGame(), defaultConfig))
    expect(pgn).toMatch(/\[Site "Chess Training Companion \(local\)"\]/)
    expect(pgn).not.toContain('http')
  })

  it('test_assembleExportPayload_terminationTag_isNormalForCheckmate', () => {
    const pgn = extractPgn(assembleExportPayload(makeGame(), defaultConfig))
    // Core Rule 5: standard-only vocabulary — checkmate maps to "normal"
    expect(pgn).toMatch(/\[Termination "normal"\]/)
  })

  it('test_assembleExportPayload_aiNameMissingLevel_dropsParenthetical', () => {
    const game = { ...makeGame(['e2e4'], 'white'), aiSkillLevel: undefined as unknown as number }
    const pgn = extractPgn(assembleExportPayload(game, defaultConfig))
    expect(pgn).toMatch(/\[Black "Stockfish"\]/)
  })

  it('test_assembleExportPayload_dateTag_usesLocalCalendarDate', () => {
    // Build a game completed at a fixed local wall-clock time; assert the Date tag
    // reflects the LOCAL calendar date (not a UTC shift) by deriving the expected value
    // from the same local getters the assembler uses.
    const epoch = new Date(2026, 4, 27, 0, 30).getTime() // 2026-05-27 00:30 local
    const game = { ...makeGame(), completedAt: epoch }
    const pgn = extractPgn(assembleExportPayload(game, defaultConfig))
    expect(pgn).toMatch(/\[Date "2026\.05\.27"\]/)
  })
})

// ---- RESULT_PLAIN mapping (§3) ----

describe('assembleExportPayload — RESULT_PLAIN mapping', () => {
  it('test_resultPlain_blackPlayerWinsByCheckmate_isWon', () => {
    // playerColor black + result 0-1 + checkmate → player won
    const game: CompletedGame = { ...makeGame([], 'black'), result: '0-1', endReason: 'checkmate' }
    const output = assembleExportPayload(game, defaultConfig)
    expect(output).toContain('- Result: I won by checkmate.')
  })

  it('test_resultPlain_whitePlayerLosesByCheckmate_isLost', () => {
    const game: CompletedGame = { ...makeGame([], 'white'), result: '0-1', endReason: 'checkmate' }
    const output = assembleExportPayload(game, defaultConfig)
    expect(output).toContain('- Result: I lost — I was checkmated.')
  })

  it('test_resultPlain_drawByStalemate', () => {
    const game: CompletedGame = { ...makeGame([], 'white'), result: '1/2-1/2', endReason: 'stalemate' }
    const output = assembleExportPayload(game, defaultConfig)
    expect(output).toContain('- Result: It was a draw by stalemate.')
  })
})

// ---- Optional context enrichment (opening / review) ----

describe('assembleExportPayload — context enrichment', () => {
  it('test_assembleExportPayload_withOpening_addsLineAndTags', () => {
    const output = assembleExportPayload(makeGame(), defaultConfig, {
      opening: { openingName: 'Italian Game', eco: 'C50' },
    })
    expect(output).toContain('- The opening was Italian Game (C50).')
    const pgn = extractPgn(output)
    expect(pgn).toMatch(/\[Opening "Italian Game"\]/)
    expect(pgn).toMatch(/\[ECO "C50"\]/)
  })

  it('test_assembleExportPayload_noContext_omitsLinesNoBlankLeftBehind', () => {
    const output = assembleExportPayload(makeGame(), defaultConfig)
    expect(output).not.toContain('The opening was')
    expect(output).not.toContain('turning points')
    // No blank line should be left where the omitted slots were:
    // "Result: ...." is followed by exactly one blank line then "Please:"
    expect(output).toMatch(/- Result: [^\n]+\n\nPlease:/)
  })

  it('test_assembleExportPayload_withReview_addsHintLine', () => {
    const output = assembleExportPayload(makeGame(), defaultConfig, {
      review: { keyMoveNumbers: [14, 22] },
    })
    expect(output).toContain('turning points around moves 14, 22.')
  })
})
