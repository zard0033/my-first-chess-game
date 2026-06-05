import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import type { CompletedGame } from '@/stores/game-store'
import { UNSYNCED_QUEUE_MAX } from '@/config/sync-tuning'
import { HISTORY_LOAD_LIMIT } from '@/config/history-config'
import type { Cursor } from '@/types/game-history'
import { buildPgn } from '@/modules/game-export/assembler'

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

/**
 * Real standard PGN (S11-03): round-trips to chess.js and external tools (lichess).
 * Never throw on a malformed move list — persistence must not lose a completed game.
 * On replay failure, degrade to the raw UCI movetext (the pre-S11-03 behavior).
 */
function safePgn(game: QueuedGame): string {
  try {
    return buildPgn(game)
  } catch {
    return game.moves.join(' ')
  }
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
    pgn: safePgn(game),
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
      // Deferred import to avoid circular dependency (data-sync ↔ game-history)
      const { useGameHistoryStore } = await import('@/stores/game-history')
      useGameHistoryStore().invalidate()
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
    if (_getUnsyncedKeys().length === 0) {
      // All queued games flushed — invalidate history cache
      const { useGameHistoryStore } = await import('@/stores/game-history')
      useGameHistoryStore().invalidate()
    }
  }

  /**
   * Fetch game_sessions for the logged-in user, ordered by played_at desc.
   * Cursor-based pagination per GDD §4. All supabase.from() calls live here per ADR-0011.
   * AC-10: returns [] immediately if userId is null.
   */
  async function loadGameHistory(cursor?: Cursor): Promise<Record<string, unknown>[]> {
    const authStore = useAuthStore()
    if (!authStore.userId) return []

    let query = supabase
      .from('game_sessions')
      .select('*')
      .order('played_at', { ascending: false })
      .order('created_at', { ascending: false })
      .order('id', { ascending: true })
      .limit(HISTORY_LOAD_LIMIT)

    if (cursor) {
      query = query.or(
        `played_at.lt.${cursor.playedAt},` +
        `and(played_at.eq.${cursor.playedAt},created_at.lt.${cursor.createdAt}),` +
        `and(played_at.eq.${cursor.playedAt},created_at.eq.${cursor.createdAt},id.gt.${cursor.id})`,
      )
    }

    const { data, error } = await query
    if (error) throw new Error(error.message ?? 'Failed to load game history')
    return data ?? []
  }

  /**
   * Fetch the user's completed lesson ids. Returns [] when not logged in or on error
   * (lesson progress degrades to the local cache; a read failure must never surface).
   * All lesson_progress supabase.from() calls live here per ADR-0011.
   */
  async function loadLessonProgress(): Promise<string[]> {
    const authStore = useAuthStore()
    if (!authStore.userId) return []
    const { data, error } = await supabase.from('lesson_progress').select('lesson_id')
    if (error) return []
    return (data ?? []).map((r) => r.lesson_id as string)
  }

  /**
   * Idempotently persist completed lesson ids for the logged-in user.
   * No-op (returns false) when not logged in — the caller keeps them in localStorage
   * and re-flushes on the next login. Duplicate completions are ignored by the PK.
   */
  async function upsertLessonProgress(lessonIds: string[]): Promise<boolean> {
    const authStore = useAuthStore()
    const userId = authStore.userId
    if (!userId || lessonIds.length === 0) return false
    const rows = lessonIds.map((lesson_id) => ({ user_id: userId, lesson_id }))
    const { error } = await supabase
      .from('lesson_progress')
      .upsert(rows, { onConflict: 'user_id,lesson_id', ignoreDuplicates: true })
    return !error
  }

  /**
   * Fetch the user's solved puzzles (id + hint_used). Returns [] when not logged in or
   * on error (dungeon progress degrades to the local cache; a read failure must never
   * surface). All dungeon_progress supabase.from() calls live here per ADR-0011.
   */
  async function loadDungeonProgress(): Promise<{ puzzleId: string; hintUsed: boolean }[]> {
    const authStore = useAuthStore()
    if (!authStore.userId) return []
    const { data, error } = await supabase.from('dungeon_progress').select('puzzle_id, hint_used')
    if (error) return []
    return (data ?? []).map((r) => ({
      puzzleId: r.puzzle_id as string,
      hintUsed: Boolean(r.hint_used),
    }))
  }

  /**
   * Idempotently persist solved puzzles for the logged-in user. Row existence = solved;
   * `hint_used` is the flag captured at solve time. No-op (returns false) when not logged
   * in — the caller keeps progress in localStorage and re-flushes on the next login.
   * Solving is monotonic, so the first write per puzzle wins (ignoreDuplicates).
   */
  async function upsertDungeonProgress(
    entries: { puzzleId: string; hintUsed: boolean }[],
  ): Promise<boolean> {
    const authStore = useAuthStore()
    const userId = authStore.userId
    if (!userId || entries.length === 0) return false
    const rows = entries.map((e) => ({ user_id: userId, puzzle_id: e.puzzleId, hint_used: e.hintUsed }))
    const { error } = await supabase
      .from('dungeon_progress')
      .upsert(rows, { onConflict: 'user_id,puzzle_id', ignoreDuplicates: true })
    return !error
  }

  return {
    syncStatus,
    lastSyncedGameId,
    syncGame,
    flushUnsyncedQueue,
    loadGameHistory,
    loadLessonProgress,
    upsertLessonProgress,
    loadDungeonProgress,
    upsertDungeonProgress,
  }
})
