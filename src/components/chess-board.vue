<script setup lang="ts">
import { ref, watch } from 'vue'
import { TheChessboard } from 'vue3-chessboard'
import type { BoardApi, BoardConfig } from 'vue3-chessboard'
import type { DrawShape, DrawBrushes } from 'chessground/draw'
import type { Key, Elements } from 'chessground/types'
import type { Move } from 'chess.js'
import type { MoveMadePayload } from '../composables/use-chess-board'
import { validateFen, useBoardRenderer, PIECE_MOVE_ANIM_MS } from '../composables/use-board-renderer'

const props = defineProps<{
  fen: string
  playerColor: 'white' | 'black'
  disabled: boolean
}>()

const emit = defineEmits<{
  'move-made': [payload: MoveMadePayload]
}>()

// ADR-0009 Decision §3: custom brushes registered once; must include chessground defaults
const BRUSHES: DrawBrushes = {
  green:       { key: 'green',       color: '#15781B', opacity: 1,   lineWidth: 10 },
  red:         { key: 'red',         color: '#882020', opacity: 1,   lineWidth: 10 },
  blue:        { key: 'blue',        color: '#003088', opacity: 1,   lineWidth: 10 },
  yellow:      { key: 'yellow',      color: '#e68f00', opacity: 1,   lineWidth: 10 },
  legalDot:    { key: 'legalDot',    color: '#3e9c35', opacity: 0.5, lineWidth: 10 },
  captureRing: { key: 'captureRing', color: '#ee6644', opacity: 0.6, lineWidth: 10 },
}

const boardApi = ref<BoardApi | null>(null)
// ADR-0009 Decision §1: boardRef captured via boardConfig.events.insert, not template ref
const boardRef = ref<HTMLElement | null>(null)

const { syncFen, onMoveMade } = useBoardRenderer(() => boardApi.value)

function showLegalMoves(fromSquare: Key): void {
  const api = boardApi.value
  if (!api) return
  const destinations = api.getPossibleMoves()?.get(fromSquare)
  if (!destinations?.length) {
    clearSelectionShapes()
    return
  }
  // TODO Sprint 2: use 'captureRing' brush for captures (needs chess.js isCapture() check)
  const shapes: DrawShape[] = destinations.map((dest) => ({
    orig: fromSquare,
    dest,
    brush: 'legalDot',
  }))
  api.setConfig({ drawable: { shapes, brushes: BRUSHES } }, false)
}

function clearSelectionShapes(): void {
  boardApi.value?.setConfig({ drawable: { shapes: [], brushes: BRUSHES } }, false)
}

// Non-reactive; subsequent changes handled imperatively via boardApi
const boardConfig: BoardConfig = {
  fen: validateFen(props.fen),
  orientation: props.playerColor,
  viewOnly: props.disabled,
  animation: { duration: PIECE_MOVE_ANIM_MS },
  movable: { free: false, color: props.playerColor, showDests: false },
  drawable: { enabled: true, eraseOnClick: false, brushes: BRUSHES },
  highlight: { lastMove: true, check: true },
  events: {
    insert: (elements: Elements) => { boardRef.value = elements.wrap },
    select: (key: Key) => { showLegalMoves(key) },
  },
}

function onBoardCreated(api: BoardApi): void {
  boardApi.value = api
}

function onMove(move: Move): void {
  clearSelectionShapes()
  onMoveMade()
  const fen = boardApi.value?.getFen() ?? ''
  const animationDoneAt = new Promise<void>((resolve) => setTimeout(resolve, PIECE_MOVE_ANIM_MS))
  emit('move-made', {
    from: move.from,
    to: move.to,
    promotion: move.promotion,
    fen,
    animationDoneAt,
  })
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
    boardApi.value?.setConfig({ viewOnly: disabled }, false)
  },
)

/** ADR-0009 Decision §4: board-local coordinates, orientation-corrected. */
function squareToRect(square: string): { x: number; y: number; width: number; height: number } | null {
  if (!/^[a-h][1-8]$/.test(square)) return null
  const el = boardRef.value
  if (!el) return null
  const squarePx = el.offsetWidth / 8
  const file = square.charCodeAt(0) - 97
  const rank = parseInt(square[1]) - 1
  const col = props.playerColor === 'white' ? file : 7 - file
  const row = props.playerColor === 'white' ? 7 - rank : rank
  return { x: col * squarePx, y: row * squarePx, width: squarePx, height: squarePx }
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
    <!-- focus-cell: roving-tabindex keyboard model — Sprint 2 full implementation -->
    <div
      class="absolute opacity-0 pointer-events-none"
      role="gridcell"
      tabindex="-1"
    />
  </div>
</template>
