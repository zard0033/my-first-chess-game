import type { Lesson } from '../../types/lesson'

/**
 * Tier 4 — 殘局技術 (endgame).
 * The "how to finish a won game" tier: basic mates (K+Q, K+R) and pawn promotion
 * (opposition). Neve's method: scenario + Socratic hints (the move arrow is the opt-in
 * reveal). Clean-room authored; all FENs carry both kings; validity (FEN parse + every
 * expectedMove legal from its step fen) enforced by lessons.test.ts.
 */

const Q_BOX = '4k3/6Q1/8/3K4/8/8/8/8 w - - 0 1'
const Q_KING_UP = '3k4/6Q1/4K3/8/8/8/8/8 w - - 2 2'

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
      successText: '將死！后貼著黑王、王在背後保護它，黑王無路可逃。這就是后王逼殺的圖案。',
    },
    {
      fen: Q_KING_UP,
      text: '訣竅：后負責縮小範圍、王負責支援，最後在邊線收尾。最大的陷阱是逼和——別把對方逼到沒棋可走卻又沒被將軍，那會白白變成和棋。每一步都確認它還有合法的走法。',
    },
  ],
}

const R_LADDER = '8/8/8/4k3/8/4K3/8/7R w - - 0 1'
const R_MATE = '4k3/8/4K3/8/8/8/8/R7 w - - 0 1'

const rookMate: Lesson = {
  id: 'rook-mate',
  title: '城堡逼殺',
  category: 'endgame',
  difficulty: 'beginner',
  tier: 4,
  order: 20,
  summary: '沒有后時，用王和一座城堡走「階梯」把孤王逼到邊線將死。',
  scenario: '這次你少了后，只剩一座城堡。一樣殺得了孤王——靠的是王和城堡的配合，把它一排一排趕到牆邊。',
  objectives: ['理解王城堡如何用「階梯」逼退孤王', '在邊線完成城堡將殺', '收尾時警覺逼和'],
  playerColor: 'white',
  steps: [
    {
      fen: R_LADDER,
      text: '少了后，光靠王和一座城堡也能殺。方法叫「階梯」：兩王正對面時，用城堡將軍把對方的王逼退一排，一排一排趕到邊線。',
      highlights: ['e3', 'e5'],
    },
    {
      fen: R_LADDER,
      text: '兩王正對面了——用城堡將軍，逼黑王往後退一排。',
      arrows: [{ orig: 'h1', dest: 'h5' }],
      expectedMove: { from: 'h1', to: 'h5' },
      hint: '你的王正對著黑王。從遠遠的一側，用城堡沿著黑王所在的那一排將軍，逼它退後。',
      successText: '將軍！黑王被逼離這一排、只能往後退。城堡躲在遠處，對方的王碰不到它。',
    },
    {
      fen: R_MATE,
      text: '就這樣「王頂王、城堡將軍逼退」，一排一排把它趕到了底排。兩王又正對面——最後一將。',
      highlights: ['e6', 'e8'],
    },
    {
      fen: R_MATE,
      text: '用城堡沿著底排將軍，將死。',
      arrows: [{ orig: 'a1', dest: 'a8' }],
      expectedMove: { from: 'a1', to: 'a8' },
      hint: '你的王守住了黑王前面三個逃格，城堡只要從側面沿著最後一排將軍即可。',
      successText: '將死！黑王被自己的邊線困住，前面三格被你的王守死，城堡從側面收尾。',
    },
    {
      fen: R_MATE,
      text: '城堡逼殺的兩個要點：王和王正對面（對王），以及城堡躲在遠側將軍、不讓對方的王碰到它。一樣小心逼和——逼退時別把它趕到沒格可走又沒被將軍。',
    },
  ],
}

const P_OPPOSITION = '8/4k3/8/5K2/4P3/8/8/8 w - - 0 1'
const P_PROMOTE = '8/4PK1k/8/8/8/8/8/8 w - - 0 1'

const pawnPromotion: Lesson = {
  id: 'pawn-promotion',
  title: '兵的升變與對王',
  category: 'endgame',
  difficulty: 'beginner',
  tier: 4,
  order: 21,
  summary: '用王護送兵、以「對王」逼開敵王，把兵送到底線升變成后。',
  scenario: '對手只剩一個王，你有王加一個兵。一個兵只要走到對方底線就能變成后——但路上有敵王擋著，得靠你的王開路。',
  objectives: ['理解「對王 (opposition)」如何逼開敵王', '用王護送兵前進', '把兵送到底線升變成后'],
  playerColor: 'white',
  steps: [
    {
      fen: P_OPPOSITION,
      text: '一個兵只要走到對方底線就能變成后。但路上有對方的王擋著，你得用自己的王開路——關鍵叫「對王」。',
      highlights: ['e7', 'f5'],
    },
    {
      fen: P_OPPOSITION,
      text: '把你的王走到正對著對方王、中間只隔一格的位置——而且輪到對方動。',
      arrows: [{ orig: 'f5', dest: 'e5' }],
      expectedMove: { from: 'f5', to: 'e5' },
      hint: '對王＝兩王在同一條線、中間隔一格，換對方動。哪一步能讓你的王正對著黑王？',
      successText: '拿到對王了！現在輪對方動，它卻只能讓開——你的王就能繞過去，替兵開路。',
    },
    {
      fen: P_PROMOTE,
      text: '一步步逼開對方的王、把兵護送到了底線前。對方的王被你的王擋在外面，碰不到這個兵。',
      highlights: ['e7'],
    },
    {
      fen: P_PROMOTE,
      text: '兵到底線了——立刻把它變成最強的子。',
      arrows: [{ orig: 'e7', dest: 'e8' }],
      expectedMove: { from: 'e7', to: 'e8', promotion: 'q' },
      hint: '兵踏上底線的瞬間就能升變。回想子力價值——你會想把它變成哪個子？',
      successText: '升變成后！一個小兵翻身變成后，你的子力瞬間壓倒對手，收尾不再是問題。',
    },
    {
      fen: P_PROMOTE,
      text: '記住：兵要升變，得靠你的王一路護送，用「對王」逼開擋路的敵王。送到底線，就把它變成后。',
    },
  ],
}

/** Tier 4 endgame lessons, in curriculum order. */
export const endgameLessons: Lesson[] = [queenMate, rookMate, pawnPromotion]
