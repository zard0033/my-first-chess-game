import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { puzzles } from '@/data/puzzles'
import type { Puzzle } from '@/types/puzzle'
import { useDataSyncStore } from '@/stores/data-sync'

const STORAGE_KEY = 'pgr:dungeon:progress'

/** Map node state for a puzzle (GDD §4.1). */
export type DungeonNodeState = 'done' | 'current' | 'locked'

interface ProgressShape {
  solved: string[]
  hinted: string[]
}

/**
 * Read the persisted progress. Corrupt or absent data is treated as empty — progress
 * must never throw and brick the dungeon UI.
 */
function loadProgress(): ProgressShape {
  if (typeof localStorage === 'undefined') return { solved: [], hinted: [] }
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return { solved: [], hinted: [] }
  try {
    const parsed = JSON.parse(raw) as ProgressShape
    const solved = Array.isArray(parsed?.solved) ? parsed.solved.filter((id): id is string => typeof id === 'string') : []
    const hinted = Array.isArray(parsed?.hinted) ? parsed.hinted.filter((id): id is string => typeof id === 'string') : []
    return { solved, hinted }
  } catch {
    return { solved: [], hinted: [] }
  }
}

/**
 * Dungeon puzzle progress store (S13-02, GDD §3.6/§4). localStorage is the offline cache
 * for instant paint and unauthenticated play; Supabase (`dungeon_progress`, via the
 * data-sync store per ADR-0011) is the cross-device source of truth once logged in.
 * Solving is monotonic, so reconciliation is a union — local and cloud never conflict
 * (`hintUsed` resolves by OR). Row existence = solved; a hint used before solving is
 * tracked locally and written with the row at solve time.
 */
export const useDungeonProgressStore = defineStore('dungeonProgress', () => {
  const initial = loadProgress()
  const solved = ref<Set<string>>(new Set(initial.solved))
  const hinted = ref<Set<string>>(new Set(initial.hinted))

  function persist(): void {
    if (typeof localStorage === 'undefined') return
    const payload: ProgressShape = { solved: [...solved.value], hinted: [...hinted.value] }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }

  function isSolved(id: string): boolean {
    return solved.value.has(id)
  }

  function wasHintUsed(id: string): boolean {
    return hinted.value.has(id)
  }

  /** Record that a hint was used on this puzzle (before solving). Local-only until solve. */
  function markHintUsed(id: string): void {
    if (hinted.value.has(id)) return
    hinted.value.add(id)
    hinted.value = new Set(hinted.value)
    persist()
  }

  function markSolved(id: string): void {
    if (solved.value.has(id)) return
    solved.value.add(id)
    solved.value = new Set(solved.value) // new ref so computed deps re-run
    persist()
    // Best-effort cloud write; no-ops when logged out (re-flushed on next login).
    void useDataSyncStore().upsertDungeonProgress([{ puzzleId: id, hintUsed: hinted.value.has(id) }])
  }

  /**
   * A puzzle is unlocked iff it is first in the track (`order === 1`) or the immediately
   * preceding puzzle by `order` has been solved. Orders are contiguous; a missing
   * predecessor is treated as unlocked (defensive, no lock-out).
   */
  function isUnlocked(puzzle: Puzzle): boolean {
    if (puzzle.order === 1) return true
    const prev = puzzles.find((p) => p.order === puzzle.order - 1)
    if (!prev) return true
    return solved.value.has(prev.id)
  }

  /** Order of the first unsolved puzzle (the frontier), or null if all are solved. */
  const currentOrder = computed<number | null>(() => {
    for (const p of puzzles) {
      if (!solved.value.has(p.id)) return p.order
    }
    return null
  })

  /** Map node state per GDD §4.1: done if solved; current if the frontier; else locked. */
  function nodeState(puzzle: Puzzle): DungeonNodeState {
    if (solved.value.has(puzzle.id)) return 'done'
    if (puzzle.order === currentOrder.value) return 'current'
    return 'locked'
  }

  const solvedCount = computed(() => solved.value.size)
  const totalCount = puzzles.length
  const percent = computed(() => (totalCount === 0 ? 0 : Math.round((100 * solvedCount.value) / totalCount)))

  /** Pull cloud progress into the local sets (union; hintUsed OR). Called on login. */
  async function syncFromCloud(): Promise<void> {
    const cloud = await useDataSyncStore().loadDungeonProgress()
    let changed = false
    for (const { puzzleId, hintUsed } of cloud) {
      if (!solved.value.has(puzzleId)) {
        solved.value.add(puzzleId)
        changed = true
      }
      if (hintUsed && !hinted.value.has(puzzleId)) {
        hinted.value.add(puzzleId)
        changed = true
      }
    }
    if (changed) {
      solved.value = new Set(solved.value)
      hinted.value = new Set(hinted.value)
      persist()
    }
  }

  /**
   * Reconcile local and cloud on login: push local-only solved puzzles up (with their
   * hintUsed flag), then pull cloud-only progress down. Wire to the App.vue userId watch.
   */
  async function reconcileOnLogin(): Promise<void> {
    if (solved.value.size > 0) {
      const entries = [...solved.value].map((id) => ({ puzzleId: id, hintUsed: hinted.value.has(id) }))
      await useDataSyncStore().upsertDungeonProgress(entries)
    }
    await syncFromCloud()
  }

  return {
    solved,
    hinted,
    isSolved,
    wasHintUsed,
    markHintUsed,
    markSolved,
    isUnlocked,
    nodeState,
    currentOrder,
    solvedCount,
    totalCount,
    percent,
    reconcileOnLogin,
  }
})
