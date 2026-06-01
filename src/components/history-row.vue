<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { GameHistoryEntry } from '@/types/game-history'

const props = defineProps<{
  entry: GameHistoryEntry
  isExpanded: boolean
}>()

const router = useRouter()
let touchStartY = 0

function onRowClick() {
  // Navigate to replay view on row click
  router.push({ name: 'replay', params: { gameId: props.entry.id } })
}

function onTouchStart(e: TouchEvent) {
  touchStartY = e.touches[0].clientY
}

function onTouchEnd(e: TouchEvent) {
  const delta = Math.abs(e.changedTouches[0].clientY - touchStartY)
  if (delta < 4) {
    onRowClick()
  }
}
</script>

<template>
  <div
    class="flex flex-col border-b border-gray-200 cursor-pointer select-none"
    data-testid="history-row"
    role="listitem"
    :aria-expanded="props.isExpanded"
    @click="onRowClick"
    @touchstart.passive="onTouchStart"
    @touchend.prevent="onTouchEnd"
  >
    <!-- Collapsed row: 3-column grid -->
    <div class="grid min-h-[44px] items-center px-4 py-2"
         style="grid-template-columns: 4em 96px 1fr">
      <!-- Col 1: prefix + result (monospace, no colour coding, weight 400) -->
      <span class="font-mono font-normal text-sm tabular-nums">
        {{ props.entry.playerResultPrefix }} {{ props.entry.playerResult }}
      </span>

      <!-- Col 2: date -->
      <span class="text-sm text-gray-600 truncate">{{ props.entry.displayDate }}</span>

      <!-- Col 3: opening (ellipsis) -->
      <span class="text-sm truncate text-right">{{ props.entry.openingDisplay }}</span>
    </div>

    <!-- Expanded panel (AC-12) -->
    <div v-if="props.isExpanded" class="px-4 pb-3 text-sm text-gray-700 space-y-1">
      <div><span class="text-gray-500">Moves:</span> {{ props.entry.moveCount }}</div>
      <div><span class="text-gray-500">Result:</span> {{ props.entry.endReasonDisplay }}</div>
      <div><span class="text-gray-500">Difficulty:</span> {{ props.entry.difficultyLabel }}</div>
      <div><span class="text-gray-500">Played as:</span> {{ props.entry.playerColor }}</div>
    </div>
  </div>
</template>
