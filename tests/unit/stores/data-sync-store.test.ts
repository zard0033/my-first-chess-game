// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signInWithOtp: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(),
  },
}))

import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useDataSyncStore } from '@/stores/data-sync'
import type { CompletedGame } from '@/stores/game-store'

function mockFrom(upsertResult: { error: unknown } = { error: null }) {
  const upsertFn = vi.fn().mockResolvedValueOnce(upsertResult)
  vi.mocked(supabase.from).mockReturnValueOnce({ upsert: upsertFn } as never)
  return upsertFn
}

function mockAuthSubscription() {
  vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue(
    { data: { subscription: { unsubscribe: vi.fn() } } } as ReturnType<
      typeof supabase.auth.onAuthStateChange
    >
  )
}

function makeGame(overrides: Partial<CompletedGame> = {}): CompletedGame {
  return {
    moves: ['e2e4', 'e7e5', 'g1f3'],
    playerColor: 'white',
    result: '1-0',
    endReason: 'checkmate',
    completedAt: 1_700_000_000_000,
    aiSkillLevel: 5,
    playerMoveTimes: [1000, 2000, 1500],
    isTerminal: true,
    ...overrides,
  }
}

describe('useDataSyncStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorage.clear()
    mockAuthSubscription()
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null }, error: null,
    } as never)
  })

  // ── syncGame — logged in ────────────────────────────────────────────────

  describe('syncGame — logged in', () => {
    it('SUPA-AC-06: transitions idle → syncing → synced and sets lastSyncedGameId', async () => {
      const upsertFn = mockFrom({ error: null })
      const authStore = useAuthStore()
      authStore.userId = 'uid-1'

      const store = useDataSyncStore()
      expect(store.syncStatus).toBe('idle')

      const promise = store.syncGame(makeGame())
      expect(store.syncStatus).toBe('syncing')

      await promise
      expect(store.syncStatus).toBe('synced')
      expect(store.lastSyncedGameId).not.toBeNull()
      expect(upsertFn).toHaveBeenCalledOnce()
    })

    it('SUPA-AC-06: upsert row contains correct result, player_color, pgn, move_count', async () => {
      mockFrom({ error: null })
      const authStore = useAuthStore()
      authStore.userId = 'uid-1'

      const store = useDataSyncStore()
      await store.syncGame(makeGame())

      const [row] = vi.mocked(supabase.from).mock.results[0].value.upsert.mock.calls[0]
      expect(row.result).toBe('white_wins')
      expect(row.player_color).toBe('white')
      expect(row.pgn).toBe('e2e4 e7e5 g1f3')
      expect(row.move_count).toBe(3)
      expect(row.user_id).toBe('uid-1')
    })

    it('SUPA-AC-09: uses ignoreDuplicates:true for ON CONFLICT DO NOTHING', async () => {
      mockFrom({ error: null })
      const authStore = useAuthStore()
      authStore.userId = 'uid-1'

      const store = useDataSyncStore()
      await store.syncGame(makeGame())

      const [, opts] = vi.mocked(supabase.from).mock.results[0].value.upsert.mock.calls[0]
      expect(opts).toMatchObject({ onConflict: 'id', ignoreDuplicates: true })
    })

    it('SUPA-AC-07: writes to localStorage and sets syncStatus=error when upsert fails', async () => {
      mockFrom({ error: { message: 'Network error' } })
      const authStore = useAuthStore()
      authStore.userId = 'uid-1'

      const store = useDataSyncStore()
      await store.syncGame(makeGame())

      expect(store.syncStatus).toBe('error')
      const keys = Object.keys(localStorage).filter(k => k.startsWith('chess:unsynced:'))
      expect(keys).toHaveLength(1)
    })
  })

  // ── syncGame — not logged in ───────────────────────────────────────────

  describe('syncGame — not logged in', () => {
    it('writes directly to localStorage without calling supabase (SUPA-AC-07)', async () => {
      const store = useDataSyncStore()
      await store.syncGame(makeGame())

      expect(supabase.from).not.toHaveBeenCalled()
      const keys = Object.keys(localStorage).filter(k => k.startsWith('chess:unsynced:'))
      expect(keys).toHaveLength(1)
    })

    it('keeps syncStatus as idle when not logged in', async () => {
      const store = useDataSyncStore()
      await store.syncGame(makeGame())
      expect(store.syncStatus).toBe('idle')
    })
  })

  // ── SUPA-AC-13 non-blocking ────────────────────────────────────────────

  describe('SUPA-AC-13: syncGame is non-blocking', () => {
    it('syncStatus becomes syncing immediately without awaiting', async () => {
      let resolveUpsert!: (v: unknown) => void
      const upsertFn = vi.fn().mockReturnValueOnce(new Promise(r => { resolveUpsert = r }))
      vi.mocked(supabase.from).mockReturnValueOnce({ upsert: upsertFn } as never)

      const authStore = useAuthStore()
      authStore.userId = 'uid-1'

      const store = useDataSyncStore()
      const syncPromise = store.syncGame(makeGame())

      // syncStatus transitions immediately, before await
      expect(store.syncStatus).toBe('syncing')

      resolveUpsert({ error: null })
      await syncPromise
      expect(store.syncStatus).toBe('synced')
    })
  })

  // ── flushUnsyncedQueue ─────────────────────────────────────────────────

  describe('flushUnsyncedQueue', () => {
    it('SUPA-AC-08: removes successfully uploaded games from localStorage', async () => {
      const authStore = useAuthStore()
      authStore.userId = 'uid-1'

      const game1 = makeGame({ completedAt: 1_000_000 })
      const game2 = makeGame({ completedAt: 2_000_000 })
      const id1 = 'aaaaaaaa-0000-0000-0000-000000000001'
      const id2 = 'aaaaaaaa-0000-0000-0000-000000000002'
      localStorage.setItem(`chess:unsynced:${id1}`, JSON.stringify({ ...game1, id: id1 }))
      localStorage.setItem(`chess:unsynced:${id2}`, JSON.stringify({ ...game2, id: id2 }))

      mockFrom({ error: null })
      mockFrom({ error: null })

      const store = useDataSyncStore()
      await store.flushUnsyncedQueue()

      expect(Object.keys(localStorage).filter(k => k.startsWith('chess:unsynced:'))).toHaveLength(0)
    })

    it('leaves failed games in localStorage for next retry', async () => {
      const authStore = useAuthStore()
      authStore.userId = 'uid-1'

      const id1 = 'aaaaaaaa-0000-0000-0000-000000000001'
      localStorage.setItem(`chess:unsynced:${id1}`, JSON.stringify({ ...makeGame(), id: id1 }))

      mockFrom({ error: { message: 'Server error' } })

      const store = useDataSyncStore()
      await store.flushUnsyncedQueue()

      expect(Object.keys(localStorage).filter(k => k.startsWith('chess:unsynced:'))).toHaveLength(1)
    })

    it('does nothing when not logged in', async () => {
      const id1 = 'aaaaaaaa-0000-0000-0000-000000000001'
      localStorage.setItem(`chess:unsynced:${id1}`, JSON.stringify({ ...makeGame(), id: id1 }))

      const store = useDataSyncStore()
      await store.flushUnsyncedQueue()

      expect(supabase.from).not.toHaveBeenCalled()
    })
  })

  // ── Queue overflow ─────────────────────────────────────────────────────

  describe('queue overflow', () => {
    it('drops oldest entry when writing the 51st game (UNSYNCED_QUEUE_MAX = 50)', async () => {
      const store = useDataSyncStore()

      // Fill queue to 50
      for (let i = 0; i < 50; i++) {
        const id = `aaaaaaaa-0000-0000-0000-${String(i).padStart(12, '0')}`
        localStorage.setItem(`chess:unsynced:${id}`, JSON.stringify({ ...makeGame(), id }))
      }

      const oldestKey = Object.keys(localStorage)
        .filter(k => k.startsWith('chess:unsynced:'))
        .sort()[0]

      // syncGame while not logged in → writes to queue (51st)
      await store.syncGame(makeGame())

      const remaining = Object.keys(localStorage).filter(k => k.startsWith('chess:unsynced:'))
      expect(remaining).toHaveLength(50)
      expect(remaining).not.toContain(oldestKey)
    })
  })

  // ── result mapping ─────────────────────────────────────────────────────

  describe('result mapping', () => {
    it.each([
      ['1-0' as const, 'white_wins'],
      ['0-1' as const, 'black_wins'],
      ['1/2-1/2' as const, 'draw'],
    ])('maps %s → %s', async (result, expected) => {
      mockFrom({ error: null })
      const authStore = useAuthStore()
      authStore.userId = 'uid-1'

      const store = useDataSyncStore()
      await store.syncGame(makeGame({ result }))

      const [row] = vi.mocked(supabase.from).mock.results[0].value.upsert.mock.calls[0]
      expect(row.result).toBe(expected)
    })
  })
})
