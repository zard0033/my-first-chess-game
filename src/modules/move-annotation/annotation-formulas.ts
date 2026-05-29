/**
 * Pure formula functions for the move annotation display.
 * ADR-0006: sign normalization to White's perspective is done here — consumers must NOT pre-flip.
 * TR-move-annotation-004: eval bar fillRatio + sign normalization to White's perspective.
 */
import type { EvaluationInput, NormalizedEval } from './annotation-types'

/**
 * Normalize engine eval from side-to-move convention to White's-perspective convention.
 * Rule: if sideToMove === 'b', flip the sign of both evalCp and evalMate.
 * Consumers MUST NOT pre-flip — this function is the single normalization point.
 */
export function normalizeEval(input: EvaluationInput): NormalizedEval {
  const flip = input.sideToMove === 'b' ? -1 : 1
  return {
    evalNormCp: input.evalCp !== undefined ? input.evalCp * flip : undefined,
    evalMateNorm: input.evalMate !== undefined ? input.evalMate * flip : undefined,
  }
}

/**
 * Formula 1 (story AC): eval bar fill ratio, White's perspective.
 * fillRatio = Math.atan(evalNormCp / 300) / Math.PI + 0.5
 * For mate: pegged to 1.0 (White mates) or 0.0 (White is mated).
 * For evalMate === 0: terminal position → neutral 0.5 (game already decided).
 * For no data: neutral 0.5.
 */
export function computeFillRatio(normalized: NormalizedEval): number {
  const { evalNormCp, evalMateNorm } = normalized
  if (evalMateNorm === 0) return 0.5 // terminal position — no forward eval
  if (evalMateNorm !== undefined) return evalMateNorm > 0 ? 1.0 : 0.0
  if (evalNormCp !== undefined) {
    return Math.atan(evalNormCp / 300) / Math.PI + 0.5
  }
  return 0.5
}

/**
 * Formula 3: eval display string from normalized White's-perspective values.
 * evalMate === 0 → "—" (terminal, no forward eval)
 * evalMate defined → "M{n}" or "−M{n}" (U+2212 minus)
 * evalCp defined → "+{n.n}" or "−{n.n}" (U+2212 minus)
 * no data → "—"
 */
export function formatEvalDisplay(normalized: NormalizedEval): string {
  const { evalNormCp, evalMateNorm } = normalized
  if (evalMateNorm === 0) return '—' // em dash for terminal
  if (evalMateNorm !== undefined) {
    return evalMateNorm >= 0
      ? `M${evalMateNorm}`
      : `−M${Math.abs(evalMateNorm)}` // U+2212 true minus
  }
  if (evalNormCp !== undefined) {
    const absVal = (Math.abs(evalNormCp) / 100).toFixed(1)
    return evalNormCp >= 0 ? `+${absVal}` : `−${absVal}` // U+2212 true minus
  }
  return '—' // em dash for no data
}
