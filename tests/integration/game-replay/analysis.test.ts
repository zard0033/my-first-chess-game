import { describe, it, expect, vi } from 'vitest'
import { buildReplayPositions } from '@/modules/game-replay/replay-positions'
import { useReplayAnalysis, type ReplayAnalyzeFn } from '@/composables/use-replay-analysis'
import type { ReviewResult } from '@/modules/chess-engine/review-engine'

const PGN = '1. e4 e5 2. Nf3 Nc6' // 4 half-moves → 5 positions

// Deterministic fake engine: eval grows with material-ish hash of fen; bestMove fixed.
function makeAnalyzeFn(evalByFen: Record<string, number> = {}): ReplayAnalyzeFn {
  return vi.fn(async ({ fen }): Promise<ReviewResult> => ({
    bestMove: 'e2e4',
    evalCp: evalByFen[fen] ?? 25,
    depthReached: 12,
  }))
}

/** GDD formula: fillRatio = (clamp(evalPawns, -4, 4) + 4) / 8 */
function fillRatio(evalCp: number): number {
  const pawns = Math.max(-4, Math.min(4, evalCp / 100))
  return (pawns + 4) / 8
}

describe('replay analysis integration', () => {
  it('test_analysis_preanalyses_all_positions_without_error', async () => {
    const positions = buildReplayPositions(PGN)
    const analysis = useReplayAnalysis({ depth: 12 })
    const analyzeFn = makeAnalyzeFn()

    await analysis.run(positions.map((p) => p.fen), analyzeFn)

    expect(analysis.isAnalysing.value).toBe(false)
    expect(analysis.totalCount.value).toBe(5)
    expect(analysis.analysedCount.value).toBe(5)
    positions.forEach((p) => expect(analysis.getByFen(p.fen)).not.toBeNull())
    expect((analyzeFn as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(
      expect.objectContaining({ targetDepth: 12 }),
    )
  })

  it('test_analysis_eval_reactivity_fillratio_changes_between_moves', async () => {
    const positions = buildReplayPositions(PGN)
    const analysis = useReplayAnalysis()
    const analyzeFn = makeAnalyzeFn({
      [positions[1].fen]: 30,
      [positions[2].fen]: -120,
    })

    await analysis.run(positions.map((p) => p.fen), analyzeFn)

    const r1 = fillRatio(analysis.getByFen(positions[1].fen)!.evalCp!)
    const r2 = fillRatio(analysis.getByFen(positions[2].fen)!.evalCp!)
    expect(r1).not.toBe(r2)
    expect(r1).toBeGreaterThan(0.5) // White slightly better
    expect(r2).toBeLessThan(0.5) // Black better
  })

  it('test_analysis_bestmove_parses_to_valid_from_to_squares', async () => {
    const positions = buildReplayPositions(PGN)
    const analysis = useReplayAnalysis()

    await analysis.run(positions.map((p) => p.fen), makeAnalyzeFn())

    const entry = analysis.getByFen(positions[0].fen)!
    const uci = entry.bestMove!
    const from = uci.slice(0, 2)
    const to = uci.slice(2, 4)
    expect(from).toMatch(/^[a-h][1-8]$/)
    expect(to).toMatch(/^[a-h][1-8]$/)
  })

  it('test_analysis_engine_failure_leaves_blank_no_stuck_spinner', async () => {
    const positions = buildReplayPositions(PGN)
    const analysis = useReplayAnalysis()
    const failingFn: ReplayAnalyzeFn = vi.fn(async () => {
      throw new Error('engine unavailable')
    })

    await analysis.run(positions.map((p) => p.fen), failingFn)

    expect(analysis.isAnalysing.value).toBe(false) // EC-04: no stuck spinner
    positions.forEach((p) => expect(analysis.getByFen(p.fen)).toBeNull())
  })

  it('test_analysis_dedupes_repeated_fens', async () => {
    const analysis = useReplayAnalysis()
    const analyzeFn = makeAnalyzeFn()
    const dupFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

    await analysis.run([dupFen, dupFen, dupFen], analyzeFn)

    expect(analysis.totalCount.value).toBe(1)
    expect(analyzeFn as ReturnType<typeof vi.fn>).toHaveBeenCalledTimes(1)
  })
})
