import { describe, it, expect } from 'vitest'
import { concepts, conceptToMotifs, getConceptById, reviewLinkForMotif } from '../../../src/data/concepts'
import { MOTIF_TO_CONCEPT, ALL_PUZZLE_MOTIFS } from '../../../src/types/concept'
import type { ChessConcept } from '../../../src/types/concept'
import { lessons } from '../../../src/data/lessons'

// S14-01 — Concept SoT integrity (GDD §3.1/§4.1, AC-1). This is the content gate for the
// whole Learning Loop: every concept label is non-empty, every `teaches` id resolves to a
// real lesson, and MOTIF_TO_CONCEPT is total over the puzzle motif set. Authoring drift
// (a renamed lesson id, a new motif without a mapping) fails this suite loudly.

describe('concept catalog integrity', () => {
  it('test_concepts_isNonEmpty', () => {
    expect(concepts.length).toBeGreaterThan(0)
  })

  it('test_concepts_hasNoDuplicateIds', () => {
    const ids = concepts.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('test_concepts_everyLabelIsNonEmpty', () => {
    for (const concept of concepts) {
      expect(concept.label.trim().length, `concept "${concept.id}" label`).toBeGreaterThan(0)
    }
  })

  it('test_concepts_everyTeachesIdResolvesToARealLesson', () => {
    const lessonIds = new Set(lessons.map((l) => l.id))
    for (const concept of concepts) {
      expect(concept.teaches.length, `concept "${concept.id}" teaches`).toBeGreaterThan(0)
      for (const id of concept.teaches) {
        expect(lessonIds.has(id), `lesson id "${id}" (concept "${concept.id}")`).toBe(true)
      }
    }
  })

  // S14-02 (AC-3, bidirectional tag integrity): a lesson can hold the id yet never carry the
  // concept tag — that silently disables a bridge with no id-resolution failure. Assert the
  // reverse direction: every `teaches` lesson actually declares the concept in its `concepts`.
  it('test_concepts_everyTeachesLessonCarriesTheConceptTag', () => {
    const lessonById = new Map(lessons.map((l) => [l.id, l]))
    for (const concept of concepts) {
      for (const id of concept.teaches) {
        const lesson = lessonById.get(id)
        expect(lesson, `lesson "${id}"`).toBeDefined()
        expect(
          lesson?.concepts ?? [],
          `lesson "${id}" should carry concept "${concept.id}"`,
        ).toContain(concept.id)
      }
    }
  })
})

describe('motif → concept mapping totality', () => {
  it('test_motifMap_keysEqualAllPuzzleMotifsByEnumeration', () => {
    // Runtime enumeration check — the TS Record type is erased, so assert against the
    // explicit ALL_PUZZLE_MOTIFS list, not puzzles.map (which passes vacuously for unused motifs).
    const mapKeys = new Set(Object.keys(MOTIF_TO_CONCEPT))
    const allMotifs = new Set<string>(ALL_PUZZLE_MOTIFS)
    expect(mapKeys).toEqual(allMotifs)
  })

  it('test_motifMap_everyTargetIsAKnownConcept', () => {
    const conceptIds = new Set<ChessConcept>(concepts.map((c) => c.id))
    for (const motif of ALL_PUZZLE_MOTIFS) {
      expect(conceptIds.has(MOTIF_TO_CONCEPT[motif]), `motif "${motif}" → concept`).toBe(true)
    }
  })
})

describe('conceptToMotifs (derived inverse)', () => {
  it('test_conceptToMotifs_returnsCorrectInverseForDrillConcepts', () => {
    expect(conceptToMotifs('material')).toEqual(['capture'])
    expect(conceptToMotifs('fork')).toEqual(['fork'])
    expect(conceptToMotifs('pin')).toEqual(['pin'])
    expect(conceptToMotifs('mate').sort()).toEqual(['mate-in-1', 'mate-in-2'])
  })

  it('test_conceptToMotifs_returnsEmptyForLessonOnlyConcepts', () => {
    for (const id of ['skewer', 'discovered', 'defense', 'center'] as ChessConcept[]) {
      expect(conceptToMotifs(id), `conceptToMotifs("${id}")`).toEqual([])
    }
  })
})

// S14-05 — Bridge 2 (試煉 → 課程) back-link target resolution (GDD §3.3, AC-4).
describe('reviewLinkForMotif', () => {
  it('test_reviewLink_resolvesEveryDrillMotifToItsConceptAndLesson', () => {
    const lessonIds = new Set(lessons.map((l) => l.id))
    for (const motif of ['capture', 'fork', 'pin', 'mate-in-1', 'mate-in-2'] as const) {
      const link = reviewLinkForMotif(motif)
      expect(link, `motif "${motif}"`).not.toBeNull()
      expect(link!.label.trim().length).toBeGreaterThan(0)
      expect(lessonIds.has(link!.lessonId), `lesson "${link!.lessonId}"`).toBe(true)
    }
  })

  it('test_reviewLink_mateMotifPointsToCheckmateLesson', () => {
    expect(reviewLinkForMotif('mate-in-1')?.lessonId).toBe('checkmate-in-one')
    expect(reviewLinkForMotif('mate-in-1')?.label).toBe('將殺')
  })
})

describe('getConceptById', () => {
  it('test_getConceptById_returnsConceptForKnownId', () => {
    expect(getConceptById('fork')?.label).toBe('捉雙')
  })

  it('test_getConceptById_returnsUndefinedForUnknownId', () => {
    expect(getConceptById('nonexistent' as ChessConcept)).toBeUndefined()
  })
})
