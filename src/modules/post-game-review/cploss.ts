import { DEPTH_MISMATCH_TOLERANCE } from '../../config/engine-tuning'

/**
 * F2 formula: centipawn loss for move i.
 * Both evals are in side-to-move convention (positive = side to move is winning).
 * Clamped to 0 — a negative result means the player improved their position (EC-9).
 */
export function computeCpLoss(evalI: number, evalNext: number): number {
  return Math.max(0, evalI + evalNext)
}

/**
 * Rule 22a depth-comparability guard.
 * Returns true when the depth difference between adjacent positions exceeds the tolerance,
 * meaning the cpLoss value should be shown with preliminary treatment.
 */
export function isCpLossPreliminary(depthI: number, depthNext: number): boolean {
  return Math.abs(depthI - depthNext) > DEPTH_MISMATCH_TOLERANCE
}
