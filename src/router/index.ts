import { createRouter, createWebHistory } from 'vue-router'
import { nextTick, watch } from 'vue'
import type { RouterScrollBehavior } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import NotFoundView from '@/views/NotFoundView.vue'
import { useAuthStore } from '@/stores/auth'

export const routes = [
  { path: '/',                name: 'home',      component: HomeView },
  { path: '/play',            name: 'play',      component: () => import('@/views/PlayView.vue') },
  { path: '/review',          name: 'review',    component: () => import('@/views/ReviewView.vue') },
  { path: '/history',         name: 'history',   component: () => import('@/views/HistoryView.vue') },
  { path: '/profile',         name: 'profile',   component: () => import('@/views/ProfileView.vue') },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView },
]

export const scrollBehavior: RouterScrollBehavior = (_to, _from, savedPosition) => savedPosition ?? { top: 0 }

const AUTH_REQUIRED_ROUTES = new Set(['history', 'profile'])

// Factory function: must be called AFTER any history.replaceState() call so that
// createWebHistory() reads the correct URL (replaceState does not fire popstate).
export function createAppRouter() {
  const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    scrollBehavior,
    routes,
  })

  router.beforeEach(async (to) => {
    if (!AUTH_REQUIRED_ROUTES.has(to.name as string)) return

    const authStore = useAuthStore()

    // Wait for initial auth resolution before making guard decisions (SUPA-AC-S5-02).
    // isAuthLoading is true until initAuth() completes in App.vue onMounted.
    if (authStore.isAuthLoading) {
      await new Promise<void>(resolve => {
        const stop = watch(() => authStore.isAuthLoading, (loading) => {
          if (!loading) { stop(); resolve() }
        })
      })
    }

    if (!authStore.userId) {
      return { name: 'home', query: { login: 'required' } }
    }
  })

  router.afterEach(() => {
    nextTick(() => {
      document.querySelector('h1')?.focus()
    })
  })

  router.onError(() => {
    if (!sessionStorage.getItem('routerReloadAttempted')) {
      sessionStorage.setItem('routerReloadAttempted', '1')
      window.location.reload()
    }
  })

  return router
}
