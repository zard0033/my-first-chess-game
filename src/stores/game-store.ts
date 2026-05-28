import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'

/** Terminal outcome of a completed game. Immutable after assembly by GameLifecycle. */
export interface CompletedGame {
  readonly moves: readonly string[]
  readonly playerMoveTimes: readonly number[]
  readonly result: '1-0' | '0-1' | '1/2-1/2'
  readonly endReason:
    | 'checkmate'
    | 'stalemate'
    | 'resignation'
    | 'draw-agreement'
    | 'insufficient-material'
    | 'fifty-move'
    | 'threefold-repetition'
}

/**
 * Cross-system game state per ADR-0005.
 * Only two pieces of state cross system boundaries in v0:
 *   isGameInProgress — read by the navigation guard (ADR-0004)
 *   completedGame    — written by GameLifecycle, read by PostGameReview + GameExport
 */
export const useGameStore = defineStore('game', () => {
  const isGameInProgress = ref(false)
  // shallowRef: reactive at top level only; Object.freeze enforces immutability at runtime
  const completedGame = shallowRef<CompletedGame | null>(null)

  function setGameInProgress(value: boolean): void {
    isGameInProgress.value = value
  }

  function setCompletedGame(game: CompletedGame): void {
    // Clone arrays so the stored snapshot is independent of the caller's data
    const snapshot: CompletedGame = {
      moves: Object.freeze([...game.moves]),
      playerMoveTimes: Object.freeze([...game.playerMoveTimes]),
      result: game.result,
      endReason: game.endReason,
    }
    completedGame.value = Object.freeze(snapshot)
  }

  function clearCompletedGame(): void {
    completedGame.value = null
  }

  return { isGameInProgress, completedGame, setGameInProgress, setCompletedGame, clearCompletedGame }
})
