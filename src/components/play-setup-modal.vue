<script setup lang="ts">
import { ref, computed } from 'vue'

type Side = 'white' | 'black' | 'random'

const props = defineProps<{
  /** Highest Skill Level the player has previously beaten, or null if none yet. */
  beatenLevel: number | null
}>()

const emit = defineEmits<{
  start: [payload: { color: 'white' | 'black'; level: number }]
}>()

// Stockfish 18 "Skill Level" UCI option: 0–20 (21 levels). Passed straight through as skillLevel.
const LEVELS = Array.from({ length: 21 }, (_, i) => i)

// Suggest the next rung above what they last beat, capped at 20.
const suggestedLevel = computed(() =>
  props.beatenLevel === null ? 3 : Math.min(props.beatenLevel + 1, 20),
)
const selectedLevel = ref<number>(suggestedLevel.value)
const selectedSide = ref<Side>('random')

const SIDES: { value: Side; label: string; piece: string }[] = [
  { value: 'black', label: '執黑', piece: 'bK' },
  { value: 'random', label: '隨機', piece: 'wK' },
  { value: 'white', label: '執白', piece: 'wK' },
]

function start(): void {
  const color: 'white' | 'black' =
    selectedSide.value === 'random'
      ? (Math.random() < 0.5 ? 'white' : 'black')
      : selectedSide.value
  emit('start', { color, level: selectedLevel.value })
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40">
    <div class="card w-full max-w-sm p-6 shadow-card-hover" role="dialog" aria-modal="true" aria-labelledby="setup-title">
      <h2 id="setup-title" class="font-display font-semibold text-xl text-ink text-center mb-1">對局設定</h2>
      <p class="text-sm text-ink-muted text-center mb-6">與引擎對弈 · 無限思考時間</p>

      <!-- Strength — Stockfish Skill Level 0–20 -->
      <fieldset class="mb-6">
        <div class="flex items-baseline justify-between mb-2">
          <legend class="text-xs font-medium uppercase tracking-wider text-ink-faint">電腦強度</legend>
          <span class="text-xs text-ink-faint">Skill Level {{ selectedLevel }} / 20</span>
        </div>
        <div class="grid grid-cols-7 gap-1.5">
          <button
            v-for="lvl in LEVELS"
            :key="lvl"
            type="button"
            class="relative h-10 rounded-btn text-sm font-semibold tabular-nums transition-colors"
            :class="selectedLevel === lvl
              ? 'bg-primary text-primary-fg shadow-button'
              : beatenLevel !== null && lvl <= beatenLevel
                ? 'bg-success/15 text-success-dark hover:bg-success/25'
                : 'bg-surface-raised text-ink-muted hover:bg-surface-hover'"
            :aria-pressed="selectedLevel === lvl"
            :aria-label="beatenLevel !== null && lvl <= beatenLevel ? `等級 ${lvl}（已戰勝）` : `等級 ${lvl}`"
            @click="selectedLevel = lvl"
          >
            {{ lvl }}
            <span
              v-if="beatenLevel !== null && lvl <= beatenLevel"
              class="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-success text-success-fg text-[8px] leading-[14px] text-center"
              aria-hidden="true"
            >✓</span>
          </button>
        </div>
        <p v-if="beatenLevel !== null" class="text-xs text-ink-muted mt-2">
          上次戰勝 Lv {{ beatenLevel }}<template v-if="beatenLevel < 20">，挑戰 Lv {{ beatenLevel + 1 }} 看看？</template>
        </p>
      </fieldset>

      <!-- Side -->
      <fieldset class="mb-7">
        <legend class="text-xs font-medium uppercase tracking-wider text-ink-faint mb-2">執子方</legend>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="side in SIDES"
            :key="side.value"
            type="button"
            class="flex flex-col items-center gap-1.5 py-3 rounded-card border transition-colors"
            :class="selectedSide === side.value
              ? 'border-primary bg-primary/10 text-ink'
              : 'border-line bg-surface-raised text-ink-muted hover:bg-surface-hover'"
            :aria-pressed="selectedSide === side.value"
            @click="selectedSide = side.value"
          >
            <img :src="`/pieces/${side.piece}.svg`" alt="" class="w-7 h-7" :class="{ 'opacity-60': side.value === 'random' }" draggable="false" />
            <span class="text-sm font-medium">{{ side.label }}</span>
          </button>
        </div>
      </fieldset>

      <button type="button" class="btn btn-primary w-full text-base" @click="start">開始對局</button>
    </div>
  </div>
</template>
