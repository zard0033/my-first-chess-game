import { describe, it, expect } from 'vitest'
import { candidates, recommended, practiceTarget } from '../../../src/modules/learning-loop/recommend'
import type { Puzzle, PuzzleMotif } from '../../../src/types/puzzle'

// S14-04 — Bridge 1 recommendation pure functions (GDD §4.3; AC-2, EC-7).
// Fixtures, not the real catalog — these tests pin the ordering/cap/replay logic.

function puz(id: string, order: number, motif: PuzzleMotif): Puzzle {
  return {
    id,
    level: 1,
    order,
    motif,
    title: id,
    prompt: '',
    fen: '8/8/8/8/8/8/8/8 w - - 0 1',
    solution: [{ from: 'a1', to: 'a2' }],
    hint: '',
    successText: '',
  } as Puzzle
}

const FIXTURE: Puzzle[] = [
  puz('cap-1', 1, 'capture'),
  puz('fork-1', 2, 'fork'),
  puz('fork-2', 3, 'fork'),
  puz('fork-3', 4, 'fork'),
  puz('m1-a', 5, 'mate-in-1'),
  puz('m2-a', 6, 'mate-in-2'),
  puz('m1-b', 7, 'mate-in-1'),
]

const noneSolved = () => false

describe('candidates', () => {
  it('test_candidates_returnsConceptPuzzlesSortedByOrder', () => {
    expect(candidates('fork', FIXTURE).map((p) => p.id)).toEqual(['fork-1', 'fork-2', 'fork-3'])
  })

  it('test_candidates_emptyForConceptWithNoPuzzles', () => {
    expect(candidates('skewer', FIXTURE)).toEqual([])
  })
})

describe('recommended', () => {
  it('test_recommended_capsAtN', () => {
    expect(recommended('fork', FIXTURE, noneSolved, 2).map((p) => p.id)).toEqual(['fork-1', 'fork-2'])
  })

  it('test_recommended_unsolvedFirst', () => {
    const solved = (id: string) => id === 'fork-1'
    expect(recommended('fork', FIXTURE, solved, 3).map((p) => p.id)).toEqual(['fork-2', 'fork-3', 'fork-1'])
  })

  it('test_recommended_mateDifficultyMatchPrefersMatchingMotif', () => {
    // A player who finished checkmate-in-one is offered mate-in-1 puzzles before mate-in-2.
    const ids = recommended('mate', FIXTURE, noneSolved, 3, 'mate-in-1').map((p) => p.id)
    expect(ids).toEqual(['m1-a', 'm1-b', 'm2-a'])
  })

  it('test_recommended_emptyForConceptWithNoPuzzles', () => {
    expect(recommended('center', FIXTURE, noneSolved, 3)).toEqual([])
  })
})

describe('practiceTarget', () => {
  it('test_practiceTarget_returnsLowestOrderUnsolved', () => {
    const solved = (id: string) => id === 'fork-1'
    expect(practiceTarget('fork', FIXTURE, solved)?.id).toBe('fork-2')
  })

  it('test_practiceTarget_allSolvedFallsBackToLowestOrderReplay', () => {
    const allSolved = () => true
    expect(practiceTarget('fork', FIXTURE, allSolved)?.id).toBe('fork-1')
  })

  it('test_practiceTarget_nullForConceptWithNoPuzzles', () => {
    expect(practiceTarget('discovered', FIXTURE, noneSolved)).toBeNull()
  })
})
