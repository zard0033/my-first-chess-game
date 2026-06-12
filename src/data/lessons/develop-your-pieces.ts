import type { Lesson } from '../../types/lesson'

const AFTER_NC6 = 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3'
const AFTER_BC5 = 'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4'
const AFTER_NC3 = 'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R b KQkq - 5 4'

/**
 * Tier 3 (opening) — Develop Your Pieces.
 * After the centre is staked, wake the minor pieces; don't shuffle the same piece twice.
 * Neve's method: scenario + Socratic hints (the move arrow is the opt-in reveal).
 */
export const developYourPieces: Lesson = {
  id: 'develop-your-pieces',
  title: '快速出子',
  category: 'opening-principles',
  difficulty: 'beginner',
  tier: 3,
  order: 16,
  summary: '開局佔好中心後，盡快把騎士、主教叫上場，別重複動同一個子。',
  scenario: '中心你已經顧到了。但棋子留在原地，再好的中心也沒人去用。開局真正的比賽，是看誰先把子力擺上場——這叫出子。',
  objectives: ['理解開局要盡快出子', '把主教調到有作用的斜線', '別在開局重複動同一個子'],
  playerColor: 'white',
  steps: [
    {
      fen: AFTER_NC6,
      text: '中心佔好了，一個騎士也跳出來了。下一步別再碰兵——把還在底排睡覺的子叫醒。先看主教：它在等一條好斜線。',
    },
    {
      fen: AFTER_NC6,
      text: '讓主教出來，挑一條能直接盯住對方弱點的斜線。',
      arrows: [{ orig: 'f1', dest: 'c4' }],
      expectedMove: { from: 'f1', to: 'c4' },
      hint: '哪一個主教的前面已經清空了？把它擺到一條斜線，瞄準對方王邊最軟的那一格。',
      successText: '好。主教一出來就盯著對方的弱點——出子不是隨便動，是讓每個子都站到能發力的地方。',
    },
    {
      fen: AFTER_BC5,
      text: '一個省力的原則：開局別重複動同一個子。你已經出了騎士和主教，接下來每一步都該換一個「新」的子上場——把全部子力擺好，比反覆挪同一個子有用得多。',
    },
    {
      fen: AFTER_BC5,
      text: '還有一個騎士沒動——讓它也跳向中心。',
      arrows: [{ orig: 'b1', dest: 'c3' }],
      expectedMove: { from: 'b1', to: 'c3' },
      hint: '哪個子到現在還沒離開底排？把它叫醒，往中心的方向出。',
      successText: '兩個騎士、一個主教都到位了——你的子力開始連成一片。出子越快，你能動用的力量越完整。',
    },
    {
      fen: AFTER_NC3,
      text: '記住開局的順序：先佔中心、再快速出子。等子力都上了場，最後一件事是把國王收到安全的地方——那是下一課。',
    },
  ],
}
