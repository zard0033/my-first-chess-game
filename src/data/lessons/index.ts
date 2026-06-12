import type { Lesson } from '../../types/lesson'
import { rulesLessons } from './rules'
import { tacticsLessons } from './tactics'
import { controlTheCenter } from './control-the-center'
import { developYourPieces } from './develop-your-pieces'
import { kingSafetyCastling } from './king-safety-castling'
import { dontBringQueenOutEarly } from './dont-bring-queen-out-early'
import { endgameLessons } from './endgame'

/**
 * Raw lesson modules, grouped by tier file. The exported `lessons` catalog is
 * sorted by `order`, so the order of this array does not matter.
 */
const rawLessons: Lesson[] = [
  ...rulesLessons,
  ...tacticsLessons,
  controlTheCenter,
  developYourPieces,
  kingSafetyCastling,
  dontBringQueenOutEarly,
  ...endgameLessons,
]

/** The static lesson catalog, sorted ascending by `order`. */
export const lessons: readonly Lesson[] = [...rawLessons].sort((a, b) => a.order - b.order)

/** Returns the lesson with the given id, or `undefined` if no such lesson exists. */
export function getLessonById(id: string): Lesson | undefined {
  return lessons.find((lesson) => lesson.id === id)
}
