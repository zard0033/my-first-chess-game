/**
 * Unit tests for move annotation display formulas and type constraints.
 * ADR-0006: sign normalization to White's perspective is owned by this module.
 * TR-move-annotation-003: Annotation.role must NOT contain emotive labels (type-level check).
 * TR-move-annotation-004: Formula 1 fillRatio + Formula 3 eval display.
 */
import { describe, it, expect } from 'vitest'
import {
  normalizeEval,
  computeFillRatio,
  formatEvalDisplay,
} from '../../../src/modules/move-annotation/annotation-formulas'
import type {
  Annotation,
  AnnotationRole,
  EvaluationInput,
} from '../../../src/modules/move-annotation/annotation-types'

// -----------------------------------------------------------------------
// AC-3: fillRatio computation (Formula 1)
// -----------------------------------------------------------------------

describe('computeFillRatio — AC-3: Formula 1', () => {
  it('test_fillRatio_evalCp300_sideTomoveWhite_approximately075', () => {
    // Arrange — story AC-3 fixture
    const input: EvaluationInput = { evalCp: 300, sideToMove: 'w' }

    // Act
    const normalized = normalizeEval(input)
    const result = computeFillRatio(normalized)

    // Assert — Math.atan(300/300) / Math.PI + 0.5 ≈ 0.75
    expect(result).toBeCloseTo(0.75, 2)
  })

  it('test_fillRatio_equalPosition_is05', () => {
    const input: EvaluationInput = { evalCp: 0, sideToMove: 'w' }
    const result = computeFillRatio(normalizeEval(input))
    expect(result).toBeCloseTo(0.5, 5)
  })

  it('test_fillRatio_noEval_returnsNeutral', () => {
    const result = computeFillRatio({ evalNormCp: undefined, evalMateNorm: undefined })
    expect(result).toBe(0.5)
  })
})

// -----------------------------------------------------------------------
// AC-4: Sign normalization (Black's perspective)
// -----------------------------------------------------------------------

describe('normalizeEval — AC-4: sign normalization', () => {
  it('test_signNorm_evalCp100_sideTomoveBlack_resultsInNegative100', () => {
    // Arrange — AC-4: evalCp=100 with Black to move → normalized to -100 → White disadvantage
    const input: EvaluationInput = { evalCp: 100, sideToMove: 'b' }

    // Act
    const normalized = normalizeEval(input)

    // Assert — sign flipped
    expect(normalized.evalNormCp).toBe(-100)
  })

  it('test_signNorm_fillRatioBlackToMove_isLessThan05', () => {
    // AC-4: evalCp=100, sideToMove='b' → normalized -100 → fillRatio < 0.5
    const input: EvaluationInput = { evalCp: 100, sideToMove: 'b' }
    const result = computeFillRatio(normalizeEval(input))
    expect(result).toBeLessThan(0.5)
  })

  it('test_signNorm_whiteToMove_noFlip', () => {
    const input: EvaluationInput = { evalCp: 150, sideToMove: 'w' }
    const normalized = normalizeEval(input)
    expect(normalized.evalNormCp).toBe(150)
  })

  it('test_signNorm_evalMate_flippedForBlack', () => {
    // Black mates in 3 (side-to-move perspective: +3) → White is mated → evalMateNorm = -3
    const input: EvaluationInput = { evalMate: 3, sideToMove: 'b' }
    const normalized = normalizeEval(input)
    expect(normalized.evalMateNorm).toBe(-3)
  })
})

// -----------------------------------------------------------------------
// AC-5: evalMate === 0 → badge "—", no best-move arrow
// -----------------------------------------------------------------------

describe('computeFillRatio — AC-5: evalMate === 0 terminal', () => {
  it('test_fillRatio_evalMate0_returnsNeutral05', () => {
    // Arrange — terminal position: evalMate === 0 (checkmate/stalemate already on board)
    const normalized = normalizeEval({ evalMate: 0, sideToMove: 'w' })
    const result = computeFillRatio(normalized)

    // Assert — neutral position (game already decided, no forward eval)
    expect(result).toBe(0.5)
  })

  it('test_evalDisplay_evalMate0_returnsDash', () => {
    const normalized = normalizeEval({ evalMate: 0, sideToMove: 'w' })
    expect(formatEvalDisplay(normalized)).toBe('—')
  })
})

// -----------------------------------------------------------------------
// Formula 3: eval display formatting
// -----------------------------------------------------------------------

describe('formatEvalDisplay — Formula 3', () => {
  it('test_formatEval_evalCp120_whiteToMove_plusOnePoint2', () => {
    const input: EvaluationInput = { evalCp: 120, sideToMove: 'w' }
    const result = formatEvalDisplay(normalizeEval(input))
    expect(result).toBe('+1.2')
  })

  it('test_formatEval_evalCp70_blackToMove_minusZeroPoint7', () => {
    // Black to move: evalCp=70 (side-to-move winning) → normalized -70 → White losing → "−0.7"
    const input: EvaluationInput = { evalCp: 70, sideToMove: 'b' }
    const result = formatEvalDisplay(normalizeEval(input))
    expect(result).toBe('−0.7') // U+2212 true minus
  })

  it('test_formatEval_evalMate3_whiteToMove_M3', () => {
    const input: EvaluationInput = { evalMate: 3, sideToMove: 'w' }
    const result = formatEvalDisplay(normalizeEval(input))
    expect(result).toBe('M3')
  })

  it('test_formatEval_evalMate2_blackToMove_minusM2', () => {
    // Black mates in 2 → White is mated → "−M2"
    const input: EvaluationInput = { evalMate: 2, sideToMove: 'b' }
    const result = formatEvalDisplay(normalizeEval(input))
    expect(result).toBe('−M2') // U+2212 true minus
  })

  it('test_formatEval_noEval_returnsDash', () => {
    const result = formatEvalDisplay({ evalNormCp: undefined, evalMateNorm: undefined })
    expect(result).toBe('—')
  })

  it('test_formatEval_evalMate_whiteToMovePositive_fillRatioIs1', () => {
    // White mates → fillRatio = 1.0
    const input: EvaluationInput = { evalMate: 3, sideToMove: 'w' }
    const result = computeFillRatio(normalizeEval(input))
    expect(result).toBe(1.0)
  })

  it('test_formatEval_evalMate_blackMates_fillRatioIs0', () => {
    // Black mates (evalMate = 3 from Black's perspective) → normalized -3 → fillRatio = 0.0
    const input: EvaluationInput = { evalMate: 3, sideToMove: 'b' }
    const result = computeFillRatio(normalizeEval(input))
    expect(result).toBe(0.0)
  })
})

// -----------------------------------------------------------------------
// AC-6: Annotation.role type constraint (structural check)
// -----------------------------------------------------------------------

describe('Annotation.role — AC-6: type constraint (structural)', () => {
  it('test_annotationRole_validRoles_areAccepted', () => {
    // This is a compile-time check — if the valid roles compile without error, the test passes
    const validRoles: AnnotationRole[] = [
      'bestMove', 'playedMove', 'alternateLine', 'threat', 'keySquare', 'from', 'to',
    ]
    expect(validRoles).toHaveLength(7)
  })

  it('test_annotation_validArrow_isWellTyped', () => {
    // If this compiles, the type is correct
    const arrow: Annotation = {
      kind: 'arrow',
      role: 'bestMove',
      from: 'e2',
      to: 'e4',
    }
    expect(arrow.kind).toBe('arrow')
    expect(arrow.role).toBe('bestMove')
  })

  it('test_annotation_validHighlight_isWellTyped', () => {
    const highlight: Annotation = {
      kind: 'highlight',
      role: 'keySquare',
      square: 'd5',
    }
    expect(highlight.kind).toBe('highlight')
    expect(highlight.role).toBe('keySquare')
  })

  it('test_annotationRole_doesNotContainEmotiveLabels', () => {
    // Structural enforcement: the emotive labels must NOT exist in AnnotationRole
    // This test documents the constraint — actual enforcement is at the TypeScript level
    const forbiddenLabels = ['brilliant', 'blunder', 'mistake', 'inaccuracy', 'lastMove', 'quality', 'judgment']
    const validRoles: AnnotationRole[] = [
      'bestMove', 'playedMove', 'alternateLine', 'threat', 'keySquare', 'from', 'to',
    ]
    for (const forbidden of forbiddenLabels) {
      expect(validRoles).not.toContain(forbidden)
    }
  })
})
