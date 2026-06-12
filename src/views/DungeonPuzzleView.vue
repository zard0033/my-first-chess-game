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
import { useBoardFit } from '@/composables/use-board-fit'
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

const boardDisabled = computed(
  () => !pz || pz.phase.value === 'solved' || pz.awaitingOpponent.value || wrongActive.value,
)
const boardKey = computed(() => puzzle?.id ?? '')

// ── board geometry plumbing (for the hint arrow), mirrors LessonView ──
const board = ref<{ boardRef: HTMLElement | null; squareToRect: (s: string) => Rect | null; resetPosition: () => void } | null>(null)
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

// Turn indicator (lichess/chess.com style): tells the player which side they move, so a bare
// prompt like「有子可吃」isn't ambiguous about who acts. Derived from the FEN — no data change.
const turnLabel = computed(() => (playerColor.value === 'white' ? '白方' : '黑方'))

const hintLabel = computed(() =>
  hintStage.value === 0 ? '提示' : hintStage.value === 1 ? '看答案箭頭' : '已給提示',
)

// 棋譜紀錄框：累積每次嘗試的白話對錯（Cubic 11 呈現）。第一次互動才出現。
const PIECE_ZH: Record<string, string> = { p: '兵', n: '騎士', b: '主教', r: '城堡', q: '后', k: '國王' }
const moveLog = ref<{ ok: boolean; text: string }[]>([])
function describeMove(piece: string, captured?: string): string {
  const p = PIECE_ZH[piece] ?? '棋子'
  return captured ? `${p}吃掉${PIECE_ZH[captured] ?? '一子'}` : `${p}就位`
}

function handleMove(payload: MoveMadePayload): void {
  if (!pz) return
  const result = pz.submitMove({ from: payload.from, to: payload.to, promotion: payload.promotion })

  if (result.kind === 'wrong') {
    wrongActive.value = true
    moveLog.value.push({ ok: false, text: '這步不是答案' }) // 紀錄留著（不再一閃即逝）
    // Snap the wrong piece home AFTER the move animation settles — doing it immediately lets
    // chessground's in-flight animation overwrite the reset (the piece stayed put). 600ms 後還原。
    setTimeout(() => {
      board.value?.resetPosition()
      wrongActive.value = false
      pz.wrong.value = false
    }, prefersReducedMotion.value ? 0 : WRONG_TINT_DURATION_MS)
    return
  }

  if (result.kind === 'correct-advance') {
    moveLog.value.push({ ok: true, text: describeMove(result.piece, result.captured) })
    hintStage.value = 0
    setTimeout(() => pz.commitOpponentReply(), prefersReducedMotion.value ? 0 : OPPONENT_REPLY_DELAY_MS)
    return
  }

  // correct-solved — practice mode records to concept-progress only (D1 zero-mutation invariant);
  // normal dungeon play advances the linear progress as before.
  moveLog.value.push({ ok: true, text: describeMove(result.piece, result.captured) })
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
    <!-- Top bar: back + calm progress (進度淡化，不搶戲) -->
    <div class="flex items-center justify-between px-4 pt-[calc(0.75rem+env(safe-area-inset-top))]">
      <button
        type="button"
        class="flex min-h-[36px] items-center gap-1 px-1 font-sans text-xs font-semibold text-gold/70 active:scale-95"
        @click="router.push(isPractice ? '/learn' : '/dungeon')"
      >
        <ArrowLeft :size="16" :stroke-width="1.8" /> {{ isPractice ? '課程' : '地圖' }}
      </button>
      <span class="font-num text-[11px] text-ink-on-deep-dim/65">{{ progress.solvedCount }}/{{ progress.totalCount }}</span>
    </div>

    <!-- 關卡銘牌：道場匾額 —「第 N 關」+ 金色 motif kicker + 細金分隔線 -->
    <div class="px-6 pb-3 pt-1 text-center">
      <h1 class="font-display text-[22px] font-bold tracking-[0.06em] text-ink-on-deep" tabindex="-1">
        第 {{ puzzle.order }} 關
      </h1>
      <p class="mt-1 font-sans text-[11px] font-medium tracking-[0.18em] text-gold/85">{{ puzzle.title }}</p>
      <div class="mx-auto mt-2.5 h-px w-12 bg-[linear-gradient(90deg,transparent,#F8B500,transparent)] opacity-60" />
    </div>

    <!-- Board in a wooden tray (複用對局木盤語彙)，放寬填滿畫面。木框／尺寸在外層；內層 `relative`
         緊貼棋盤，讓提示箭頭疊層對齊（padding 在 positioned 祖先會整排偏移）。 -->
    <div class="mx-auto w-full max-w-[min(96vw,30rem)]">
      <div class="rounded-[12px] bg-[linear-gradient(160deg,#6f4b30,#523722)] p-3 ring-1 ring-black/30 shadow-[0_12px_32px_rgba(10,30,24,0.45),inset_0_1px_0_rgba(255,228,194,0.20),inset_0_-2px_6px_rgba(0,0,0,0.38)]">
        <div ref="boardFit" class="relative board-fit">
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
      </div>
    </div>

    <!-- 石碑題卡：解題態＝turn＋目標＋提示／複習；達成態＝inline（成就＋successText＋回地圖／下一題，
         取代彈窗，單步多步皆同）。棋譜紀錄框累積每次嘗試的白話對錯，兩態共用。 -->
    <div class="mx-auto max-w-[420px] px-4 pt-4">
      <div class="rounded-[14px] border border-gold/25 bg-[linear-gradient(170deg,#18443A,#0C2118)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_24px_rgba(0,0,0,0.35)]">

        <!-- ===== 達成態（inline，正解後對手不再動）===== -->
        <template v-if="pz.phase.value === 'solved'">
          <div class="mb-2 flex items-center gap-2">
            <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gold bg-gold/15" aria-hidden="true">
              <Check :size="14" :stroke-width="3" class="text-gold" />
            </span>
            <b class="font-display text-base font-bold tracking-[0.05em] text-[#F5D070]">
              {{ (isPractice ? hintUsed : progress.wasHintUsed(puzzle.id)) ? '看了提示，完成' : '試煉達成' }}
            </b>
          </div>
          <p class="font-lesson text-sm leading-relaxed text-ink-on-deep-dim">{{ puzzle.successText }}</p>
        </template>

        <!-- ===== 解題態 ===== -->
        <template v-else>
          <!-- Turn indicator — which side you move, plus position for multi-step puzzles -->
          <div class="mb-2 flex items-center gap-2 font-sans text-xs text-ink-on-deep-dim">
            <span
              class="h-3 w-3 shrink-0 rounded-full border"
              :class="playerColor === 'white' ? 'border-black/20 bg-[#fbfbf6]' : 'border-white/20 bg-[#2a2a2a]'"
              aria-hidden="true"
            />
            {{ turnLabel }} · <b class="font-bold text-ink-on-deep">輪你走</b>
            <span v-if="positionLabel">· {{ positionLabel }}</span>
          </div>

          <!-- Goal (prompt) — the headline; never leaks the solution -->
          <p class="font-display text-[19px] font-bold leading-snug text-ink-on-deep">{{ puzzle.prompt }}</p>

          <!-- Brief — one concrete sentence clarifying the goal; sits above the on-demand hint -->
          <p class="mt-1.5 font-lesson text-[13px] leading-relaxed text-ink-on-deep-dim">{{ puzzle.brief }}</p>

          <!-- Hint text (stage 1+) -->
          <div v-if="hintStage >= 1" class="mt-3 rounded-lg bg-gold/10 px-3 py-2 ring-1 ring-gold/20">
            <p class="font-lesson text-sm leading-relaxed text-ink-on-deep">{{ puzzle.hint }}</p>
            <p v-if="hintStage >= 2" class="mt-1 font-sans text-sm text-ink-on-deep-dim">答案箭頭已畫在棋盤上。</p>
          </div>
        </template>

        <!-- 棋譜紀錄框（複用對局棋譜語彙；第一次互動才出現，累積對錯，Cubic 11 等寬）-->
        <div v-if="moveLog.length" class="mt-3 overflow-hidden rounded-lg border border-white/10 bg-black/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <p class="border-b border-white/10 px-3 py-1.5 font-sans text-[10px] uppercase tracking-[0.12em] text-ink-on-deep-dim">試煉紀錄</p>
          <div class="px-3 py-2 font-num text-[13px] leading-relaxed">
            <div v-for="(e, i) in moveLog" :key="i" class="flex gap-2">
              <span :class="e.ok ? 'text-[#7FCBA9]' : 'text-[#E8A892]'">{{ e.ok ? '✓' : '✗' }}</span>
              <span class="text-ink-on-deep">{{ e.text }}</span>
            </div>
          </div>
        </div>

        <!-- ===== Footer ===== -->
        <!-- 達成：回地圖（次要）+ 下一題（金 CTA）-->
        <div v-if="pz.phase.value === 'solved'" class="mt-3.5 flex items-center gap-2 border-t border-white/[0.08] pt-3">
          <button
            type="button"
            class="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-4 font-sans text-[13px] font-semibold text-ink-on-deep active:scale-[0.98]"
            @click="router.push(isPractice ? '/learn' : '/dungeon')"
          >
            <ArrowLeft :size="15" :stroke-width="1.8" /> {{ isPractice ? '回課程' : '回地圖' }}
          </button>
          <div class="flex-1" />
          <button
            type="button"
            class="inline-flex min-h-[40px] items-center gap-2 rounded-full bg-gradient-to-b from-gold-light to-gold px-5 font-sans text-sm font-bold text-gold-ink shadow-[0_2px_12px_rgba(248,181,0,0.4)] active:scale-95"
            @click="goNext"
          >
            {{ isPractice ? '回課程' : nextPuzzle ? '下一題' : '回到地圖' }} <ArrowRight :size="16" />
          </button>
        </div>

        <!-- 解題：提示（低調收進卡內）+ 概念複習連結 -->
        <div v-else class="mt-3.5 flex items-center justify-between border-t border-white/[0.08] pt-3">
          <button
            type="button"
            class="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-gold/25 bg-gold/[0.08] px-3.5 font-sans text-[13px] font-semibold text-[#F5D070] active:scale-[0.98]"
            @click="showHint"
          >
            <Lightbulb :size="15" :stroke-width="1.8" /> {{ hintLabel }}
          </button>

          <!-- Bridge 2: calm back-link to the concept's lesson (Learning Loop #20) -->
          <button
            v-if="reviewLink"
            type="button"
            data-testid="concept-review-link"
            class="inline-flex min-h-[36px] items-center gap-1.5 font-sans text-[12.5px] font-medium text-ink-on-deep-dim/80 active:scale-[0.98]"
            @click="reviewConcept"
          >
            <BookOpen :size="15" :stroke-width="1.8" /> 複習「{{ reviewLink.label }}」
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* vue3-chessboard 的 .main-wrap 被釘死 700px（撐爆木框、桌機棋盤過大且木框對不到）。強制它跟著
   木框寬度走，cg-board 才會 follow 成正方、剛好貼合木盤（桌機棋盤過大／木框未對齊修正）。 */
.board-fit :deep(.main-wrap) {
  width: 100% !important;
  max-width: 100% !important;
  height: auto !important;
}
</style>
