// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// dungeon-progress imports data-sync → supabase; stub it so the zero-mutation test can
// instantiate the dungeon store logged-out (cloud writes no-op).
vi.mock('@/lib/supabase', () => ({
  supabase: { auth: { onAuthStateChange: vi.fn() }, from: vi.fn() },
}))

import { useConceptProgressStore } from '@/stores/concept-progress'
import { useDungeonProgressStore } from '@/stores/dungeon-progress'
import { puzzles } from '@/data/puzzles'

const STORAGE_KEY = 'pgr:concept:practice'

describe('useConceptProgressStore', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('test_markPracticed_addsToPracticeSolvedAndPersists', () => {
    const store = useConceptProgressStore()
    expect(store.isPracticeSolved('l2-some-fork')).toBe(false)

    store.markPracticed('l2-some-fork')

    expect(store.isPracticeSolved('l2-some-fork')).toBe(true)
    expect(store.practiceSolvedCount).toBe(1)
    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    expect(persisted.practiceSolved).toContain('l2-some-fork')
  })

  it('test_markPracticed_isIdempotent', () => {
    const store = useConceptProgressStore()
    store.markPracticed('p1')
    store.markPracticed('p1')
    expect(store.practiceSolvedCount).toBe(1)
  })

  it('test_load_corruptDataDegradesToEmpty', () => {
    localStorage.setItem(STORAGE_KEY, '{ not valid json')
    setActivePinia(createPinia())
    const store = useConceptProgressStore()
    expect(store.practiceSolvedCount).toBe(0)
  })

  it('test_load_rehydratesFromPersistedState', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ practiceSolved: ['a', 'b'] }))
    setActivePinia(createPinia())
    const store = useConceptProgressStore()
    expect(store.isPracticeSolved('a')).toBe(true)
    expect(store.isPracticeSolved('b')).toBe(true)
  })
})

// AC-03 (D1 zero-mutation invariant): a practice solve must leave the DUNGEON store's solved
// set, currentOrder, and every node's state byte-for-byte identical. This is the invariant the
// whole side-door rests on — practice progress lives in a separate store and never touches #19.
describe('D1 side-door — practice solve does not mutate dungeon progress', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('test_practiceSolve_leavesDungeonStoreIdentical', () => {
    const dungeon = useDungeonProgressStore()
    const concept = useConceptProgressStore()

    // Snapshot the dungeon's full observable state before any practice.
    const before = {
      solved: [...dungeon.solved].sort(),
      currentOrder: dungeon.currentOrder,
      solvedCount: dungeon.solvedCount,
      nodeStates: puzzles.map((p) => dungeon.nodeState(p)),
    }

    // Practice-solve a puzzle deep in the locked range (the flagship fork/pin case).
    const deepLocked = puzzles[puzzles.length - 1]
    concept.markPracticed(deepLocked.id)

    const after = {
      solved: [...dungeon.solved].sort(),
      currentOrder: dungeon.currentOrder,
      solvedCount: dungeon.solvedCount,
      nodeStates: puzzles.map((p) => dungeon.nodeState(p)),
    }

    expect(after).toEqual(before)
    // And the practice solve is recorded where it belongs.
    expect(concept.isPracticeSolved(deepLocked.id)).toBe(true)
    expect(dungeon.isSolved(deepLocked.id)).toBe(false)
  })
})
