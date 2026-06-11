import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { ResumePayload, ResumeSnapshot } from '@/types/resume'
import { useDataSyncStore } from '@/stores/data-sync'

const STORAGE_KEY = 'pgr:resume:game'

/**
 * Read the persisted in-progress game. Corrupt or absent data is treated as "no resume" — a bad
 * snapshot must never throw and brick the home screen.
 */
function loadSnapshot(): ResumeSnapshot | null {
  if (typeof localStorage === 'undefined') return null
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const p = JSON.parse(raw) as ResumeSnapshot
    if (
      !Array.isArray(p?.moves) ||
      !p.moves.every((m): m is string => typeof m === 'string') ||
      (p.playerColor !== 'white' && p.playerColor !== 'black') ||
      typeof p.level !== 'number' ||
      typeof p.updatedAt !== 'number'
    ) {
      return null
    }
    const playerMoveTimes = Array.isArray(p.playerMoveTimes)
      ? p.playerMoveTimes.filter((n): n is number => typeof n === 'number')
      : []
    return { moves: p.moves, playerColor: p.playerColor, level: p.level, playerMoveTimes, updatedAt: p.updatedAt }
  } catch {
    return null
  }
}

/**
 * In-progress game store for the resume feature (續玩對局). localStorage is the offline cache (written
 * after every move so a refresh / tab-close / crash can still resume); Supabase (`in_progress_game`,
 * one row per user, via the data-sync store per ADR-0011) is the cross-device copy, pushed when the
 * player leaves the board. Unlike lesson/dungeon progress this is NOT monotonic, so reconciliation is
 * last-write-wins by `updatedAt`, not a union.
 */
export const useResumeGameStore = defineStore('resumeGame', () => {
  const current = ref<ResumeSnapshot | null>(loadSnapshot())
  const hasResume = computed(() => current.value !== null)

  function persist(): void {
    if (typeof localStorage === 'undefined') return
    if (current.value) localStorage.setItem(STORAGE_KEY, JSON.stringify(current.value))
    else localStorage.removeItem(STORAGE_KEY)
  }

  /** Write the latest in-progress snapshot to the local cache (called after each move). */
  function saveLocal(payload: ResumePayload): void {
    current.value = { ...payload, updatedAt: Date.now() }
    persist()
  }

  /** Push the local snapshot to the cloud (best-effort; no-ops when logged out). Called on leave. */
  async function syncToCloud(): Promise<void> {
    if (current.value) await useDataSyncStore().upsertResumeGame(current.value)
  }

  /** Drop the in-progress game everywhere — on game completion or when starting a new game. */
  async function clear(): Promise<void> {
    current.value = null
    persist()
    await useDataSyncStore().deleteResumeGame()
  }

  /**
   * Reconcile local and cloud on login. In-progress is single-slot and non-monotonic, so the newer
   * `updatedAt` wins: push local up when it is at least as new, otherwise pull the cloud copy down.
   */
  async function reconcileOnLogin(): Promise<void> {
    const cloud = await useDataSyncStore().loadResumeGame()
    const local = current.value
    if (!cloud && !local) return
    if (cloud && (!local || cloud.updatedAt > local.updatedAt)) {
      current.value = cloud
      persist()
    } else if (local) {
      await useDataSyncStore().upsertResumeGame(local)
    }
  }

  return { current, hasResume, saveLocal, syncToCloud, clear, reconcileOnLogin }
})
