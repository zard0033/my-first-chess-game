import { Chess } from 'chess.js'
import type { CompletedGame } from '../../stores/game-store'
import type { ExportConfig } from './types'

/**
 * Assembles a Claude.ai prompt containing the game's PGN.
 * Pure synchronous — no network calls, no storage access.
 * ADR-0010: always called at share-gesture time, never pre-built on mount.
 */
export function assembleExportPayload(game: CompletedGame, config: ExportConfig): string {
  const chess = new Chess()
  for (const uci of game.moves) {
    const from = uci.slice(0, 2)
    const to = uci.slice(2, 4)
    const promo = uci.length === 5 ? (uci[4] as 'q' | 'r' | 'b' | 'n') : undefined
    chess.move({ from, to, promotion: promo })
  }

  // Seven Tag Roster (required by PGN standard)
  chess.setHeader('Event', 'Chess Training Companion')
  chess.setHeader('Site', 'https://chess-training.app')
  chess.setHeader('Date', new Date(game.completedAt).toISOString().split('T')[0].replace(/-/g, '.'))
  chess.setHeader('Round', '-')
  chess.setHeader('White', game.playerColor === 'white' ? config.playerName : 'Stockfish')
  chess.setHeader('Black', game.playerColor === 'black' ? config.playerName : 'Stockfish')
  chess.setHeader('Result', game.result)

  const pgn = chess.pgn()

  return [
    'Here is my chess game for analysis:',
    '',
    '```pgn',
    pgn,
    '```',
    '',
    'Please review my moves and identify my biggest mistakes and what I should have played instead.',
  ].join('\n')
}
