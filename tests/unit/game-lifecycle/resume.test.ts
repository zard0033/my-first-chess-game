import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGameLifecycle } from '../../../src/modules/game-lifecycle/use-game-lifecycle'
import type { ResumePayload } from '../../../src/types/resume'

// Pinia must be active since useGameLifecycle calls useGameStore() internally
beforeEach(() => { setActivePinia(createPinia()) })

function payload(over: Partial<ResumePayload> = {}): ResumePayload {
  return { moves: [], playerColor: 'white', level: 5, playerMoveTimes: [], ...over }
}

describe('useGameLifecycle — restoreGame (續玩對局)', () => {
  it('replays the move list and rebuilds fen + SAN history, returning true', () => {
    const lc = useGameLifecycle()
    const ok = lc.restoreGame(payload({ moves: ['e2e4', 'e7e5', 'g1f3'], level: 8 }))

    expect(ok).toBe(true)
    expect([...lc.moveHistory.value]).toEqual(['e4', 'e5', 'Nf3'])
    expect(lc.aiSkillLevel.value).toBe(8)
    expect(lc.lastMove.value).toEqual(['g1', 'f3'])
    // 3 plies played → Black to move; player is White → opponent's turn.
    expect(lc.phase.value).toBe('AI_THINKING')
  })

  it('enters PLAYER_TURN when the restored position is the player to move', () => {
    const lc = useGameLifecycle()
    lc.restoreGame(payload({ moves: ['e2e4', 'e7e5'], playerColor: 'white' }))
    expect(lc.phase.value).toBe('PLAYER_TURN')
  })

  it('returns false and leaves state untouched on a corrupt move list', () => {
    const lc = useGameLifecycle()
    const fenBefore = lc.fen.value
    const ok = lc.restoreGame(payload({ moves: ['e2e4', 'z9z9'] }))

    expect(ok).toBe(false)
    expect(lc.fen.value).toBe(fenBefore)
    expect(lc.phase.value).toBe('SETUP')
    expect([...lc.moveHistory.value]).toEqual([])
  })

  it('refuses to restore an already-terminal position (Scholar\'s mate)', () => {
    const lc = useGameLifecycle()
    // 1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6 4.Qxf7#
    const ok = lc.restoreGame(
      payload({ moves: ['e2e4', 'e7e5', 'f1c4', 'b8c6', 'd1h5', 'g8f6', 'h5f7'] }),
    )
    expect(ok).toBe(false)
    expect(lc.phase.value).toBe('SETUP')
  })

  it('round-trips through getResumeSnapshot: snapshot → restore preserves position', () => {
    const a = useGameLifecycle()
    a.startGame('white', 7)
    a.handlePlayerMove('e2', 'e4')
    a.handleAiMove('e7e5')
    a.handlePlayerMove('g1', 'f3')

    const snap = a.getResumeSnapshot()
    expect(snap).toMatchObject({ moves: ['e2e4', 'e7e5', 'g1f3'], playerColor: 'white', level: 7 })
    expect(snap.playerMoveTimes).toHaveLength(2) // two player moves

    const b = useGameLifecycle()
    expect(b.restoreGame(snap)).toBe(true)
    expect(b.fen.value).toBe(a.fen.value)
    expect([...b.moveHistory.value]).toEqual([...a.moveHistory.value])
  })
})
