<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Chess } from 'chess.js'
import { TheChessboard } from 'vue3-chessboard'
import type { BoardApi, BoardConfig } from 'vue3-chessboard'
import type { Key, Elements } from 'chessground/types'
import type { Move } from 'chess.js'
import type { MoveMadePayload } from '../composables/use-chess-board'
import { validateFen, useBoardRenderer, PIECE_MOVE_ANIM_MS } from '../composables/use-board-renderer'
import { BOARD_BRUSHES, buildLegalMoveShapes, buildAnimationDoneAt } from '../composables/use-board-input'
import { squareToRect as computeSquareRect } from '../utils/board-geometry'
import type { Rect } from '../utils/board-geometry'
import PromotionDialog from './promotion-dialog.vue'
import { useReducedMotion } from '../composables/use-reduced-motion'

const props = defineProps<{
  fen: string
  playerColor: 'white' | 'black'
  disabled: boolean
}>()

const emit = defineEmits<{
  'move-made': [payload: MoveMadePayload]
}>()

const boardApi = ref<BoardApi | null>(null)
// ADR-0009 Decision §1: boardRef captured via boardConfig.events.insert, not template ref
const boardRef = ref<HTMLElement | null>(null)

const { prefersReducedMotion } = useReducedMotion()

const { syncFen, onMoveMade } = useBoardRenderer(() => boardApi.value)

// Promotion dialog state
const pendingPromotion = ref<{ from: string; to: string } | null>(null)
const promotionSquareRect = ref<Rect | null>(null)

function showLegalMoves(fromSquare: Key): void {
  const api = boardApi.value
  if (!api) return
  const shapes = buildLegalMoveShapes(fromSquare, props.fen)
  if (!shapes.length) {
    clearSelectionShapes()
    return
  }
  api.setConfig({ drawable: { shapes, brushes: BOARD_BRUSHES } }, false)
}

function clearSelectionShapes(): void {
  boardApi.value?.setConfig({ drawable: { shapes: [], brushes: BOARD_BRUSHES } }, false)
}

// Non-reactive; subsequent changes handled imperatively via boardApi
const boardConfig: BoardConfig = {
  fen: validateFen(props.fen),
  orientation: props.playerColor,
  viewOnly: props.disabled,
  animation: { duration: PIECE_MOVE_ANIM_MS },
  movable: { free: false, color: props.playerColor, showDests: false },
  drawable: { enabled: true, eraseOnClick: false, brushes: BOARD_BRUSHES },
  highlight: { lastMove: true, check: true },
  events: {
    insert: (elements: Elements) => { boardRef.value = elements.wrap },
    select: (key: Key) => { showLegalMoves(key) },
  },
}

function onBoardCreated(api: BoardApi): void {
  boardApi.value = api
}

function isPromotionMove(move: Move): boolean {
  // vue3-chessboard handles promotions internally before emitting @move;
  // by the time onMove fires, move.promotion is already set.
  // Only show our dialog if promotion wasn't already handled.
  return move.flags.includes('p') && !move.promotion
}

function onMove(move: Move): void {
  clearSelectionShapes()
  if (isPromotionMove(move)) {
    // Freeze board and show dialog — don't emit yet
    boardApi.value?.setConfig({ viewOnly: true }, false)
    pendingPromotion.value = { from: move.from, to: move.to }
    promotionSquareRect.value = computeSquareRect(move.to, boardRef.value?.offsetWidth ?? 0, props.playerColor)
    return
  }
  onMoveMade()
  const fen = boardApi.value?.getFen() ?? ''
  emit('move-made', {
    from: move.from,
    to: move.to,
    promotion: move.promotion,
    fen,
    animationDoneAt: buildAnimationDoneAt(boardRef.value),
  })
}

function handlePromotionSelect(piece: 'q' | 'r' | 'b' | 'n'): void {
  const pending = pendingPromotion.value
  if (!pending) return

  // Compute correct FEN with user-chosen promotion piece
  const chess = new Chess(props.fen)
  chess.move({ from: pending.from, to: pending.to, promotion: piece })
  const fen = chess.fen()

  // Sync chessground with the corrected position
  boardApi.value?.setPosition(fen)

  const animationDoneAt = buildAnimationDoneAt(boardRef.value)

  closePendingPromotion()
  onMoveMade()
  emit('move-made', {
    from: pending.from,
    to: pending.to,
    promotion: piece,
    fen,
    animationDoneAt,
  })
}

function handlePromotionCancel(): void {
  // Snap pawn back by restoring pre-move position
  boardApi.value?.setPosition(props.fen)
  closePendingPromotion()
}

function closePendingPromotion(): void {
  pendingPromotion.value = null
  promotionSquareRect.value = null
  boardApi.value?.setConfig({ viewOnly: props.disabled }, false)
}

watch(
  () => props.fen,
  (newFen) => { syncFen(newFen) },
)

watch(
  () => props.playerColor,
  (color) => { boardApi.value?.setConfig({ orientation: color }, false) },
)

watch(
  () => props.disabled,
  (disabled) => {
    if (!pendingPromotion.value) {
      boardApi.value?.setConfig({ viewOnly: disabled }, false)
    }
  },
)

// Apply prefers-reduced-motion: collapse animation duration to 0
watch(
  prefersReducedMotion,
  (reduced) => {
    boardApi.value?.setConfig({
      animation: { duration: reduced ? 0 : PIECE_MOVE_ANIM_MS },
    }, false)
  },
)

/**
 * Find the square of the king that is currently in check, or null if no check.
 * Used to position the check ring SVG overlay (story-006-visual-feedback.md AC-2).
 */
const kingInCheckSquare = computed((): string | null => {
  if (!boardApi.value) return null
  const currentFen = props.fen
  try {
    const chess = new Chess(currentFen)
    if (!chess.inCheck()) return null
    // Find the king of the side-to-move (the side in check)
    const sideToMove = chess.turn() // 'w' or 'b'
    const kingPiece = sideToMove === 'w' ? 'K' : 'k'
    const board = chess.board()
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = board[rank][file]
        if (piece && piece.type + '' === kingPiece.toLowerCase() && piece.color === sideToMove) {
          const fileChar = String.fromCharCode(97 + file) // 'a'..'h'
          const rankChar = String.fromCharCode(56 - rank)  // '8'..'1'
          return fileChar + rankChar
        }
      }
    }
  } catch {
    // Invalid FEN — no check
  }
  return null
})

const checkRingRect = computed((): Rect | null => {
  const sq = kingInCheckSquare.value
  if (!sq || !boardRef.value) return null
  return computeSquareRect(sq, boardRef.value.offsetWidth, props.playerColor)
})

/** ADR-0009 Decision §4: board-local coordinates, orientation-corrected. */
function squareToRect(square: string): Rect | null {
  const el = boardRef.value
  if (!el) return null
  return computeSquareRect(square, el.offsetWidth, props.playerColor)
}

defineExpose({ boardRef, squareToRect })
</script>

<template>
  <div
    class="relative min-w-[352px]"
    role="grid"
    aria-label="Chess board"
    aria-rowcount="8"
    aria-colcount="8"
  >
    <TheChessboard
      :boardConfig="boardConfig"
      @boardCreated="onBoardCreated"
      @move="onMove"
    />

    <!-- Check indicator: glow + border ring on the king square in check (story-006-visual-feedback.md AC-2) -->
    <svg
      v-if="checkRingRect"
      class="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
      aria-hidden="true"
    >
      <!-- Glow (opacity pulse — reduced-motion: skip animation, keep residual opacity) -->
      <rect
        :x="checkRingRect.x + 1"
        :y="checkRingRect.y + 1"
        :width="checkRingRect.width - 2"
        :height="checkRingRect.height - 2"
        rx="2"
        fill="rgba(220,38,38,0.4)"
        :class="prefersReducedMotion ? '' : 'check-glow-pulse'"
      />
      <!-- Border ring (always visible when in check, regardless of reduced-motion) -->
      <rect
        :x="checkRingRect.x + 1"
        :y="checkRingRect.y + 1"
        :width="checkRingRect.width - 2"
        :height="checkRingRect.height - 2"
        rx="2"
        fill="none"
        stroke="#dc2626"
        stroke-width="3"
      />
    </svg>

    <!-- Screen reader check announcement — always in DOM, content updated on check -->
    <span
      class="sr-only"
      aria-live="assertive"
      aria-atomic="true"
    >{{ kingInCheckSquare ? 'Check' : '' }}</span>

    <!-- Promotion dialog — shown only when a pawn reaches the back rank -->
    <PromotionDialog
      v-if="pendingPromotion && promotionSquareRect"
      :playerColor="playerColor"
      :squareRect="promotionSquareRect"
      @select="handlePromotionSelect"
      @cancel="handlePromotionCancel"
    />

    <!-- focus-cell: roving-tabindex keyboard model — Sprint 2 full implementation -->
    <div
      class="absolute opacity-0 pointer-events-none"
      role="gridcell"
      tabindex="-1"
    />
  </div>
</template>

<style scoped>
/* Check glow: opacity pulse then fade to residual. Uses opacity only (no layout/paint). */
@keyframes check-glow-pulse {
  0%   { opacity: 0.4; }
  30%  { opacity: 0.7; }
  100% { opacity: 0.2; }
}

.check-glow-pulse {
  animation: check-glow-pulse 800ms ease-out forwards;
}

/* Last-move highlight contrast via chessground's .cg-last-dests class.
   Chessground natively renders last-move tint via .cg-last-dests — no override needed. */

/* forced-colors fallback: check ring uses CanvasText; dots/rings use system Highlight */
@media (forced-colors: active) {
  .check-glow-pulse {
    fill: Highlight;
    opacity: 1;
  }
}
</style>
