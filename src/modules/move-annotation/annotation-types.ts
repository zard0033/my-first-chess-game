/**
 * Move annotation display types.
 * ADR-0006: neutral role semantics — no emotive labels anywhere in this type surface.
 * TR-move-annotation-001: declarative annotations prop — no imperative add-arrow API.
 * TR-move-annotation-003: neutral role semantics enforced at the type level.
 */

/**
 * Neutral arrow/highlight role enum.
 * Forbidden values: lastMove, quality, judgment, brilliant, blunder, mistake, inaccuracy.
 * These are explicitly NOT part of this type — enforced structurally per ADR-0006 + Pillar 3.
 */
export type AnnotationRole =
  | 'bestMove'
  | 'playedMove'
  | 'alternateLine'
  | 'threat'
  | 'keySquare'
  | 'from'
  | 'to'

export interface ArrowAnnotation {
  readonly kind: 'arrow'
  readonly role: AnnotationRole
  readonly from: string
  readonly to: string
}

export interface HighlightAnnotation {
  readonly kind: 'highlight'
  readonly role: AnnotationRole
  readonly square: string
}

export type Annotation = ArrowAnnotation | HighlightAnnotation

export interface EvaluationInput {
  /** Centipawns in side-to-move convention (+ve = side-to-move winning). */
  readonly evalCp?: number
  /** Moves-to-mate in side-to-move convention (+ve = side-to-move mates). */
  readonly evalMate?: number
  /** Which side is to move in the annotated position. */
  readonly sideToMove: 'w' | 'b'
}

export interface NormalizedEval {
  /** White's-perspective centipawns (sign-flipped when side-to-move = 'b'). */
  readonly evalNormCp: number | undefined
  /** White's-perspective mate (sign-flipped when side-to-move = 'b'). */
  readonly evalMateNorm: number | undefined
}
