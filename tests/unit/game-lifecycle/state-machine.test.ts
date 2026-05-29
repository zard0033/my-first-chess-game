import { describe, it, expect, beforeEach } from 'vitest'
import { isRef, isReactive } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import { Chess } from 'chess.js'
import {
  useGameLifecycle,
  detectTerminal,
} from '../../../src/modules/game-lifecycle/use-game-lifecycle'

// Pinia must be active since useGameLifecycle calls useGameStore() internally
beforeEach(() => { setActivePinia(createPinia()) })

// -----------------------------------------------------------------------
// Test helpers — known terminal positions
// -----------------------------------------------------------------------

/** Scholar's mate (White wins): 1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6 4.Qxf7# */
function makeScholarsMate(): Chess {
  const chess = new Chess()
  chess.move('e4')
  chess.move('e5')
  chess.move('Bc4')
  chess.move('Nc6')
  chess.move('Qh5')
  chess.move('Nf6')
  chess.move('Qxf7') // checkmate — Black checkmated, White wins
  return chess
}

/** Fool's mate (Black wins): 1.f3 e5 2.g4 Qh4# */
function makeFoolsMate(): Chess {
  const chess = new Chess()
  chess.move('f3')
  chess.move('e5')
  chess.move('g4')
  chess.move('Qh4') // checkmate — White checkmated, Black wins
  return chess
}

// Stalemate: Black king f8, White pawn f7, White king f6 — Black to move, no legal moves
const STALEMATE_FEN = '5k2/5P2/5K2/8/8/8/8/8 b - - 0 1'

// Insufficient material: only two kings
const KINGS_ONLY_FEN = '4k3/8/8/8/8/8/8/4K3 w - - 0 1'

// -----------------------------------------------------------------------
// AC-1: chess.js instance is not reactive
// -----------------------------------------------------------------------

describe('useGameLifecycle — AC-1: chess.js non-reactive', () => {
  it('test_stateMachine_chessInstance_isNotRef', () => {
    // Arrange
    const { _getChess } = useGameLifecycle()

    // Assert
    expect(isRef(_getChess())).toBe(false)
  })

  it('test_stateMachine_chessInstance_isNotReactive', () => {
    // Arrange
    const { _getChess } = useGameLifecycle()

    // Assert
    expect(isReactive(_getChess())).toBe(false)
  })
})

// -----------------------------------------------------------------------
// AC-2: detectTerminal — checkmate detection and result derivation
// -----------------------------------------------------------------------

describe('detectTerminal — AC-2: checkmate', () => {
  it('test_detectTerminal_checkmateBlack_returnsCheckmateWhiteWin', () => {
    // Arrange — scholar's mate: Black is checkmated
    const chess = makeScholarsMate()

    // Act
    const result = detectTerminal(chess)

    // Assert
    expect(result).not.toBeNull()
    expect(result!.endReason).toBe('checkmate')
    expect(result!.result).toBe('1-0')
  })

  it('test_detectTerminal_checkmateWhite_returnsCheckmateBlackWin', () => {
    // Arrange — fool's mate: White is checkmated
    const chess = makeFoolsMate()

    // Act
    const result = detectTerminal(chess)

    // Assert
    expect(result).not.toBeNull()
    expect(result!.endReason).toBe('checkmate')
    expect(result!.result).toBe('0-1')
  })
})

// -----------------------------------------------------------------------
// AC-3: detectTerminal — stalemate
// -----------------------------------------------------------------------

describe('detectTerminal — AC-3: stalemate', () => {
  it('test_detectTerminal_stalemate_returnsDrawResult', () => {
    // Arrange — Black king trapped (f8 king with White Pawn f7 and King f6)
    const chess = new Chess(STALEMATE_FEN)

    // Act
    const result = detectTerminal(chess)

    // Assert
    expect(result).not.toBeNull()
    expect(result!.endReason).toBe('stalemate')
    expect(result!.result).toBe('1/2-1/2')
  })
})

// -----------------------------------------------------------------------
// Additional: detectTerminal for other terminal conditions
// -----------------------------------------------------------------------

describe('detectTerminal — other terminal conditions', () => {
  it('test_detectTerminal_insufficientMaterial_returnsDrawResult', () => {
    // Arrange — two kings only
    const chess = new Chess(KINGS_ONLY_FEN)

    // Act
    const result = detectTerminal(chess)

    // Assert
    expect(result).not.toBeNull()
    expect(result!.endReason).toBe('insufficient-material')
    expect(result!.result).toBe('1/2-1/2')
  })

  it('test_detectTerminal_nonTerminalPosition_returnsNull', () => {
    // Arrange — starting position
    const chess = new Chess()

    // Act
    const result = detectTerminal(chess)

    // Assert
    expect(result).toBeNull()
  })
})

// -----------------------------------------------------------------------
// AC-4: Phase machine transitions
// -----------------------------------------------------------------------

describe('useGameLifecycle — AC-4: phase transitions', () => {
  it('test_stateMachine_initial_phaseIsSetup', () => {
    const { phase } = useGameLifecycle()
    expect(phase.value).toBe('SETUP')
  })

  it('test_stateMachine_startGameWhite_transitionsToPlayerTurn', () => {
    // Arrange
    const { phase, startGame } = useGameLifecycle()

    // Act
    startGame('white', 10)

    // Assert
    expect(phase.value).toBe('PLAYER_TURN')
  })

  it('test_stateMachine_startGameBlack_transitionsToAiThinking', () => {
    // Arrange
    const { phase, startGame } = useGameLifecycle()

    // Act
    startGame('black', 5)

    // Assert — AI must move first when player is Black
    expect(phase.value).toBe('AI_THINKING')
  })

  it('test_stateMachine_playerMove_transitionsToAiThinking', () => {
    // Arrange
    const { phase, startGame, handlePlayerMove } = useGameLifecycle()
    startGame('white', 10)

    // Act
    handlePlayerMove('e2', 'e4')

    // Assert
    expect(phase.value).toBe('AI_THINKING')
  })

  it('test_stateMachine_aiMove_transitionsToPlayerTurn', () => {
    // Arrange
    const { phase, startGame, handlePlayerMove, handleAiMove } = useGameLifecycle()
    startGame('white', 10)
    handlePlayerMove('e2', 'e4')
    expect(phase.value).toBe('AI_THINKING')

    // Act
    handleAiMove('e7e5')

    // Assert
    expect(phase.value).toBe('PLAYER_TURN')
  })

  it('test_stateMachine_scholarsMate_transitionsToGameOver', () => {
    // Arrange — play scholar's mate using composable
    const { phase, terminal, startGame, handlePlayerMove, handleAiMove } = useGameLifecycle()
    startGame('white', 0)

    // Act — play all 7 half-moves of scholar's mate
    handlePlayerMove('e2', 'e4')
    handleAiMove('e7e5')
    handlePlayerMove('f1', 'c4')
    handleAiMove('b8c6')
    handlePlayerMove('d1', 'h5')
    handleAiMove('g8f6')
    const t = handlePlayerMove('h5', 'f7') // Qxf7#

    // Assert
    expect(phase.value).toBe('GAME_OVER')
    expect(terminal.value?.endReason).toBe('checkmate')
    expect(terminal.value?.result).toBe('1-0')
    expect(t).not.toBeNull()
    expect(t).not.toBe(false)
  })
})

// -----------------------------------------------------------------------
// AC-5: Illegal move rejected; state unchanged
// -----------------------------------------------------------------------

describe('useGameLifecycle — AC-5: illegal move rejected', () => {
  it('test_stateMachine_illegalMove_returnsFalse', () => {
    // Arrange
    const { startGame, handlePlayerMove } = useGameLifecycle()
    startGame('white', 10)

    // Act — pawn jumping 3 squares is illegal
    const result = handlePlayerMove('e2', 'e5')

    // Assert
    expect(result).toBe(false)
  })

  it('test_stateMachine_illegalMove_phaseUnchanged', () => {
    // Arrange
    const { phase, startGame, handlePlayerMove } = useGameLifecycle()
    startGame('white', 10)

    // Act
    handlePlayerMove('e2', 'e6') // illegal

    // Assert — must remain PLAYER_TURN
    expect(phase.value).toBe('PLAYER_TURN')
  })

  it('test_stateMachine_illegalMove_fenUnchanged', () => {
    // Arrange
    const { fen, startGame, handlePlayerMove } = useGameLifecycle()
    startGame('white', 10)
    const fenBefore = fen.value

    // Act
    handlePlayerMove('a1', 'a8') // illegal

    // Assert
    expect(fen.value).toBe(fenBefore)
  })
})

// -----------------------------------------------------------------------
// EC-01: move-made ignored after GAME_OVER
// -----------------------------------------------------------------------

describe('useGameLifecycle — EC-01: GAME_OVER blocks further input', () => {
  it('test_stateMachine_moveAfterGameOver_returnsFalse', () => {
    // Arrange — reach GAME_OVER via resign
    const lifecycle = useGameLifecycle()
    lifecycle.startGame('white', 10)
    lifecycle.resign()
    expect(lifecycle.phase.value).toBe('GAME_OVER')

    // Act
    const result = lifecycle.handlePlayerMove('e2', 'e4')

    // Assert
    expect(result).toBe(false)
    expect(lifecycle.phase.value).toBe('GAME_OVER')
  })

  it('test_stateMachine_aiMoveAfterGameOver_returnsFalse', () => {
    // Arrange
    const lifecycle = useGameLifecycle()
    lifecycle.startGame('white', 10)
    lifecycle.handlePlayerMove('e2', 'e4') // → AI_THINKING
    // Force GAME_OVER by resignation-equivalent
    lifecycle.resign()
    expect(lifecycle.phase.value).toBe('GAME_OVER')

    // Act
    const result = lifecycle.handleAiMove('e7e5')

    // Assert
    expect(result).toBe(false)
  })
})

// -----------------------------------------------------------------------
// EC-07 + EC-08: AI resignation edge cases
// -----------------------------------------------------------------------

describe('useGameLifecycle — EC-07/EC-08: AI resignation edge cases', () => {
  it('test_stateMachine_bestmove0000_treatedAsAiResignation', () => {
    // Arrange
    const { phase, terminal, startGame, handlePlayerMove, handleAiMove } = useGameLifecycle()
    startGame('white', 10)
    handlePlayerMove('e2', 'e4') // → AI_THINKING

    // Act
    const result = handleAiMove('0000')

    // Assert
    expect(phase.value).toBe('GAME_OVER')
    expect(terminal.value?.endReason).toBe('resignation')
    expect(terminal.value?.result).toBe('1-0') // player (white) wins
    expect(result).not.toBe(false)
    expect(result).not.toBeNull()
  })

  it('test_stateMachine_illegalAiMove_treatedAsAiResignation', () => {
    // Arrange
    const { phase, terminal, startGame, handlePlayerMove, handleAiMove } = useGameLifecycle()
    startGame('white', 10)
    handlePlayerMove('e2', 'e4')

    // Act — EC-07: syntactically valid UCI but illegal in position
    const result = handleAiMove('a8a1') // rook move from empty square — illegal

    // Assert
    expect(phase.value).toBe('GAME_OVER')
    expect(terminal.value?.endReason).toBe('resignation')
  })
})

// -----------------------------------------------------------------------
// Resign action
// -----------------------------------------------------------------------

describe('useGameLifecycle — resign', () => {
  it('test_stateMachine_resignWhite_resultIs0_1', () => {
    // Arrange
    const { phase, terminal, startGame, resign } = useGameLifecycle()
    startGame('white', 10)

    // Act
    resign()

    // Assert
    expect(phase.value).toBe('GAME_OVER')
    expect(terminal.value?.endReason).toBe('resignation')
    expect(terminal.value?.result).toBe('0-1')
  })

  it('test_stateMachine_resignBlack_resultIs1_0', () => {
    // Arrange
    const { phase, terminal, startGame, resign } = useGameLifecycle()
    startGame('black', 10) // → AI_THINKING (AI moves first)

    // Act
    resign()

    // Assert
    expect(terminal.value?.result).toBe('1-0')
  })

  it('test_stateMachine_resignInSetup_noEffect', () => {
    // Arrange
    const { phase, resign } = useGameLifecycle()
    // phase is SETUP (no startGame called)

    // Act
    resign()

    // Assert — resign in SETUP is a no-op
    expect(phase.value).toBe('SETUP')
  })
})

// -----------------------------------------------------------------------
// resetToSetup
// -----------------------------------------------------------------------

describe('useGameLifecycle — resetToSetup', () => {
  it('test_stateMachine_resetToSetup_clearsAllState', () => {
    // Arrange — play some moves then reset
    const { phase, terminal, fen, startGame, handlePlayerMove, resetToSetup } = useGameLifecycle()
    startGame('white', 10)
    handlePlayerMove('e2', 'e4')
    expect(phase.value).toBe('AI_THINKING')

    // Act
    resetToSetup()

    // Assert
    expect(phase.value).toBe('SETUP')
    expect(terminal.value).toBeNull()
    expect(fen.value).toContain('rnbqkbnr') // starting position
  })
})

// -----------------------------------------------------------------------
// Double-call guard for startGame (EC-05)
// -----------------------------------------------------------------------

describe('useGameLifecycle — EC-05: startGame guard', () => {
  it('test_stateMachine_startGameCalledTwice_secondCallIsNoOp', () => {
    // Arrange
    const { phase, playerColor, startGame, handlePlayerMove } = useGameLifecycle()
    startGame('white', 10)
    handlePlayerMove('e2', 'e4') // phase = AI_THINKING

    // Act — second startGame while not in SETUP
    startGame('black', 20)

    // Assert — phase and playerColor unchanged
    expect(phase.value).toBe('AI_THINKING')
    expect(playerColor.value).toBe('white')
  })
})
