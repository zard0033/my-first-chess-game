import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { GameHistoryEntry, Cursor } from '@/types/game-history'
import { mapRowToEntry, buildCursor } from '@/utils/game-history-mappers'
import { HISTORY_LOAD_LIMIT } from '@/config/history-config'

export type CacheState = 'cold' | 'valid' | 'dirty'

/**
 * Game history display store per ADR-0005 (dedicated store) and ADR-0011 (no supabase.from here).
 * All Supabase calls go through useDataSyncStore().loadGameHistory().
 */
export const useGameHistoryStore = defineStore('gameHistory', () => {
  const entries = ref<GameHistoryEntry[]>([])
  const isLoading = ref(false)
  const isLoadingMore = ref(false)
  const error = ref<string | null>(null)
  const cacheState = ref<CacheState>('cold')
  const hasMore = ref(false)
  const nextCursor = ref<Cursor | null>(null)
  /** Reactive generation counter — incremented on invalidate() and each fetchHistory() start.
   *  In-flight fetches abandon their write-back when generation has moved on. */
  const fetchGeneration = ref(0)
  /** Single-row expand invariant: only one row open at a time. null = all collapsed. */
  const expandedRowId = ref<string | null>(null)

  async function fetchHistory(): Promise<void> {
    if (isLoading.value) return  // AC-25 deduplication guard — does NOT increment fetchGeneration
    const myGeneration = ++fetchGeneration.value
    isLoading.value = true
    error.value = null

    try {
      // Deferred import avoids circular dependency (game-history ↔ data-sync)
      const { useDataSyncStore } = await import('@/stores/data-sync')
      const rows = await useDataSyncStore().loadGameHistory()

      if (myGeneration !== fetchGeneration.value) return  // stale fetch — discard

      entries.value = rows.map(mapRowToEntry)
      hasMore.value = rows.length === HISTORY_LOAD_LIMIT
      nextCursor.value = rows.length > 0 ? buildCursor(rows[rows.length - 1]) : null
      cacheState.value = 'valid'
    } catch (e) {
      if (myGeneration !== fetchGeneration.value) return
      error.value = e instanceof Error ? e.message : 'Failed to load game history'
      // cacheState intentionally unchanged on failure (remains cold or dirty)
    } finally {
      if (myGeneration === fetchGeneration.value) {
        isLoading.value = false
      }
    }
  }

  async function loadMore(): Promise<void> {
    if (!hasMore.value || isLoadingMore.value || !nextCursor.value) return
    isLoadingMore.value = true

    try {
      const { useDataSyncStore } = await import('@/stores/data-sync')
      const rows = await useDataSyncStore().loadGameHistory(nextCursor.value)

      entries.value = [...entries.value, ...rows.map(mapRowToEntry)]
      hasMore.value = rows.length === HISTORY_LOAD_LIMIT
      nextCursor.value = rows.length > 0 ? buildCursor(rows[rows.length - 1]) : null
    } catch (e) {
      // Surface to the caller (HistoryView shows a load-more-specific message). Do NOT write the
      // shared `error` — that drives the page-level "重新整理失敗" banner and would misfire here.
      throw e instanceof Error ? e : new Error('Failed to load more history')
    } finally {
      isLoadingMore.value = false
    }
  }

  function invalidate(): void {
    cacheState.value = 'dirty'
    fetchGeneration.value++  // invalidates any in-flight fetch
  }

  /** Toggle expanded row; calling with the already-expanded id collapses it. */
  function setExpandedRow(id: string | null): void {
    expandedRowId.value = expandedRowId.value === id ? null : id
  }

  return {
    entries,
    isLoading,
    isLoadingMore,
    error,
    cacheState,
    hasMore,
    nextCursor,
    fetchGeneration,
    expandedRowId,
    fetchHistory,
    loadMore,
    invalidate,
    setExpandedRow,
  }
})
