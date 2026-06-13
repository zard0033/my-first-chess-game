import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

/**
 * Authentication state per ADR-0011.
 * Single source of truth for auth identity — no other store reads supabase.auth directly.
 * Call initAuth() once in App.vue onMounted.
 */
export const useAuthStore = defineStore('auth', () => {
  const userId = ref<string | null>(null)
  const email = ref<string | null>(null)
  /** True during the initial getSession() call on mount; prevents flash of unauthenticated state. */
  const isAuthLoading = ref(true)
  /** Set when auth fails. Cleared on successful auth state change or next signIn attempt. */
  const authError = ref<string | null>(null)

  let _subscription: { unsubscribe: () => void } | null = null

  function _applySession(session: Session | null): void {
    userId.value = session?.user.id ?? null
    email.value = session?.user.email ?? null
  }

  /** Initialize auth state from persisted session and subscribe to future changes. */
  async function initAuth(): Promise<void> {
    isAuthLoading.value = true
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        authError.value = error.message
      } else {
        _applySession(session)
      }
    } catch (e) {
      authError.value = e instanceof Error ? e.message : 'Unexpected auth error'
    } finally {
      isAuthLoading.value = false
    }

    _subscription?.unsubscribe()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      _applySession(session)
      if (session) {
        authError.value = null
      }
    })
    _subscription = subscription
  }

  /** Redirect to Google's OAuth consent screen. Returns to the app on completion. */
  async function signInWithGoogle(): Promise<void> {
    authError.value = null
    const redirectTo = typeof window !== 'undefined'
      ? window.location.origin + (import.meta.env.BASE_URL ?? '/')
      : undefined
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      ...(redirectTo ? { options: { redirectTo } } : {}),
    })
    if (error) {
      authError.value = error.message
    }
  }

  /** Sign out and clear all auth state. */
  async function signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut()
    _applySession(null)
    authError.value = error?.message ?? null
  }

  return { userId, email, isAuthLoading, authError, initAuth, signInWithGoogle, signOut }
})
