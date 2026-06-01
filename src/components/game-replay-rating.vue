<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

interface Props {
  gameId: string
}

const props = defineProps<Props>()

const rating = ref<number | null>(null)
const notes = ref('')

const storageKey = computed(() => `pgr:replay:${props.gameId}`)

function loadRating() {
  try {
    const data = localStorage.getItem(storageKey.value)
    if (data) {
      const parsed = JSON.parse(data)
      rating.value = parsed.rating
      notes.value = parsed.notes
    }
  } catch {
    console.error('[GameReplayRating] Failed to load data')
  }
}

function saveRating() {
  try {
    const data = {
      rating: rating.value,
      notes: notes.value.slice(0, 200), // Max 200 chars
    }
    localStorage.setItem(storageKey.value, JSON.stringify(data))
  } catch {
    console.error('[GameReplayRating] Failed to save data')
  }
}

function setRating(value: number) {
  if (rating.value === value) {
    rating.value = null
  } else {
    rating.value = value
  }
  saveRating()
}

function onNotesBlur() {
  saveRating()
}

onMounted(() => {
  loadRating()
})

watch(() => props.gameId, () => {
  loadRating()
})
</script>

<template>
  <div class="game-replay-rating border-t border-gray-200 pt-4 mt-4">
    <!-- Rating -->
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">How did you feel about this game?</label>
      <div class="flex gap-2">
        <button
          v-for="star in 5"
          :key="star"
          :aria-pressed="rating === star"
          class="text-2xl p-1 rounded min-h-[44px] min-w-[44px]"
          :class="rating === star ? 'bg-yellow-100' : 'hover:bg-gray-100'"
          @click="setRating(star)"
        >
          {{ rating && rating >= star ? '⭐' : '☆' }}
        </button>
      </div>
    </div>

    <!-- Notes -->
    <div>
      <label for="replay-notes" class="block text-sm font-medium text-gray-700 mb-2">Notes (optional, max 200 chars)</label>
      <textarea
        id="replay-notes"
        v-model="notes"
        maxlength="200"
        class="w-full px-3 py-2 border border-gray-300 rounded text-sm"
        placeholder="e.g., Could have defended better on move 15..."
        rows="3"
        @blur="onNotesBlur"
      />
      <div class="text-xs text-gray-500 mt-1">{{ notes.length }}/200</div>
    </div>
  </div>
</template>

<style scoped>
.game-replay-rating {
  background: #f9fafb;
  padding: 1rem;
  border-radius: 0.375rem;
}
</style>
