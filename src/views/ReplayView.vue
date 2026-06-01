<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGameHistoryStore } from '@/stores/game-history'
import PgnViewer from '@/components/pgn-viewer.vue'
import ReplayAnalysisOverlay from '@/components/replay-analysis-overlay.vue'
import GameReplayRating from '@/components/game-replay-rating.vue'
import type { GameHistoryEntry } from '@/types/game-history'

const route = useRoute()
const router = useRouter()
const historyStore = useGameHistoryStore()

const gameId = route.params.gameId as string
const currentMoveIndex = ref(0)
const isPlaying = ref(false)

const game = computed<GameHistoryEntry | null>(() => {
  return historyStore.entries.find((e) => e.id === gameId) || null
})

const pgn = computed(() => {
  return game.value?.pgn || ''
})

const totalMoves = computed(() => {
  if (!pgn.value) return 0
  const matches = pgn.value.match(/[a-h][1-8]|O-O(?:-O)?|[KQRBN][a-h1-8]?x?[a-h][1-8]/g) || []
  return matches.length
})

function nextMove() {
  if (currentMoveIndex.value < totalMoves.value) {
    currentMoveIndex.value++
  }
}

function prevMove() {
  if (currentMoveIndex.value > 0) {
    currentMoveIndex.value--
  }
}

function jumpToMove(index: number) {
  currentMoveIndex.value = Math.max(0, Math.min(index, totalMoves.value))
}

function togglePlay() {
  if (!isPlaying.value) {
    isPlaying.value = true
    // Auto-step every 1 second
    const interval = setInterval(() => {
      if (currentMoveIndex.value >= totalMoves.value) {
        isPlaying.value = false
        clearInterval(interval)
      } else {
        currentMoveIndex.value++
      }
    }, 1000)
  } else {
    isPlaying.value = false
  }
}

function goBack() {
  router.push('/history')
}

onMounted(() => {
  if (!game.value) {
    router.push('/history')
  }
})
</script>

<template>
  <div v-if="game" class="max-w-4xl mx-auto px-4 py-6">
    <!-- Header -->
    <header class="flex items-center justify-between mb-6">
      <div>
        <button
          aria-label="Go back to game history"
          class="text-2xl p-2 rounded hover:bg-gray-100 min-h-[44px] min-w-[44px]"
          @click="goBack"
        >← Back</button>
      </div>
      <h1 class="text-2xl font-semibold flex-1 text-center">
        {{ game.openingDisplay }}
      </h1>
      <div class="w-12" />
    </header>

    <!-- Main content: board + move list -->
    <div class="flex flex-col lg:flex-row gap-6 mb-6">
      <!-- PGN Viewer (board + moves) -->
      <div class="flex-1">
        <PgnViewer
          :pgn="pgn"
          :highlighted="`move-${currentMoveIndex}`"
          @move-selected="(move) => {}"
        />
      </div>

      <!-- Move information panel -->
      <div class="lg:w-48 text-sm">
        <div class="bg-gray-100 p-3 rounded space-y-2">
          <div><span class="text-gray-600">Current move:</span> {{ currentMoveIndex }} / {{ totalMoves }}</div>
          <div><span class="text-gray-600">Result:</span> {{ game.playerResult }}</div>
          <div><span class="text-gray-600">Difficulty:</span> {{ game.difficultyLabel }}</div>
          <div><span class="text-gray-600">Moves:</span> {{ game.moveCount }}</div>
        </div>

        <!-- S10-03: Analysis overlay -->
        <ReplayAnalysisOverlay
          class="mt-3"
          :move-index="currentMoveIndex"
          :total-moves="totalMoves"
        />
      </div>
    </div>

    <!-- Controls (S10-05: fade transition on play state) -->
    <div class="flex flex-wrap items-center gap-2 justify-center mb-4">
      <button
        class="px-4 py-2 rounded bg-gray-200 text-sm min-h-[44px] transition-opacity duration-150"
        :class="{ 'opacity-40': currentMoveIndex <= 0 }"
        :disabled="currentMoveIndex <= 0"
        @click="prevMove"
      >← Prev</button>

      <button
        class="px-4 py-2 rounded bg-blue-600 text-white text-sm min-h-[44px] transition-colors duration-150"
        :class="{ 'bg-blue-800': isPlaying }"
        @click="togglePlay"
      >{{ isPlaying ? '⏸ Pause' : '▶ Play' }}</button>

      <button
        class="px-4 py-2 rounded bg-gray-200 text-sm min-h-[44px] transition-opacity duration-150"
        :class="{ 'opacity-40': currentMoveIndex >= totalMoves }"
        :disabled="currentMoveIndex >= totalMoves"
        @click="nextMove"
      >Next →</button>
    </div>

    <!-- Move slider -->
    <div class="flex items-center gap-4 mb-6">
      <input
        type="range"
        min="0"
        :max="totalMoves"
        :value="currentMoveIndex"
        class="flex-1"
        @input="(e) => jumpToMove(parseInt((e.target as HTMLInputElement).value))"
      />
      <span class="text-sm text-gray-600 w-12">{{ currentMoveIndex }}/{{ totalMoves }}</span>
    </div>

    <!-- S10-04: Game rating -->
    <GameReplayRating :game-id="gameId" />
  </div>

  <!-- No game found -->
  <div v-else class="text-center py-12">
    <p class="text-gray-700 mb-4">Game not found.</p>
  </div>
</template>
