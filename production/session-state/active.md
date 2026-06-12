<!-- STATUS -->
Epic: 課程/試煉 UI 修正批 + 2-3 升變框
Feature: 一批 bug/語氣/連接性修正（未 commit，待 Eason 測）
Task: 下一步＝2-3 升變框 redesign + 變身動畫
<!-- /STATUS -->

> **交接快照**：只留現況 + 待辦 + 鐵則。歷史細節在 git log；詳盡規格在各 GDD / EPIC。
> 全專案總覽 `production/epics/index.md`（較舊，試煉/學習迴圈狀態以本檔為準）。

---

## 現況（產品已全線可用）

- **核心動線**：對局 → 賽後檢討(#7) → 課程(#18) / 試煉(#19)，雲端登入 + 跨裝置同步。
- **試煉道場 (#19)**：完成（30 題、地圖、解題、跨裝置進度，`dungeon_progress` 表已驗）。
- **學習迴圈 (#20)**：Phase A/B/C 完成（概念底層、雙向橋接課程↔試煉、概念地圖 `/learn/concepts`、
  賽後檢討的中立 opt-in 概念標記 v1＝mate + material）。**概念頁已改版＝「熟悉度地圖 + 按戰術切入學習」
  雙職，可側門跳學鎖住的戰術（不污染線性進度）；側門已學雲端同步（`lesson_side_learned` 表已套用）。**
- **game-replay (#S10)**：QA APPROVED；S10-05 動畫 polish 已 deferred；剩 iPhone 實機。
- **訪客模式 local-first + 續玩對局**：done+push（`170abf0`）。訪客完局讀本地 queue、登入 flush 同步；Resume 每步存 local／離開推雲／登入 last-write-wins。**程式已 push，剩實機驗收（見待辦）**。
- **測試**：vue-tsc 0、vitest **664 passed**。

## UI Redesign（2026-06-09～06-11，已全數 push）

> 主計畫 `production/redesign-2026-06.md`；每 Phase 細節在 git log。

- **Phase 0–4 全 done+push**：共用語言／PlayView（`6e35394`）／HomeView（`ff4a675`）／學習三頁（`727ec56`）／試煉兩頁（DungeonMap 透視 funnel + Puzzle H/M）。
- **Redesign 回饋 A1/B2/B4/C + 試煉地圖 chrome + 學習 IG 分頁**：done+push（2026-06-10）。
- **Bug 2 對局側板一屏優化**：done+push（2026-06-11）。合併密度列（徽章＋身分一行，nowrap，文字精簡「思考中」「Lv.X」防窄面板溢出）+ 棋譜捲動區 `max-h-[9rem]`（桌機 12rem）+ 側板自然高度貼合內容。待 iPhone 實機驗收（AI 思考列、棋譜捲動）。
- **鐵則**：redesign 類先跑 `/redesign` 對真實畫面出 H/M/L → Eason 拍板 → 才施工，**即使已給明確方向也不例外**。

## ✅ 課程系統 = 四階課綱完整（S05 完成）

> 教練人格 Neve + 試煉 brief 已 push（`24c1e3d`）；repo 改名 base path 已 push（`e137bef`）。

- **課綱 21 課、orders 1–21 連續**：規則 8 + 戰術 6 + **開局 4**（控制中心/快速出子/王翼易位/別太早出后）
  + **殘局 3**（后王逼殺/城堡逼殺/兵升變對王）。學習弧線完整：規則→戰術→開局→收官。
- **教練人格 Neve（已 push `24c1e3d`）**：SoT `design/gambit-design-system/persona-neve.md`。課程＝Neve 第一
  人稱對你說、試煉 brief＝你內化後的第三人稱觀察、概念＝中性。寫任何課程/試煉/概念文案前先讀此 SoT。

## 🟡 未 commit／push（working tree）

- **S05 課程內容撰寫**（新增 `data/lessons/{develop-your-pieces,king-safety-castling,dont-bring-queen-out-early,
  endgame}.ts`、改 `index.ts`、`rules.ts`+`control-the-center.ts` 語氣巡檢）：
  開局補 3 課 + 殘局 tier 從零建 3 課；既有課反射式讚美 9 處收掉（對齊 Neve「不輕易讚美」）。
  殘局將殺已用 chess.js 實證（Qd7#/Ra8# checkmate=true、對王邏輯正確、升變合法）。
- **驗證**：vue-tsc 0、vitest **664 passed**。**新課互動步（易位 O-O、升變 e8=Q）的 chessground 拖放待實機點一輪**
  （合成事件 Playwright 難觸發；資料層已 chess.js 驗證）。

### 🟡 UI 修正批（本輪，未 commit，待 Eason 一起測）

> dev server 跑著（`http://localhost:5173/`，base=`/`）。`?from=concept` 可繞課程鎖直達任何課；
> 訪客閘門需 `sessionStorage['gambit:guest-entry']='1'`。

- **4 bug**：①首頁「學習進度」StatCard 包 `RouterLink to=/learn`（原本點了沒反應）；②`LessonView` 教練頭像
  寫死「貝」→ `COACH.name.charAt(0)`（Cubic 字體、`translate-y-[1.5px]` 置中）、「教練 ·」拿掉只留 Neve；
  ③試煉走錯：`moveLog` 累積頂掉 CTA → 改 `lastResult` 單筆覆蓋、釘卡片右上 turn 列；④`chess-board.vue`
  `resetPosition()` 走錯滑回時清 `lastMove` 高亮（綠格殘留修正）。
- **語氣全面 review**：17 處慶祝式「！」/興奮詞（將死/將軍/易位完成/升變/威風/抓到了…）收成冷靜陳述（對齊 Neve）。
- **升變課（2-2）重寫**＋**endgame 連接性修正**：chess.js 掃全 21 課相鄰步，scenario 三課（后王/城堡/升變）的
  「互動後跳場」修掉——rook-mate 重建連貫線、queen/pawn 收尾敘述步改「動完後」盤面。基礎規則/捉雙等「換範例跳」
  Eason 同意維持（刻意分例教學）。
- **複習按鈕（B）**：`DungeonPuzzleView` 複習 → `/learn/concepts?focus=<conceptId>`（concept hub，1:N）；
  `ConceptMapView` 讀 `focus` query → 金框**呼吸脈動 2.4s fade-out**（`.concept-focus-ring`，只動 opacity）+ 捲到該概念。
- **驗證**：vue-tsc 0、vitest 664、endgame 連接性 chess.js 掃過乾淨。**待 Eason 重測後一起 commit**。

### 2-3 升變框 redesign + 變身動畫 — done（未 commit，待 Eason 實機測）

- **走 Option A（CSS 重塑原生 dialog，Eason 拍板）**：反編譯 vue3-chessboard 確認原生升變 UI 硬綁在內部
  `changeTurn`（`movable.events.after`），永遠搶先、boardConfig 擋不掉；接管原生需碰 private 內部（風險高），
  故改最小可行解＝CSS reskin 原生 `.promotion-dialog`。
- **改了什麼**：①`board-theme.css` 加 `.promotion-dialog` Gambit reskin（surface.card 米底＋line.strong 邊＋
  card 陰影/圓角）＋棋子換成 Gioco Wood `/pieces/*.svg`（原生 cburnett base64 棄用）；按鈕用 `aspect-ratio:1/1`
  自撐高度（原生 `height:100%` 在 content-driven 父層會塌 0）。②`chess-board.vue` 加「兵→選定子」變身 overlay：
  升變格上疊 pawn SVG `opacity/scale` 淡出 + 選定子 `scale .55→1 + opacity` 淡入，只動 transform/opacity、
  300ms 對齊 `PIECE_MOVE_ANIM_MS`、reduced-motion 跳過。③**升變時棋盤壓暗 scrim**（`.main-board::after`，
  deep-jade rgba(16,48,41,.28)，掛 library 既有的 `.main-wrap.disabledBoard`，z-index 10 在棋子上、dialog 999 下）。
  ④**升變框美化（redesign，Eason 拍板 H+M+L）**：每顆棋子獨立 tile（surface.raised 底＋line 邊＋圓角）、
  hover/focus 金邊 `#F8B500`＋金光圈＋`translateY(-2px)`（只過渡 transform，box-shadow 即時不過渡守 Gambit）、
  卡片頂金色細線（reward cue）、棋子 `background-size:72%` 留白。**金色只在升變 reward 瞬間出現，不違鐵則**。
- **驗證**：vue-tsc 0、vitest 664。Playwright 注入 dialog 驗 reskin（米卡片＋4 Gioco Wood 棋子）✅。
  **變身動畫＋實際升變拖放待 Eason 實機**（合成事件難觸發）。驗證點：`/learn/pawn-promotion?from=concept` 第 4 步、對局/試煉升變。
- **遺留**：自訂 `components/promotion-dialog.vue` ＋ `chess-board.vue` 的 `pendingPromotion`/`handlePromotionSelect`/
  `handlePromotionCancel`/`isPromotionMove` 分支現為 dead code（原生永遠搶先，Option A 不走自訂路徑）。未刪，待 Eason 決定是否清。

## 🚧 待辦 / 開放項

- **migration**：`in_progress_game` 已確認套用（2026-06-12 查 `to_regclass` 有表）。Supabase 6 張表全到位，無待套 migration。
- **push 後待 iPhone 實機驗收（累積）**：①Resume「每步存」真實 chessground 落子（合成事件 Playwright 難觸發）；②課程換步殘留綠格已消（`f9be8df`）；③登入開場動線——Magic Link 回跳登入、PWA 冷啟動擋 sign-in／點訪客放行；④`14fa407` 那批（試煉下一題、棋盤對齊、last-move 高亮、易位點城堡、座標木框）；⑤Magic Link 登入流程（S8-06）、game-replay、apple-touch/PWA 圖標。
- **對局頁「專注模式」自動收 navbar（Eason 提案，未來獨立任務）**：Eason 想要 IG 式「靜止縮小／滑動回復」navbar。
  結論：**捲動驅動不適用對局頁**（一屏不捲＝沒手勢叫回，會卡死）。若要做，改**狀態驅動**——對局進行中
  （PLAYER_TURN/AI_THINKING）自動收底部 nav 進專注模式、結束或底緣上滑叫回。屬**全站導覽改動**（影響每頁），
  要留意 Gambit「平靜少動效」鐵則 + iOS 底緣手勢衝突。IG 原版捲動隱藏留給會長捲的頁（學習/試煉清單）。獨立評估。
- **vue3-chessboard 幾何/易位踩坑（技術護欄，重要）**：①棋盤容器寬須對齊 8 倍數，否則 chessground 把 cg-board floor 成 8n 偏移（`useBoardFit` ResizeObserver 解，套在木框內 `.board-fit`）；②overlay（標註/箭頭/check ring/castle hint/座標）定位要用**真實 cg-board 尺寸＋相對 cg-wrap 原點**，非 cg-wrap 寬（`chess-board.vue` squareToRect 已改，連帶修好 active 舊待辦的 annotation 2-4px 偏移）；③易位 chess.js 只收 `e1→g1/c1`，城堡格手勢要 remap 成 king 兩格目標；④`boardConfig.events.select(key)` 可偵測選子，用來觸發城堡格提示；⑤座標自繪在木框（chessground `coordinates:false`），木框 tray 用 p-3 留帶、font-num 暖米色 `rgba(233,217,186,0.6)`。
  ⑥**不可用 `max-w` 依高度硬縮棋盤**：棋盤高度被內部 pin 住，縮木框寬會把棋盤壓成非正方（h 檔被裁）。要省空間改縮周邊（合併列、棋譜上限），別碰棋盤寬。Tailwind arbitrary calc 內 `-` 兩側要用底線：`calc(100dvh_-_Nrem)`。

- **#3 過場效能**：上面那批是推測性修法，**待 Eason 下次實機確認**點 tab 換頁/膠囊動畫是否變順。
- ~~**試煉題卡「補充描述」逐題撰寫**~~ **done（未 commit，見上節）**：Puzzle 加必填 `brief`、30 題逐題撰寫、
  題卡常駐渲染、測試內容閘門 + Playwright 截圖驗證。文案討論於 git log。
- **B5 桌機棋盤尺寸已解（root cause 紀錄，重要）**：vue3-chessboard 的 `.main-wrap` SECTION 被釘死
  `width:700px` 撐爆容器（不是 cg-wrap）。解法＝board wrapper 加 class `board-fit` ＋ scoped
  `.board-fit :deep(.main-wrap){width:100%!important;max-width:100%!important;height:auto!important}`，
  main-wrap→main-board(aspect)→cg-board 就一起 follow 外層寬度。課程桌機＝board `lg:flex-1` 主寬、對話
  `lg:w-[26rem]` 次寬、按鈕並排；課程／試煉棋盤都加木框 wooden tray。**其他用到棋盤的頁（PlayView/Review/Replay）
  若也遇棋盤過大，套同一個 `board-fit` :deep fix 即可。**
- **B5 試煉互動需部署實機驗證**：log 框累積對錯、inline 達成（不彈窗）、答錯棋子 setPosition 滑回、課程換步不 remount、
  揭曉箭頭走子後消失——這些互動 chessground 合成事件難在 Playwright 自動觸發，已靠 vue-tsc 0＋645 test＋邏輯正確性保證，
  Eason 部署後實機點一輪確認（特別是答錯滑回＋對手不亂動）。
- **annotation 高亮/箭頭 vs 棋盤格子 2-4px 偏移（polish，後續）**：MoveAnnotationDisplay 用 boardRef
  ＝`elements.wrap`（.cg-wrap，量到 536px）算格子；但 chessground 實際棋盤 `cg-board` 是 531.2px（內部設定、
  左偏 ~5px），導致 keySquare 高亮/箭頭比真實格子算大 sq、整體偏 dx≈-2 dy≈+4。修法：annotation 改用
  `elements.board`（cg-board）的尺寸＋原點，或讓 cg-board=cg-wrap（coords overlay／chessground 重繪）。牽涉
  全站箭頭/標註定位（課程/試煉/review/replay），需獨立驗證故未在 B5 收尾動。
- ~~**課程內容撰寫 (S05)**~~ **done（未 commit，見上）**：四階課綱 21 課全到位（開局補完、殘局從零建）。
- **dead-file 稽核（Eason 喊暫緩，未動）**：src ~11 orphan（ui/checkbox·label·progress·tooltip、
  composables/use-stockfish）、模板殘留 `docs/engine-reference/`、`CCGS Skill Testing Framework/`、
  引擎 specialist agents、`public/board/wood12_bg.jpg` 皆可清。
- **Phase C+ / D（未排程）**：捉雙/牽制賽後偵測（需精準度實測）；Claude API 動態講解（選配，最後）。
- **文件**：`epics/index.md` 試煉/學習迴圈狀態待補（純文件）。UI drift 報告
  `production/qa/ui-drift-audit-2026-06-07.md`：整體一致，H/M 級已套、L 級刻意不動。

## 🔑 鐵則 / 技術參考

- **Push guardrail**：`git push origin main`，**絕不 bare `git push`**（origin=你的 fork、upstream=模板）。
  push 前先列 commit message 等 Eason 確認。
- **部署 base path**：JS/inline-style 的資產路徑（`url()`、`<img src>`、`mask-image`）**必加
  `import.meta.env.BASE_URL`**，否則部署子路徑下 404；只有 `.css` 的 `url()` 會被 Vite 自動補。詳見 CLAUDE.md。
- **設計 SoT**：`design/gambit-design-system/`（deep-jade #103029 錨、品牌金 #F8B500 只 focus/reward、
  暖 cream 內容、BIZ UDPMincho 標題 / Sarasa 內文 / LXGW 課文 / Cubic 數字）。Lucide icon、無 emoji、
  touch ≥44px、平靜語氣、**無 streak/timer/leaderboard**。
- **西洋棋用語**：后/城堡/騎士/主教/國王/兵；**禁象棋 車/馬/象**。
- **內容授權**：lichess 題庫位置/解法＝CC0 可商用；lila/chessops/Learn 課文＝禁抄（copyleft），教學文一律
  繁中 clean-room 自寫；棋子 Gioco Wood（CC BY-NC-SA，已標）。
- **Supabase migration**：走 Dashboard SQL Editor 手動套（無 CLI link）；見 `supabase/README.md`。
- **解法驗證**：chess.js（`.move()` 非法步 throw；`isCheckmate()`）。棋盤 `components/chess-board.vue`、
  對局狀態機 `modules/game-lifecycle/use-game-lifecycle.ts`（chess.js 為唯一權威狀態）。
- **截圖/暫存檔**：寫到子目錄、測完自清，不留在專案根目錄。
