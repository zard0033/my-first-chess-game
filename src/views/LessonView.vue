<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight, RotateCw, Lightbulb, Check, X } from 'lucide-vue-next'
import ChessBoard from '@/components/chess-board.vue'
import MoveAnnotationDisplay from '@/components/move-annotation-display.vue'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { getLessonById } from '@/data/lessons'
import { COACH } from '@/types/lesson'
import type { LessonStep } from '@/types/lesson'
import type { Annotation } from '@/modules/move-annotation/annotation-types'
import type { MoveMadePayload } from '@/composables/use-chess-board'
import type { Rect } from '@/utils/board-geometry'
import { useLessonProgressStore } from '@/stores/lesson-progress'
import { useDungeonProgressStore } from '@/stores/dungeon-progress'
import { useConceptProgressStore } from '@/stores/concept-progress'
import { puzzles } from '@/data/puzzles'
import { getConceptById } from '@/data/concepts'
import { candidates, practiceTarget } from '@/modules/learning-loop/recommend'
import { LESSON_TO_PUZZLE_COUNT } from '@/config/learning-loop-tuning'

const route = useRoute()
const router = useRouter()
const progress = useLessonProgressStore()
const dungeonProgress = useDungeonProgressStore()
const conceptProgress = useConceptProgressStore()

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
const wrongMove = ref<{ from: string; to: string } | null>(null)
const everWrong = ref(false)
const hintShown = ref(false)
const answerRevealed = ref(false)
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

const board = ref<{ boardRef: HTMLElement | null; squareToRect: (s: string) => Rect | null } | null>(null)
const geomTick = ref(0)
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

// Annotations: highlights always show; arrows only on narration steps or after answer revealed.
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

// Wrong-move square tint geometry.
const wrongGeom = computed(() => {
  void geomTick.value
  const wm = wrongMove.value
  if (!wm) return null
  const from = squareToRect(wm.from)
  const to = squareToRect(wm.to)
  return from && to ? { from, to } : null
})

function cornerBadge(square: string | undefined) {
  void geomTick.value
  if (!square) return null
  const r = squareToRect(square)
  if (!r) return null
  const size = Math.max(18, r.width * 0.42)
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
    wrongMove.value = { from: payload.from, to: payload.to }
    everWrong.value = true
  }
}

function retry(): void {
  wrongMove.value = null
  boardNonce.value++
}

const canAdvance = computed(() => !isInteractive.value || solved.value)
const lightbulbGlowing = computed(
  () => everWrong.value && !wrongMove.value && !solved.value && !hintShown.value,
)

// ── Bridge 1 (Learning Loop #20): lesson completion card + course→puzzle invitation ──
const completed = ref(false)

// A puzzle counts as practised whether cleared in the dungeon or from a prior lesson CTA.
function isPuzzleSolved(id: string): boolean {
  return dungeonProgress.isSolved(id) || conceptProgress.isPracticeSolved(id)
}

/**
 * One completion-card row per concept the lesson teaches (capped for readability). Concepts with
 * drill puzzles get a CTA into practice mode; concepts with none get a calm "即將加入" hint (EC-1).
 */
const completionConcepts = computed(() => {
  const ids = lesson?.concepts ?? []
  return ids.slice(0, LESSON_TO_PUZZLE_COUNT).map((id) => {
    const meta = getConceptById(id)
    const hasPuzzles = candidates(id, puzzles).length > 0
    const target = hasPuzzles ? practiceTarget(id, puzzles, isPuzzleSolved) : null
    return { id, label: meta?.label ?? id, hasPuzzles, targetId: target?.id ?? null }
  })
})

function practise(targetId: string): void {
  router.push(`/dungeon/${targetId}?from=lesson`)
}

function next(): void {
  if (isLastStep.value) {
    if (lesson) progress.markComplete(lesson.id)
    completed.value = true // show the completion card; Bridge-1 invitation lives here
    return
  }
  stepIndex.value++
}
function prev(): void {
  if (stepIndex.value > 0) stepIndex.value--
}
</script>

<template>
  <!-- Full-height flex column — no outer horizontal padding so the board can go edge-to-edge.
       fullBleed route (no global top/bottom nav): the sticky action bar sits at the very bottom. -->
  <div v-if="lesson" class="flex min-h-dvh flex-col">

    <!-- Header: back + title + step counter -->
    <header class="flex shrink-0 items-center gap-3 px-4 py-3">
      <Button
        variant="ghost"
        size="icon"
        aria-label="返回課程清單"
        @click="router.push('/learn')"
      ><ArrowLeft :size="20" :stroke-width="1.8" /></Button>
      <h1 class="flex-1 font-display text-xl font-semibold text-ink" tabindex="-1">{{ lesson.title }}</h1>
      <span class="shrink-0 text-sm tabular-nums text-ink-faint">
        {{ stepIndex + 1 }} / {{ lesson.steps.length }}
      </span>
    </header>

    <!-- Content area: board left, coach right on desktop -->
    <div class="flex flex-1 flex-col lg:mx-auto lg:w-full lg:max-w-5xl lg:flex-row lg:items-start lg:gap-6 lg:px-4 lg:py-4">

      <!-- Board: capped to a share of viewport height on mobile so the coach's narration stays
           above the fold (board is square, so an uncapped full-width board eats the whole screen);
           auto on desktop where board + coach sit side by side. -->
      <div class="relative mx-auto w-full max-w-[min(100%,54dvh)] lg:mx-0 lg:w-auto lg:max-w-none lg:shrink-0 lg:self-start">
        <ChessBoard
          :key="boardKey"
          ref="board"
          :fen="currentStep?.fen ?? ''"
          :player-color="playerColor"
          :disabled="boardDisabled"
          :coordinates="true"
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

        <!-- Wrong-move square tint (no arrow) -->
        <svg
          v-if="wrongGeom"
          class="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
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

        <!-- Corner badges: ✗ wrong / ✓ correct -->
        <div
          v-if="wrongBadge"
          class="pointer-events-none absolute z-10 flex items-center justify-center rounded-full bg-danger text-danger-fg shadow-button"
          :style="{ left: `${wrongBadge.left}px`, top: `${wrongBadge.top}px`, width: `${wrongBadge.size}px`, height: `${wrongBadge.size}px` }"
          aria-hidden="true"
        ><X :size="wrongBadge.size * 0.62" :stroke-width="3" /></div>
        <div
          v-if="correctBadge"
          class="pointer-events-none absolute z-10 flex items-center justify-center rounded-full bg-success text-success-fg shadow-button"
          :style="{ left: `${correctBadge.left}px`, top: `${correctBadge.top}px`, width: `${correctBadge.size}px`, height: `${correctBadge.size}px` }"
          aria-hidden="true"
        ><Check :size="correctBadge.size * 0.62" :stroke-width="3" /></div>
      </div>

      <!-- Coach panel: scrollable content (no action buttons here on mobile) -->
      <div class="flex-1 min-w-0 px-4 py-3 lg:px-0 lg:py-0">
        <Card class="p-4 lg:p-6">
          <!-- Coach avatar -->
          <div class="mb-3 flex items-center gap-2.5">
            <span
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-display text-base leading-none text-primary-fg"
              aria-hidden="true"
            >貝</span>
            <span class="text-sm font-medium text-ink">教練 · {{ COACH.name }}</span>
          </div>

          <!-- Scenario (step 0 only) -->
          <p
            v-if="stepIndex === 0 && lesson.scenario"
            class="mb-4 border-l-2 border-primary/40 pl-4 font-display text-base leading-relaxed text-ink-muted"
          >{{ lesson.scenario }}</p>

          <!-- Step narration -->
          <p class="mb-4 font-lesson text-base leading-loose text-ink">{{ currentStep?.text }}</p>

          <!-- Wrong-move feedback (no buttons — they're in the sticky bar) -->
          <Alert v-if="wrongMove" variant="danger" class="mb-4">
            <AlertTitle class="text-danger">這一步不是答案</AlertTitle>
            <AlertDescription v-if="currentStep?.hint" class="text-ink">{{ currentStep.hint }}</AlertDescription>
            <p v-if="answerRevealed" class="mt-2 text-sm text-hint">
              答案箭頭已畫在棋盤上——點「重試」後照著走。
            </p>
          </Alert>

          <!-- Hint text (no reveal button — in sticky bar) -->
          <div v-else-if="isInteractive && !solved">
            <p class="mb-3 text-sm text-ink-muted">輪到你了——在棋盤上走一步。</p>
            <Alert v-if="hintShown" variant="hint">
              <AlertDescription class="text-hint-fg">{{ currentStep?.hint }}</AlertDescription>
              <p v-if="answerRevealed" class="mt-2 text-sm text-hint">答案已畫在棋盤上——照著箭頭走走看。</p>
            </Alert>
          </div>

          <!-- Success -->
          <Alert v-if="solved && currentStep?.successText" variant="success" class="mb-4">
            <AlertDescription class="text-success">{{ currentStep.successText }}</AlertDescription>
          </Alert>

          <!-- Desktop-only inline action buttons (hidden on mobile — see sticky bar) -->
          <div class="hidden items-center gap-2 pt-2 lg:flex">
            <Button
              v-if="wrongMove"
              variant="danger"
              class="text-sm"
              @click="retry"
            ><RotateCw :size="15" :stroke-width="1.8" /> 重試</Button>
            <Button
              v-if="wrongMove && !answerRevealed"
              variant="secondary"
              class="text-sm"
              @click="answerRevealed = true"
            >揭曉答案</Button>
            <Button
              v-if="isInteractive && !solved && !wrongMove"
              variant="outline"
              class="border-hint-ring bg-hint-light text-sm text-hint-fg hover:bg-hint-ring"
              :class="{ 'lightbulb-glow': lightbulbGlowing }"
              @click="hintShown = true"
            >
              <Lightbulb :size="15" :stroke-width="1.8" /> 提示
            </Button>
            <Button
              v-if="hintShown && !answerRevealed && !wrongMove"
              class="bg-hint-ring text-sm text-hint-fg hover:bg-hint"
              @click="answerRevealed = true"
            >揭曉答案</Button>
            <div class="flex-1" />
            <Button
              v-if="stepIndex > 0"
              variant="secondary"
              class="text-sm"
              @click="prev"
            ><ArrowLeft :size="15" :stroke-width="1.8" /> 上一步</Button>
            <Button
              class="text-sm"
              :variant="isLastStep ? 'gold' : 'default'"
              :disabled="!canAdvance"
              @click="next"
            >
              <template v-if="isLastStep"><Check :size="16" :stroke-width="1.8" /> 完成課程</template>
              <template v-else>下一步 <ArrowRight :size="16" :stroke-width="1.8" /></template>
            </Button>
          </div>
        </Card>
      </div>
    </div>

    <!-- Sticky bottom action bar — mobile only. fullBleed route: no tab nav below, so it sits at
         the very bottom (+ iOS safe-area inset). -->
    <div class="sticky bottom-0 z-20 flex shrink-0 items-center gap-2 border-t border-line bg-surface-base px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden">
      <!-- Contextual: wrong-move state -->
      <template v-if="wrongMove">
        <Button variant="danger" class="text-sm" @click="retry"><RotateCw :size="15" :stroke-width="1.8" /> 重試</Button>
        <Button
          v-if="!answerRevealed"
          variant="secondary"
          class="text-sm"
          @click="answerRevealed = true"
        >揭曉答案</Button>
      </template>

      <!-- Contextual: interactive hint state -->
      <template v-else-if="isInteractive && !solved">
        <Button
          variant="outline"
          class="border-hint-ring bg-hint-light text-sm text-hint-fg hover:bg-hint-ring"
          :class="{ 'lightbulb-glow': lightbulbGlowing }"
          @click="hintShown = true"
        >
          <Lightbulb :size="15" :stroke-width="1.8" /> 提示
        </Button>
        <Button
          v-if="hintShown && !answerRevealed"
          class="bg-hint-ring text-sm text-hint-fg hover:bg-hint"
          @click="answerRevealed = true"
        >揭曉答案</Button>
      </template>

      <div class="flex-1" />

      <!-- Always: prev / next -->
      <Button
        v-if="stepIndex > 0"
        variant="secondary"
        class="text-sm"
        @click="prev"
      ><ArrowLeft :size="15" :stroke-width="1.8" /> 上一步</Button>
      <Button
        class="text-sm"
        :variant="isLastStep ? 'gold' : 'default'"
        :disabled="!canAdvance"
        @click="next"
      >
        <template v-if="isLastStep"><Check :size="16" :stroke-width="1.8" /> 完成課程</template>
        <template v-else>下一步 <ArrowRight :size="16" :stroke-width="1.8" /></template>
      </Button>
    </div>

    <!-- Bridge 1: lesson completion card (Learning Loop #20) -->
    <div
      v-if="completed"
      data-testid="lesson-completion-card"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6"
    >
      <div class="flex w-full max-w-[340px] flex-col items-center gap-5 rounded-[20px] border border-white/[0.14] bg-[linear-gradient(160deg,#1E4D3E,#142E26)] p-7 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
        <div class="flex h-14 w-14 items-center justify-center rounded-full bg-success/25 ring-2 ring-success">
          <Check :size="28" :stroke-width="2.5" class="text-success" />
        </div>
        <div class="text-center">
          <p class="font-display text-xl font-bold text-ink-on-deep">這一課完成了</p>
          <p class="mt-2 font-lesson text-sm leading-relaxed text-ink-on-deep-dim">{{ lesson?.summary }}</p>
        </div>

        <!-- Per-concept Bridge-1 invitation / hint -->
        <div v-if="completionConcepts.length" class="flex w-full flex-col gap-2">
          <template v-for="c in completionConcepts" :key="c.id">
            <button
              v-if="c.hasPuzzles && c.targetId"
              type="button"
              data-testid="lesson-practice-cta"
              class="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-gold-light to-gold px-5 py-3 font-sans text-sm font-bold text-gold-ink shadow-[0_2px_12px_rgba(248,181,0,0.4)] active:scale-95"
              @click="practise(c.targetId)"
            >
              想趁熱練幾題「{{ c.label }}」嗎？ <ArrowRight :size="16" />
            </button>
            <p
              v-else
              data-testid="lesson-practice-hint"
              class="w-full rounded-[10px] bg-white/[0.05] px-4 py-3 text-center font-sans text-sm text-ink-on-deep-dim"
            >「{{ c.label }}」的試煉即將加入</p>
          </template>
        </div>

        <button
          type="button"
          data-testid="lesson-completion-return"
          class="font-sans text-sm font-semibold text-ink-on-deep-dim/80 active:scale-95"
          @click="router.push('/learn')"
        >回課程列表</button>
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
