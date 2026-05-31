<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDataSyncStore } from '@/stores/data-sync'

const authStore = useAuthStore()
const dataSyncStore = useDataSyncStore()
const router = useRouter()

// Flush offline queue when player logs in (SUPA-AC-08).
watch(() => authStore.userId, (userId) => {
  if (userId) dataSyncStore.flushUnsyncedQueue()
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
    <nav class="flex gap-4 px-4 py-2 border-b border-gray-200 bg-white items-center">
      <RouterLink
        to="/"
        class="text-sm font-medium text-gray-700 hover:text-gray-900"
        active-class="text-blue-600 font-semibold"
      >
        Home
      </RouterLink>
      <RouterLink
        to="/play"
        class="text-sm font-medium text-gray-700 hover:text-gray-900"
        active-class="text-blue-600 font-semibold"
      >
        Play
      </RouterLink>
      <RouterLink
        to="/review"
        class="text-sm font-medium text-gray-700 hover:text-gray-900"
        active-class="text-blue-600 font-semibold"
      >
        Review
      </RouterLink>
      <span class="flex-1" />
      <RouterLink
        v-if="!authStore.userId"
        to="/sign-in"
        class="text-sm font-medium text-gray-700 hover:text-gray-900 min-h-[44px] flex items-center"
        active-class="text-blue-600 font-semibold"
      >
        Sign in
      </RouterLink>
      <button
        v-else
        @click="handleSignOut"
        class="text-sm font-medium text-gray-700 hover:text-gray-900 min-h-[44px] px-1"
      >
        Sign out
      </button>
    </nav>
    <main class="flex-1">
      <RouterView />
    </main>
  </div>
</template>
