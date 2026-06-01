<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  pgn: string
  orientation?: 'white' | 'black'
  highlighted?: number
}

const props = withDefaults(defineProps<Props>(), {
  orientation: 'white',
  highlighted: undefined,
})

const emit = defineEmits<{
  'move-selected': [move: string]
}>()

// Simple PGN parser: extract moves from PGN string
function parsePgnMoves(pgn: string): string[] {
  if (!pgn || typeof pgn !== 'string') return []

  try {
    // Remove comments, variations, and whitespace
    let cleanPgn = pgn
      .replace(/\{[^}]*\}/g, '') // Remove comments
      .replace(/\([^)]*\)/g, '') // Remove variations
      .replace(/\d+\./g, ' ') // Remove move numbers

    // Extract moves (algebraic notation)
    const moves = cleanPgn.match(/[a-h][1-8](?:=[QRBN])?|O-O(?:-O)?|[KQRBN][a-h1-8]?x?[a-h][1-8](?:=[QRBN])?/g) || []
    return moves
  } catch {
    console.error('[PgnViewer] Failed to parse PGN')
    return []
  }
}

const moves = computed(() => parsePgnMoves(props.pgn))

function selectMove(move: string) {
  emit('move-selected', move)
}
</script>

<template>
  <div class="pgn-viewer-container" role="region" aria-label="PGN viewer with move list">
    <!-- Move list -->
    <div class="move-list">
      <button
        v-for="(move, idx) in moves"
        :key="idx"
        :data-testid="`move-${idx}`"
        class="move-button"
        :aria-pressed="idx === highlighted"
        @click="selectMove(move)"
      >
        {{ move }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.pgn-viewer-container {
  width: 100%;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  background: #f9fafb;
}

.move-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.move-button {
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  cursor: pointer;
  font-family: monospace;
  font-size: 0.875rem;
  min-height: 2.75rem;
  min-width: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 150ms ease-in-out;
}

.move-button:hover {
  background: #e5e7eb;
}

.move-button:focus {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

.move-button[aria-pressed="true"] {
  background: #2563eb;
  color: white;
  border-color: #2563eb;
}
</style>
