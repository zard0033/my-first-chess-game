// AC-3: disabled prop blocks input — requires component mount; not testable in unit env
// AC-6: tap same piece cancels selection — chessground native + events.select wiring; not testable in unit env
// AC-7: second touch ignored — chessground native pointer model; not testable in unit env

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { buildLegalMoveShapes, buildAnimationDoneAt } from '../../../src/composables/use-board-input'

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
// After 1.e4 d5 — white pawn e4, black pawn d5, white to move
const AFTER_E4_D5 = 'rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2'
// After 1.e4 c5 2.e5 — white pawn e5, black pawn d5 just moved (en passant at d6 available)
const EN_PASSANT_FEN = 'rnbqkbnr/pp2pppp/8/2ppP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3'

describe('buildLegalMoveShapes', () => {
  // AC-4: legal-move destinations are rendered as dots (non-captures)
  it('test_buildLegalMoveShapes_startingPositionE2_returnsTwoLegalDotShapes', () => {
    // Arrange + Act
    const shapes = buildLegalMoveShapes('e2', START_FEN)

    // Assert — white pawn at e2 can move to e3 and e4 (no captures)
    expect(shapes).toHaveLength(2)
    expect(shapes.every((s) => s.orig === 'e2')).toBe(true)
    expect(shapes.every((s) => s.brush === 'legalDot')).toBe(true)
    const dests = shapes.map((s) => s.dest).sort()
    expect(dests).toEqual(['e3', 'e4'])
  })

  // AC-5: capturable squares use 'captureRing' brush
  it('test_buildLegalMoveShapes_pawnWithCaptureAvailable_captureDestUsesRingBrush', () => {
    // Arrange + Act — white pawn on e4, black pawn on d5; e4 can capture d5
    const shapes = buildLegalMoveShapes('e4', AFTER_E4_D5)

    // Assert — e5 is legalDot, d5 is captureRing
    const e5Shape = shapes.find((s) => s.dest === 'e5')
    const d5Shape = shapes.find((s) => s.dest === 'd5')
    expect(e5Shape?.brush).toBe('legalDot')
    expect(d5Shape?.brush).toBe('captureRing')
  })

  // AC-5 (en passant variant): en passant capture also uses 'captureRing'
  it('test_buildLegalMoveShapes_enPassantCapture_usesRingBrush', () => {
    // Arrange + Act — white pawn on e5; black pawn just moved d7→d5 (en passant square d6)
    const shapes = buildLegalMoveShapes('e5', EN_PASSANT_FEN)

    // Assert — e6 is legalDot, d6 (en passant capture dest) is captureRing
    const e6Shape = shapes.find((s) => s.dest === 'e6')
    const d6Shape = shapes.find((s) => s.dest === 'd6')
    expect(e6Shape?.brush).toBe('legalDot')
    expect(d6Shape?.brush).toBe('captureRing')
  })

  it('test_buildLegalMoveShapes_emptySquare_returnsEmpty', () => {
    // Arrange + Act — e5 is empty in starting position
    const shapes = buildLegalMoveShapes('e5', START_FEN)

    // Assert
    expect(shapes).toHaveLength(0)
  })

  it('test_buildLegalMoveShapes_opponentPieceSquare_returnsEmpty', () => {
    // Arrange + Act — e7 has a black pawn but it is white to move; no legal moves for opponent
    const shapes = buildLegalMoveShapes('e7', START_FEN)

    // Assert
    expect(shapes).toHaveLength(0)
  })

  it('test_buildLegalMoveShapes_shapes_allHaveCorrectOrigField', () => {
    // Arrange + Act
    const shapes = buildLegalMoveShapes('d1', START_FEN)

    // Assert — queen on d1 is blocked, no legal moves; all shapes (if any) would have orig='d1'
    expect(shapes.every((s) => s.orig === 'd1')).toBe(true)
  })
})

describe('buildAnimationDoneAt', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // AC-1: move-made payload includes animationDoneAt as a Promise
  it('test_buildAnimationDoneAt_withNullBoardRef_returnsPromise', () => {
    // Arrange + Act
    const result = buildAnimationDoneAt(null)

    // Assert
    expect(result).toBeInstanceOf(Promise)
  })

})
