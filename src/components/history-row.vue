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
    class="flex cursor-pointer select-none flex-col rounded-md border-b border-line transition-colors hover:bg-surface-hover"
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
      <span class="font-mono text-sm font-normal tabular-nums text-ink">
        {{ props.entry.playerResultPrefix }} {{ props.entry.playerResult }}
      </span>

      <!-- Col 2: date -->
      <span class="truncate text-sm text-ink-muted">{{ props.entry.displayDate }}</span>

      <!-- Col 3: opening (ellipsis) -->
      <span class="truncate text-right text-sm text-ink">{{ props.entry.openingDisplay }}</span>
    </div>

    <!-- Expanded panel (AC-12) -->
    <div v-if="props.isExpanded" class="space-y-1 px-4 pb-3 text-sm text-ink-muted">
      <div><span class="text-ink-faint">Moves:</span> {{ props.entry.moveCount }}</div>
      <div><span class="text-ink-faint">Result:</span> {{ props.entry.endReasonDisplay }}</div>
      <div><span class="text-ink-faint">Difficulty:</span> {{ props.entry.difficultyLabel }}</div>
      <div><span class="text-ink-faint">Played as:</span> {{ props.entry.playerColor }}</div>
    </div>
  </div>
</template>
