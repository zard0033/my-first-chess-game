import { ref, readonly, onMounted } from 'vue'
import { Chess } from 'chess.js'
import { usePlayEngine } from '../modules/chess-engine/play-engine'
import { useGameStore } from '../stores/game-store'

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
  const gameStore = useGameStore()
  const engine = usePlayEngine()

  onMounted(async () => {
    try {
      await engine.init()
    } catch {
      console.warn('Stockfish unavailable — playing without AI')
    }
  })

  async function handleMoveMade(payload: MoveMadePayload): Promise<void> {
    fen.value = payload.fen
    gameStore.setGameInProgress(true)

    if (engine.state.value !== 'IDLE') return

    disabled.value = true
    await payload.animationDoneAt

    try {
      const result = await engine.play({ fen: fen.value, skillLevel: 10, movetimeMs: 3000 })

      if (!result.bestMove || result.bestMove === '(none)' || result.bestMove === '0000') return

      const from = result.bestMove.slice(0, 2)
      const to = result.bestMove.slice(2, 4)
      const promotion = result.bestMove.length === 5
        ? (result.bestMove[4] as 'q' | 'r' | 'b' | 'n')
        : undefined

      const chess = new Chess(fen.value)
      const move = chess.move({ from, to, promotion })
      if (move) fen.value = chess.fen()
    } catch {
      // Engine error — board re-enables, player can keep moving
    } finally {
      disabled.value = false
    }
  }

  return {
    fen: readonly(fen),
    playerColor: readonly(playerColor),
    disabled: readonly(disabled),
    handleMoveMade,
  }
}
