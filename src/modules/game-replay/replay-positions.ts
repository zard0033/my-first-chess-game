/**
 * Replay position builder — expands a PGN into the per-ply position list used by
 * ReplayView and the replay analysis engine (S10-02 / S10-03).
 *
 * Position 0 is the initial position (no move played); position i is the state
 * after the i-th half-move. Mirrors buildFenSequence() in post-game-review but
 * works from a PGN string (replay only has the saved PGN, not the UCI array).
 */
import { Chess } from 'chess.js'

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

export interface ReplayPosition {
  /** 0 = initial position; i = position after the i-th half-move. */
  ply: number
  fen: string
  /** SAN of the move that produced this position; null for ply 0. */
  san: string | null
  /** UCI (long algebraic) of the move that produced this position; null for ply 0. */
  uci: string | null
}

/**
 * Expand a PGN into the list of positions, one per ply (initial + after each move).
 * Invalid or empty PGN yields a single initial position so callers never crash.
 */
export function buildReplayPositions(pgn: string): ReplayPosition[] {
  const initial: ReplayPosition = { ply: 0, fen: INITIAL_FEN, san: null, uci: null }
  if (!pgn || !pgn.trim()) return [initial]

  const chess = new Chess()
  try {
    chess.loadPgn(pgn)
  } catch {
    return [initial]
  }

  const history = chess.history({ verbose: true })
  if (history.length === 0) return [initial]

  const positions: ReplayPosition[] = [{ ...initial, fen: history[0].before }]
  history.forEach((move, i) => {
    positions.push({ ply: i + 1, fen: move.after, san: move.san, uci: move.lan })
  })
  return positions
}
