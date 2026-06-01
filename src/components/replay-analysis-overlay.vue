<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  moveIndex: number
  totalMoves: number
  eval?: number
  depth?: number
}

const props = withDefaults(defineProps<Props>(), {
  eval: 0,
  depth: 0,
})

// Clamp eval to [-4, +4] pawns (same as post-game review)
const clampedEval = computed(() => {
  const val = props.eval ?? 0
  return Math.max(-4, Math.min(4, val))
})

// Fill ratio: -4 → 0%, 0 → 50%, +4 → 100%
const fillPercentage = computed(() => {
  return ((clampedEval.value + 4) / 8) * 100
})

// Eval bar color: red (Black) to green (White)
const barColor = computed(() => {
  const ratio = fillPercentage.value / 100
  if (ratio < 0.5) {
    // Red to neutral
    return `rgb(${Math.round(255 - ratio * 100)}, ${Math.round(ratio * 100)}, 0)`
  } else {
    // Neutral to green
    return `rgb(${Math.round(100 - (ratio - 0.5) * 100)}, 200, 0)`
  }
})

// Format eval for display
const evalDisplay = computed(() => {
  if (props.eval === undefined) return '?'
  const val = props.eval
  if (val >= 10) return '+'
  if (val <= -10) return '−'
  return val.toFixed(1)
})
</script>

<template>
  <div class="replay-analysis-overlay">
    <!-- Eval bar -->
    <div class="eval-bar-container">
      <div class="eval-label">Eval</div>
      <div class="eval-bar-background">
        <div
          class="eval-bar-fill"
          :style="{
            width: `${fillPercentage}%`,
            backgroundColor: barColor,
          }"
        />
      </div>
      <div class="eval-value">{{ evalDisplay }}</div>
    </div>

    <!-- Depth indicator -->
    <div v-if="depth" class="depth-indicator">
      <span class="text-xs text-gray-600">depth {{ depth }}</span>
    </div>
  </div>
</template>

<style scoped>
.replay-analysis-overlay {
  padding: 0.5rem 0;
  border-top: 1px solid #e5e7eb;
}

.eval-bar-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.eval-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  width: 2.5rem;
}

.eval-bar-background {
  flex: 1;
  height: 1.5rem;
  background-color: #f3f4f6;
  border-radius: 0.25rem;
  overflow: hidden;
  border: 1px solid #d1d5db;
}

.eval-bar-fill {
  height: 100%;
  transition: width 100ms ease-out, background-color 100ms ease-out;
}

.eval-value {
  width: 2rem;
  text-align: right;
  font-size: 0.75rem;
  font-weight: 600;
  font-family: monospace;
}

.depth-indicator {
  margin-top: 0.25rem;
  text-align: right;
}
</style>
