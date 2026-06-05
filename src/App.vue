<script setup lang="ts">
import { onMounted, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDataSyncStore } from '@/stores/data-sync'
import { useLessonProgressStore } from '@/stores/lesson-progress'
import AppNav from '@/components/app-nav.vue'

const authStore = useAuthStore()
const dataSyncStore = useDataSyncStore()
const lessonProgressStore = useLessonProgressStore()
const router = useRouter()
const route = useRoute()

// 沉浸式全屏頁（登入）不套 app chrome：無頂部品牌列、無底部 tab。
const fullBleed = computed(() => route.meta.fullBleed === true)

// Flush offline queue + reconcile lesson progress when player logs in (SUPA-AC-08).
watch(() => authStore.userId, (userId) => {
  if (userId) {
    dataSyncStore.flushUnsyncedQueue()
    lessonProgressStore.reconcileOnLogin()
  }
})

// initAuth() not awaited — isAuthLoading guards against flash of unauthenticated state
onMounted(() => { authStore.initAuth() })

async function handleSignOut() {
  await authStore.signOut()
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <AppNav v-if="!fullBleed" :on-sign-out="handleSignOut" />
    <main class="flex-1" :class="fullBleed ? '' : 'pb-20 md:pb-0'">
      <RouterView />
    </main>
  </div>
</template>
