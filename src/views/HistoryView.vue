<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useGameHistoryStore } from '@/stores/game-history'
import HistoryRow from '@/components/history-row.vue'
import { HISTORY_SKELETON_ROWS } from '@/config/history-config'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'

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
      <h1 class="font-display text-2xl font-semibold text-ink" tabindex="-1">Game History</h1>
      <Button
        v-if="showRefresh"
        variant="ghost"
        size="icon"
        aria-label="Refresh game history"
        class="text-xl"
        @click="onRefresh"
      >↻</Button>
    </header>

    <!-- Loading -->
    <div v-if="store.isLoading" role="list" aria-busy="true">
      <Skeleton
        v-for="n in HISTORY_SKELETON_ROWS"
        :key="n"
        class="mb-1 h-[44px] rounded"
        aria-hidden="true"
        style="pointer-events: none"
      />
      <p role="status" class="sr-only">Loading game history</p>
    </div>

    <!-- Error (initial load, no cached data) -->
    <div v-else-if="store.error && store.entries.length === 0" class="py-12 text-center">
      <p class="mb-4 text-ink">{{ errorMessage }}</p>
      <Button @click="onRetry">Try again</Button>
    </div>

    <!-- Empty -->
    <div v-else-if="store.entries.length === 0" class="py-12 text-center">
      <p class="mb-4 text-ink-muted">No games recorded yet.</p>
      <Button as-child><RouterLink to="/play">Play a game →</RouterLink></Button>
    </div>

    <!-- List -->
    <template v-else>
      <!-- Error banner above cached list (refresh failure) -->
      <Alert
        v-if="store.error"
        variant="danger"
        class="mb-3 flex items-center justify-between py-2.5"
      >
        <AlertDescription class="text-danger">{{ errorMessage }}</AlertDescription>
        <Button variant="link" class="ml-3 text-danger" @click="onRetry">Try again</Button>
      </Alert>

      <div role="list">
        <HistoryRow
          v-for="entry in store.entries"
          :key="entry.id"
          :entry="entry"
          :is-expanded="store.expandedRowId === entry.id"
        />
      </div>

      <div v-if="store.hasMore || store.isLoadingMore" class="mt-4 text-center">
        <Button
          v-if="!store.isLoadingMore"
          data-testid="load-more-button"
          variant="secondary"
          class="text-sm"
          @click="onLoadMore"
        >Load more</Button>
        <div
          v-else
          role="status"
          aria-label="Loading more games"
          class="inline-block h-6 w-6 animate-spin rounded-full border-2 border-line border-t-primary"
        />
      </div>

      <div
        v-if="loadMoreError"
        class="mt-2 text-center text-sm text-danger"
        role="alert"
      >{{ loadMoreError }}</div>

      <div role="status" class="sr-only" aria-live="polite">{{ loadMoreAnnouncement }}</div>
    </template>
  </div>
</template>
