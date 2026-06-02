import { describe, it, expect } from 'vitest'
import { Chess } from 'chess.js'
import { lessons, getLessonById } from '../../../src/data/lessons'
import { LESSON_TIERS } from '../../../src/types/lesson'

// S12-01 — Lesson types + static data loader (AC-02, AC-03, AC-04)
// Plus chess.js content-validity gate: every FEN must load and every interactive
// expectedMove must be legal in its step's position.

describe('lesson catalog loader', () => {
  it('test_catalog_isNonEmpty', () => {
    expect(lessons.length).toBeGreaterThan(0)
  })

  it('test_catalog_sortedByOrderAscending', () => {
    const orders = lessons.map((l) => l.order)
    expect(orders).toEqual([...orders].sort((a, b) => a - b))
  })

  it('test_catalog_hasNoDuplicateIds', () => {
    const ids = lessons.map((l) => l.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('test_catalog_hasNoDuplicateOrders', () => {
    const orders = lessons.map((l) => l.order)
    expect(new Set(orders).size).toBe(orders.length)
  })

  it('test_catalog_tierMatchesCategory', () => {
    for (const lesson of lessons) {
      expect(lesson.tier, `${lesson.id}: tier must match category`).toBe(LESSON_TIERS[lesson.category])
    }
  })
})

describe('getLessonById', () => {
  it('test_getLessonById_existingId_returnsLesson', () => {
    const first = lessons[0]
    expect(getLessonById(first.id)).toBe(first)
  })

  it('test_getLessonById_unknownId_returnsUndefined', () => {
    expect(getLessonById('no-such-lesson')).toBeUndefined()
  })
})

describe('lesson content chess-validity', () => {
  it('test_allSteps_fenIsLegalPosition', () => {
    for (const lesson of lessons) {
      lesson.steps.forEach((step, i) => {
        expect(
          () => new Chess(step.fen),
          `${lesson.id} step ${i}: illegal FEN "${step.fen}"`,
        ).not.toThrow()
      })
    }
  })

  it('test_interactiveSteps_expectedMoveIsLegal', () => {
    for (const lesson of lessons) {
      lesson.steps.forEach((step, i) => {
        if (!step.expectedMove) return
        const chess = new Chess(step.fen)
        const move = step.expectedMove
        expect(
          () => chess.move({ from: move.from, to: move.to, promotion: move.promotion }),
          `${lesson.id} step ${i}: illegal expectedMove ${move.from}${move.to}${move.promotion ?? ''} in "${step.fen}"`,
        ).not.toThrow()
      })
    }
  })

  it('test_interactiveSteps_haveSocraticHintAndRevealArrow', () => {
    // Teaching Philosophy: every interactive step needs a stage-1 hint (text) and a
    // stage-2 reveal (arrows). The hint must not be empty.
    for (const lesson of lessons) {
      lesson.steps.forEach((step, i) => {
        if (!step.expectedMove) return
        expect(step.hint?.trim(), `${lesson.id} step ${i}: missing Socratic hint`).toBeTruthy()
        expect(
          step.arrows && step.arrows.length > 0,
          `${lesson.id} step ${i}: missing reveal arrow(s)`,
        ).toBe(true)
      })
    }
  })

  it('test_interactiveSteps_sideToMoveMatchesPlayerColor', () => {
    for (const lesson of lessons) {
      const player = lesson.playerColor ?? 'white'
      const expectedTurn = player === 'white' ? 'w' : 'b'
      lesson.steps.forEach((step, i) => {
        if (!step.expectedMove) return
        const turn = new Chess(step.fen).turn()
        expect(turn, `${lesson.id} step ${i}: side-to-move must be the player`).toBe(expectedTurn)
      })
    }
  })
})
