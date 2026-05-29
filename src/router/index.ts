import { createRouter, createWebHistory } from 'vue-router'
import { nextTick } from 'vue'
import type { RouterScrollBehavior } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import NotFoundView from '@/views/NotFoundView.vue'

export const routes = [
  { path: '/',                name: 'home',      component: HomeView },
  { path: '/play',            name: 'play',      component: () => import('@/views/PlayView.vue') },
  { path: '/review',          name: 'review',    component: () => import('@/views/ReviewView.vue') },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView },
]

export const scrollBehavior: RouterScrollBehavior = (to, from, savedPosition) => savedPosition ?? { top: 0 }

// Factory function: must be called AFTER any history.replaceState() call so that
// createWebHistory() reads the correct URL (replaceState does not fire popstate).
export function createAppRouter() {
  const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    scrollBehavior,
    routes,
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
