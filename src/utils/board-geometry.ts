/** Board-local rectangle: pixels from boardRef's top-left corner. */
export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

/**
 * ADR-0009 §4: board-local orientation-aware geometry.
 * Returns null for invalid square identifiers.
 */
export function squareToRect(
  square: string,
  boardWidth: number,
  orientation: 'white' | 'black',
): Rect | null {
  if (!/^[a-h][1-8]$/.test(square)) return null
  if (boardWidth <= 0) return null
  const squarePx = boardWidth / 8
  const file = square.charCodeAt(0) - 97   // 'a'=0 … 'h'=7
  const rank = parseInt(square[1]) - 1     // '1'=0 … '8'=7
  const col = orientation === 'white' ? file : 7 - file
  const row = orientation === 'white' ? 7 - rank : rank
  return { x: col * squarePx, y: row * squarePx, width: squarePx, height: squarePx }
}
