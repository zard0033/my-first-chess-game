import type { Puzzle } from '../../types/puzzle'

/**
 * Level 3 — 進階：殘局將殺與騎士捉雙取后。Clean-room authored; FENs carry both kings
 * and solutions are legal lines (enforced by puzzles.test.ts).
 */
export const level3Puzzles: Puzzle[] = [
  {
    id: 'l3-corner-mate',
    level: 3,
    order: 5,
    motif: 'mate-in-1',
    title: '王的牢籠',
    prompt: '白方走步，一步將死',
    fen: 'k7/8/K7/8/8/8/8/7R w - - 0 1',
    solution: [{ from: 'h1', to: 'h8' }],
    hint: '對方國王被擠在角落，你的國王已經看住了旁邊的逃格。剩下那條底線交給誰？',
    successText: '國王封住逃格、城堡攻入底線——這是最基本的「王＋城堡」殺王法。殘局裡記住這個圖案，多一座城堡就能收尾。',
  },
  {
    id: 'l3-knight-fork-queen',
    level: 3,
    order: 6,
    motif: 'fork',
    title: '騎士奪后',
    prompt: '白方走步，用捉雙贏取對方的后',
    fen: '4q1k1/8/8/8/4N3/8/8/6K1 w - - 0 1',
    solution: [{ from: 'e4', to: 'f6' }],
    hint: '想像騎士跳到能將軍的格子，它的八個攻擊點裡，有沒有一個正好踩著對方的后？',
    successText: '騎士同時將軍與攻后，對手只能二選一——救了王就丟了后。記牢這個圖案：當騎士能一步碰到對方的王和后，通常就是免費的大子。',
  },
]
