import { describe, it, expect } from 'vitest'
import { buildReplayPositions } from '@/modules/game-replay/replay-positions'

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

describe('buildReplayPositions', () => {
  it('test_replay_positions_empty_pgn_returns_single_initial', () => {
    const positions = buildReplayPositions('')
    expect(positions).toHaveLength(1)
    expect(positions[0]).toEqual({ ply: 0, fen: INITIAL_FEN, san: null, uci: null })
  })

  it('test_replay_positions_four_ply_game_returns_five_positions', () => {
    const positions = buildReplayPositions('1. e4 e5 2. Nf3 Nc6')
    expect(positions).toHaveLength(5) // initial + 4 half-moves
    expect(positions[0].ply).toBe(0)
    expect(positions[4].ply).toBe(4)
  })

  it('test_replay_positions_ply_one_carries_san_and_uci', () => {
    const positions = buildReplayPositions('1. e4 e5')
    expect(positions[1].san).toBe('e4')
    expect(positions[1].uci).toBe('e2e4')
    expect(positions[1].fen).toContain(' b ') // black to move after 1.e4
  })

  it('test_replay_positions_ply_zero_has_no_move', () => {
    const positions = buildReplayPositions('1. d4 d5')
    expect(positions[0].san).toBeNull()
    expect(positions[0].uci).toBeNull()
    expect(positions[0].fen).toBe(INITIAL_FEN)
  })

  it('test_replay_positions_invalid_pgn_returns_single_initial', () => {
    const positions = buildReplayPositions('this is not a pgn !!!')
    expect(positions).toHaveLength(1)
    expect(positions[0].fen).toBe(INITIAL_FEN)
  })

  it('test_replay_positions_each_ply_fen_unique_and_ordered', () => {
    const positions = buildReplayPositions('1. e4 e5 2. Nf3 Nc6 3. Bb5 a6')
    const fens = positions.map((p) => p.fen)
    expect(new Set(fens).size).toBe(fens.length) // all distinct
    positions.forEach((p, i) => expect(p.ply).toBe(i))
  })
})
