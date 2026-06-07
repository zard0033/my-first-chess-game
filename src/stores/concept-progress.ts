import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

const STORAGE_KEY = 'pgr:concept:practice'

interface ProgressShape {
  practiceSolved: string[]
}

/**
 * Read persisted practice progress. Corrupt or absent data is treated as empty — must never
 * throw and brick the UI (mirrors dungeon-progress's defensive load).
 */
function loadProgress(): ProgressShape {
  if (typeof localStorage === 'undefined') return { practiceSolved: [] }
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return { practiceSolved: [] }
  try {
    const parsed = JSON.parse(raw) as ProgressShape
    const practiceSolved = Array.isArray(parsed?.practiceSolved)
      ? parsed.practiceSolved.filter((id): id is string => typeof id === 'string')
      : []
    return { practiceSolved }
  } catch {
    return { practiceSolved: [] }
  }
}

/**
 * Concept practice progress (Learning Loop #20, S14-03 — D1 side-door). Records puzzles solved
 * from a lesson's Bridge-1 CTA in **practice mode**. This is deliberately a SEPARATE store from
 * `dungeon-progress`: a practice solve must NOT mutate the dungeon's linear `solved` set,
 * `currentOrder`, or `nodeState` (the D1 zero-mutation invariant). The Concept Map's 已練 state
 * (Phase B) will read `practiceSolved ∪ dungeonSolved` of a concept ≥ threshold.
 *
 * localStorage only in Phase A; cross-device sync (if wanted) is deferred to the Concept Map.
 */
export const useConceptProgressStore = defineStore('conceptProgress', () => {
  const initial = loadProgress()
  const practiceSolved = ref<Set<string>>(new Set(initial.practiceSolved))

  function persist(): void {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ practiceSolved: [...practiceSolved.value] }))
  }

  function isPracticeSolved(puzzleId: string): boolean {
    return practiceSolved.value.has(puzzleId)
  }

  /** Record a puzzle solved in practice mode. Idempotent; persists to localStorage. */
  function markPracticed(puzzleId: string): void {
    if (practiceSolved.value.has(puzzleId)) return
    practiceSolved.value.add(puzzleId)
    practiceSolved.value = new Set(practiceSolved.value) // new ref so computed deps re-run
    persist()
  }

  const practiceSolvedCount = computed(() => practiceSolved.value.size)

  return { practiceSolved, practiceSolvedCount, isPracticeSolved, markPracticed }
})
