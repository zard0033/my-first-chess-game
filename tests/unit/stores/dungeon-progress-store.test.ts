// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Logged-out by default → cloud writes no-op; we test local-cache + unlock + nodeState.
// The reconcile-union test injects a mocked data-sync store.
vi.mock('@/lib/supabase', () => ({
  supabase: { auth: { onAuthStateChange: vi.fn() }, from: vi.fn() },
}))

import { useDungeonProgressStore } from '@/stores/dungeon-progress'
import { useDataSyncStore } from '@/stores/data-sync'
import { puzzles } from '@/data/puzzles'

const STORAGE_KEY = 'pgr:dungeon:progress'

function puzzleByOrder(order: number) {
  const p = puzzles.find((x) => x.order === order)
  if (!p) throw new Error(`no puzzle with order ${order}`)
  return p
}

describe('useDungeonProgressStore', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('test_unlock_first_puzzle_is_always_unlocked', () => {
    const store = useDungeonProgressStore()
    expect(store.isUnlocked(puzzleByOrder(1))).toBe(true)
  })

  it('test_unlock_second_puzzle_locked_until_first_solved', () => {
    const store = useDungeonProgressStore()
    const second = puzzleByOrder(2)
    expect(store.isUnlocked(second)).toBe(false)

    store.markSolved(puzzleByOrder(1).id)
    expect(store.isUnlocked(second)).toBe(true)
  })

  it('test_nodeState_frontier_is_current_rest_locked', () => {
    const store = useDungeonProgressStore()
    store.markSolved(puzzleByOrder(1).id)

    expect(store.nodeState(puzzleByOrder(1))).toBe('done')
    expect(store.nodeState(puzzleByOrder(2))).toBe('current')
    expect(store.nodeState(puzzleByOrder(3))).toBe('locked')
  })

  it('test_nodeState_all_solved_has_no_current', () => {
    const store = useDungeonProgressStore()
    for (const p of puzzles) store.markSolved(p.id)
    expect(store.currentOrder).toBeNull()
    for (const p of puzzles) expect(store.nodeState(p)).toBe('done')
  })

  it('test_markSolved_persists_and_is_idempotent', () => {
    const store = useDungeonProgressStore()
    const id = puzzleByOrder(1).id
    store.markSolved(id)
    store.markSolved(id)
    expect(store.solvedCount).toBe(1)

    const raw = localStorage.getItem(STORAGE_KEY)
    expect(raw).not.toBeNull()
    expect(JSON.parse(raw!).solved).toEqual([id])
  })

  it('test_percent_is_solved_over_total_rounded', () => {
    const store = useDungeonProgressStore()
    expect(store.percent).toBe(0)
    store.markSolved(puzzleByOrder(1).id)
    expect(store.percent).toBe(Math.round((100 * 1) / puzzles.length))
  })

  it('test_markHintUsed_tracked_separately_and_persisted', () => {
    const store = useDungeonProgressStore()
    const id = puzzleByOrder(1).id
    store.markHintUsed(id)
    expect(store.wasHintUsed(id)).toBe(true)
    expect(store.isSolved(id)).toBe(false)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).hinted).toEqual([id])
  })

  it('test_corrupt_localStorage_treated_as_empty', () => {
    localStorage.setItem(STORAGE_KEY, '{ not valid json')
    setActivePinia(createPinia())
    const store = useDungeonProgressStore()
    expect(store.solvedCount).toBe(0)
    expect(store.isUnlocked(puzzleByOrder(1))).toBe(true)
  })

  it('test_hydrates_from_localStorage', () => {
    const id = puzzleByOrder(1).id
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ solved: [id], hinted: [id] }))
    setActivePinia(createPinia())
    const store = useDungeonProgressStore()
    expect(store.isSolved(id)).toBe(true)
    expect(store.wasHintUsed(id)).toBe(true)
    expect(store.isUnlocked(puzzleByOrder(2))).toBe(true)
  })

  it('test_reconcileOnLogin_unions_local_and_cloud', async () => {
    const localId = puzzleByOrder(1).id
    const cloudId = puzzleByOrder(2).id

    const store = useDungeonProgressStore()
    store.markSolved(localId) // local-only

    // Mock the data-sync store: cloud has a different solved puzzle (with hint used).
    const dataSync = useDataSyncStore()
    const upsertSpy = vi
      .spyOn(dataSync, 'upsertDungeonProgress')
      .mockResolvedValue(true)
    vi.spyOn(dataSync, 'loadDungeonProgress').mockResolvedValue([
      { puzzleId: cloudId, hintUsed: true },
    ])

    await store.reconcileOnLogin()

    // Local-only pushed up, cloud-only pulled down → union of both solved.
    expect(store.isSolved(localId)).toBe(true)
    expect(store.isSolved(cloudId)).toBe(true)
    expect(store.wasHintUsed(cloudId)).toBe(true)
    expect(upsertSpy).toHaveBeenCalledWith([{ puzzleId: localId, hintUsed: false }])
  })
})
