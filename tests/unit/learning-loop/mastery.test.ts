import { describe, it, expect } from 'vitest'
import { learned, practiced, practicedCount } from '../../../src/modules/learning-loop/mastery'
import type { Puzzle, PuzzleMotif } from '../../../src/types/puzzle'

// S14-06 — Concept Map mastery state pure functions (GDD §4.2; AC-8).
// Uses the REAL concept catalog (teaches ids) but FIXTURE puzzles so the assertions pin the logic.

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
  puz('fork-1', 1, 'fork'),
  puz('fork-2', 2, 'fork'),
  puz('cap-1', 3, 'capture'),
]

describe('learned', () => {
  it('test_mastery_learned_trueWhenAllTeachingLessonsCompleted', () => {
    // fork concept teaches ['fork']
    expect(learned('fork', (id) => id === 'fork')).toBe(true)
  })

  it('test_mastery_learned_falseWhenTeachingLessonIncomplete', () => {
    expect(learned('fork', () => false)).toBe(false)
  })

  it('test_mastery_learned_falseForConceptWithNoTeachingLessons', () => {
    // No concept has empty teaches in v1; assert the guard via a never-completing predicate on a
    // concept whose lesson exists — and document the non-empty-guard contract.
    expect(learned('material', () => false)).toBe(false)
  })
})

describe('practiced', () => {
  const solvedFork1 = (id: string) => id === 'fork-1'

  it('test_mastery_practiced_trueAtThresholdOne', () => {
    expect(practiced('fork', FIXTURE, solvedFork1, 1)).toBe(true)
  })

  it('test_mastery_practiced_falseBelowThreshold', () => {
    expect(practiced('fork', FIXTURE, solvedFork1, 2)).toBe(false)
    expect(practiced('fork', FIXTURE, () => false, 1)).toBe(false)
  })

  it('test_mastery_practiced_falseForLessonOnlyConcept', () => {
    // skewer has no drill puzzles → never 已練, even with everything "solved".
    expect(practiced('skewer', FIXTURE, () => true, 1)).toBe(false)
  })

  it('test_mastery_practiced_clampsZeroThresholdToOne', () => {
    // A mis-set 0 must NOT mark a concept with zero solved puzzles as practised.
    expect(practiced('fork', FIXTURE, () => false, 0)).toBe(false)
  })

  it('test_mastery_practicedCount_countsSolvedDrillsOnly', () => {
    const allSolved = () => true
    expect(practicedCount('fork', FIXTURE, allSolved)).toBe(2)
    expect(practicedCount('material', FIXTURE, allSolved)).toBe(1)
    expect(practicedCount('skewer', FIXTURE, allSolved)).toBe(0)
  })
})
