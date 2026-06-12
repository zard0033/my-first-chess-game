import type { Lesson } from '../../types/lesson'

/**
 * Tier 1 — 基礎規則 (rules).
 * Neve's method: each lesson opens with a `scenario`; interactive steps pose the
 * idea as a question and the `hint` is Socratic (goal / what-to-avoid, never names
 * the move — the move arrow is the opt-in stage-2 reveal). All FENs carry both kings
 * (chess.js). Clean-room authored (inspired by lichess Learn); validity enforced by
 * lessons.test.ts.
 */

const pawnBasics: Lesson = {
  id: 'pawn-basics',
  title: '兵的走法與吃子',
  category: 'rules',
  difficulty: 'beginner',
  tier: 1,
  order: 1,
  summary: '兵只能往前走，但吃子是斜著吃。',
  scenario: '先從最小的棋子開始。別急著記規則——看著棋盤，感受兵能去哪、不能去哪。',
  objectives: ['知道兵往前直走、第一步可走兩格', '知道兵斜向吃子'],
  playerColor: 'white',
  steps: [
    {
      fen: '7k/8/8/8/8/8/4P3/K7 w - - 0 1',
      text: '這是一個兵。它只能「往前」直直地走，永遠不能後退，也不能左右移動。每一步都是不能反悔的決定。',
      highlights: ['e2'],
    },
    {
      fen: '7k/8/8/8/8/8/4P3/K7 w - - 0 1',
      text: '兵還沒動過時，有個一次性的特權。試著讓它前進——看你能推多遠。',
      arrows: [{ orig: 'e2', dest: 'e4' }],
      expectedMove: { from: 'e2', to: 'e4' },
      hint: '兵的第一步和之後不一樣——它能一次走得比平常遠。最遠能到哪一格？',
      successText: '兵的第一步可以選一格或兩格，之後就每次只能走一格了。',
    },
    {
      fen: '7k/8/8/3p4/4P3/8/8/K7 w - - 0 1',
      text: '前方斜上有個黑兵擋在 d5。問題來了：兵要怎麼吃掉它？',
      highlights: ['d5'],
    },
    {
      fen: '7k/8/8/3p4/4P3/8/8/K7 w - - 0 1',
      text: '想清楚兵「走」和「吃」的方向差別，再動手。',
      arrows: [{ orig: 'e4', dest: 'd5' }],
      expectedMove: { from: 'e4', to: 'd5' },
      hint: '兵直直往前的格子如果有人擋著，它過不去；但它的「吃法」方向不一樣。它能斜著碰到誰？',
      successText: '兵直走、斜吃——這是最常被記錯的一點，你已經親手走過一次了。',
    },
    {
      fen: '7k/8/8/3P4/8/8/8/K7 b - - 0 1',
      text: '直走、斜吃。記住的不是兩條規則，而是兵這個子「往前推進、靠斜線清路」的個性。',
    },
  ],
}

const rookAndBishop: Lesson = {
  id: 'rook-and-bishop',
  title: '城堡與主教',
  category: 'rules',
  difficulty: 'beginner',
  tier: 1,
  order: 2,
  summary: '城堡走直線，主教走斜線。',
  scenario: '兩個遠程子力，各管一種方向。學會分辨它們的「勢力範圍」，你就知道哪個格子歸誰罩。',
  objectives: ['知道城堡沿橫列與直行移動', '知道主教沿斜線移動'],
  playerColor: 'white',
  steps: [
    {
      fen: '7k/8/8/8/3R4/8/8/4K3 w - - 0 1',
      text: '這是「城堡」。它沿著橫列或直行，能走任意多格——只要路上沒被擋住。它是棋盤上的遠程火力。',
      highlights: ['d4'],
    },
    {
      fen: '7k/3p4/8/8/3R4/8/8/4K3 w - - 0 1',
      text: '盤面上有個黑兵可以拿。先看城堡能罩到哪些格，再決定怎麼走。',
      arrows: [{ orig: 'd4', dest: 'd7' }],
      expectedMove: { from: 'd4', to: 'd7' },
      hint: '城堡只走直線（橫或直）。從它現在的位置沿著線看出去，哪條線盡頭有子可吃？',
      successText: '城堡就是直來直往的遠程火力，一條暢通的線就是它的高速公路。',
    },
    {
      fen: '7k/8/8/8/8/8/8/2B1K3 w - - 0 1',
      text: '這是「主教」。它只能沿斜線走，所以它一輩子待在同一種顏色的格子上——這是主教的天生限制。',
      highlights: ['c1'],
    },
    {
      fen: '7k/8/7p/8/8/8/8/2B1K3 w - - 0 1',
      text: '遠方有個黑兵。順著主教能走的方向看出去，它在你的射程內嗎？',
      arrows: [{ orig: 'c1', dest: 'h6' }],
      expectedMove: { from: 'c1', to: 'h6' },
      hint: '主教只走斜線。沿著它所在格子的斜對角線一路看到底，盡頭站著誰？',
      successText: '城堡管直線、主教管斜線——兩者合起來，就能罩住整個棋盤。',
    },
    {
      fen: '7k/8/7B/8/8/8/8/4K3 b - - 0 1',
      text: '城堡是十字、主教是叉叉。腦中有了這兩張「勢力範圍圖」，你看盤面就會快很多。',
    },
  ],
}

const knightAndQueen: Lesson = {
  id: 'knight-and-queen',
  title: '騎士與后',
  category: 'rules',
  difficulty: 'beginner',
  tier: 1,
  order: 3,
  summary: '騎士走「日」字並能跳過棋子，后是城堡加主教的合體。',
  scenario: '一個最古怪、一個最強大。騎士會跳、后全能——把它們的個性看懂，比背走法有用得多。',
  objectives: ['知道騎士走 L 形且可跳子', '知道后能直能斜、是最強子力'],
  playerColor: 'white',
  steps: [
    {
      fen: '7k/8/8/8/3N4/8/8/4K3 w - - 0 1',
      text: '這是「騎士」。它走「日」字形（先直走兩格、再橫一格），而且是唯一能「跳過」其他棋子的子——它不怕被擋路。',
      highlights: ['d4'],
    },
    {
      fen: '7k/8/4p3/8/3N4/8/8/4K3 w - - 0 1',
      text: '有個黑兵在 e6。騎士的走法很反直覺，慢慢推算哪一步能跳到它身上。',
      arrows: [{ orig: 'd4', dest: 'e6' }],
      expectedMove: { from: 'd4', to: 'e6' },
      hint: '把 e6 當終點反過來想：哪些格子能用「日」字跳到 e6？你的騎士正好站在其中一個上嗎？',
      successText: '騎士的跳躍最適合出其不意，因為它能無視中間擋路的子。',
    },
    {
      fen: '7k/8/8/8/8/8/8/3QK3 w - - 0 1',
      text: '這是「后」。它等於「城堡 + 主教」：直線、斜線都能走任意多格，是棋盤上最強的子力——也因此最珍貴，別輕易讓它涉險。',
      highlights: ['d1'],
    },
    {
      fen: '7k/8/8/8/p7/8/8/3QK3 w - - 0 1',
      text: '遠處 a4 有個黑兵。后有兩種「身分」，這次用它像主教的那一面去拿。',
      arrows: [{ orig: 'd1', dest: 'a4' }],
      expectedMove: { from: 'd1', to: 'a4' },
      hint: '后能走直線也能走斜線。a4 跟你的后不在同一橫直線上——那它們之間是什麼關係？',
      successText: '后既能當城堡也能當主教——正因為它什麼都能做，失去它幾乎等於輸掉一半。',
    },
    {
      fen: '7k/8/8/8/Q7/8/8/4K3 b - - 0 1',
      text: '騎士靠跳躍製造意外、后靠全能掌控全局。主要子力的「個性」你都認識了。',
    },
  ],
}

const kingAndValue: Lesson = {
  id: 'king-and-value',
  concepts: ['material'],
  title: '王的走法與子力價值',
  category: 'rules',
  difficulty: 'beginner',
  tier: 1,
  order: 4,
  summary: '王每次只走一格；不同棋子有不同價值，換子要划算。',
  scenario: '王是你必須守住的核心，慢卻不可失。同時，學會幫每個子「估價」——這是你之後每次換子的判斷依據。',
  objectives: ['知道王每步走一格', '記住子力價值：兵1、騎士主教3、城堡5、后9'],
  playerColor: 'white',
  steps: [
    {
      fen: '7k/8/8/8/4K3/8/8/8 w - - 0 1',
      text: '這是「王」。它往任何方向都能走，但每次「只能走一格」。它走得慢，卻是全盤最重要、絕不能丟的子。',
      highlights: ['e4'],
    },
    {
      fen: '7k/8/8/4p3/4K3/8/8/8 w - - 0 1',
      text: '正前方有個黑兵。王也能吃子——它在王的步伐範圍內嗎？',
      arrows: [{ orig: 'e4', dest: 'e5' }],
      expectedMove: { from: 'e4', to: 'e5' },
      hint: '王每次只能踏出一格。那個黑兵就在它隔壁嗎？',
      successText: '王也能吃子，只是它步伐慢，通常要等到殘局才出來打仗。',
    },
    {
      fen: '7k/8/8/8/8/8/8/4K3 w - - 0 1',
      text: '每種子有大概的「身價」：兵=1、騎士=3、主教=3、城堡=5、后=9，王則是無價（丟了就輸）。換子時，心裡要有這把尺。',
    },
    {
      fen: '7k/8/8/1p3r2/3N4/8/8/4K3 w - - 0 1',
      text: '你的騎士同時能吃 b5 的兵或 f5 的城堡。兩個都吃得到——但別急，先想哪個選擇對你更有利。',
      arrows: [{ orig: 'd4', dest: 'f5' }],
      highlights: ['b5', 'f5'],
      expectedMove: { from: 'd4', to: 'f5' },
      hint: '兩個目標都在騎士的攻擊範圍內。回想剛才的身價表——拿走哪一個，對手會更心痛？',
      successText: '同樣一步，賺 5 分的城堡遠勝賺 1 分的兵——永遠優先換取價值更高的子。',
    },
    {
      fen: '7k/8/8/1p3N2/8/8/8/4K3 b - - 0 1',
      text: '王每步一格、換子看身價——這把「價值的尺」會跟著你到對局的每一個決定。',
    },
  ],
}

const checkAndEscape: Lesson = {
  id: 'check-and-escape',
  title: '將軍與解將',
  category: 'rules',
  difficulty: 'beginner',
  tier: 1,
  order: 5,
  summary: '王被攻擊就是「將軍」，必須立刻解除。',
  scenario: '整盤棋都繞著王打轉。先學會「攻擊對方的王」與「自己被攻擊時怎麼脫困」，這是所有戰術的地基。',
  objectives: ['認得「將軍」', '知道解將三法：移王、擋子、吃掉攻擊者'],
  playerColor: 'white',
  steps: [
    {
      fen: '4k3/8/8/8/8/8/8/4R1K1 b - - 0 1',
      text: '白城堡正沿著 e 線攻擊黑王——這就是「將軍 (check)」。被將軍的一方，下一步「只能」處理這件事，別無選擇。',
      highlights: ['e8', 'e1'],
    },
    {
      fen: '4k3/8/8/8/8/8/8/R5K1 w - - 0 1',
      text: '換你來將軍黑王。黑王站在 e 線上——你手上的城堡能怎麼利用這條線？',
      arrows: [{ orig: 'a1', dest: 'e1' }],
      expectedMove: { from: 'a1', to: 'e1' },
      hint: '將軍 = 你的子攻擊到對方的王。哪一步能讓你的城堡控制住黑王所在的整條直線？',
      successText: '將軍。你逼黑王非得回應不可——這就是掌握主動權的感覺。',
    },
    {
      fen: '4k3/8/8/8/8/8/8/4R1K1 b - - 0 1',
      text: '被將軍時有三條活路：① 把王移到安全格 ② 用子擋在中間 ③ 吃掉那個攻擊的子。記住這三招，你就不會慌。',
    },
    {
      fen: '7k/8/8/8/8/8/5b2/4K3 w - - 0 1',
      text: '現在輪到你的白王被黑主教將軍了。三招之中，哪一招在這裡最乾脆？',
      arrows: [{ orig: 'e1', dest: 'f2' }],
      expectedMove: { from: 'e1', to: 'f2' },
      hint: '移王、擋子、吃掉攻擊者。攻擊你的那隻主教就在王的旁邊——有沒有辦法一勞永逸地除掉威脅來源？',
      successText: '直接吃掉攻擊者，威脅就徹底消失——這是最乾脆的解將。',
    },
    {
      fen: '7k/8/8/8/8/8/5K2/8 b - - 0 1',
      text: '被將軍一定要先解決，否則就違規了。學會「攻王」與「護王」這兩面，你已經摸到西洋棋的核心。',
    },
  ],
}

const checkmateInOne: Lesson = {
  id: 'checkmate-in-one',
  concepts: ['mate'],
  title: '一步將死',
  category: 'rules',
  difficulty: 'beginner',
  tier: 1,
  order: 6,
  summary: '將軍且對方無法解除，就是將死，遊戲結束。',
  scenario: '將死不是「吃掉」王，而是讓它「無路可走」。關鍵不在你的子有多強，而在對手的王還剩幾個逃生口。',
  objectives: ['理解「將死」是無法解除的將軍', '練習底線將殺'],
  playerColor: 'white',
  steps: [
    {
      fen: '6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1',
      text: '看黑王——它被自己的三個兵堵死在角落，一個逃生口都沒有。這種「底線弱點」在實戰裡到處都是。',
      highlights: ['f7', 'g7', 'h7'],
    },
    {
      fen: '6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1',
      text: '你的城堡有一條暢通的大道。把它送上去會發生什麼事？',
      arrows: [{ orig: 'a1', dest: 'a8' }],
      expectedMove: { from: 'a1', to: 'a8' },
      hint: '將死 = 將軍 + 王無處可逃。黑王的逃生格已被自己的兵堵住——你只要再控制住牠所在的那一排就行。',
      successText: '將死。注意你贏的關鍵不是城堡多強，而是黑王沒有逃生口。以後看到對方王悶在底線、沒開氣孔，就要想到這一招。',
    },
    {
      fen: 'R5k1/5ppp/8/8/8/8/8/6K1 b - - 0 1',
      text: '將死的本質是「無路可走」。這也反過來提醒你：自己的王也要記得留逃生口，別被同一招打。',
    },
  ],
}

const specialRules: Lesson = {
  id: 'special-rules',
  title: '特殊規則',
  category: 'rules',
  difficulty: 'beginner',
  tier: 1,
  order: 7,
  summary: '王城堡易位、吃過路兵、兵的升變、逼和——四個容易忽略的特殊規則。',
  scenario: '四個新手常忽略的規則。每一個背後都有它存在的「理由」，懂了理由就不必硬背。',
  objectives: ['會王城堡易位', '會吃過路兵', '會把兵升變', '認識逼和（和棋）'],
  playerColor: 'white',
  steps: [
    {
      fen: '4k3/8/8/8/8/8/8/4K2R w K - 0 1',
      text: '「王城堡易位」是唯一能同時動兩個子的走法。它的目的很單純：快速把王送到角落、變安全，同時讓城堡參戰。',
      highlights: ['e1', 'h1'],
    },
    {
      fen: '4k3/8/8/8/8/8/8/4K2R w K - 0 1',
      text: '做一次短易位。動的是王（城堡會自動跟上）——想想王該往哪個方向移、移幾格。',
      arrows: [{ orig: 'e1', dest: 'g1' }],
      expectedMove: { from: 'e1', to: 'g1' },
      hint: '易位時你移動的是「王」，朝著城堡的方向跨兩格。城堡會自己跳到王的另一側。',
      successText: '易位完成。王躲好了、城堡也順勢參戰——開局盡早易位，是保護王的好習慣。',
    },
    {
      fen: '4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1',
      text: '「吃過路兵」：黑兵剛從 d7 衝兩格到 d5，和你的 e5 兵並排。規則給你一個機會——但只有現在這一步。',
      highlights: ['d5', 'd6'],
    },
    {
      fen: '4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1',
      text: '把握這個轉瞬即逝的機會。把那個衝過頭的黑兵當作只走了一格來處理。',
      arrows: [{ orig: 'e5', dest: 'd6' }],
      expectedMove: { from: 'e5', to: 'd6' },
      hint: '你的兵照常斜著吃，但落點是那個黑兵「如果只走一格」會停的位置，而不是它現在站的格子。',
      successText: '過路兵只有「緊接著的下一步」能吃，錯過就永遠沒了。',
    },
    {
      fen: 'k7/4P3/8/8/8/8/8/4K3 w - - 0 1',
      text: '「升變」：兵一旦走到對方底線，就立刻變成更強的子。這是小兵翻身的時刻。',
      highlights: ['e7'],
    },
    {
      fen: 'k7/4P3/8/8/8/8/8/4K3 w - - 0 1',
      text: '把兵送到底線。到達之後，回想子力價值——你會想升變成什麼？',
      arrows: [{ orig: 'e7', dest: 'e8' }],
      expectedMove: { from: 'e7', to: 'e8', promotion: 'q' },
      hint: '先讓兵抵達對方的底排；既然可以任選，就挑那個身價最高（9 分）的子。',
      successText: '一兵變后——這常常是殘局逆轉勝負的關鍵，別小看任何一個兵。',
    },
    {
      fen: '7k/8/5KQ1/8/8/8/8/8 b - - 0 1',
      text: '最後是「逼和」：輪到的一方沒被將軍、卻一步合法棋都走不出來，這局算「和棋」，不是你贏。所以大優時要小心，別把對方逼到無路可走卻又沒將軍——那會白白丟掉勝利。',
    },
  ],
}

const tier1Capstone: Lesson = {
  id: 'rules-capstone',
  title: '綜合演練：讀懂這個盤面',
  category: 'rules',
  difficulty: 'beginner',
  tier: 1,
  order: 8,
  summary: '把子的走法、王的安全與將死串起來——一步結束戰鬥。',
  scenario: '基礎規則你都學過了。現在不給提示走法，只給你一個盤面——像我一樣，先讀懂它，再出手。',
  objectives: ['整合運用：子力走法 + 王的安全 + 將死', '養成「先看對手的王能逃去哪」的習慣'],
  playerColor: 'white',
  steps: [
    {
      fen: '6k1/5ppp/8/8/8/8/8/2Q3K1 w - - 0 1',
      text: '看整個盤面：黑王 g8 被自己三個兵悶死，沒有逃生口。你有一個后，后能走直線。能不能一步結束？',
      highlights: ['g8', 'f7', 'g7', 'h7'],
    },
    {
      fen: '6k1/5ppp/8/8/8/8/8/2Q3K1 w - - 0 1',
      text: '別找「隨便一個將軍」，要找「將軍且黑王完全無處可逃」的那一步。',
      arrows: [{ orig: 'c1', dest: 'c8' }],
      expectedMove: { from: 'c1', to: 'c8' },
      hint: '先問自己：黑王現在有哪些逃生格？（多半已被牠自己的兵堵住。）你要的那一步，要把僅剩的逃路也一起蓋掉。后能控制一整排。',
      successText: '將死。這步贏在哪？不是后多強，而是黑王沒有逃生口、而你的后同時鎖住了整條第 8 列。看穿「對手的王能逃去哪」，你就看穿了將殺。',
    },
    {
      fen: '2Q3k1/5ppp/8/8/8/8/8/6K1 b - - 0 1',
      text: '子怎麼走、王怎麼保護、怎麼將死——其實是同一個問題的三面：把火力對準對方無處可逃的王。基礎打穩了，接下來進入「戰術」。',
    },
  ],
}

/** Tier 1 lessons in curriculum order. */
export const rulesLessons: Lesson[] = [
  pawnBasics,
  rookAndBishop,
  knightAndQueen,
  kingAndValue,
  checkAndEscape,
  checkmateInOne,
  specialRules,
  tier1Capstone,
]
