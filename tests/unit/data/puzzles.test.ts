import { describe, it, expect } from 'vitest'
import { Chess } from 'chess.js'
import { puzzles, getPuzzleById } from '../../../src/data/puzzles'

// S13-01 — Puzzle types + static data loader (AC-02, AC-03, AC-04).
// This is the content gate for the Dungeon mode: every authored puzzle must have a
// legal FEN (both kings), a fully-legal alternating solution line of odd length, and
// unique/contiguous order. Mate puzzles must actually end in checkmate.

describe('puzzle catalog loader', () => {
  it('test_catalog_isNonEmpty', () => {
    expect(puzzles.length).toBeGreaterThan(0)
  })

  it('test_catalog_sortedByOrderAscending', () => {
    const orders = puzzles.map((p) => p.order)
    expect(orders).toEqual([...orders].sort((a, b) => a - b))
  })

  it('test_catalog_hasNoDuplicateIds', () => {
    const ids = puzzles.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('test_catalog_ordersAreUniqueAndContiguousFromOne', () => {
    const orders = puzzles.map((p) => p.order)
    expect(new Set(orders).size).toBe(orders.length)
    const expected = Array.from({ length: puzzles.length }, (_, i) => i + 1)
    expect([...orders].sort((a, b) => a - b)).toEqual(expected)
  })
})

describe('getPuzzleById', () => {
  it('test_getPuzzleById_existingId_returnsPuzzle', () => {
    const first = puzzles[0]
    expect(getPuzzleById(first.id)).toBe(first)
  })

  it('test_getPuzzleById_unknownId_returnsUndefined', () => {
    expect(getPuzzleById('no-such-puzzle')).toBeUndefined()
  })
})

describe('puzzle content chess-validity', () => {
  it('test_allPuzzles_fenIsLegalPositionWithBothKings', () => {
    for (const p of puzzles) {
      expect(() => new Chess(p.fen), `${p.id}: illegal FEN "${p.fen}"`).not.toThrow()
      const board = p.fen.split(' ')[0]
      expect((board.match(/K/g) ?? []).length, `${p.id}: needs exactly one white king`).toBe(1)
      expect((board.match(/k/g) ?? []).length, `${p.id}: needs exactly one black king`).toBe(1)
    }
  })

  it('test_allPuzzles_solutionIsOddLength', () => {
    for (const p of puzzles) {
      expect(p.solution.length % 2, `${p.id}: solution must be odd length (ends on a player ply)`).toBe(1)
    }
  })

  it('test_allPuzzles_solutionIsAFullyLegalLine', () => {
    for (const p of puzzles) {
      const chess = new Chess(p.fen)
      p.solution.forEach((mv, i) => {
        expect(
          () => chess.move({ from: mv.from, to: mv.to, promotion: mv.promotion }),
          `${p.id} ply ${i}: illegal move ${mv.from}${mv.to}${mv.promotion ?? ''}`,
        ).not.toThrow()
      })
    }
  })

  it('test_matePuzzles_endInCheckmate', () => {
    for (const p of puzzles) {
      if (!p.motif.startsWith('mate')) continue
      const chess = new Chess(p.fen)
      for (const mv of p.solution) {
        chess.move({ from: mv.from, to: mv.to, promotion: mv.promotion })
      }
      expect(chess.isCheckmate(), `${p.id}: ${p.motif} must end in checkmate`).toBe(true)
    }
  })

  it('test_allPuzzles_haveNonEmptyBrief', () => {
    for (const p of puzzles) {
      expect(p.brief.trim().length, `${p.id}: brief must be a non-empty goal sentence`).toBeGreaterThan(0)
    }
  })

  it('test_firstPlySideMatchesPlayer', () => {
    // The player always plays solution[0]; the FEN side-to-move must therefore be the
    // mover of the first ply (GDD AC-04). Replaying ply 0 proves it is the side to move.
    for (const p of puzzles) {
      const chess = new Chess(p.fen)
      const mv = p.solution[0]
      expect(
        () => chess.move({ from: mv.from, to: mv.to, promotion: mv.promotion }),
        `${p.id}: first ply not playable by side-to-move`,
      ).not.toThrow()
    }
  })
})
