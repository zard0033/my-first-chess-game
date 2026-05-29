import { ref } from 'vue'
import { Chess } from 'chess.js'
import type { BoardConfig } from 'vue3-chessboard'

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
/** ADR-0009 spike confirmed: chessground animation.duration = 300ms */
export const PIECE_MOVE_ANIM_MS = 300
/** Shorter animation for pending-FEN reconciliation after a move animation completes */
export const RECONCILE_ANIM_MS = 150

export interface BoardApiLike {
  getFen(): string
  setPosition(fen: string): void
  setConfig(config: BoardConfig, fillDefaults?: boolean): void
}

/**
 * Returns fen unchanged if valid; falls back to START_FEN with console.error if invalid.
 */
export function validateFen(fen: string): string {
  try {
    new Chess(fen)
    return fen
  } catch {
    console.error('ChessBoard: invalid FEN received, falling back to start position', fen)
    return START_FEN
  }
}

/**
 * Manages FEN synchronization to chessground with a depth-1 pending queue.
 * Latest FEN wins during in-flight animations; queued FEN is flushed with
 * RECONCILE_ANIM_MS animation after the in-flight animation completes.
 */
export function useBoardRenderer(getBoardApi: () => BoardApiLike | null) {
  const isAnimating = ref(false)
  const pendingFen = ref<string | null>(null)
  let animTimer: ReturnType<typeof setTimeout> | null = null

  function _clearTimer(): void {
    if (animTimer !== null) {
      clearTimeout(animTimer)
      animTimer = null
    }
  }

  function _flush(): void {
    animTimer = null
    isAnimating.value = false
    const queued = pendingFen.value
    if (queued !== null) {
      pendingFen.value = null
      _applyFen(queued, RECONCILE_ANIM_MS)
    }
  }

  function _applyFen(fen: string, duration: number): void {
    const api = getBoardApi()
    if (!api) return
    if (api.getFen() === fen) return
    isAnimating.value = true
    api.setConfig({ animation: { duration } }, false)
    api.setPosition(fen)
    _clearTimer()
    animTimer = setTimeout(_flush, duration)
  }

  /** Mark that a user-initiated move animation is in flight. */
  function onMoveMade(): void {
    isAnimating.value = true
    _clearTimer()
    animTimer = setTimeout(_flush, PIECE_MOVE_ANIM_MS + 16)
  }

  /** Sync a new FEN; queues it if an animation is in flight (latest wins). */
  function syncFen(fen: string): void {
    const validated = validateFen(fen)
    if (isAnimating.value) {
      pendingFen.value = validated
    } else {
      _applyFen(validated, PIECE_MOVE_ANIM_MS)
    }
  }

  return { syncFen, onMoveMade, isAnimating, pendingFen }
}
