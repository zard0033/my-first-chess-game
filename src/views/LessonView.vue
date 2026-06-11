<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight, RotateCw, Lightbulb, Check, X } from 'lucide-vue-next'
import ChessBoard from '@/components/chess-board.vue'
import MoveAnnotationDisplay from '@/components/move-annotation-display.vue'
import { Button } from '@/components/ui/button'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { getLessonById } from '@/data/lessons'
import { COACH } from '@/types/lesson'
import type { LessonStep } from '@/types/lesson'
import type { Annotation } from '@/modules/move-annotation/annotation-types'
import type { MoveMadePayload } from '@/composables/use-chess-board'
import type { Rect } from '@/utils/board-geometry'
import { useBoardFit } from '@/composables/use-board-fit'
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

// Concept-tab side-door (Learning Loop #20): `?from=concept` lets a non-beginner open a tactic's
// lesson out of linear order. Mirrors the dungeon practice side-door; return nav routes back to 概念.
const fromConcept = route.query.from === 'concept'
const backTo = fromConcept ? '/learn/concepts' : '/learn'

// Guard: unknown or still-locked lesson → back to the catalog. The side-door bypasses the lock.
if (!lesson || (!progress.isUnlocked(lesson) && !fromConcept)) {
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

watch(stepIndex, async () => {
  solved.value = false
  wrongMove.value = null
  everWrong.value = false
  hintShown.value = false
  answerRevealed.value = false
  // Force the board onto the new step's FEN even when it's an identical string to the previous
  // step (Vue won't re-fire watch(props.fen); the player's last move would otherwise stay on the
  // board — 上一步沒把棋子移回修正).
  await nextTick()
  board.value?.reapplyFen()
})

// Board key is the lesson id (NOT the step) so stepping never remounts the board — chessground
// syncs each step's FEN via setPosition (smooth), instead of a full rebuild that replays the
// piece entry animation (上一步/下一步換步棋盤 dash 修正).
const boardKey = computed(() => lesson?.id ?? '')
const boardDisabled = computed(() => !isInteractive.value || solved.value || !!wrongMove.value)

const board = ref<{ boardRef: HTMLElement | null; squareToRect: (s: string) => Rect | null; resetPosition: () => void; reapplyFen: () => void } | null>(null)
const boardFit = ref<HTMLElement | null>(null)
useBoardFit(boardFit)
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
  // Once solved, drop the answer arrow — the player already made the move (走子後箭頭消失).
  const showArrows = !isInteractive.value || (answerRevealed.value && !solved.value)
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
  board.value?.resetPosition() // snap the wrong piece home without remounting (no entry-animation replay)
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
    // Side-door entry lights 已學 via the separate signal only — it must NOT advance linear progress
    // (no markComplete → no isUnlocked leak; GDD §3.2 D1 pattern).
    if (lesson) {
      if (fromConcept) progress.markSideLearned(lesson.id)
      else progress.markComplete(lesson.id)
    }
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
  <!-- 課程內頁：整頁錨進 deep-jade，棋盤浮在 jade 上聚焦；課文收進底部暖色教練氣泡（IG 對話框語彙）。
       固定視口高 flex column：header / 棋盤(shrink-0 不被擠) / 氣泡(flex-1 自捲、捲軸隱藏) / CTA(shrink-0 固定底)。 -->
  <div v-if="lesson" class="flex h-dvh flex-col bg-surface-deep text-ink-on-deep">

    <!-- Header: back + title + step counter -->
    <header class="flex shrink-0 items-center gap-3 px-4 pb-2 pt-[calc(0.625rem+env(safe-area-inset-top))]">
      <button
        type="button"
        :aria-label="fromConcept ? '返回概念' : '返回課程清單'"
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.08] text-ink-on-deep transition-colors hover:bg-white/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold active:scale-95"
        @click="router.push(backTo)"
      ><ArrowLeft :size="20" :stroke-width="1.8" /></button>
      <h1 class="flex-1 truncate font-display text-lg font-bold text-ink-on-deep" tabindex="-1">{{ lesson.title }}</h1>
    </header>

    <!-- Side-door context note: quiet, neutral — never judges the out-of-order entry -->
    <p
      v-if="fromConcept"
      data-testid="lesson-from-concept-note"
      class="shrink-0 px-4 pb-1 font-sans text-xs text-ink-on-deep-dim"
    >你從概念地圖提前學這個戰術</p>

    <!-- Content: board (fixed) on mobile stacked, side-by-side on desktop -->
    <div class="flex min-h-0 flex-1 flex-col lg:mx-auto lg:w-full lg:max-w-5xl lg:flex-row lg:items-start lg:gap-6 lg:px-4 lg:py-2">

      <!-- Board floats on jade; capped so the coach bubble keeps room on the first screen.
           Padding/size live on the OUTER box; the inner `relative` box hugs the board so the
           annotation overlay (absolute inset-0) aligns with the squares — padding on the positioned
           ancestor would shift every arrow sideways (課程答案箭頭偏移修正). -->
      <div class="mx-auto w-full shrink-0 px-4 pt-1 lg:mx-0 lg:max-w-none lg:flex-1 lg:self-start lg:px-0 lg:pt-1">
        <!-- wooden tray：棋盤木框（與試煉／對局同款木盤） -->
        <div class="rounded-[12px] bg-[linear-gradient(160deg,#6f4b30,#523722)] p-3 ring-1 ring-black/30 shadow-[0_12px_32px_rgba(10,30,24,0.45),inset_0_1px_0_rgba(255,228,194,0.20),inset_0_-2px_6px_rgba(0,0,0,0.38)]">
        <div ref="boardFit" class="relative board-fit">
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
        </div>
      </div>

      <!-- Coach bubble:暖色對話框浮在 jade；內容過長時自己捲動（捲軸隱藏），棋盤與 CTA 都不被擠。 -->
      <div class="coach-scroll flex min-h-0 flex-1 items-start gap-2.5 overflow-y-auto px-4 pb-3 pt-1 lg:w-[26rem] lg:flex-none lg:px-0 lg:pt-0">
        <span
          class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-display text-base leading-none text-primary-fg"
          aria-hidden="true"
        >貝</span>
        <div class="min-w-0 flex-1 rounded-[6px_18px_18px_18px] bg-surface-card p-4 shadow-[0_6px_20px_rgba(8,24,18,0.28)]">
          <div class="mb-2.5 flex items-center justify-between gap-2 font-sans text-xs font-medium text-ink-muted">
            <span>教練 · {{ COACH.name }}</span>
            <span class="shrink-0 font-num text-ink-faint">{{ stepIndex + 1 }} / {{ lesson.steps.length }}</span>
          </div>

          <!-- Scenario (step 0 only) -->
          <p
            v-if="stepIndex === 0 && lesson.scenario"
            class="mb-3 border-l-2 border-primary/40 pl-3 font-lesson text-[15px] leading-relaxed text-ink-muted"
          >{{ lesson.scenario }}</p>

          <!-- Step narration -->
          <p class="font-sans text-base leading-loose text-ink">{{ currentStep?.text }}</p>

          <!-- Wrong-move feedback (no buttons — they're in the sticky bar) -->
          <Alert v-if="wrongMove" variant="danger" class="mt-3">
            <AlertTitle class="text-danger">這一步不是答案</AlertTitle>
            <AlertDescription v-if="currentStep?.hint" class="text-ink">{{ currentStep.hint }}</AlertDescription>
            <p v-if="answerRevealed" class="mt-2 text-sm text-hint">
              答案箭頭已畫在棋盤上——點「重試」後照著走。
            </p>
          </Alert>

          <!-- Hint text (no reveal button — in sticky bar) -->
          <div v-else-if="isInteractive && !solved" class="mt-3">
            <p class="mb-2 font-sans text-sm text-ink-muted">輪到你了——在棋盤上走一步。</p>
            <Alert v-if="hintShown" variant="hint">
              <AlertDescription class="text-hint-fg">{{ currentStep?.hint }}</AlertDescription>
              <p v-if="answerRevealed" class="mt-2 text-sm text-hint">答案已畫在棋盤上——照著箭頭走走看。</p>
            </Alert>
          </div>

          <!-- Success -->
          <Alert v-if="solved && currentStep?.successText" variant="success" class="mt-3">
            <AlertDescription class="text-success">{{ currentStep.successText }}</AlertDescription>
          </Alert>

          <!-- Desktop-only inline action buttons (hidden on mobile — see sticky bar). Bubble is a fixed
               26rem on desktop — wide enough for all buttons on one row (prev/next grouped no-wrap). -->
          <div class="mt-4 hidden items-center gap-2 lg:flex">
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
            <!-- 提示按下後「替換」成揭曉答案（非並存），換步才還原 -->
            <Button
              v-if="isInteractive && !solved && !wrongMove && !hintShown"
              variant="outline"
              class="border-hint-ring bg-hint-light text-sm text-hint-fg hover:bg-hint-ring"
              :class="{ 'lightbulb-glow': lightbulbGlowing }"
              @click="hintShown = true"
            >
              <Lightbulb :size="15" :stroke-width="1.8" /> 提示
            </Button>
            <Button
              v-else-if="isInteractive && !solved && !wrongMove && hintShown && !answerRevealed"
              class="bg-hint-ring text-sm text-hint-fg hover:bg-hint"
              @click="answerRevealed = true"
            >揭曉答案</Button>
            <!-- prev/next 包成不換行的導航群組，永遠並排（桌機氣泡窄時 contextual 換行，但兩顆導航鈕不拆） -->
            <div class="ml-auto flex shrink-0 gap-2">
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
          </div>
        </div>
      </div>
    </div>

    <!-- CTA bar — mobile only. 固定底部、gradient 上緣讓氣泡內容滑到後面自然淡出（暗示可捲）。
         底部留白加大（safe-area + 1rem）避免 iPhone 圓角／home indicator 吃到按鈕。 -->
    <div class="flex shrink-0 items-center gap-2 bg-gradient-to-t from-surface-deep from-60% to-transparent px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-5 lg:hidden">
      <!-- 走錯：只留 揭曉答案 + 重試（重試靠右為主行動），不顯示上一步／下一步，專注修正當前步 -->
      <template v-if="wrongMove">
        <div class="flex-1" />
        <Button
          v-if="!answerRevealed"
          variant="secondary"
          class="text-sm"
          @click="answerRevealed = true"
        >揭曉答案</Button>
        <Button variant="danger" class="text-sm" @click="retry"><RotateCw :size="15" :stroke-width="1.8" /> 重試</Button>
      </template>

      <template v-else>
        <!-- Contextual: interactive hint state — 提示按下後「替換」成揭曉答案（非並存） -->
        <template v-if="isInteractive && !solved">
          <Button
            v-if="!hintShown"
            variant="outline"
            class="border-hint-ring bg-hint-light text-sm text-hint-fg hover:bg-hint-ring"
            :class="{ 'lightbulb-glow': lightbulbGlowing }"
            @click="hintShown = true"
          >
            <Lightbulb :size="15" :stroke-width="1.8" /> 提示
          </Button>
          <Button
            v-else-if="!answerRevealed"
            class="bg-hint-ring text-sm text-hint-fg hover:bg-hint"
            @click="answerRevealed = true"
          >揭曉答案</Button>
        </template>

        <div class="flex-1" />

        <!-- prev / next -->
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
      </template>
    </div>

    <!-- Bridge 1: lesson completion card (Learning Loop #20) -->
    <div
      v-if="completed"
      data-testid="lesson-completion-card"
      class="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(16,48,41,0.72)] px-6"
    >
      <div class="flex w-full max-w-[340px] flex-col items-center gap-5 rounded-[20px] border border-white/[0.14] bg-[linear-gradient(160deg,#163929,#0C2118)] p-7 shadow-[0_12px_40px_rgba(61,34,16,0.45)]">
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
          @click="router.push(backTo)"
        >{{ fromConcept ? '回概念地圖' : '回課程列表' }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* vue3-chessboard 的 .main-wrap 被釘死 700px（撐爆容器、桌機棋盤過大溢出）。強制它跟著外層寬度走，
   底下的 main-board(aspect)→cg-board 才會一起 follow 成正方（桌機棋盤過大修正）。 */
.board-fit :deep(.main-wrap) {
  width: 100% !important;
  max-width: 100% !important;
  height: auto !important;
}
/* Coach bubble scrolls when narration is long; hide the scrollbar — the gradient fade is the cue. */
.coach-scroll {
  scrollbar-width: none;
}
.coach-scroll::-webkit-scrollbar {
  display: none;
}
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
