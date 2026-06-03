<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDataSyncStore } from '@/stores/data-sync'
import { useLessonProgressStore } from '@/stores/lesson-progress'
import AppNav from '@/components/app-nav.vue'

const authStore = useAuthStore()
const dataSyncStore = useDataSyncStore()
const lessonProgressStore = useLessonProgressStore()
const router = useRouter()

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
    <AppNav :on-sign-out="handleSignOut" />
    <main class="flex-1 pb-20 md:pb-0">
      <RouterView />
    </main>
  </div>
</template>
