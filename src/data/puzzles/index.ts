import type { Puzzle } from '../../types/puzzle'
import { level1Puzzles } from './level-1'
import { level2Puzzles } from './level-2'
import { level3Puzzles } from './level-3'

/**
 * Raw puzzle modules, grouped by level file. The exported `puzzles` catalog is sorted
 * by `order`, so the order of this array does not matter.
 */
const rawPuzzles: Puzzle[] = [...level1Puzzles, ...level2Puzzles, ...level3Puzzles]

/** The static puzzle catalog, sorted ascending by `order`. */
export const puzzles: readonly Puzzle[] = [...rawPuzzles].sort((a, b) => a.order - b.order)

/** Returns the puzzle with the given id, or `undefined` if no such puzzle exists. */
export function getPuzzleById(id: string): Puzzle | undefined {
  return puzzles.find((puzzle) => puzzle.id === id)
}
