import type { Puzzle } from '../../types/puzzle'

/**
 * Level 2 — 戰術：捉雙與子力價值。Clean-room authored; FENs carry both kings and
 * solutions are legal lines (enforced by puzzles.test.ts).
 */
export const level2Puzzles: Puzzle[] = [
  {
    id: 'l2-pawn-takes-queen',
    level: 2,
    order: 3,
    motif: 'capture',
    title: '小兵立功',
    prompt: '白方走步，贏取對方的后',
    fen: '4k3/8/8/3q4/4P3/8/8/4K3 w - - 0 1',
    solution: [{ from: 'e4', to: 'd5' }],
    hint: '兵是怎麼吃子的？看看你的兵斜前方站著什麼。',
    successText: '兵用斜線吃子——再大的后也擋不住一個位置正確的小兵。子力價值不等於安全，站錯位子的后照樣被吃。',
  },
  {
    id: 'l2-knight-fork-rook',
    level: 2,
    order: 4,
    motif: 'fork',
    title: '捉雙取城',
    prompt: '白方走步，用捉雙贏取城堡',
    fen: '4k3/3r4/8/8/4N3/8/8/4K3 w - - 0 1',
    solution: [
      { from: 'e4', to: 'f6' },
      { from: 'e8', to: 'd8' },
      { from: 'f6', to: 'd7' },
    ],
    hint: '有沒有一個落點，能讓你的騎士同時將軍、又碰到那座城堡？',
    successText: '騎士跳到 f6 同時將軍並攻擊城堡——對手先救王，你下一步就白吃城堡。騎士的捉雙最難防，因為它的攻擊擋不住。',
  },
]
