import { Chess } from '../node_modules/chess.js/dist/esm/chess.js'

// Spike: does chess.js use STRICT or LOOSE en passant convention?
// STRICT: ep square set only when opponent pawn CAN capture en passant
// LOOSE:  ep square set after any double pawn push, regardless

// Test 1: After 1.e4 — Black has NO pawn adjacent to e-file → strict would give ep="-"
const c1 = new Chess()
c1.move('e4')
const fen1 = c1.fen()
const ep1 = fen1.split(' ')[3]
console.log('After 1.e4 (no Black pawn adjacent):')
console.log('  FEN:', fen1)
console.log('  EP field:', ep1, ep1 === '-' ? '← STRICT' : '← LOOSE')
console.log()

// Test 2: After 1.e4 d5 2.e5 f5 — White IS at e5 and Black just played f5 (strict: ep=f6 ✓)
const c2 = new Chess()
c2.move('e4'); c2.move('d5')
c2.move('e5'); c2.move('f5')
const fen2 = c2.fen()
const ep2 = fen2.split(' ')[3]
console.log('After 1.e4 d5 2.e5 f5 (White CAN capture e.p. on f6):')
console.log('  FEN:', fen2)
console.log('  EP field:', ep2)
console.log()

// Test 3: Compare with chess-openings dataset EPD for the same position
// The chess-openings TSV has entries with EPD keys — check what convention they use
import openings from '../node_modules/chess-openings/dist/chess-openings.js' assert { type: 'json' }
const all = Array.isArray(openings) ? openings : Object.values(openings)

// Find any opening whose moves contain a double pawn push as the first move
// e.g., "e2e4" → ep should be "e3" if loose, "-" if strict (no adjacent Black pawn)
const firstMove = all.find(o => o.pgn && o.pgn.startsWith('1. e4'))
if (firstMove) {
  console.log('chess-openings first entry starting with 1.e4:')
  console.log('  Name:', firstMove.name)
  console.log('  EPD/FEN from dataset:', firstMove.epd ?? firstMove.fen ?? '(no epd/fen field)')
  console.log('  Raw entry keys:', Object.keys(firstMove).join(', '))
} else {
  console.log('No opening found starting with 1. e4 — listing first entry:')
  console.log(all[0])
}
