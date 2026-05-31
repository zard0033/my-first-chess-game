import { defineStore } from 'pinia'
import { ref } from 'vue'
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
  /** Set when signIn() fails or an auth error is detected. Cleared on next signIn() attempt. */
  const authError = ref<string | null>(null)
  /** True after signIn() succeeds — awaiting Magic Link click. */
  const pendingEmail = ref(false)

  let _authSubscribed = false

  /** Initialize auth state from persisted session and subscribe to future changes. */
  async function initAuth(): Promise<void> {
    isAuthLoading.value = true
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        authError.value = error.message
      } else {
        userId.value = session?.user.id ?? null
        email.value = session?.user.email ?? null
      }
    } catch (e) {
      authError.value = e instanceof Error ? e.message : 'Unexpected auth error'
    } finally {
      isAuthLoading.value = false
    }

    if (!_authSubscribed) {
      _authSubscribed = true
      supabase.auth.onAuthStateChange((_event, session) => {
        userId.value = session?.user.id ?? null
        email.value = session?.user.email ?? null
      })
    }
  }

  /** Send a Magic Link to the given email address. Sets pendingEmail on success. */
  async function signIn(emailInput: string): Promise<void> {
    authError.value = null
    const { error } = await supabase.auth.signInWithOtp({ email: emailInput })
    if (error) {
      authError.value = error.message
    } else {
      pendingEmail.value = true
    }
  }

  /** Sign out and clear all auth state. */
  async function signOut(): Promise<void> {
    await supabase.auth.signOut()
    userId.value = null
    email.value = null
    pendingEmail.value = false
    authError.value = null
  }

  return { userId, email, isAuthLoading, authError, pendingEmail, initAuth, signIn, signOut }
})
