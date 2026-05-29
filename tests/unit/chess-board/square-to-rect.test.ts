import { describe, it, expect } from 'vitest'
import { squareToRect } from '../../../src/utils/board-geometry'

const BOARD = 400  // px — standard mock board size

describe('squareToRect — AC-1: valid square returns {x, y, width, height} with width === height', () => {
  it('test_squareToRect_e4White_returnsCorrectRect', () => {
    // e=file 4, rank 4 → col=4, row=7-3=4 → x=200, y=200
    const r = squareToRect('e4', BOARD, 'white')
    expect(r).toEqual({ x: 200, y: 200, width: 50, height: 50 })
    expect(r!.width).toBe(r!.height)
  })

  it('test_squareToRect_a8White_isTopLeftCorner', () => {
    // ADR-0009 §4 validation criterion: a8 → {x:0, y:0, w:50, h:50} (White)
    expect(squareToRect('a8', BOARD, 'white')).toEqual({ x: 0, y: 0, width: 50, height: 50 })
  })

  it('test_squareToRect_h1White_isBottomRightCorner', () => {
    // ADR-0009 §4 validation criterion: h1 → {x:350, y:350} (White)
    expect(squareToRect('h1', BOARD, 'white')).toEqual({ x: 350, y: 350, width: 50, height: 50 })
  })

  it('test_squareToRect_a1White_isBottomLeftCorner', () => {
    // a=0, rank 1=0 → col=0, row=7 → x=0, y=350
    expect(squareToRect('a1', BOARD, 'white')).toEqual({ x: 0, y: 350, width: 50, height: 50 })
  })

  it('test_squareToRect_h8White_isTopRightCorner', () => {
    // h=7, rank 8=7 → col=7, row=0 → x=350, y=0
    expect(squareToRect('h8', BOARD, 'white')).toEqual({ x: 350, y: 0, width: 50, height: 50 })
  })

  it('test_squareToRect_widthAlwaysEqualsHeight', () => {
    const squares = ['a1', 'e4', 'd5', 'h8']
    for (const sq of squares) {
      const r = squareToRect(sq, BOARD, 'white')!
      expect(r.width).toBe(r.height)
    }
  })
})

describe('squareToRect — AC-2: orientation-aware (Black perspective)', () => {
  it('test_squareToRect_a1Black_isTopRightCorner', () => {
    // Black: col=7-0=7, row=0 → x=350, y=0
    // QA test case: White a1={x:0,y:350}; Black a1={x:350,y:0}
    const white = squareToRect('a1', BOARD, 'white')
    const black = squareToRect('a1', BOARD, 'black')
    expect(white).toEqual({ x: 0, y: 350, width: 50, height: 50 })
    expect(black).toEqual({ x: 350, y: 0, width: 50, height: 50 })
    expect(white!.x).not.toBe(black!.x)
  })

  it('test_squareToRect_h1Black_isTopLeftCorner', () => {
    // Black top-left: h=7 → col=7-7=0, rank=0 → row=0 → x=0, y=0
    expect(squareToRect('h1', BOARD, 'black')).toEqual({ x: 0, y: 0, width: 50, height: 50 })
  })

  it('test_squareToRect_a8Black_isBottomRightCorner', () => {
    // Black bottom-right: a=0 → col=7, rank=7 → row=7 → x=350, y=350
    expect(squareToRect('a8', BOARD, 'black')).toEqual({ x: 350, y: 350, width: 50, height: 50 })
  })

  it('test_squareToRect_e4BlackDiffersFromWhite', () => {
    const white = squareToRect('e4', BOARD, 'white')
    const black = squareToRect('e4', BOARD, 'black')
    expect(white!.x).not.toBe(black!.x)
    expect(white!.y).not.toBe(black!.y)
  })
})

describe('squareToRect — AC-3: invalid square returns null', () => {
  it('test_squareToRect_z9_returnsNull', () => {
    expect(squareToRect('z9', BOARD, 'white')).toBeNull()
  })

  it('test_squareToRect_emptyString_returnsNull', () => {
    expect(squareToRect('', BOARD, 'white')).toBeNull()
  })

  it('test_squareToRect_singleChar_returnsNull', () => {
    expect(squareToRect('e', BOARD, 'white')).toBeNull()
  })

  it('test_squareToRect_twoDigits_returnsNull', () => {
    expect(squareToRect('44', BOARD, 'white')).toBeNull()
  })

  it('test_squareToRect_a9_returnsNull', () => {
    expect(squareToRect('a9', BOARD, 'white')).toBeNull()
  })

  it('test_squareToRect_i1_returnsNull', () => {
    expect(squareToRect('i1', BOARD, 'white')).toBeNull()
  })
})

describe('squareToRect — AC-4: live values (boardWidth parameter drives cell size)', () => {
  it('test_squareToRect_400px_cellIs50', () => {
    const r = squareToRect('e4', 400, 'white')!
    expect(r.width).toBe(50)
  })

  it('test_squareToRect_600px_cellIs75', () => {
    // Simulates resize: new boardWidth → new cellSize immediately
    const r = squareToRect('e4', 600, 'white')!
    expect(r.width).toBe(75)
    expect(r.height).toBe(75)
  })

  it('test_squareToRect_320px_cellIs40', () => {
    const r = squareToRect('a1', 320, 'white')!
    expect(r.width).toBe(40)
    expect(r.y).toBe(7 * 40)  // row 7 × cellSize
  })
})
