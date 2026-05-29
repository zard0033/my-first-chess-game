<script setup lang="ts">
import { onBeforeRouteLeave } from 'vue-router'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import ChessBoard from '@/components/chess-board.vue'
import { useChessBoard } from '@/composables/use-chess-board'
import { useGameStore } from '@/stores/game-store'
import { createLeaveGuard, useNavigationGuards } from '@/composables/use-navigation-guards'

const { fen, playerColor, disabled, handleMoveMade } = useChessBoard()
const gameStore = useGameStore()
const router = useRouter()
const { isGameInProgress } = storeToRefs(gameStore)

onBeforeRouteLeave(createLeaveGuard(() => gameStore.isGameInProgress))
useNavigationGuards(isGameInProgress, (path) => router.push(path))
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
  </div>
</template>
