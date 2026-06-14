import type { Lesson } from '../../types/lesson'

/**
 * Tier 4 — 殘局技術 (endgame).
 * The "how to finish a won game" tier: basic mates (K+Q, K+R) and pawn promotion.
 * Neve's method: scenario + Socratic hints (the move arrow is the opt-in reveal). Clean-room
 * authored; every FEN carries both kings; each step CONNECTS to the next by a single move (the
 * player's move, then the scripted reply animates) — no teleporting. Validity (FEN parse + every
 * expectedMove legal) is enforced by lessons.test.ts; the mates/lines are chess.js-verified.
 */

const Q_BOX = '4k3/6Q1/8/3K4/8/8/8/8 w - - 0 1'
const Q_KING_UP = '3k4/6Q1/4K3/8/8/8/8/8 w - - 2 2'
const Q_MATED = '3k4/3Q4/4K3/8/8/8/8/8 b - - 3 2'

const queenMate: Lesson = {
  id: 'queen-mate',
  title: '后王逼殺',
  category: 'endgame',
  difficulty: 'beginner',
  tier: 4,
  order: 19,
  summary: '用王和后合作，把孤王逼到邊線將死；收尾時小心別逼和。',
  scenario: '對手只剩一個光桿司令，你有王加后。后很強，卻殺不了孤王——真正收尾的，是王和后的合作。',
  objectives: ['理解后單獨殺不了孤王，需要王支援', '把孤王逼到邊線將死', '收尾時警覺逼和（和棋）'],
  playerColor: 'white',
  steps: [
    {
      fen: Q_BOX,
      text: '你的后已經把黑王困在底排，但它自己碰不到對方的王。最後一哩，得讓你的王走上來幫忙。',
      highlights: ['e8'],
    },
    {
      fen: Q_BOX,
      text: '把你的王往對方王的方向送一步，準備替后撐腰。',
      arrows: [{ orig: 'd5', dest: 'e6' }],
      expectedMove: { from: 'd5', to: 'e6' },
      hint: '后困住了王，卻少了靠山。讓你的王靠近對方的王，走到能保護將殺格的位置。',
      successText: '王到位了——它正對著黑王、只隔一排。現在后有了後盾，可以收網。',
    },
    {
      fen: Q_KING_UP,
      text: '黑王被逼到只剩底排能動。你的王守住了所有逃格，后只要送上最後一擊——記得：那一步必須是「將軍」。',
    },
    {
      fen: Q_KING_UP,
      text: '后沿著第七排滑過去，貼著黑王將死。',
      arrows: [{ orig: 'g7', dest: 'd7' }],
      expectedMove: { from: 'g7', to: 'd7' },
      hint: '把后移到緊貼黑王的那一格，靠你的王在背後撐腰，讓黑王連一個逃格都不剩。',
      successText: '將死。后貼著黑王、王在背後保護它，黑王無路可逃——這就是后王逼殺的圖案。',
    },
    {
      fen: Q_MATED,
      text: '訣竅：后負責縮小範圍、王負責支援，最後在邊線收尾。最大的陷阱是逼和——別把對方逼到沒棋可走卻又沒被將軍，那會白白變成和棋。每一步都確認它還有合法的走法。',
    },
  ],
}

const R_BOX = '6k1/R7/8/6K1/8/8/8/8 w - - 0 1'
const R_CORNER = '7k/R7/6K1/8/8/8/8/8 w - - 2 2'
const R_MATED = 'R6k/8/6K1/8/8/8/8/8 b - - 3 2'

const rookMate: Lesson = {
  id: 'rook-mate',
  title: '城堡逼殺',
  category: 'endgame',
  difficulty: 'beginner',
  tier: 4,
  order: 20,
  summary: '沒有后時，用王和一座城堡把孤王逼到角落將死。',
  scenario: '這次你少了后，只剩一座城堡。一樣殺得了孤王——靠的是王和城堡的配合，把它逼到牆邊收網。',
  objectives: ['理解王城堡如何把孤王逼到邊線', '在角落完成城堡將殺', '收尾時警覺逼和'],
  playerColor: 'white',
  steps: [
    {
      fen: R_BOX,
      text: '你的城堡守住第七排，把黑王鎖在底排——它一格都跨不過城堡這條線。少了后，就靠王和城堡把它逼進角落。',
      highlights: ['g8'],
    },
    {
      fen: R_BOX,
      text: '你的王頂上去，跟黑王正面對峙，逼它往角落退。',
      arrows: [{ orig: 'g5', dest: 'g6' }],
      expectedMove: { from: 'g5', to: 'g6' },
      hint: '兩王正對面、中間隔一格時，黑王就被你和城堡夾住了。把王往黑王的方向送一步。',
      successText: '王頂上來了——黑王前面的退路被你的王和城堡夾死，只能往角落挪。',
    },
    {
      fen: R_CORNER,
      text: '黑王被逼進了角落（我替它走了這步）。它前面那排全被你的王守著，城堡這條線又跨不過去。',
      highlights: ['h8'],
    },
    {
      fen: R_CORNER,
      text: '城堡沿著底排將軍——收網。',
      arrows: [{ orig: 'a7', dest: 'a8' }],
      expectedMove: { from: 'a7', to: 'a8' },
      hint: '你的王守住黑王前面的逃格，城堡只要從遠端沿最後一排將軍即可。',
      successText: '將死。王守住所有逃格、城堡從遠端將軍，黑王在角落無路可逃。這就是城堡逼殺：王頂王、城堡收網。',
    },
    {
      fen: R_MATED,
      text: '記住城堡逼殺的兩個要點：王和王正對面（對王）守住逃格，城堡躲在遠端將軍、對方的王碰不到它。一樣小心逼和——逼退時別讓它無處可走卻又沒被將軍。',
    },
  ],
}

// Kf7/Pe6/Kd6, white to move. The white king already guards the promotion square e8. 1.e7 (the
// pawn can't be captured — Kf7 defends e7), scripted reply ...Kd5, then 2.e8=Q with the new queen
// protected by Kf7 (Kxe8 is illegal) → a clean K+Q vs K win, no stalemate. Verified by chess.js.
// Teaches: keep your king on the promotion square and escort the pawn home safely.
const PROMO_BLOCK = '8/5K2/3kP3/8/8/8/8/8 w - - 0 1'
const PROMO_YIELD = '8/4PK2/8/3k4/8/8/8/8 w - - 1 2'
const PROMO_DONE = '4Q3/5K2/8/3k4/8/8/8/8 b - - 0 2'

const pawnPromotion: Lesson = {
  id: 'pawn-promotion',
  title: '兵的升變',
  category: 'endgame',
  difficulty: 'beginner',
  tier: 4,
  order: 21,
  summary: '用王守住升變格、護送兵前進，把兵送到底線升變成后。',
  scenario: '對手只剩一個王，你有王加一個兵。一個兵只要走到對方底線就能變成后——關鍵是你的王要守住升變格、護著兵一路前進，別讓敵王搆到它。',
  objectives: ['理解用自己的王守住升變格、護送兵前進', '把兵推進到底線', '升變成后且不被敵王吃掉'],
  playerColor: 'white',
  steps: [
    {
      fen: PROMO_BLOCK,
      text: '你的兵離底線只剩兩步，你的王守在 f7、正盯著升變格 e8。敵王在一旁卻搆不到——看你怎麼護著兵走完最後兩步。',
      highlights: ['e8', 'f7'],
    },
    {
      fen: PROMO_BLOCK,
      text: '把兵推進一步——有王在背後守著，敵王碰不到它。',
      arrows: [{ orig: 'e6', dest: 'e7' }],
      expectedMove: { from: 'e6', to: 'e7' },
      hint: '兵往前一步，離升變只剩一步；你的王在 f7 守著 e7 和 e8，敵王吃不到兵。',
      successText: '兵挺進到 e7，王在 f7 罩著它——敵王碰不到，升變只剩一步。',
    },
    {
      fen: PROMO_YIELD,
      text: '你的王守住 e8、兵也逼近底線，敵王只能在旁邊看著（我替它走了一步）。底線就在眼前。',
      highlights: ['e8', 'f7'],
    },
    {
      fen: PROMO_YIELD,
      text: '底線就在眼前——把兵送上去，升變成后。',
      arrows: [{ orig: 'e7', dest: 'e8' }],
      expectedMove: { from: 'e7', to: 'e8', promotion: 'q' },
      hint: '兵踏上底線的瞬間就能升變；你的王 f7 守著 e8，升出來的子誰也吃不掉。回想子力價值——你會想把它變成哪個子？',
      successText: '升變成后，而且你的王 f7 守著它——黑王碰不到。一個小兵走到底線翻身為后，勝勢到手。',
    },
    {
      fen: PROMO_DONE,
      text: '記住：兵要升變，靠你的王先守住升變格、再護著兵一步步推進。王罩著，升出來的后才安全——送到底線，就把它變成后。',
    },
  ],
}

/** Tier 4 endgame lessons, in curriculum order. */
export const endgameLessons: Lesson[] = [queenMate, rookMate, pawnPromotion]
