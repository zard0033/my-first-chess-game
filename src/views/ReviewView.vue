<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game-store'
import { usePostGameReview } from '@/modules/post-game-review/use-post-game-review'
import { useReviewEngine } from '@/modules/chess-engine/review-engine'
import { identifyOpening } from '@/modules/opening-id/opening-index'
import type { OpeningResult } from '@/modules/opening-id/opening-index'
import type { Annotation, EvaluationInput } from '@/modules/move-annotation/annotation-types'
import MoveAnnotationDisplay from '@/components/move-annotation-display.vue'
import OpeningKnowledgeCard from '@/components/opening-knowledge-card.vue'
import { useDataSyncStore } from '@/stores/data-sync'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert } from '@/components/ui/alert'

const router = useRouter()
const gameStore = useGameStore()
const dataSyncStore = useDataSyncStore()
const review = usePostGameReview()
const engine = useReviewEngine()

const syncStatus = computed(() => dataSyncStore.syncStatus)

const openingResult = ref<OpeningResult | null>(null)
const boardPlaceholderRef = ref<HTMLElement | null>(null)

// ---- Opening header (Rule 25, AC-8, AC-9, AC-10) ----

const openingHeader = computed<string | null>(() => {
  const or = openingResult.value
  if (!or || or.isUnknown) return null
  if (review.cursor.value === 0) return null

  let header = or.name ?? ''
  const n = review.totalPositions.value
  const bp = or.bookExitPly
  if (bp !== null && bp < n && review.cursor.value >= bp) {
    const moveNum = Math.ceil(bp / 2)
    header += ` — left book at move ${moveNum}`
  }
  return header
})

// ---- cpLoss display (Rule 22, AC-2, AC-3, AC-4, AC-5) ----

/** Returns the F2b mate label when either eval is mate, else null. */
function getMateLabel(i: number): string | null {
  const curr = review.analysisResults.value[i]
  const next = review.analysisResults.value[i + 1]
  if (!curr || !next) return null

  const currIsMate = curr.evalMate !== undefined
  const nextIsMate = next.evalMate !== undefined
  if (!currIsMate && !nextIsMate) return null

  const hadMate = currIsMate && curr.evalMate! > 0
  const nowMated = nextIsMate && next.evalMate! > 0

  if (hadMate && !nowMated) return 'Missed forced mate'
  if (!hadMate && nowMated) return 'Allowed forced mate'
  // Both stay in same state — no swing to report
  return null
}

const cpLossDisplay = computed<{ text: string; preliminary: boolean; omit: boolean }>(() => {
  const i = review.cursor.value
  const n = review.totalPositions.value

  // not-applicable cases (Rule 22 branch 1)
  if (!review.isPlayerMove(i)) return { text: '—', preliminary: false, omit: false }
  if (i >= n - 1) return { text: '—', preliminary: false, omit: false }

  const curr = review.analysisResults.value[i]
  const next = review.analysisResults.value[i + 1]

  // EC-8: terminal position
  if (curr && curr.bestMove === null) return { text: '—', preliminary: false, omit: false }

  // COMPLETE + null entry = engine error (AC-20)
  if (review.phase.value === 'COMPLETE' && (!curr || !next)) {
    return { text: '—', preliminary: false, omit: false }
  }

  // pending (Rule 22 branch 2)
  if (review.phase.value === 'ANALYZING' && (!curr || !next)) {
    return { text: '…', preliminary: false, omit: false }
  }

  if (!curr || !next) return { text: '—', preliminary: false, omit: false }

  // confirming case (Rule 22 branch 3 / AC-23)
  const playedMove = gameStore.completedGame?.moves[i]
  const bestMove = curr.bestMove
  if (playedMove && bestMove && playedMove.toLowerCase() === bestMove.toLowerCase()) {
    return { text: '', preliminary: false, omit: true }
  }

  // mate transition (Rule 22 branch 4 / AC-15)
  const mateLabel = getMateLabel(i)
  if (mateLabel) return { text: mateLabel, preliminary: false, omit: false }

  // value (Rule 22 branch 5)
  const loss = review.computeCpLoss(i)
  if (loss === null) return { text: '—', preliminary: false, omit: false }

  const isFinal = review.isCpLossFinal(i)
  const pawns = (loss / 100).toFixed(1)
  const display = loss === 0 ? '0.0' : `-${pawns}`
  const preliminary = !isFinal

  return { text: preliminary ? `~${display}` : display, preliminary, omit: false }
})

// ---- Progress indicator (Rule 12, AC-16) ----

const progressLabel = computed<string | null>(() => {
  if (review.phase.value !== 'ANALYZING') return null
  const n = review.totalPositions.value
  const count = review.progressCount.value
  if (review.progressPass.value === 'preview') {
    return `Analyzing… ${count}/${n}`
  }
  return `Refining… ${count}/${n}`
})

// ---- Mobile calm default (S4-06, TR-post-game-review-006) ----
// < 768px: bestMove arrow only, no eval bar. BINDING per control manifest.

const _mq = typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)') : null
const isMobile = ref(_mq?.matches ?? false)

function _onMqChange(e: MediaQueryListEvent) { isMobile.value = e.matches }
if (_mq) _mq.addEventListener('change', _onMqChange)

const currentAnnotations = computed<Annotation[]>(() => {
  const i = review.cursor.value
  const result = review.analysisResults.value[i]
  if (!result) return []

  const annotations: Annotation[] = []
  const best = result.bestMove
  if (best && best.length >= 4) {
    annotations.push({ kind: 'arrow', role: 'bestMove', from: best.slice(0, 2), to: best.slice(2, 4) })
  }

  const played = gameStore.completedGame?.moves[i]
  if (played && played.length >= 4 && played.slice(0, 4).toLowerCase() !== best?.slice(0, 4).toLowerCase()) {
    annotations.push({ kind: 'arrow', role: 'playedMove', from: played.slice(0, 2), to: played.slice(2, 4) })
  }

  return annotations
})

const currentEvaluation = computed<EvaluationInput | null>(() => {
  const i = review.cursor.value
  const result = review.analysisResults.value[i]
  if (!result) return null
  return { evalCp: result.evalCp, evalMate: result.evalMate, sideToMove: i % 2 === 0 ? 'w' : 'b' }
})

const displayAnnotations = computed<Annotation[]>(() =>
  isMobile.value ? currentAnnotations.value.filter(a => a.role === 'bestMove') : currentAnnotations.value,
)

const displayEvaluation = computed<EvaluationInput | null>(() =>
  isMobile.value ? null : currentEvaluation.value,
)

// ---- Biggest swing (Rules 30-32, AC-24) ----

const biggestSwingCursor = computed(() => {
  if (review.phase.value !== 'COMPLETE') return null
  return review.biggestSwingCursor.value
})

function jumpToBiggestSwing(): void {
  const bsc = biggestSwingCursor.value
  if (bsc !== null) review.goTo(bsc)
}

// ---- Lifecycle ----

onMounted(async () => {
  const game = gameStore.completedGame
  if (!game) {
    router.push('/')
    return
  }

  // Opening identification (Rule 3)
  openingResult.value = identifyOpening([...game.moves])

  // Start analysis
  review.init(game, ({ fen, targetDepth, movetimeMs, signal }) =>
    engine.analyze({ fen, targetDepth, movetimeMs, signal }),
  ).catch(() => {
    // Aborted or engine error — review remains partially usable
  })
})

onUnmounted(() => {
  review.abort()
  engine.dispose()
  if (_mq) _mq.removeEventListener('change', _onMqChange)
})

function handleExit(): void {
  review.abort()
  router.push('/')
}
</script>

<template>
  <div class="flex flex-col items-center p-4 min-h-screen">
    <!-- Header row -->
    <div class="mb-3 flex w-full max-w-md items-center justify-between">
      <Button variant="secondary" @click="handleExit">← Back</Button>
      <h1 class="font-display text-xl font-semibold text-ink">Review</h1>
      <div class="w-16" />
    </div>

    <!-- Opening header + knowledge card (OKC-01, OKC-02, OKC-03) -->
    <OpeningKnowledgeCard
      :eco="openingResult?.eco ?? null"
      :header-text="openingHeader"
    />

    <!-- Sync status badge (SUPA-AC-13, AC-S7-02~05) -->
    <Badge
      v-if="syncStatus !== 'idle'"
      :variant="syncStatus === 'syncing' ? 'hint' : syncStatus === 'synced' ? 'success' : 'danger'"
      class="mb-2"
      aria-live="polite"
    >
      <span v-if="syncStatus === 'syncing'">Saving…</span>
      <span v-if="syncStatus === 'synced'">Saved</span>
      <span v-if="syncStatus === 'error'">Not saved</span>
    </Badge>

    <!-- Progress indicator (Rule 12, AC-16) -->
    <div
      v-if="progressLabel"
      class="w-full max-w-md text-xs text-center text-ink-muted mb-2"
    >
      {{ progressLabel }}
    </div>

    <!-- Board placeholder (FEN display) -->
    <div ref="boardPlaceholderRef" class="w-full max-w-md bg-surface-hover rounded p-4 mb-3 text-center font-mono text-xs text-ink-muted break-all relative">
      {{ review.currentFen.value }}
      <!-- MoveAnnotationDisplay — mobile calm: < 768px shows bestMove arrow only, no eval bar -->
      <MoveAnnotationDisplay
        :annotations="displayAnnotations"
        :evaluation="displayEvaluation"
        :square-to-rect="() => null"
        :board-ref="boardPlaceholderRef"
      />
    </div>

    <!-- cpLoss display (AC-2, AC-3, AC-4, AC-5) -->
    <div class="w-full max-w-md flex items-center justify-center mb-3 min-h-[28px]">
      <template v-if="!cpLossDisplay.omit">
        <span
          :class="[
            'text-sm font-mono px-2 py-1 rounded',
            cpLossDisplay.text === '—' || cpLossDisplay.text === '…'
              ? 'text-ink-faint'
              : cpLossDisplay.preliminary
                ? 'text-ink-muted bg-surface-hover'
                : 'text-ink bg-surface-hover',
          ]"
        >
          {{ cpLossDisplay.text }}
        </span>
        <span
          v-if="review.phase.value === 'COMPLETE' && biggestSwingCursor === review.cursor.value"
          class="ml-2 text-xs text-hint font-semibold"
        >
          Biggest swing
        </span>
      </template>
    </div>

    <!-- Navigation row (Rules 15-17, AC-11, AC-12) -->
    <div class="mb-4 flex items-center gap-4">
      <Button
        variant="secondary"
        :disabled="!review.canGoPrev.value"
        @click="review.goPrev()"
      >
        ←
      </Button>
      <span class="text-sm text-ink-muted">
        {{ review.cursor.value }} / {{ review.totalPositions.value }}
      </span>
      <Button
        variant="secondary"
        :disabled="!review.canGoNext.value"
        @click="review.goNext()"
      >
        →
      </Button>
    </div>

    <!-- Jump to biggest swing (Rules 31-32, AC-24) -->
    <div
      v-if="review.phase.value === 'COMPLETE' && biggestSwingCursor !== null"
      class="mb-3"
    >
      <Button
        class="bg-hint text-sm text-hint-fg hover:bg-hint-dark"
        @click="jumpToBiggestSwing"
      >
        Jump to biggest swing
      </Button>
    </div>

    <!-- No big swings empty state (Rule 32) -->
    <div
      v-if="review.phase.value === 'COMPLETE' && biggestSwingCursor === null && review.totalPositions.value > 0"
      class="text-sm text-ink-muted text-center"
    >
      No big swings this game — steady throughout
    </div>

    <!-- Engine error state (AC-30 / Visual Requirements §Error State) -->
    <Alert
      v-if="review.phase.value === 'COMPLETE' && review.totalPositions.value > 0 && review.analysisResults.value.every(r => r === null)"
      variant="danger"
      class="mt-4 w-full max-w-md text-center"
    >
      <p class="mb-3 text-sm font-semibold text-danger">Couldn't analyze this game</p>
      <div class="flex justify-center gap-3">
        <Button variant="danger" class="text-sm" @click="handleExit">Exit</Button>
      </div>
    </Alert>
  </div>
</template>
