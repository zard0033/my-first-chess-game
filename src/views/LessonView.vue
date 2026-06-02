<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ChessBoard from '@/components/chess-board.vue'
import MoveAnnotationDisplay from '@/components/move-annotation-display.vue'
import { getLessonById } from '@/data/lessons'
import { COACH } from '@/types/lesson'
import type { LessonStep } from '@/types/lesson'
import type { Annotation } from '@/modules/move-annotation/annotation-types'
import type { MoveMadePayload } from '@/composables/use-chess-board'
import type { Rect } from '@/utils/board-geometry'
import { useLessonProgressStore } from '@/stores/lesson-progress'
import { useUiStore } from '@/stores/ui-store'

const route = useRoute()
const router = useRouter()
const progress = useLessonProgressStore()
const ui = useUiStore()

const lesson = getLessonById(route.params.lessonId as string)

// Guard: unknown or still-locked lesson → back to the catalog.
if (!lesson || !progress.isUnlocked(lesson)) {
  router.replace('/learn')
}

const playerColor = computed<'white' | 'black'>(() => lesson?.playerColor ?? 'white')

const stepIndex = ref(0)
const currentStep = computed<LessonStep | null>(() => lesson?.steps[stepIndex.value] ?? null)
const isInteractive = computed(() => !!currentStep.value?.expectedMove)
const isLastStep = computed(() => !!lesson && stepIndex.value >= lesson.steps.length - 1)

// Per-step interaction state — reset whenever the step changes.
const solved = ref(false)
// The wrong-but-legal move currently displayed (piece left on the wrong square, marked red).
const wrongMove = ref<{ from: string; to: string } | null>(null)
const everWrong = ref(false) // a wrong attempt happened this step → emphasise the hint affordance
const hintShown = ref(false)
const answerRevealed = ref(false)
// Bumped to remount the board (fresh FEN on step change; reset position on retry).
const boardNonce = ref(0)

watch(stepIndex, () => {
  solved.value = false
  wrongMove.value = null
  everWrong.value = false
  hintShown.value = false
  answerRevealed.value = false
})

const boardKey = computed(() => `${stepIndex.value}:${boardNonce.value}`)
const boardDisabled = computed(() => !isInteractive.value || solved.value || !!wrongMove.value)

// ChessBoard exposes boardRef (unwrapped) + squareToRect via defineExpose.
const board = ref<{ boardRef: HTMLElement | null; squareToRect: (s: string) => Rect | null } | null>(null)
const geomTick = ref(0) // forces offsetWidth / boardRef reads after the board lays out
const boardEl = computed<HTMLElement | null>(() => {
  void geomTick.value
  return board.value?.boardRef ?? null
})
const boardSizePx = computed(() => {
  void geomTick.value
  return boardEl.value?.offsetWidth ?? 0
})
function squareToRect(square: string): Rect | null {
  void geomTick.value
  return board.value?.squareToRect?.(square) ?? null
}

onMounted(async () => {
  await nextTick()
  geomTick.value++
})
watch(boardKey, async () => {
  await nextTick()
  geomTick.value++
})

// Highlights always show. The answer arrow is the opt-in "reveal" on interactive steps;
// narration steps show their arrows immediately (GDD §3 Hint System).
const annotations = computed<Annotation[]>(() => {
  const step = currentStep.value
  if (!step) return []
  const out: Annotation[] = []
  for (const sq of step.highlights ?? []) {
    out.push({ kind: 'highlight', role: 'keySquare', square: sq })
  }
  const showArrows = !isInteractive.value || answerRevealed.value
  if (showArrows) {
    for (const a of step.arrows ?? []) {
      out.push({ kind: 'arrow', role: 'bestMove', from: a.orig, to: a.dest })
    }
  }
  return out
})

// chess.com-style feedback: tint the from/to squares of the wrong move (no arrow).
const wrongGeom = computed(() => {
  void geomTick.value
  const wm = wrongMove.value
  if (!wm) return null
  const from = squareToRect(wm.from)
  const to = squareToRect(wm.to)
  return from && to ? { from, to } : null
})

// A corner ✗ / ✓ badge sits over the destination square the piece is now on.
function cornerBadge(square: string | undefined) {
  void geomTick.value
  if (!square) return null
  const r = squareToRect(square)
  if (!r) return null
  const size = Math.max(18, r.width * 0.42)
  // Straddling the square's top-right corner.
  return { left: r.x + r.width - size / 2, top: r.y - size / 2, size }
}
const wrongBadge = computed(() => (wrongMove.value ? cornerBadge(wrongMove.value.to) : null))
const correctBadge = computed(() =>
  solved.value ? cornerBadge(currentStep.value?.expectedMove?.to) : null,
)

function handleMove(payload: MoveMadePayload): void {
  const exp = currentStep.value?.expectedMove
  if (!exp || solved.value || wrongMove.value) return
  const correct =
    payload.from === exp.from &&
    payload.to === exp.to &&
    (exp.promotion === undefined || payload.promotion === exp.promotion)
  if (correct) {
    solved.value = true
  } else {
    // chess.com-style: leave the piece on the wrong square, mark the path red,
    // lock the board, and let the player read the feedback then retry.
    wrongMove.value = { from: payload.from, to: payload.to }
    everWrong.value = true
  }
}

function retry(): void {
  wrongMove.value = null
  boardNonce.value++ // remount → snap the position back to the step FEN
}

const canAdvance = computed(() => !isInteractive.value || solved.value)
const lightbulbGlowing = computed(
  () => everWrong.value && !wrongMove.value && !solved.value && !hintShown.value,
)

function next(): void {
  if (isLastStep.value) {
    if (lesson) progress.markComplete(lesson.id)
    router.push('/learn')
    return
  }
  stepIndex.value++
}
function prev(): void {
  if (stepIndex.value > 0) stepIndex.value--
}
</script>

<template>
  <div v-if="lesson" class="max-w-5xl mx-auto px-4 py-6">
    <header class="flex items-center gap-3 mb-5">
      <button
        class="text-base p-2 rounded hover:bg-surface-hover text-ink min-h-[44px] min-w-[44px]"
        aria-label="返回課程清單"
        @click="router.push('/learn')"
      >←</button>
      <h1 class="font-display text-xl font-semibold flex-1 text-ink" tabindex="-1">{{ lesson.title }}</h1>
      <label class="flex items-center gap-1.5 text-sm text-ink-muted cursor-pointer select-none min-h-[44px]">
        <input
          type="checkbox"
          class="w-4 h-4 accent-[#8b6f5c]"
          :checked="ui.showCoordinates"
          @change="ui.toggleCoordinates"
        />
        座標
      </label>
      <span class="text-sm text-ink-faint tabular-nums">
        {{ stepIndex + 1 }} / {{ lesson.steps.length }}
      </span>
    </header>

    <div class="flex flex-col lg:flex-row gap-6">
      <!-- Board + annotation overlay -->
      <div class="relative w-fit mx-auto lg:mx-0">
        <ChessBoard
          :key="boardKey"
          ref="board"
          :fen="currentStep?.fen ?? ''"
          :player-color="playerColor"
          :disabled="boardDisabled"
          :coordinates="ui.showCoordinates"
          @move-made="handleMove"
        />

        <!-- Blue answer arrow / highlights -->
        <MoveAnnotationDisplay
          v-if="boardEl"
          :key="`anno-${boardKey}`"
          :annotations="annotations"
          :evaluation="null"
          :square-to-rect="squareToRect"
          :board-ref="boardEl"
          :board-size-px="boardSizePx"
          :shaft-scale="0.5"
        />

        <!-- Wrong-move square tint (no arrow — chess.com style) -->
        <svg
          v-if="wrongGeom"
          class="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
          aria-hidden="true"
        >
          <rect
            :x="wrongGeom.from.x" :y="wrongGeom.from.y"
            :width="wrongGeom.from.width" :height="wrongGeom.from.height"
            fill="#dc2626" opacity="0.18"
          />
          <rect
            :x="wrongGeom.to.x" :y="wrongGeom.to.y"
            :width="wrongGeom.to.width" :height="wrongGeom.to.height"
            fill="#dc2626" opacity="0.32"
          />
        </svg>

        <!-- Corner badges: ✗ on a wrong move, ✓ on the solved move -->
        <div
          v-if="wrongBadge"
          class="absolute z-10 pointer-events-none rounded-full bg-red-500 text-white flex items-center justify-center font-bold shadow"
          :style="{ left: `${wrongBadge.left}px`, top: `${wrongBadge.top}px`, width: `${wrongBadge.size}px`, height: `${wrongBadge.size}px`, fontSize: `${wrongBadge.size * 0.6}px` }"
          aria-hidden="true"
        >✕</div>
        <div
          v-if="correctBadge"
          class="absolute z-10 pointer-events-none rounded-full bg-green-500 text-white flex items-center justify-center font-bold shadow"
          :style="{ left: `${correctBadge.left}px`, top: `${correctBadge.top}px`, width: `${correctBadge.size}px`, height: `${correctBadge.size}px`, fontSize: `${correctBadge.size * 0.6}px` }"
          aria-hidden="true"
        >✓</div>
      </div>

      <!-- Coach panel -->
      <div class="flex-1 min-w-0 card p-5 lg:p-6 self-start">
        <div class="flex items-center gap-2.5 mb-4">
          <span
            class="w-8 h-8 rounded-full bg-primary text-primary-fg font-display flex items-center justify-center text-base leading-none shrink-0"
            aria-hidden="true"
          >貝</span>
          <span class="text-sm font-medium text-ink">教練 · {{ COACH.name }}</span>
        </div>

        <p
          v-if="stepIndex === 0 && lesson.scenario"
          class="font-display text-base text-ink-muted italic mb-4 border-l-2 border-primary/40 pl-4 leading-relaxed"
        >{{ lesson.scenario }}</p>

        <p class="text-base text-ink leading-loose mb-5">{{ currentStep?.text }}</p>

        <!-- Wrong move: red feedback + retry (chess.com-style) -->
        <div
          v-if="wrongMove"
          class="mb-5 p-4 rounded-card bg-danger-light border border-danger/40"
        >
          <p class="text-sm font-semibold text-danger mb-1">這一步不是答案</p>
          <p v-if="currentStep?.hint" class="text-sm text-ink leading-relaxed">{{ currentStep.hint }}</p>
          <div class="mt-3 flex items-center gap-2">
            <button class="btn btn-danger text-sm" @click="retry">↻ 重試</button>
            <button
              v-if="!answerRevealed"
              class="btn btn-secondary text-sm"
              @click="answerRevealed = true"
            >揭曉答案</button>
          </div>
          <p v-if="answerRevealed" class="mt-2 text-sm text-hint">
            答案箭頭已畫在棋盤上——點「重試」後照著走。
          </p>
        </div>

        <!-- Interactive prompt + progressive hint (lightbulb), when not in a wrong state -->
        <div v-else-if="isInteractive && !solved" class="mb-5">
          <p class="text-sm text-ink-muted mb-3">輪到你了——在棋盤上走一步。</p>

          <button
            class="btn text-sm min-h-[44px] border border-hint-ring bg-hint-light text-hint-fg hover:bg-hint-ring"
            :class="{ 'lightbulb-glow': lightbulbGlowing }"
            @click="hintShown = true"
          >
            <span aria-hidden="true">💡</span> 提示
          </button>

          <div v-if="hintShown" class="mt-3 p-4 rounded-card bg-hint-light border border-hint-ring/60">
            <p class="text-sm text-hint-fg leading-relaxed">{{ currentStep?.hint }}</p>
            <button
              v-if="!answerRevealed"
              class="btn text-sm mt-3 bg-hint-ring hover:bg-hint text-hint-fg"
              @click="answerRevealed = true"
            >揭曉答案</button>
            <p v-else class="mt-3 text-sm text-hint">答案已畫在棋盤上——照著箭頭走走看。</p>
          </div>
        </div>

        <!-- Success -->
        <p
          v-if="solved && currentStep?.successText"
          class="mb-5 p-4 rounded-card bg-success-light border border-success/40 text-sm text-success leading-relaxed"
        >{{ currentStep.successText }}</p>

        <!-- Navigation -->
        <div class="flex items-center gap-2 pt-2">
          <button
            v-if="stepIndex > 0"
            class="btn btn-secondary text-sm"
            @click="prev"
          >← 上一步</button>
          <button
            class="btn btn-primary text-sm"
            :disabled="!canAdvance"
            @click="next"
          >{{ isLastStep ? '完成課程' : '下一步 →' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes lightbulb-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(201, 135, 46, 0.0); }
  50%      { box-shadow: 0 0 0 4px rgba(201, 135, 46, 0.45); }
}
.lightbulb-glow {
  animation: lightbulb-glow 1.1s ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .lightbulb-glow {
    animation: none;
    box-shadow: 0 0 0 3px rgba(201, 135, 46, 0.5);
  }
}
</style>
