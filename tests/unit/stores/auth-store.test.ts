import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// vi.mock is hoisted — runs before any imports below
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signInWithOtp: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  },
}))

import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

/** Returns a function that fires the captured onAuthStateChange callback. */
function setupAuthCallback(): (event: string, session: Record<string, unknown> | null) => void {
  let captured: ((event: string, session: Record<string, unknown> | null) => void) | undefined
  vi.mocked(supabase.auth.onAuthStateChange).mockImplementationOnce((cb: unknown) => {
    captured = cb as typeof captured
    return { data: { subscription: { unsubscribe: vi.fn() } } } as unknown as ReturnType<
      typeof supabase.auth.onAuthStateChange
    >
  })
  return (event, session) => captured?.(event, session)
}

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue(
      { data: { subscription: { unsubscribe: vi.fn() } } } as unknown as ReturnType<
        typeof supabase.auth.onAuthStateChange
      >
    )
  })

  // ── initAuth ────────────────────────────────────────────────────────────

  describe('initAuth', () => {
    it('sets userId and email from existing session (SUPA-AC-03)', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: { user: { id: 'uid-1', email: 'a@b.com' } } as never },
        error: null,
      })

      const store = useAuthStore()
      await store.initAuth()

      expect(store.userId).toBe('uid-1')
      expect(store.email).toBe('a@b.com')
    })

    it('sets isAuthLoading to false after resolving', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: null,
      })

      const store = useAuthStore()
      expect(store.isAuthLoading).toBe(true) // initial state
      await store.initAuth()
      expect(store.isAuthLoading).toBe(false)
    })

    it('sets userId to null when no session exists', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: null,
      })

      const store = useAuthStore()
      await store.initAuth()

      expect(store.userId).toBeNull()
      expect(store.email).toBeNull()
      expect(store.isAuthLoading).toBe(false)
    })

    it('sets authError and leaves userId null when getSession returns error (SUPA-AC-05)', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: { message: 'OTP has expired or already been used' } as never,
      })

      const store = useAuthStore()
      await store.initAuth()

      expect(store.authError).toBe('OTP has expired or already been used')
      expect(store.userId).toBeNull()
      expect(store.isAuthLoading).toBe(false) // must still become false even on error
    })

    it('sets authError and sets isAuthLoading=false even when getSession throws', async () => {
      vi.mocked(supabase.auth.getSession).mockRejectedValueOnce(
        new Error('Network unreachable')
      )

      const store = useAuthStore()
      await store.initAuth()

      expect(store.authError).toBe('Network unreachable')
      expect(store.isAuthLoading).toBe(false)
    })
  })

  // ── onAuthStateChange ────────────────────────────────────────────────────

  describe('onAuthStateChange', () => {
    it('SIGNED_IN event sets userId and email (SUPA-AC-02)', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: null,
      })
      const fireEvent = setupAuthCallback()

      const store = useAuthStore()
      await store.initAuth()

      fireEvent('SIGNED_IN', { user: { id: 'uid-2', email: 'b@c.com' } })

      expect(store.userId).toBe('uid-2')
      expect(store.email).toBe('b@c.com')
    })

    it('SIGNED_OUT event clears userId and email', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: { user: { id: 'uid-1', email: 'a@b.com' } } as never },
        error: null,
      })
      const fireEvent = setupAuthCallback()

      const store = useAuthStore()
      await store.initAuth()
      expect(store.userId).toBe('uid-1')

      fireEvent('SIGNED_OUT', null)

      expect(store.userId).toBeNull()
      expect(store.email).toBeNull()
    })

    it('TOKEN_REFRESHED event is idempotent — userId remains correct', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: { user: { id: 'uid-1', email: 'a@b.com' } } as never },
        error: null,
      })
      const fireEvent = setupAuthCallback()

      const store = useAuthStore()
      await store.initAuth()

      fireEvent('TOKEN_REFRESHED', { user: { id: 'uid-1', email: 'a@b.com' } })

      expect(store.userId).toBe('uid-1') // unchanged
    })

    it('does not crash on unexpected null session event (SUPA-AC-05 resilience)', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: null,
      })
      const fireEvent = setupAuthCallback()

      const store = useAuthStore()
      await store.initAuth()

      expect(() => fireEvent('SIGNED_OUT', null)).not.toThrow()
      expect(store.userId).toBeNull()
    })

    it('SIGNED_IN event clears pendingEmail and authError', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: null,
      })
      const fireEvent = setupAuthCallback()

      const store = useAuthStore()
      await store.initAuth()
      store.pendingEmail = true
      store.authError = 'Previous error'

      fireEvent('SIGNED_IN', { user: { id: 'uid-2', email: 'b@c.com' } })

      expect(store.pendingEmail).toBe(false)
      expect(store.authError).toBeNull()
    })
  })

  // ── signIn ────────────────────────────────────────────────────────────────

  describe('signIn', () => {
    it('sets pendingEmail on success and calls signInWithOtp (SUPA-AC-01)', async () => {
      vi.mocked(supabase.auth.signInWithOtp).mockResolvedValueOnce({ error: null } as never)

      const store = useAuthStore()
      await store.signIn('test@example.com')

      expect(store.pendingEmail).toBe(true)
      expect(store.authError).toBeNull()
      expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({ email: 'test@example.com' })
    })

    it('sets authError and leaves pendingEmail false on network error', async () => {
      vi.mocked(supabase.auth.signInWithOtp).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Network request failed' } as never,
      })

      const store = useAuthStore()
      await store.signIn('test@example.com')

      expect(store.pendingEmail).toBe(false)
      expect(store.authError).toBe('Network request failed')
    })

    it('clears previous authError before each signIn attempt', async () => {
      vi.mocked(supabase.auth.signInWithOtp)
        .mockResolvedValueOnce({ data: { user: null, session: null }, error: { message: 'First error' } as never })
        .mockResolvedValueOnce({ error: null } as never)

      const store = useAuthStore()
      await store.signIn('test@example.com')
      expect(store.authError).toBe('First error')

      await store.signIn('test@example.com')
      expect(store.authError).toBeNull()
    })
  })

  // ── signOut ───────────────────────────────────────────────────────────────

  describe('signOut', () => {
    it('clears userId, email, and pendingEmail; calls supabase.auth.signOut (SUPA-AC-04)', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: { user: { id: 'uid-1', email: 'a@b.com' } } as never },
        error: null,
      })
      vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({ error: null } as never)

      const store = useAuthStore()
      await store.initAuth()
      store.pendingEmail = true
      expect(store.userId).toBe('uid-1')

      await store.signOut()

      expect(store.userId).toBeNull()
      expect(store.email).toBeNull()
      expect(store.pendingEmail).toBe(false)
      expect(store.authError).toBeNull()
      expect(supabase.auth.signOut).toHaveBeenCalledOnce()
    })

    it('exposes error and still clears local state when signOut fails', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: { user: { id: 'uid-1', email: 'a@b.com' } } as never },
        error: null,
      })
      vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({
        error: { message: 'Network error' },
      } as never)

      const store = useAuthStore()
      await store.initAuth()
      await store.signOut()

      expect(store.userId).toBeNull()
      expect(store.email).toBeNull()
      expect(store.authError).toBe('Network error')
    })
  })
})
