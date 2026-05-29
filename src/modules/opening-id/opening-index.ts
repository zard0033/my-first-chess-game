import { Chess } from 'chess.js'
import type { Move } from 'chess.js'
import { ECO } from 'chess-openings'

const ecoBook = new ECO()

/** Neutral result of opening identification — contains no evaluative fields. */
export interface OpeningResult {
  eco: string | null
  name: string | null
  matchedPly: number
  bookExitPly: number | null
  isUnknown: boolean
  epd: string
}

/**
 * Walk a move array and return the longest-prefix opening match.
 * Each ply derives EPD via the first 4 FEN fields (piece placement,
 * active color, castling, en passant — per ADR-0003).
 */
export function identifyOpening(moves: Move[] | string[]): OpeningResult {
  const chess = new Chess()
  let bestMatch: { eco: string; name: string; matchedPly: number; epd: string } | null = null
  let bookExitPly: number | null = null

  for (let i = 0; i < moves.length; i++) {
    chess.move(moves[i] as Move)
    const epd = chess.fen().split(' ').slice(0, 4).join(' ')
    const entry = ecoBook.lookupSync(epd)
    if (entry !== undefined) {
      bestMatch = { eco: entry.code, name: entry.name, matchedPly: i + 1, epd }
    } else if (bestMatch !== null && bookExitPly === null) {
      bookExitPly = i + 1
    }
  }

  return {
    eco: bestMatch?.eco ?? null,
    name: bestMatch?.name ?? null,
    matchedPly: bestMatch?.matchedPly ?? 0,
    bookExitPly,
    isUnknown: bestMatch === null,
    epd: bestMatch?.epd ?? '',
  }
}

/**
 * Single-position lookup. Accepts full FEN or EPD (first 4 fields).
 * Returns { eco, name } or null if not in the database.
 */
export function identifyPosition(fenOrEpd: string): { eco: string; name: string } | null {
  const entry = ecoBook.lookupSync(fenOrEpd)
  if (entry === undefined) return null
  return { eco: entry.code, name: entry.name }
}
