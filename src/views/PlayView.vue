<script setup lang="ts">
import ChessBoard from '@/components/chess-board.vue'
import { useChessBoard } from '@/composables/use-chess-board'

const { fen, playerColor, disabled, handleMoveMade } = useChessBoard()
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
