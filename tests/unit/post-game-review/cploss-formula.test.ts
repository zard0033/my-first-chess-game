/**
 * Unit tests for the F2 cpLoss formula and depth-comparability guard.
 * Story: post-game-review/story-002-cploss-formula
 * AC-1..AC-7
 */
import { describe, it, expect } from 'vitest'
import { computeCpLoss, isCpLossPreliminary } from '../../../src/modules/post-game-review/cploss'
import { DEPTH_MISMATCH_TOLERANCE } from '../../../src/config/engine-tuning'

// ---- AC-1: bad move — both evals positive (side-to-move convention) ----

describe('computeCpLoss — AC-1: bad move', () => {
  it('test_computeCpLoss_badMove_returns130', () => {
    // evalI=50 (we're 50cp ahead before move), evalNext=80 (opponent now 80cp ahead after our move)
    expect(computeCpLoss(50, 80)).toBe(130)
  })
})

// ---- AC-2: good move — improvement is clamped to 0 ----

describe('computeCpLoss — AC-2: good move clamped', () => {
  it('test_computeCpLoss_goodMove_returnsZero', () => {
    // evalI=50, evalNext=-60 → max(0, 50 + (-60)) = max(0, -10) = 0
    expect(computeCpLoss(50, -60)).toBe(0)
  })
})

// ---- AC-3: zero loss — equal swap ----

describe('computeCpLoss — AC-3: zero loss', () => {
  it('test_computeCpLoss_equalSwap_returnsZero', () => {
    expect(computeCpLoss(0, 0)).toBe(0)
  })
})

// ---- Additional formula correctness ----

describe('computeCpLoss — formula correctness', () => {
  it('test_computeCpLoss_bothPositive_sumsCorrectly', () => {
    expect(computeCpLoss(100, 200)).toBe(300)
  })

  it('test_computeCpLoss_negativePlusLargerNegative_returnsZero', () => {
    expect(computeCpLoss(-200, -50)).toBe(0)
  })

  it('test_computeCpLoss_exactlyZeroCrossSum_returnsZero', () => {
    expect(computeCpLoss(100, -100)).toBe(0)
  })
})

// ---- AC-4: depth-comparability guard — marks preliminary ----

describe('isCpLossPreliminary — AC-4: large depth mismatch', () => {
  it('test_isCpLossPreliminary_mismatch6_returnsTrue', () => {
    // |8 - 14| = 6 > DEPTH_MISMATCH_TOLERANCE (4)
    expect(isCpLossPreliminary(8, 14)).toBe(true)
  })
})

// ---- AC-5: depth within tolerance — not preliminary ----

describe('isCpLossPreliminary — AC-5: within tolerance', () => {
  it('test_isCpLossPreliminary_mismatch2_returnsFalse', () => {
    // |10 - 12| = 2 ≤ 4
    expect(isCpLossPreliminary(10, 12)).toBe(false)
  })

  it('test_isCpLossPreliminary_exactlyTolerance_returnsFalse', () => {
    // |10 - 14| = 4 = DEPTH_MISMATCH_TOLERANCE → not preliminary
    expect(isCpLossPreliminary(10, 14)).toBe(false)
  })

  it('test_isCpLossPreliminary_onePastTolerance_returnsTrue', () => {
    // |10 - 15| = 5 > 4 → preliminary
    expect(isCpLossPreliminary(10, 15)).toBe(true)
  })

  it('test_isCpLossPreliminary_sameDepth_returnsFalse', () => {
    expect(isCpLossPreliminary(22, 22)).toBe(false)
  })

  it('test_isCpLossPreliminary_reverseOrderSameAbsValue_returnsTrue', () => {
    // |14 - 8| = 6 > 4 → preliminary (absolute value)
    expect(isCpLossPreliminary(14, 8)).toBe(true)
  })
})

// ---- AC-6: DEPTH_MISMATCH_TOLERANCE is a named export ----

describe('DEPTH_MISMATCH_TOLERANCE — AC-6: named export', () => {
  it('test_depthMismatchTolerance_namedExport_is4', () => {
    expect(DEPTH_MISMATCH_TOLERANCE).toBe(4)
  })
})

// ---- AC-7: pure function — deterministic ----

describe('computeCpLoss — AC-7: pure function', () => {
  it('test_computeCpLoss_sameInputs3Times_identicalOutput', () => {
    const results = [computeCpLoss(50, 80), computeCpLoss(50, 80), computeCpLoss(50, 80)]
    expect(results[0]).toBe(130)
    expect(results[1]).toBe(130)
    expect(results[2]).toBe(130)
  })

  it('test_isCpLossPreliminary_sameInputs3Times_identicalOutput', () => {
    const results = [isCpLossPreliminary(8, 14), isCpLossPreliminary(8, 14), isCpLossPreliminary(8, 14)]
    expect(results[0]).toBe(true)
    expect(results[1]).toBe(true)
    expect(results[2]).toBe(true)
  })
})
