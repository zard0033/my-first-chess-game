// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

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
import { createAppRouter } from '@/router/index'

function makeRouter() {
  return createAppRouter()
}

function mockAuthSubscription() {
  vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue(
    { data: { subscription: { unsubscribe: vi.fn() } } } as unknown as ReturnType<
      typeof supabase.auth.onAuthStateChange
    >
  )
}

describe('auth route guard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockAuthSubscription()
  })

  // Guest mode (訪客完局紀錄): history/profile are now public — guests read their games from
  // localStorage. These two previously asserted a redirect to home (SUPA-AC-10, now superseded).
  it('test_authGuard_guest_historyRoute_allowsNavigation', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null }, error: null,
    })
    const router = makeRouter()
    const authStore = useAuthStore()
    await authStore.initAuth()

    await router.push('/history')
    expect(router.currentRoute.value.name).toBe('history')
    expect(router.currentRoute.value.query.login).toBeUndefined()
  })

  it('test_authGuard_guest_profileRoute_allowsNavigation', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null }, error: null,
    })
    const router = makeRouter()
    const authStore = useAuthStore()
    await authStore.initAuth()

    await router.push('/profile')
    expect(router.currentRoute.value.name).toBe('profile')
    expect(router.currentRoute.value.query.login).toBeUndefined()
  })

  it('test_authGuard_authenticated_historyRoute_allowsNavigation (AC-S5-03)', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: { user: { id: 'uid-1', email: 'a@b.com' } } as never }, error: null,
    })
    const router = makeRouter()
    const authStore = useAuthStore()
    await authStore.initAuth()

    await router.push('/history')
    expect(router.currentRoute.value.name).toBe('history')
  })

  it('test_authGuard_authenticated_profileRoute_allowsNavigation (AC-S5-03)', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: { user: { id: 'uid-1', email: 'a@b.com' } } as never }, error: null,
    })
    const router = makeRouter()
    const authStore = useAuthStore()
    await authStore.initAuth()

    await router.push('/profile')
    expect(router.currentRoute.value.name).toBe('profile')
  })

  it('test_authGuard_publicRoutes_noRedirect', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null }, error: null,
    })
    const router = makeRouter()
    const authStore = useAuthStore()
    await authStore.initAuth()

    await router.push('/play')
    expect(router.currentRoute.value.name).toBe('play')
  })

  it('test_authGuard_isAuthLoadingTrue_doesNotBlockPublicNav', async () => {
    // With no auth-only routes, the guard never blocks — navigating mid-auth-load resolves
    // straight through without redirect or hang.
    let resolveSession!: (v: unknown) => void
    vi.mocked(supabase.auth.getSession).mockReturnValueOnce(
      new Promise(r => { resolveSession = r as typeof resolveSession })
    )
    const router = makeRouter()
    const authStore = useAuthStore()

    const initPromise = authStore.initAuth()
    expect(authStore.isAuthLoading).toBe(true)

    const navPromise = router.push('/history')

    resolveSession({ data: { session: null }, error: null })
    await initPromise
    await navPromise

    expect(router.currentRoute.value.name).toBe('history')
    expect(router.currentRoute.value.query.login).toBeUndefined()
  })
})
