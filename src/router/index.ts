import { createRouter, createWebHistory, nextTick } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import NotFoundView from '@/views/NotFoundView.vue'

const routes = [
  { path: '/',                name: 'home',      component: HomeView },
  { path: '/play',            name: 'play',      component: () => import('@/views/PlayView.vue') },
  { path: '/review',          name: 'review',    component: () => import('@/views/ReviewView.vue') },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView },
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: (to, from, savedPosition) => savedPosition ?? { top: 0 },
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
