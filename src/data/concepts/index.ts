import type { ChessConcept, ConceptMeta } from '../../types/concept'
import { MOTIF_TO_CONCEPT } from '../../types/concept'
import type { PuzzleMotif } from '../../types/puzzle'

/**
 * The static concept catalog (GDD §3.1). Each entry names the REAL lesson(s) that teach the
 * concept; `tests/unit/data/concepts.test.ts` asserts every `teaches` id resolves against the
 * lesson catalog and that lesson-only concepts carry no puzzle motif. Adding a drill puzzle
 * for a lesson-only concept lights its course→puzzle bridge with no code change (data-driven).
 */
export const concepts: readonly ConceptMeta[] = [
  { id: 'material', label: '子力', teaches: ['king-and-value'] },
  { id: 'fork', label: '捉雙', teaches: ['fork'] },
  { id: 'pin', label: '牽制', teaches: ['pin'] },
  { id: 'mate', label: '將殺', teaches: ['checkmate-in-one'] },
  { id: 'skewer', label: '串擊', teaches: ['skewer'] },
  { id: 'discovered', label: '閃擊', teaches: ['discovered-attack'] },
  { id: 'defense', label: '保護', teaches: ['protection'] },
  { id: 'center', label: '控制中心', teaches: ['control-the-center'] },
]

/** Returns the concept metadata for an id, or `undefined` if no such concept exists. */
export function getConceptById(id: ChessConcept): ConceptMeta | undefined {
  return concepts.find((concept) => concept.id === id)
}

/**
 * Derived inverse of `MOTIF_TO_CONCEPT` (GDD §4.1): the puzzle motifs that drill a concept.
 * May be ∅ for lesson-only concepts (skewer/discovered/defense/center). Computed, not stored,
 * so the two directions can never disagree.
 */
export function conceptToMotifs(concept: ChessConcept): PuzzleMotif[] {
  return (Object.keys(MOTIF_TO_CONCEPT) as PuzzleMotif[]).filter(
    (motif) => MOTIF_TO_CONCEPT[motif] === concept,
  )
}

/**
 * Bridge 2 (試煉 → 課程, GDD §3.3): the concept a puzzle's `motif` drills and the lesson that
 * teaches it. Returns `null` when the concept has no teaching lesson (EC-3 — the puzzle view then
 * omits the back-link). None of v1's drill motifs hit this, but it is guarded defensively so a
 * future motif without a taught concept degrades to "no link" rather than crashing.
 */
export function reviewLinkForMotif(
  motif: PuzzleMotif,
): { label: string; lessonId: string } | null {
  const meta = getConceptById(MOTIF_TO_CONCEPT[motif])
  const lessonId = meta?.teaches[0]
  if (!meta || !lessonId) return null
  return { label: meta.label, lessonId }
}
