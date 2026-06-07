/**
 * Learning Loop — shared concept vocabulary (GDD: design/gdd/learning-loop.md §3.1, §4.1,
 * Appendix). A `ChessConcept` is a named, beginner-level chess idea that all three learning
 * surfaces already use; it is the single primitive that stitches lessons ↔ puzzles ↔ game
 * review into one loop.
 *
 * Static, front-end-only data. The set is closed (this union) and never invented at runtime.
 * Concepts link the lesson catalog (by real lesson id) and the puzzle catalog (by `motif`) —
 * never by comparing `order` across the two independent catalogs.
 */

import type { PuzzleMotif } from './puzzle'

/** The closed concept vocabulary. Lesson-only concepts have no drill puzzles in v1. */
export type ChessConcept =
  | 'material' // 子力（得失／無保護的子）
  | 'fork' // 捉雙
  | 'pin' // 牽制
  | 'mate' // 將殺（含底線／基本殺王）
  | 'skewer' // 串擊        (lesson-only in v1)
  | 'discovered' // 閃擊        (lesson-only in v1)
  | 'defense' // 保護        (lesson-only in v1)
  | 'center' // 控制中心     (lesson-only in v1)

/** Per-concept metadata. `teaches` holds REAL lesson ids; the data test asserts each resolves. */
export interface ConceptMeta {
  id: ChessConcept
  /** 繁中 display label, e.g. '捉雙'. 西洋棋用語: 后/城堡/騎士/主教/國王/兵. */
  label: string
  /** Lesson ids that teach this concept (verified against src/data/lessons by concepts.test.ts). */
  teaches: string[]
}

/**
 * Single source of truth for the drill mapping (GDD §4.1). Total over `PuzzleMotif`:
 * `Record<PuzzleMotif, …>` makes adding a motif without a row a compile error, so the map
 * can never silently miss a motif. The inverse `conceptToMotifs` is derived, not stored.
 */
export const MOTIF_TO_CONCEPT: Record<PuzzleMotif, ChessConcept> = {
  capture: 'material',
  fork: 'fork',
  pin: 'pin',
  'mate-in-1': 'mate',
  'mate-in-2': 'mate',
}

/**
 * Explicit runtime enumeration of `PuzzleMotif`, adjacent to the type. The TS type is erased
 * at runtime, so concepts.test.ts needs this real list to prove `MOTIF_TO_CONCEPT` is total
 * (deriving it from `puzzles.map(p => p.motif)` would pass vacuously for an unused motif).
 * Keep in sync with `PuzzleMotif` in ./puzzle — the data test fails loudly if they diverge.
 */
export const ALL_PUZZLE_MOTIFS: readonly PuzzleMotif[] = [
  'capture',
  'fork',
  'pin',
  'mate-in-1',
  'mate-in-2',
]
