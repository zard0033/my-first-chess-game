<script setup lang="ts">
import { ref, watch } from 'vue'
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
  return move.flags.includes('p')
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
    class="relative"
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
