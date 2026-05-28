import { ref, readonly } from 'vue'

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

export interface MoveMadePayload {
  from: string
  to: string
  promotion?: string
  fen: string
  animationDoneAt: Promise<void>
}

/** Manages top-level game state for PlayView — drives ChessBoard.vue props. */
export function useChessBoard() {
  const fen = ref(START_FEN)
  const playerColor = ref<'white' | 'black'>('white')
  const disabled = ref(false)

  function handleMoveMade(payload: MoveMadePayload): void {
    fen.value = payload.fen
    // Sprint 2: await payload.animationDoneAt, then trigger AI move here
  }

  return {
    fen: readonly(fen),
    playerColor: readonly(playerColor),
    disabled: readonly(disabled),
    handleMoveMade,
  }
}
