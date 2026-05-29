// AC-1: board renders within 100ms — requires browser; not testable in unit env
// AC-3: playerColor → orientation — requires component mount; not testable in unit env

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  validateFen,
  useBoardRenderer,
  START_FEN,
  PIECE_MOVE_ANIM_MS,
  RECONCILE_ANIM_MS,
} from '../../../src/composables/use-board-renderer'
import type { BoardApiLike } from '../../../src/composables/use-board-renderer'

describe('validateFen', () => {
  it('test_validateFen_validFen_returnsUnchanged', () => {
    // Arrange
    const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'

    // Act + Assert
    expect(validateFen(fen)).toBe(fen)
  })

  it('test_validateFen_startingFen_returnsUnchanged', () => {
    expect(validateFen(START_FEN)).toBe(START_FEN)
  })

  it('test_validateFen_invalidString_returnsStartFenAndLogsError', () => {
    // Arrange
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Act
    const result = validateFen('not-a-fen')

    // Assert
    expect(result).toBe(START_FEN)
    expect(consoleSpy).toHaveBeenCalledOnce()
    expect(consoleSpy.mock.calls[0][0]).toContain('invalid FEN')
    consoleSpy.mockRestore()
  })

  it('test_validateFen_emptyString_returnsStartFen', () => {
    // Arrange
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Act + Assert
    expect(validateFen('')).toBe(START_FEN)
    consoleSpy.mockRestore()
  })

  it('test_validateFen_fenWithEnPassant_returnsUnchanged', () => {
    // Arrange
    const fen = 'rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3'

    // Act + Assert
    expect(validateFen(fen)).toBe(fen)
  })

  it('test_validateFen_fenWithPartialCastlingRights_returnsUnchanged', () => {
    // Arrange — K-k- style (white and black kingside only)
    const fen = 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w Kk - 0 1'

    // Act + Assert
    expect(validateFen(fen)).toBe(fen)
  })
})

describe('useBoardRenderer', () => {
  let mockGetFen: ReturnType<typeof vi.fn>
  let mockSetPosition: ReturnType<typeof vi.fn>
  let mockSetConfig: ReturnType<typeof vi.fn>
  let mockApi: BoardApiLike

  beforeEach(() => {
    vi.useFakeTimers()
    mockGetFen = vi.fn().mockReturnValue('') // returns '' by default → never equal to a valid FEN
    mockSetPosition = vi.fn()
    mockSetConfig = vi.fn()
    mockApi = {
      getFen: mockGetFen,
      setPosition: mockSetPosition,
      setConfig: mockSetConfig,
    } as unknown as BoardApiLike
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  // AC-4: disabled board still receives FEN updates via prop watcher
  // The composable is unaware of disabled state; viewOnly is managed separately in chess-board.vue
  it('test_syncFen_whenNotAnimating_callsSetPosition', () => {
    // Arrange
    const { syncFen } = useBoardRenderer(() => mockApi)
    const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'

    // Act
    syncFen(fen)

    // Assert
    expect(mockSetPosition).toHaveBeenCalledWith(fen)
  })

  it('test_syncFen_invalidFen_callsSetPositionWithStartFen', () => {
    // Arrange
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { syncFen } = useBoardRenderer(() => mockApi)

    // Act
    syncFen('not-a-fen')

    // Assert
    expect(mockSetPosition).toHaveBeenCalledWith(START_FEN)
    consoleSpy.mockRestore()
  })

  it('test_syncFen_whenNoBoardApi_doesNotThrow', () => {
    // Arrange
    const { syncFen } = useBoardRenderer(() => null)

    // Act + Assert
    expect(() => syncFen(START_FEN)).not.toThrow()
  })

  // AC-5: reconciliation — FEN arriving during animation is queued, not applied immediately
  it('test_syncFen_whenAnimating_storesPendingFenWithoutCallingSetPosition', () => {
    // Arrange
    const { syncFen, onMoveMade, pendingFen } = useBoardRenderer(() => mockApi)
    const incomingFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
    onMoveMade()

    // Act
    syncFen(incomingFen)

    // Assert
    expect(pendingFen.value).toBe(incomingFen)
    expect(mockSetPosition).not.toHaveBeenCalled()
  })

  it('test_syncFen_multipleArriveDuringAnimation_latestFenWins', () => {
    // Arrange
    const { syncFen, onMoveMade, pendingFen } = useBoardRenderer(() => mockApi)
    onMoveMade()
    const firstFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
    const secondFen = 'rnbqkbnr/pppppppp/8/8/3PP3/8/PPP2PPP/RNBQKBNR b KQkq - 0 2'

    // Act
    syncFen(firstFen)
    syncFen(secondFen)

    // Assert — depth-1 queue: second FEN replaces first
    expect(pendingFen.value).toBe(secondFen)
  })

  it('test_onMoveMade_setsIsAnimatingTrue', () => {
    // Arrange
    const { onMoveMade, isAnimating } = useBoardRenderer(() => mockApi)

    // Act
    onMoveMade()

    // Assert
    expect(isAnimating.value).toBe(true)
  })

  it('test_onMoveMade_afterTimerFires_flushesQueuedFenWithReconcileMs', () => {
    // Arrange
    const { syncFen, onMoveMade } = useBoardRenderer(() => mockApi)
    const queuedFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
    onMoveMade()
    syncFen(queuedFen)
    mockSetPosition.mockClear()
    mockSetConfig.mockClear()

    // Act: move animation completes
    vi.advanceTimersByTime(PIECE_MOVE_ANIM_MS + 16)

    // Assert: queued FEN applied, animation config set to RECONCILE_ANIM_MS
    expect(mockSetConfig).toHaveBeenCalledWith({ animation: { duration: RECONCILE_ANIM_MS } }, false)
    expect(mockSetPosition).toHaveBeenCalledWith(queuedFen)
  })

  // Regression: setPosition(fen) calls chess.load() which erases game history.
  // Guard: skip setPosition when board already has the target FEN.
  it('test_applyFen_whenFenMatchesCurrent_doesNotCallSetPosition', () => {
    // Arrange
    const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
    mockGetFen.mockReturnValue(fen)
    const { syncFen } = useBoardRenderer(() => mockApi)

    // Act
    syncFen(fen)

    // Assert — no history-destroying setPosition when FEN is unchanged
    expect(mockSetPosition).not.toHaveBeenCalled()
  })

  it('test_flushPendingFen_whenFenMatchesCurrent_doesNotCallSetPosition', () => {
    // Regression: after a user move, _flush queues the same FEN the board already has.
    // setPosition must not be called, to preserve game history.
    // Arrange
    const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
    mockGetFen.mockReturnValue(fen)
    const { syncFen, onMoveMade } = useBoardRenderer(() => mockApi)
    onMoveMade()
    syncFen(fen) // queued, same as current board position
    mockSetPosition.mockClear()

    // Act: move animation timer fires → _flush → _applyFen
    vi.advanceTimersByTime(PIECE_MOVE_ANIM_MS + 16)

    // Assert
    expect(mockSetPosition).not.toHaveBeenCalled()
  })

  it('test_reconcileAnimation_isAnimatingFalseAfterReconcileMs', () => {
    // Verifies the reconcile timer uses RECONCILE_ANIM_MS: isAnimating clears exactly
    // RECONCILE_ANIM_MS after the move animation ends, not sooner.
    // Arrange
    const { syncFen, onMoveMade, isAnimating } = useBoardRenderer(() => mockApi)
    const queuedFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
    onMoveMade()
    syncFen(queuedFen)

    // Act: advance past move animation — reconcile begins
    vi.advanceTimersByTime(PIECE_MOVE_ANIM_MS + 16)

    // Assert
    expect(isAnimating.value).toBe(true) // reconcile animation still in progress

    // Advance past reconcile
    vi.advanceTimersByTime(RECONCILE_ANIM_MS)
    expect(isAnimating.value).toBe(false)
  })
})
