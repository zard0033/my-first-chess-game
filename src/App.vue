<script setup lang="ts">
import { onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDataSyncStore } from '@/stores/data-sync'
import { useLessonProgressStore } from '@/stores/lesson-progress'
import { useDungeonProgressStore } from '@/stores/dungeon-progress'
import AppNav from '@/components/app-nav.vue'

const authStore = useAuthStore()
const dataSyncStore = useDataSyncStore()
const lessonProgressStore = useLessonProgressStore()
const dungeonProgressStore = useDungeonProgressStore()
const route = useRoute()

// 沉浸式全屏頁（登入）不套 app chrome：無頂部品牌列、無底部 tab。
const fullBleed = computed(() => route.meta.fullBleed === true)

// Flush offline queue + reconcile lesson progress when player logs in (SUPA-AC-08).
watch(() => authStore.userId, (userId) => {
  if (userId) {
    dataSyncStore.flushUnsyncedQueue()
    lessonProgressStore.reconcileOnLogin()
    dungeonProgressStore.reconcileOnLogin()
  }
})

// initAuth() not awaited — isAuthLoading guards against flash of unauthenticated state
onMounted(() => {
  authStore.initAuth()

  // Warm the primary tab route chunks during idle so tab taps swap instantly on mobile
  // (first visit otherwise blocks on downloading/parsing each view's lazy chunk). Importing
  // only loads the module — PlayView's Stockfish init still waits for the view to actually mount.
  const prefetch = (): void => {
    void import('@/views/PlayView.vue')
    void import('@/views/LearnView.vue')
    void import('@/views/DungeonMapView.vue')
  }
  if ('requestIdleCallback' in window) window.requestIdleCallback(prefetch)
  else setTimeout(prefetch, 1500)
})
</script>

<template>
  <div class="min-h-dvh flex flex-col">
    <AppNav v-if="!fullBleed" />
    <main class="flex-1" :class="fullBleed ? '' : 'pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0'">
      <RouterView />
    </main>
  </div>
</template>
