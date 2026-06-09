<script setup lang="ts">
import { onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDataSyncStore } from '@/stores/data-sync'
import { useLessonProgressStore } from '@/stores/lesson-progress'
import { useDungeonProgressStore } from '@/stores/dungeon-progress'
import { useUiStore } from '@/stores/ui-store'
import type { PendingGame } from '@/stores/ui-store'
import AppNav from '@/components/app-nav.vue'
import PlaySetupModal from '@/components/play-setup-modal.vue'

const authStore = useAuthStore()
const dataSyncStore = useDataSyncStore()
const lessonProgressStore = useLessonProgressStore()
const dungeonProgressStore = useDungeonProgressStore()
const uiStore = useUiStore()
const route = useRoute()
const router = useRouter()

// Global play-setup modal: opens over the current page; confirming navigates to /play with the
// chosen settings (PlayView starts the game directly — no modal on the board screen).
function onSetupStart(payload: PendingGame): void {
  uiStore.requestGame(payload)
  if (route.name !== 'play') router.push('/play')
}
function onSetupClose(): void {
  uiStore.closePlaySetup()
}

// 沉浸式全屏頁（登入）不套 app chrome：無頂部品牌列、無底部 tab。
const fullBleed = computed(() => route.meta.fullBleed === true)

// 頁面底色套在 <main> 上：深色頁（試煉/對局）的底部 nav 留白區若無底色會露出 body 的 cream
// （試煉底部未填色 bug）。套在 main 讓 padding 區與內容同色。
const pageBg = computed(() => {
  switch (route.name) {
    case 'dungeon':
      return 'bg-surface-dungeon'
    case 'play':
      return 'bg-surface-deep'
    default:
      return 'bg-surface-base'
  }
})

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
    <main class="flex-1" :class="[fullBleed ? '' : 'pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0', pageBg]">
      <RouterView />
    </main>

    <!-- Global play-setup modal — opens over the current page (Dialog portals above everything). -->
    <PlaySetupModal
      v-if="uiStore.showPlaySetup"
      :beaten-level="uiStore.highestBeatenLevel"
      @start="onSetupStart"
      @close="onSetupClose"
    />
  </div>
</template>
