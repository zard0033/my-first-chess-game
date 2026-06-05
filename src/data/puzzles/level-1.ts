import type { Puzzle } from '../../types/puzzle'

/**
 * Level 1 — 入門：直接吃子與最基本的將殺。Clean-room authored; every FEN carries both
 * kings and every solution is a legal line (enforced by puzzles.test.ts). 西洋棋用語：
 * rook=城堡, knight=騎士, bishop=主教, queen=后, king=國王, pawn=兵.
 */
export const level1Puzzles: Puzzle[] = [
  {
    id: 'l1-capture-queen',
    level: 1,
    order: 1,
    motif: 'capture',
    title: '棋子取奪',
    prompt: '白方走步，吃下對方子力',
    fen: '4k3/8/8/8/3q4/8/8/3RK3 w - - 0 1',
    solution: [{ from: 'd1', to: 'd4' }],
    hint: '盤面上有沒有哪個子是沒人保護、可以直接吃掉的？先找最值錢的目標。',
    successText: '城堡沿著直線一路吃掉對方的后——沒被保護的子就是免費的。每步落子前，先掃一遍對手有沒有「空著」的子。',
  },
  {
    id: 'l1-back-rank-mate',
    level: 1,
    order: 2,
    motif: 'mate-in-1',
    title: '一擊制勝',
    prompt: '白方走步，一步將死',
    fen: '6k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1',
    solution: [{ from: 'a1', to: 'a8' }],
    hint: '對方的國王被自己的兵困在底線，逃不掉。你的城堡能不能直接攻進那條線？',
    successText: '底線將殺：國王被自家的兵擋住退路，城堡攻入第八排即無解。也記得替自己的國王留個透氣孔，免得反被將死。',
  },
]
