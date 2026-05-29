<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { Rect } from '../utils/board-geometry'

const props = defineProps<{
  playerColor: 'white' | 'black'
  squareRect: Rect
}>()

const emit = defineEmits<{
  select: [piece: 'q' | 'r' | 'b' | 'n']
  cancel: []
}>()

const PIECES: Array<{ value: 'q' | 'r' | 'b' | 'n'; label: string; symbol: string; name: string }> = [
  { value: 'q', label: 'Promote to queen',  symbol: props.playerColor === 'white' ? '♕' : '♛', name: 'Queen' },
  { value: 'r', label: 'Promote to rook',   symbol: props.playerColor === 'white' ? '♖' : '♜', name: 'Rook' },
  { value: 'b', label: 'Promote to bishop', symbol: props.playerColor === 'white' ? '♗' : '♝', name: 'Bishop' },
  { value: 'n', label: 'Promote to knight', symbol: props.playerColor === 'white' ? '♘' : '♞', name: 'Knight' },
]

const dialogEl = ref<HTMLElement | null>(null)

// Assertive live region text (triggers screen reader announcement)
const announcement = ref('')

onMounted(() => {
  announcement.value = 'Promote pawn — choose Queen, Rook, Bishop, or Knight'
  dialogEl.value?.querySelector<HTMLButtonElement>('[data-piece="q"]')?.focus()
})

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    emit('cancel')
    return
  }
  // Digit shortcuts: 1=Q, 2=R, 3=B, 4=N
  const digitMap: Record<string, 'q' | 'r' | 'b' | 'n'> = { '1': 'q', '2': 'r', '3': 'b', '4': 'n' }
  if (digitMap[event.key]) {
    emit('select', digitMap[event.key])
    return
  }
  // Focus trap: Tab/Shift+Tab cycles within the 4 buttons
  if (event.key === 'Tab') {
    const buttons = dialogEl.value?.querySelectorAll<HTMLButtonElement>('button[data-piece]') ?? []
    const arr = Array.from(buttons)
    const idx = arr.indexOf(document.activeElement as HTMLButtonElement)
    event.preventDefault()
    if (event.shiftKey) {
      arr[(idx - 1 + arr.length) % arr.length].focus()
    } else {
      arr[(idx + 1) % arr.length].focus()
    }
  }
}

function handleBackdropClick(event: MouseEvent): void {
  if (event.target === event.currentTarget) emit('cancel')
}

// Global keydown for digit keys and Escape (even when focus is outside the dialog)
function handleDocumentKeydown(event: KeyboardEvent): void {
  handleKeydown(event)
}

onMounted(() => document.addEventListener('keydown', handleDocumentKeydown))
onUnmounted(() => document.removeEventListener('keydown', handleDocumentKeydown))
</script>

<template>
  <!-- Full-board backdrop to catch tap-outside cancels -->
  <div
    class="absolute inset-0 z-10"
    aria-hidden="true"
    @click="handleBackdropClick"
  />

  <!-- Dialog positioned at the promotion square -->
  <div
    ref="dialogEl"
    role="dialog"
    aria-modal="true"
    aria-label="Promote pawn"
    class="absolute z-20 flex flex-col shadow-lg rounded bg-white border border-gray-300"
    :style="{
      left: `${squareRect.x}px`,
      top: playerColor === 'white' ? `${squareRect.y}px` : `${squareRect.y - squareRect.height * 3}px`,
      width: `${squareRect.width}px`,
    }"
    @keydown.stop
  >
    <button
      v-for="piece in PIECES"
      :key="piece.value"
      :data-piece="piece.value"
      :aria-label="piece.label"
      class="flex flex-col items-center justify-center gap-0.5 select-none py-2"
      style="min-width: 56px; min-height: 64px;"
      type="button"
      @click="emit('select', piece.value)"
    >
      <span class="text-3xl font-chess">{{ piece.symbol }}</span>
      <span class="text-xs font-sans leading-none">{{ piece.name }}</span>
    </button>
  </div>

  <!-- Assertive live region for screen readers -->
  <div
    aria-live="assertive"
    aria-atomic="true"
    class="sr-only"
  >
    {{ announcement }}
  </div>
</template>
