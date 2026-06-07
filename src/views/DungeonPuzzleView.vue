<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Chess } from 'chess.js'
import { ArrowLeft, ArrowRight, Lightbulb, Check, BookOpen } from 'lucide-vue-next'
import ChessBoard from '@/components/chess-board.vue'
import MoveAnnotationDisplay from '@/components/move-annotation-display.vue'
import { getPuzzleById, puzzles } from '@/data/puzzles'
import { reviewLinkForMotif } from '@/data/concepts'
import { useDungeonProgressStore } from '@/stores/dungeon-progress'
import { useConceptProgressStore } from '@/stores/concept-progress'
import { useDungeonPuzzle } from '@/modules/dungeon/use-dungeon-puzzle'
import { useReducedMotion } from '@/composables/use-reduced-motion'
import {
  OPPONENT_REPLY_DELAY_MS,
  WRONG_TINT_DURATION_MS,
  HINT_ARROW_ON_SECOND_PRESS,
} from '@/config/dungeon-tuning'
import type { MoveMadePayload } from '@/composables/use-chess-board'
import type { Annotation } from '@/modules/move-annotation/annotation-types'
import type { Rect } from '@/utils/board-geometry'

const route = useRoute()
const router = useRouter()
const progress = useDungeonProgressStore()
const conceptProgress = useConceptProgressStore()
const { prefersReducedMotion } = useReducedMotion()

const puzzle = getPuzzleById(route.params.puzzleId as string)

// D1 side-door (Learning Loop #20): when arriving from a lesson's Bridge-1 CTA (`?from=lesson`),
// this puzzle opens in PRACTICE mode — it bypasses the dungeon's linear `nodeState` lock, and a
// solve is recorded ONLY in the concept-progress store (never the dungeon `solved` set). The
// dungeon's linear map is untouched.
const isPractice = route.query.from === 'lesson'

// Guard: unknown puzzle → back to the map. A still-locked puzzle is allowed ONLY in practice mode.
if (!puzzle || (progress.nodeState(puzzle) === 'locked' && !isPractice)) {
  router.replace('/dungeon')
}

// Local hint-used flag for the solved panel — in practice mode we must NOT write the dungeon
// store's `hinted` set, so the panel reads this instead.
const hintUsed = ref(false)

const playerColor = computed<'white' | 'black'>(() =>
  puzzle && new Chess(puzzle.fen).turn() === 'b' ? 'black' : 'white',
)

const pz = puzzle ? useDungeonPuzzle(puzzle) : null

// Wrong-move + hint UI state.
const wrongActive = ref(false)
const hintStage = ref<0 | 1 | 2>(0)
const boardNonce = ref(0)

const boardDisabled = computed(
  () => !pz || pz.phase.value === 'solved' || pz.awaitingOpponent.value || wrongActive.value,
)
const boardKey = computed(() => `${puzzle?.id}:${boardNonce.value}`)

// ── board geometry plumbing (for the hint arrow), mirrors LessonView ──
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
onMounted(async () => { await nextTick(); geomTick.value++ })
watch(boardKey, async () => { await nextTick(); geomTick.value++ })

// Hint arrow (stage-2 reveal) drawn over the board.
const annotations = computed<Annotation[]>(() => {
  if (!pz || hintStage.value < 2 || !pz.hintArrow.value) return []
  const a = pz.hintArrow.value
  return [{ kind: 'arrow', role: 'bestMove', from: a.orig, to: a.dest }]
})

const positionLabel = computed(() => {
  if (!puzzle || !pz) return ''
  const move = Math.floor(pz.plyIndex.value / 2) + 1
  return puzzle.solution.length > 1 ? `第 ${move} 步` : ''
})

function handleMove(payload: MoveMadePayload): void {
  if (!pz) return
  const result = pz.submitMove({ from: payload.from, to: payload.to, promotion: payload.promotion })

  if (result.kind === 'wrong') {
    wrongActive.value = true
    setTimeout(() => {
      wrongActive.value = false
      pz.wrong.value = false
      boardNonce.value++ // remount → snap the piece back to the current position
    }, prefersReducedMotion.value ? 0 : WRONG_TINT_DURATION_MS)
    return
  }

  if (result.kind === 'correct-advance') {
    hintStage.value = 0
    setTimeout(() => pz.commitOpponentReply(), prefersReducedMotion.value ? 0 : OPPONENT_REPLY_DELAY_MS)
    return
  }

  // correct-solved — practice mode records to concept-progress only (D1 zero-mutation invariant);
  // normal dungeon play advances the linear progress as before.
  if (puzzle) {
    if (isPractice) conceptProgress.markPracticed(puzzle.id)
    else progress.markSolved(puzzle.id)
  }
}

function showHint(): void {
  if (!pz) return
  if (hintStage.value === 0) {
    hintStage.value = 1
    hintUsed.value = true
    // Practice mode must not touch the dungeon store; only normal play records the hint flag.
    if (puzzle && !isPractice) progress.markHintUsed(puzzle.id) // non-penalising (no streak); flag only
  } else if (hintStage.value === 1 && HINT_ARROW_ON_SECOND_PRESS) {
    hintStage.value = 2
  }
}

// Bridge 2 (Learning Loop #20, GDD §3.3): a calm, ALWAYS-visible back-link to the lesson that
// teaches this puzzle's concept — never tied to wrong-attempt count (no implicit failure counter).
const reviewLink = computed(() => (puzzle ? reviewLinkForMotif(puzzle.motif) : null))

function reviewConcept(): void {
  if (reviewLink.value) router.push(`/learn/${reviewLink.value.lessonId}`)
}

const nextPuzzle = computed(() => {
  if (!puzzle) return null
  return puzzles.find((p) => p.order === puzzle.order + 1) ?? null
})

function goNext(): void {
  // Practice mode is a side trip from a lesson — return to the lessons, not the dungeon's
  // linear "next puzzle" flow.
  if (isPractice) {
    router.push('/learn')
    return
  }
  if (nextPuzzle.value) router.push(`/dungeon/${nextPuzzle.value.id}`)
  else router.push('/dungeon')
}
</script>

<template>
  <div v-if="puzzle && pz" class="min-h-dvh bg-surface-dungeon pb-[calc(2rem+env(safe-area-inset-bottom))] lg:pb-8">
    <!-- Header: back + position + calm progress -->
    <header class="flex items-center gap-2.5 border-b border-white/[0.06] bg-surface-dungeon-2 px-4 py-2.5">
      <button
        type="button"
        class="flex items-center gap-1 px-1 py-1 font-sans text-xs font-semibold text-gold/70 active:scale-95"
        @click="router.push(isPractice ? '/learn' : '/dungeon')"
      >
        <ArrowLeft :size="16" :stroke-width="1.8" /> {{ isPractice ? '課程' : '地圖' }}
      </button>
      <div class="flex-1 text-center font-num text-[11px] text-ink-on-deep-dim">
        Level {{ puzzle.level }} <span v-if="positionLabel">· {{ positionLabel }}</span>
      </div>
      <div class="rounded-full bg-white/[0.06] px-2.5 py-1 font-num text-xs font-bold text-ink-on-deep-dim">
        {{ progress.solvedCount }}/{{ progress.totalCount }}
      </div>
    </header>

    <!-- Board: cap to a share of viewport height (board is square) so the prompt + hint stay on the
         first screen instead of being pushed below an edge-to-edge board. -->
    <div class="relative mx-auto w-full max-w-[min(420px,56dvh)]">
      <ChessBoard
        :key="boardKey"
        ref="board"
        :fen="pz.fen.value"
        :player-color="playerColor"
        :disabled="boardDisabled"
        :coordinates="true"
        @move-made="handleMove"
      />
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
    </div>

    <!-- Prompt + actions -->
    <div class="mx-auto max-w-[420px] px-4 pt-3">
      <div class="rounded-[14px] border border-white/[0.06] bg-white/[0.03] p-4">
        <p class="font-sans text-[10px] tracking-[0.08em] text-ink-on-deep-dim">謎題 · {{ puzzle.title }}</p>
        <p class="mt-1 font-display text-base font-bold text-ink-on-deep">{{ puzzle.prompt }}</p>

        <!-- Wrong feedback (non-punishing) -->
        <p v-if="wrongActive" class="mt-3 font-sans text-sm text-gold/80">再想想——這一步不是答案。</p>

        <!-- Hint text (stage 1+) -->
        <p v-else-if="hintStage >= 1" class="mt-3 rounded-lg bg-gold/10 px-3 py-2 font-sans text-sm leading-relaxed text-[#F5D070] ring-1 ring-gold/20">
          {{ puzzle.hint }}
          <span v-if="hintStage >= 2" class="mt-1 block text-[#F5D070]/70">答案箭頭已畫在棋盤上。</span>
        </p>

        <div class="mt-3 h-px bg-white/[0.08]" />

        <!-- Hint button -->
        <button
          type="button"
          :disabled="pz.phase.value === 'solved'"
          class="mt-3 flex w-full items-center justify-center gap-2 rounded-[10px] border border-gold/30 bg-gradient-to-b from-gold/[0.18] to-[#a06400]/[0.14] py-2.5 font-sans text-sm font-bold text-[#F5D070] active:scale-[0.98] disabled:opacity-40"
          @click="showHint"
        >
          <Lightbulb :size="16" :stroke-width="1.8" />
          {{ hintStage === 0 ? '提示' : hintStage === 1 ? '看答案箭頭' : '已給提示' }}
        </button>

        <!-- Bridge 2: calm, always-visible back-link to the concept's lesson (Learning Loop #20) -->
        <button
          v-if="reviewLink"
          type="button"
          data-testid="concept-review-link"
          class="mt-2.5 flex min-h-[44px] w-full items-center justify-center gap-1.5 font-sans text-[13px] font-medium text-ink-on-deep-dim/80 active:scale-[0.98]"
          @click="reviewConcept"
        >
          <BookOpen :size="15" :stroke-width="1.8" /> 複習「{{ reviewLink.label }}」這個概念
        </button>
      </div>
    </div>

    <!-- Solved overlay -->
    <div
      v-if="pz.phase.value === 'solved'"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6"
    >
      <div class="flex w-full max-w-[320px] flex-col items-center gap-4 rounded-[20px] border border-white/[0.14] bg-[linear-gradient(160deg,#1E4D3E,#142E26)] p-7 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
        <div class="flex h-14 w-14 items-center justify-center rounded-full bg-success/25 ring-2 ring-success">
          <Check :size="28" :stroke-width="2.5" class="text-success" />
        </div>
        <div class="text-center">
          <p class="font-display text-xl font-bold text-ink-on-deep">
            {{ (isPractice ? hintUsed : progress.wasHintUsed(puzzle.id)) ? '看了提示，完成' : '正確！' }}
          </p>
          <p class="mt-2 font-lesson text-sm leading-relaxed text-ink-on-deep-dim">{{ puzzle.successText }}</p>
        </div>
        <button
          type="button"
          class="flex min-w-[150px] items-center justify-center gap-2 rounded-full bg-gradient-to-b from-gold-light to-gold px-5 py-2.5 font-sans text-sm font-bold text-gold-ink shadow-[0_2px_12px_rgba(248,181,0,0.4)] active:scale-95"
          @click="goNext"
        >
          {{ isPractice ? '回課程' : nextPuzzle ? '下一題' : '回到地圖' }} <ArrowRight :size="16" />
        </button>
      </div>
    </div>
  </div>
</template>
