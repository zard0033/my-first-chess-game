import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import type { CompletedGame } from '@/stores/game-store'
import { UNSYNCED_QUEUE_MAX } from '@/config/sync-tuning'

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error'

const UNSYNCED_PREFIX = 'chess:unsynced:'

/** CompletedGame extended with a stable client-generated UUID for idempotent DB inserts. */
interface QueuedGame extends CompletedGame {
  readonly id: string
}

function mapResult(r: CompletedGame['result']): 'white_wins' | 'black_wins' | 'draw' {
  if (r === '1-0') return 'white_wins'
  if (r === '0-1') return 'black_wins'
  return 'draw'
}

function mapEndReason(r: CompletedGame['endReason']): string {
  const m: Record<CompletedGame['endReason'], string> = {
    checkmate: 'checkmate',
    stalemate: 'stalemate',
    resignation: 'resign',
    'insufficient-material': 'insufficient',
    'fifty-move': 'fifty_move',
    threefold: 'threefold',
  }
  return m[r]
}

function buildRow(game: QueuedGame, userId: string) {
  return {
    id: game.id,
    user_id: userId,
    played_at: new Date(game.completedAt).toISOString(),
    result: mapResult(game.result),
    player_color: game.playerColor,
    end_reason: mapEndReason(game.endReason),
    ai_difficulty: game.aiSkillLevel,
    // MVP: UCI move string; replaced with proper PGN when PGN viewer is added.
    pgn: game.moves.join(' '),
    move_count: game.moves.length,
    opening_eco: null as string | null,
    opening_name: null as string | null,
  }
}

/**
 * Data sync store per ADR-0011.
 * Handles game_sessions persistence: immediate sync → localStorage fallback → flush on login.
 * No other store calls supabase.from() directly.
 * Wire up flushUnsyncedQueue via App.vue watch on useAuthStore().userId.
 */
export const useDataSyncStore = defineStore('dataSync', () => {
  const syncStatus = ref<SyncStatus>('idle')
  const lastSyncedGameId = ref<string | null>(null)

  function _getUnsyncedKeys(): string[] {
    if (typeof localStorage === 'undefined') return []
    return Object.keys(localStorage)
      .filter(k => k.startsWith(UNSYNCED_PREFIX))
      .sort()
  }

  function _writeToUnsyncedQueue(game: QueuedGame): void {
    if (typeof localStorage === 'undefined') return
    const keys = _getUnsyncedKeys()
    if (keys.length >= UNSYNCED_QUEUE_MAX) {
      localStorage.removeItem(keys[0])
    }
    localStorage.setItem(`${UNSYNCED_PREFIX}${game.id}`, JSON.stringify(game))
  }

  /** Sync a completed game to Supabase. Falls back to localStorage queue if offline or not logged in. */
  async function syncGame(game: CompletedGame): Promise<void> {
    const authStore = useAuthStore()
    const queued: QueuedGame = { ...game, id: crypto.randomUUID() }

    if (!authStore.userId) {
      _writeToUnsyncedQueue(queued)
      return
    }

    syncStatus.value = 'syncing'
    const { error } = await supabase
      .from('game_sessions')
      .upsert(buildRow(queued, authStore.userId), { onConflict: 'id', ignoreDuplicates: true })

    if (error) {
      _writeToUnsyncedQueue(queued)
      syncStatus.value = 'error'
    } else {
      lastSyncedGameId.value = queued.id
      syncStatus.value = 'synced'
    }
  }

  /** Upload all locally-queued games. Called from App.vue when userId becomes non-null. */
  async function flushUnsyncedQueue(): Promise<void> {
    const authStore = useAuthStore()
    if (!authStore.userId) return

    const keys = _getUnsyncedKeys()
    for (const key of keys) {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const game: QueuedGame = JSON.parse(raw)
      const { error } = await supabase
        .from('game_sessions')
        .upsert(buildRow(game, authStore.userId), { onConflict: 'id', ignoreDuplicates: true })
      if (!error) {
        localStorage.removeItem(key)
        lastSyncedGameId.value = game.id
      }
    }
  }

  return { syncStatus, lastSyncedGameId, syncGame, flushUnsyncedQueue }
})
