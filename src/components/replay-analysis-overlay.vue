<script setup lang="ts">
import { computed } from 'vue'

/**
 * Replay analysis overlay (S10-03) — eval bar + depth + best move for the current
 * replay position. Driven by the pre-computed analysis entry; when no entry exists
 * (still analysing, or engine failed) the bar is hidden (EC-04) and a state hint shows.
 *
 * GDD formula: fillRatio = (clamp(evalPawns, -4, +4) + 4) / 8, White's perspective.
 */
interface Props {
  /** Centipawn eval (White POV); undefined when not yet analysed. */
  evalCp?: number
  /** Forced-mate distance (positive = White mates); overrides evalCp. */
  evalMate?: number
  /** Analysis depth reached for this position. */
  depth?: number
  /** Engine best move for this position, UCI (e.g. "e2e4"); null at terminal. */
  bestMove?: string | null
  /** Whether background pre-analysis is still running. */
  analysing?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  evalCp: undefined,
  evalMate: undefined,
  depth: undefined,
  bestMove: undefined,
  analysing: false,
})

// An entry exists once we have either a cp or a mate score for this position.
const hasEval = computed(() => props.evalMate !== undefined || props.evalCp !== undefined)

const clampedPawns = computed(() => {
  if (props.evalMate !== undefined) return props.evalMate > 0 ? 4 : -4
  const pawns = (props.evalCp ?? 0) / 100
  return Math.max(-4, Math.min(4, pawns))
})

const fillPercentage = computed(() => ((clampedPawns.value + 4) / 8) * 100)

const barColor = computed(() => {
  const ratio = fillPercentage.value / 100
  return ratio < 0.5
    ? `rgb(${Math.round(255 - ratio * 100)}, ${Math.round(ratio * 100)}, 0)`
    : `rgb(${Math.round(100 - (ratio - 0.5) * 100)}, 200, 0)`
})

const evalDisplay = computed(() => {
  if (props.evalMate !== undefined) {
    return props.evalMate > 0 ? `M${props.evalMate}` : `-M${Math.abs(props.evalMate)}`
  }
  if (props.evalCp === undefined) return '?'
  const pawns = props.evalCp / 100
  return (pawns >= 0 ? '+' : '') + pawns.toFixed(1)
})
</script>

<template>
  <div class="replay-analysis-overlay">
    <template v-if="hasEval">
      <div class="eval-bar-container">
        <div class="eval-label">Eval</div>
        <div class="eval-bar-background" role="img" :aria-label="`Evaluation ${evalDisplay}`">
          <div
            class="eval-bar-fill"
            :style="{ width: `${fillPercentage}%`, backgroundColor: barColor }"
          />
        </div>
        <div class="eval-value">{{ evalDisplay }}</div>
      </div>

      <div class="meta-row">
        <span v-if="bestMove" class="best-move">Best: {{ bestMove }}</span>
        <span v-if="depth != null" class="depth-indicator">depth {{ depth }}</span>
      </div>
    </template>

    <!-- No eval yet: show spinner while analysing, otherwise stay quiet (EC-04) -->
    <div v-else-if="analysing" class="analysing-hint">
      <span class="spinner" aria-hidden="true" /> Analysing…
    </div>
    <div v-else class="no-eval-hint">No analysis</div>
  </div>
</template>

<style scoped>
.replay-analysis-overlay {
  padding: 0.5rem 0;
  border-top: 1px solid #e0d3bd;
}

.eval-bar-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.eval-label {
  font-size: 0.75rem;
  color: #7a5c44;
  font-weight: 500;
  width: 2.5rem;
}

.eval-bar-background {
  flex: 1;
  height: 1.5rem;
  background-color: #efe4d2;
  border-radius: 0.375rem;
  overflow: hidden;
  border: 1px solid #e0d3bd;
}

.eval-bar-fill {
  height: 100%;
  transition: width 120ms ease-out, background-color 120ms ease-out;
}

.eval-value {
  width: 2.5rem;
  text-align: right;
  font-size: 0.75rem;
  font-weight: 600;
  font-family: monospace;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: #7a5c44;
}

.best-move {
  font-family: monospace;
}

.analysing-hint,
.no-eval-hint {
  font-size: 0.75rem;
  color: #7a5c44;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.spinner {
  width: 0.75rem;
  height: 0.75rem;
  border: 2px solid #e0d3bd;
  border-top-color: #8b6f5c;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
