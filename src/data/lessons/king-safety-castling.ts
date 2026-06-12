import type { Lesson } from '../../types/lesson'

const READY_TO_CASTLE = 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 6 5'
const AFTER_OO = 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQ1RK1 b kq - 7 5'

/**
 * Tier 3 (opening) — King Safety & Castling.
 * Once developed, tuck the king into the corner early — one move that also activates a rook.
 * Neve's method: scenario + Socratic hints (the move arrow is the opt-in reveal).
 */
export const kingSafetyCastling: Lesson = {
  id: 'king-safety-castling',
  title: '王翼易位',
  category: 'opening-principles',
  difficulty: 'beginner',
  tier: 3,
  order: 17,
  summary: '子力出齊後盡早易位，把國王收到角落、同時讓城堡進場。',
  scenario: '子力差不多都上場了。但你的國王還站在中央——開局最不該久留的地方。最後一步，是把它安頓好。',
  objectives: ['知道易位能一步完成王的安全與城堡出動', '養成「子力出齊就早點易位」的習慣'],
  playerColor: 'white',
  steps: [
    {
      fen: READY_TO_CASTLE,
      text: '騎士、主教都出來了，國王卻還杵在中央。中央是棋盤最熱鬧、也最危險的地方——該把它收進角落了。',
      highlights: ['e1'],
    },
    {
      fen: READY_TO_CASTLE,
      text: '用一步「易位」，把國王送進角落、同時叫城堡進場。',
      arrows: [{ orig: 'e1', dest: 'g1' }],
      expectedMove: { from: 'e1', to: 'g1' },
      hint: '國王和那側的城堡都還沒動過、中間也清空了——有一個特別的一步，能讓國王往城堡方向跳兩格，城堡同時繞到它身邊。',
      successText: '易位完成。國王躲進兵牆後面安全多了，原本縮在角落的城堡也一步進場——一手棋做兩件事。',
    },
    {
      fen: AFTER_OO,
      text: '看出差別了嗎？國王有兵牆罩著，城堡也從角落來到中央那條開放線上。這是開局唯一能「一步做兩件事」的棋。',
      highlights: ['g1', 'f1'],
    },
    {
      fen: AFTER_OO,
      text: '記住節奏：佔中心、快出子、早易位。新手最常輸在「國王留在中央被打」——子力一出齊，就趁中心還沒打開把王收好。',
    },
  ],
}
