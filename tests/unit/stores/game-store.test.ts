import { beforeEach, describe, expect, it } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGameStore } from '@/stores/game-store'
import type { CompletedGame } from '@/stores/game-store'

const FIXTURE: CompletedGame = {
  moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4', 'f8c5', 'c4f7'],
  playerColor: 'white',
  result: '1-0',
  endReason: 'checkmate',
  completedAt: 1_000_000,
  aiSkillLevel: 10,
  playerMoveTimes: [1200, 800, 950],
  isTerminal: true,
}

describe('useGameStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initialises with isGameInProgress=false and no completedGame', () => {
    const store = useGameStore()
    expect(store.isGameInProgress).toBe(false)
    expect(store.completedGame).toBeNull()
  })

  it('setGameInProgress toggles the flag', () => {
    const store = useGameStore()
    store.setGameInProgress(true)
    expect(store.isGameInProgress).toBe(true)
    store.setGameInProgress(false)
    expect(store.isGameInProgress).toBe(false)
  })

  it('setCompletedGame stores a frozen snapshot', () => {
    const store = useGameStore()
    store.setCompletedGame(FIXTURE)
    expect(store.completedGame).not.toBeNull()
    expect(store.completedGame?.result).toBe('1-0')
    expect(store.completedGame?.endReason).toBe('checkmate')
    expect(Object.isFrozen(store.completedGame)).toBe(true)
  })

  it('clearCompletedGame resets to null', () => {
    const store = useGameStore()
    store.setCompletedGame(FIXTURE)
    store.clearCompletedGame()
    expect(store.completedGame).toBeNull()
  })

  it('setCompletedGame snapshot is independent of the original object', () => {
    const store = useGameStore()
    const originalMoves = [...FIXTURE.moves]
    const mutableGame: CompletedGame = { ...FIXTURE, moves: originalMoves }
    store.setCompletedGame(mutableGame)
    // Mutation of the source array does not affect the stored snapshot
    originalMoves.push('Qh5')
    expect(store.completedGame?.moves).toHaveLength(FIXTURE.moves.length)
  })
})
