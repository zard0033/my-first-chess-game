import type { Lesson } from '../../types/lesson'

const QUEEN_OUT = 'rnb1kbnr/pppp1ppp/8/4p1q1/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 2 3'
const QUEEN_BACK = 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 4 3'

/**
 * Tier 3 (opening) — Don't Bring the Queen Out Early.
 * The queen is strongest but most valuable; an early sortie just gets chased, losing tempo.
 * Here the opponent has erred; the player punishes by developing with tempo (attacking the queen).
 * Neve's method: scenario + Socratic hints (the move arrow is the opt-in reveal).
 */
export const dontBringQueenOutEarly: Lesson = {
  id: 'dont-bring-queen-out-early',
  title: '別太早出后',
  category: 'opening-principles',
  difficulty: 'beginner',
  tier: 3,
  order: 18,
  summary: '后太早出來會被小子追著打，白費步數；先發展小子，把后留在後面。',
  scenario: '后是盤上最強的子。但越強的子越值錢——太早把它請出來，反而成了對手追著打的目標。這一局，犯錯的是對手。',
  objectives: ['理解太早出后會被追打、浪費步數', '學會用發展子力的同時攻擊對方的后'],
  playerColor: 'white',
  steps: [
    {
      fen: QUEEN_OUT,
      text: '對手太早把后請了出來，停在 g5。后很強，可它待在這裡，誰碰得到它、就能逼它跑。',
      highlights: ['g5'],
    },
    {
      fen: QUEEN_OUT,
      text: '別客氣。出一個還沒動的子，順手踩住那隻后——發展自己，又逼它逃。',
      arrows: [{ orig: 'g1', dest: 'f3' }],
      expectedMove: { from: 'g1', to: 'f3' },
      hint: '哪個還沒動的子，一跳出來就能攻擊到對方的后？把「發展」和「攻擊」一次做到。',
      successText: '騎士出來了，還順手趕走后——你發展了一個子，對手卻得花一步逃命。',
    },
    {
      fen: QUEEN_BACK,
      text: '后退回了老家。對手等於白走了兩步，你卻多一個子在場上——這就是太早出后的代價：強子變成被追打的包袱。',
    },
    {
      fen: QUEEN_BACK,
      text: '所以開局先派騎士、主教這些小子上場，把后留到中後盤再出。它太貴重，不該在開局到處跑給人追。',
    },
  ],
}
