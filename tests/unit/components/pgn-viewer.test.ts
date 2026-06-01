import { describe, it, expect } from 'vitest'

// Test PGN move parsing logic (no DOM needed)
describe('PgnViewer (Logic)', () => {
  function parsePgnMoves(pgn: string): string[] {
    if (!pgn || typeof pgn !== 'string') return []

    try {
      let cleanPgn = pgn
        .replace(/\{[^}]*\}/g, '')
        .replace(/\([^)]*\)/g, '')
        .replace(/\d+\./g, ' ')

      const moves = cleanPgn.match(/[a-h][1-8](?:=[QRBN])?|O-O(?:-O)?|[KQRBN][a-h1-8]?x?[a-h][1-8](?:=[QRBN])?/g) || []
      return moves
    } catch {
      return []
    }
  }

  it('parses simple PGN moves', () => {
    const pgn = '1.e4 e5'
    const moves = parsePgnMoves(pgn)
    expect(moves).toContain('e4')
    expect(moves).toContain('e5')
  })

  it('extracts all moves from multi-move PGN', () => {
    const pgn = '1.e4 e5 2.Nf3 Nc6'
    const moves = parsePgnMoves(pgn)
    expect(moves).toHaveLength(4)
    expect(moves).toEqual(['e4', 'e5', 'Nf3', 'Nc6'])
  })

  it('handles PGN with comments', () => {
    const pgn = '1.e4 {good move} e5 2.Nf3'
    const moves = parsePgnMoves(pgn)
    expect(moves).toContain('e4')
    expect(moves).toContain('e5')
    expect(moves).toContain('Nf3')
  })

  it('handles PGN with variations', () => {
    const pgn = '1.e4 (1.d4 d5) e5'
    const moves = parsePgnMoves(pgn)
    expect(moves).toContain('e4')
    expect(moves).toContain('e5')
  })

  it('returns empty array for invalid PGN', () => {
    const moves = parsePgnMoves('invalid pgn')
    expect(moves).toEqual([])
  })

  it('returns empty array for empty string', () => {
    const moves = parsePgnMoves('')
    expect(moves).toEqual([])
  })
})
