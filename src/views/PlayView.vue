<script setup lang="ts">
import { ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import ChessBoard from '@/components/chess-board.vue'
import { useChessBoard } from '@/composables/use-chess-board'
import { useGameStore } from '@/stores/game-store'
import { createLeaveGuard, useNavigationGuards } from '@/composables/use-navigation-guards'

const { fen, playerColor, disabled, handleMoveMade, setDevFen } = useChessBoard()
const gameStore = useGameStore()
const router = useRouter()
const { isGameInProgress } = storeToRefs(gameStore)

onBeforeRouteLeave(createLeaveGuard(() => gameStore.isGameInProgress))
useNavigationGuards(isGameInProgress, (path) => router.push(path))

const isDev = import.meta.env.DEV
const devFenInput = ref('')

function injectFen(): void {
  const trimmed = devFenInput.value.trim()
  if (trimmed) setDevFen(trimmed)
}
</script>

<template>
  <div class="flex flex-col items-center p-4">
    <h1 class="text-2xl font-bold mb-4">Play</h1>
    <ChessBoard
      :fen="fen"
      :playerColor="playerColor"
      :disabled="disabled"
      @move-made="handleMoveMade"
    />

    <!-- DEV ONLY: FEN injection tool for testing rare game states (e.g. promotion, check) -->
    <div
      v-if="isDev"
      class="mt-4 p-3 bg-yellow-100 border border-yellow-400 rounded text-sm flex items-center gap-2"
    >
      <span class="font-mono font-bold text-yellow-800">DEV</span>
      <input
        v-model="devFenInput"
        class="border border-yellow-400 px-2 py-1 w-80 font-mono text-xs rounded"
        placeholder="Paste FEN to inject board position…"
        @keyup.enter="injectFen"
      />
      <button
        class="px-3 py-1 bg-yellow-400 hover:bg-yellow-500 rounded font-semibold"
        @click="injectFen"
      >
        Set FEN
      </button>
    </div>
  </div>
</template>
