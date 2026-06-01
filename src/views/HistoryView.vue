<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useGameHistoryStore } from '@/stores/game-history'
import HistoryRow from '@/components/history-row.vue'
import { HISTORY_SKELETON_ROWS } from '@/config/history-config'

const store = useGameHistoryStore()

const loadMoreError = ref<string | null>(null)
const loadMoreAnnouncement = ref('')

const showRefresh = computed(() =>
  !store.isLoading && (store.entries.length > 0 || store.error !== null),
)

const errorMessage = computed(() => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 'No internet connection. Check your connection and try again.'
  }
  return 'Could not load game history. Try again.'
})

function onRefresh() {
  store.invalidate()
  store.fetchHistory()
}

function onRetry() {
  store.fetchHistory()
}

async function onLoadMore() {
  loadMoreError.value = null
  try {
    await store.loadMore()
    loadMoreAnnouncement.value = `${store.entries.length} games loaded`
  } catch {
    loadMoreError.value = 'Could not load more games. Try again.'
  }
}

onMounted(() => {
  if (store.cacheState !== 'valid') {
    store.fetchHistory()
  }
})
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-6">
    <header class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-semibold" tabindex="-1">Game History</h1>
      <button
        v-if="showRefresh"
        aria-label="Refresh game history"
        class="text-xl p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded hover:bg-gray-100"
        @click="onRefresh"
      >↻</button>
    </header>

    <!-- Loading -->
    <div v-if="store.isLoading" role="list" aria-busy="true">
      <div
        v-for="n in HISTORY_SKELETON_ROWS"
        :key="n"
        class="h-[44px] mb-1 rounded bg-gray-100 animate-pulse"
        aria-hidden="true"
        style="pointer-events: none"
      />
      <p role="status" class="sr-only">Loading game history</p>
    </div>

    <!-- Error (initial load, no cached data) -->
    <div v-else-if="store.error && store.entries.length === 0" class="text-center py-12">
      <p class="text-gray-700 mb-4">{{ errorMessage }}</p>
      <button
        class="px-4 py-2 rounded bg-blue-600 text-white min-h-[44px]"
        @click="onRetry"
      >Try again</button>
    </div>

    <!-- Empty -->
    <div v-else-if="store.entries.length === 0" class="text-center py-12">
      <p class="text-gray-600 mb-4">No games recorded yet.</p>
      <RouterLink
        to="/play"
        class="px-4 py-2 rounded bg-blue-600 text-white min-h-[44px] inline-flex items-center"
      >Play a game →</RouterLink>
    </div>

    <!-- List -->
    <template v-else>
      <!-- Error banner above cached list (refresh failure) -->
      <div
        v-if="store.error"
        class="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded text-sm text-red-700 flex items-center justify-between"
        role="alert"
      >
        <span>{{ errorMessage }}</span>
        <button class="ml-3 underline min-h-[44px] px-2" @click="onRetry">Try again</button>
      </div>

      <div role="list">
        <HistoryRow
          v-for="entry in store.entries"
          :key="entry.id"
          :entry="entry"
          :is-expanded="store.expandedRowId === entry.id"
        />
      </div>

      <div v-if="store.hasMore || store.isLoadingMore" class="mt-4 text-center">
        <button
          v-if="!store.isLoadingMore"
          data-testid="load-more-button"
          class="px-6 py-2 rounded border border-gray-300 text-sm min-h-[44px]"
          @click="onLoadMore"
        >Load more</button>
        <div
          v-else
          role="status"
          aria-label="Loading more games"
          class="inline-block w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"
        />
      </div>

      <div
        v-if="loadMoreError"
        class="mt-2 text-center text-sm text-red-600"
        role="alert"
      >{{ loadMoreError }}</div>

      <div role="status" class="sr-only" aria-live="polite">{{ loadMoreAnnouncement }}</div>
    </template>
  </div>
</template>
