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
    { data: { subscription: { unsubscribe: vi.fn() } } } as ReturnType<
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

  it('test_authGuard_unauthenticated_historyRoute_redirectsHome (SUPA-AC-10)', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null }, error: null,
    })
    const router = makeRouter()
    const authStore = useAuthStore()
    await authStore.initAuth()

    await router.push('/history')
    expect(router.currentRoute.value.name).toBe('home')
    expect(router.currentRoute.value.query.login).toBe('required')
  })

  it('test_authGuard_unauthenticated_profileRoute_redirectsHome (SUPA-AC-10)', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null }, error: null,
    })
    const router = makeRouter()
    const authStore = useAuthStore()
    await authStore.initAuth()

    await router.push('/profile')
    expect(router.currentRoute.value.name).toBe('home')
    expect(router.currentRoute.value.query.login).toBe('required')
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

  it('test_authGuard_isAuthLoadingTrue_waitsBeforeDeciding (AC-S5-02)', async () => {
    // Guard must not redirect while auth is still loading
    let resolveSession!: (v: unknown) => void
    vi.mocked(supabase.auth.getSession).mockReturnValueOnce(
      new Promise(r => { resolveSession = r })
    )
    const router = makeRouter()
    const authStore = useAuthStore()

    // Start initAuth (won't finish until resolveSession is called)
    const initPromise = authStore.initAuth()
    expect(authStore.isAuthLoading).toBe(true)

    // Start navigation while loading — guard must wait
    const navPromise = router.push('/history')

    // Resolve auth with no session
    resolveSession({ data: { session: null }, error: null })
    await initPromise
    await navPromise

    // Guard should now redirect (no session)
    expect(router.currentRoute.value.name).toBe('home')
    expect(router.currentRoute.value.query.login).toBe('required')
  })
})
