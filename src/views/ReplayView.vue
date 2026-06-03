<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGameHistoryStore } from '@/stores/game-history'
import PgnViewer from '@/components/pgn-viewer.vue'
import ReplayAnalysisOverlay from '@/components/replay-analysis-overlay.vue'
import GameReplayRating from '@/components/game-replay-rating.vue'
import { buildReplayPositions } from '@/modules/game-replay/replay-positions'
import { useReplayNavigation } from '@/composables/use-replay-navigation'
import { useReplayAnalysis } from '@/composables/use-replay-analysis'
import { useReviewEngine } from '@/modules/chess-engine/review-engine'
import { REVIEW_PREVIEW_DEPTH, REVIEW_PREVIEW_MOVE_TIME_MS } from '@/config/engine-tuning'
import type { GameHistoryEntry } from '@/types/game-history'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'

const route = useRoute()
const router = useRouter()
const historyStore = useGameHistoryStore()

const gameId = route.params.gameId as string

const game = computed<GameHistoryEntry | null>(
  () => historyStore.entries.find((e) => e.id === gameId) ?? null,
)

const positions = computed(() => buildReplayPositions(game.value?.pgn ?? ''))
const totalMoves = computed(() => positions.value.length - 1)

const nav = useReplayNavigation(totalMoves)
const { currentPly } = nav

const currentFen = computed(() => positions.value[currentPly.value]?.fen ?? '')

const analysis = useReplayAnalysis()
const engine = useReviewEngine()

const currentEntry = computed(() => analysis.getByFen(currentFen.value))
const currentBestMove = computed(() => currentEntry.value?.bestMove ?? null)

const pgnRef = ref<InstanceType<typeof PgnViewer> | null>(null)
const pgn = computed(() => game.value?.pgn ?? '')

// --- Board mirroring: ReplayView's currentPly is the single source of truth ---

watch(currentPly, (ply) => {
  pgnRef.value?.toPly(ply)
  pgnRef.value?.setBestArrow(currentBestMove.value)
})

// Best-move arrow appears as soon as the position's analysis lands.
watch(currentBestMove, (uci) => pgnRef.value?.setBestArrow(uci))

// User clicked a move in the pgn-viewer move list → sync our ply back.
function onMoveSelected(): void {
  const ply = pgnRef.value?.getCurrentPly() ?? 0
  nav.jumpToMove(ply)
}

// --- Keyboard navigation (AC-07) ---

function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'ArrowRight') {
    e.preventDefault()
    nav.nextMove()
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    nav.prevMove()
  } else if (e.key === 'Escape') {
    goBack()
  }
}

function goBack(): void {
  router.push('/history')
}

onMounted(() => {
  if (!game.value) {
    router.push('/history')
    return
  }
  window.addEventListener('keydown', onKeydown)
  // Background pre-analysis (depth-12); per-position failures degrade gracefully.
  // Fire-and-forget: run() never rejects (errors are swallowed per-position), the
  // catch is a belt-and-braces guard against an unhandled rejection.
  void analysis
    .run(
      positions.value.map((p) => p.fen),
      (input) =>
        engine.analyze({
          fen: input.fen,
          targetDepth: REVIEW_PREVIEW_DEPTH,
          movetimeMs: REVIEW_PREVIEW_MOVE_TIME_MS,
          signal: input.signal,
        }),
    )
    .catch(() => {})
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  nav.stop()
  analysis.cancel()
  engine.dispose()
})

// Expose for unit tests (navigation acceptance criteria).
defineExpose({
  nextMove: nav.nextMove,
  prevMove: nav.prevMove,
  jumpToMove: nav.jumpToMove,
  togglePlay: nav.togglePlay,
  currentPly,
  isPlaying: nav.isPlaying,
  totalMoves,
})
</script>

<template>
  <div v-if="game" class="max-w-4xl mx-auto px-4 py-6">
    <!-- Header -->
    <header class="mb-6 flex items-center justify-between">
      <Button
        variant="ghost"
        aria-label="Go back to game history"
        @click="goBack"
      >← Back</Button>
      <h1 class="flex-1 text-center font-display text-2xl font-semibold text-ink">
        {{ game.openingDisplay }}
      </h1>
      <div class="w-12" />
    </header>

    <!-- Main content: board + info -->
    <div class="flex flex-col lg:flex-row gap-6 mb-6">
      <div class="flex-1">
        <PgnViewer
          ref="pgnRef"
          :pgn="pgn"
          :keyboard-to-move="false"
          :show-controls="false"
          @move-selected="onMoveSelected"
        />
      </div>

      <div class="text-sm lg:w-56">
        <Card class="space-y-2 p-4">
          <div class="text-ink"><span class="text-ink-muted">Move:</span> {{ currentPly }} / {{ totalMoves }}</div>
          <div class="text-ink"><span class="text-ink-muted">Result:</span> {{ game.playerResult }}</div>
          <div class="text-ink"><span class="text-ink-muted">Difficulty:</span> {{ game.difficultyLabel }}</div>
        </Card>

        <ReplayAnalysisOverlay
          class="mt-3"
          :eval-cp="currentEntry?.evalCp"
          :eval-mate="currentEntry?.evalMate"
          :depth="currentEntry?.depthReached"
          :best-move="currentBestMove"
          :analysing="analysis.isAnalysing.value"
        />
      </div>
    </div>

    <!-- Controls -->
    <div class="mb-4 flex flex-wrap items-center justify-center gap-2">
      <Button
        variant="secondary"
        class="text-sm"
        :disabled="!nav.canGoPrev.value"
        @click="nav.prevMove"
      >← Prev</Button>

      <Button
        class="text-sm"
        :class="{ 'bg-primary-dark': nav.isPlaying.value }"
        :disabled="!nav.canGoNext.value && !nav.isPlaying.value"
        @click="nav.togglePlay"
      >{{ nav.isPlaying.value ? '⏸ Pause' : '▶ Play' }}</Button>

      <Button
        variant="secondary"
        class="text-sm"
        :disabled="!nav.canGoNext.value"
        @click="nav.nextMove"
      >Next →</Button>
    </div>

    <!-- Move slider -->
    <div class="mb-6 flex items-center gap-4">
      <Slider
        :model-value="[currentPly]"
        :min="0"
        :max="totalMoves"
        class="flex-1"
        aria-label="Jump to move"
        @update:model-value="(v) => nav.jumpToMove(v[0] ?? 0)"
      />
      <span class="w-12 text-sm text-ink-muted">{{ currentPly }}/{{ totalMoves }}</span>
    </div>

    <GameReplayRating :game-id="gameId" />
  </div>

  <div v-else class="text-center py-12">
    <p class="text-ink-muted mb-4">Game not found.</p>
  </div>
</template>
