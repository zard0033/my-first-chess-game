<!-- STATUS -->
Epic: UI Redesign + 實機回饋修正（收尾中）
Feature: Bug 2 手機對局頁側板一屏優化 — 已 push，待 iPhone 實機驗收
Task: 下一個大項待 Eason 指定（候選：訪客完局紀錄／續玩對局／試煉題卡 brief／字型規則）
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
- **測試**：vue-tsc 0、vitest **645 passed**。

## UI Redesign（2026-06-09～06-11，已全數 push）

> 主計畫 `production/redesign-2026-06.md`；每 Phase 細節在 git log。

- **Phase 0–4 全 done+push**：共用語言／PlayView（`6e35394`）／HomeView（`ff4a675`）／學習三頁（`727ec56`）／試煉兩頁（DungeonMap 透視 funnel + Puzzle H/M）。
- **Redesign 回饋 A1/B2/B4/C + 試煉地圖 chrome + 學習 IG 分頁**：done+push（2026-06-10）。
- **Bug 2 對局側板一屏優化**：done+push（2026-06-11）。合併密度列（徽章＋身分一行，nowrap，文字精簡「思考中」「Lv.X」防窄面板溢出）+ 棋譜捲動區 `max-h-[9rem]`（桌機 12rem）+ 側板自然高度貼合內容。待 iPhone 實機驗收（AI 思考列、棋譜捲動）。
- **鐵則**：redesign 類先跑 `/redesign` 對真實畫面出 H/M/L → Eason 拍板 → 才施工，**即使已給明確方向也不例外**。

## 🚧 待辦 / 開放項

- **對局頁「專注模式」自動收 navbar（Eason 提案，未來獨立任務）**：Eason 想要 IG 式「靜止縮小／滑動回復」navbar。
  結論：**捲動驅動不適用對局頁**（一屏不捲＝沒手勢叫回，會卡死）。若要做，改**狀態驅動**——對局進行中
  （PLAYER_TURN/AI_THINKING）自動收底部 nav 進專注模式、結束或底緣上滑叫回。屬**全站導覽改動**（影響每頁），
  要留意 Gambit「平靜少動效」鐵則 + iOS 底緣手勢衝突。IG 原版捲動隱藏留給會長捲的頁（學習/試煉清單）。獨立評估。
- **2026-06-11 實機修正已 push（commit 14fa407），待 iPhone 驗收**：試煉下一題、課程棋盤對齊、對手 last-move 高亮、王車易位點城堡、座標上木框、castle hint/標註對格。
- **vue3-chessboard 幾何/易位踩坑（技術護欄，重要）**：①棋盤容器寬須對齊 8 倍數，否則 chessground 把 cg-board floor 成 8n 偏移（`useBoardFit` ResizeObserver 解，套在木框內 `.board-fit`）；②overlay（標註/箭頭/check ring/castle hint/座標）定位要用**真實 cg-board 尺寸＋相對 cg-wrap 原點**，非 cg-wrap 寬（`chess-board.vue` squareToRect 已改，連帶修好 active 舊待辦的 annotation 2-4px 偏移）；③易位 chess.js 只收 `e1→g1/c1`，城堡格手勢要 remap 成 king 兩格目標；④`boardConfig.events.select(key)` 可偵測選子，用來觸發城堡格提示；⑤座標自繪在木框（chessground `coordinates:false`），木框 tray 用 p-3 留帶、font-num 暖米色 `rgba(233,217,186,0.6)`。
  ⑥**不可用 `max-w` 依高度硬縮棋盤**：棋盤高度被內部 pin 住，縮木框寬會把棋盤壓成非正方（h 檔被裁）。要省空間改縮周邊（合併列、棋譜上限），別碰棋盤寬。Tailwind arbitrary calc 內 `-` 兩側要用底線：`calc(100dvh_-_Nrem)`。

- **#3 過場效能**：上面那批是推測性修法，**待 Eason 下次實機確認**點 tab 換頁/膠囊動畫是否變順。
- **訪客模式（local 完局紀錄）— Eason 指定，有份量**：課程/試煉/概念進度已存 localStorage 且
  `reconcileOnLogin` 合併上雲，但**完局紀錄只存 Supabase、訪客對局不保存**。要做：①本地完局紀錄 store
  （仿 lesson/dungeon mirror）+ 解除 history/profile/review 對訪客的 auth gate；②登入時 reconcile 上雲；
  ③文案：登入定位改「雲端備份・跨裝置同步」、標「訪客資料存此裝置」。框架現成（mirror + union reconcile）。
- **續玩對局（Resume in-progress）— Eason 指定，有份量**：離開未完成的對局時保存當前對局，下次回來可續玩。
  訪客＝存 localStorage；登入＝雲端保存並跨裝置同步（仿 lesson/dungeon 的 mirror + `reconcileOnLogin` union 模式）。
  ①新增 in-progress 對局 store（FEN / moveHistory / playerColor / chosenLevel / phase 等狀態快照），離開對局頁時寫入、
  完局或新局時清除；②訪客存 local、登入推拉雲端（需新表 + RLS，仿 `dungeon_progress`）；
  ③**首頁卡片**：偵測到有續玩對局時，「開始新對局」卡 → 切成「繼續對局」卡（HomeView hero card），點擊回 `/play` 還原局面，
  並提供「放棄並開新局」次要入口。與「訪客模式完局紀錄」相關但獨立（那個存的是已完成棋局，這個存的是進行中對局）。
- **試煉題卡「補充描述」逐題撰寫（B5 redesign 衍生，Eason 指定一定要做、可排後）**：試煉內頁題卡已加
  「白方/黑方 · 輪你走」turn 指示（從 FEN 免費算，已做）。但題卡的**一句補充說明**（如「對方有一子沒受保護——
  找出來吃掉它」，比單一行 prompt「有子可吃」更清楚目標）需**每題新增一欄逐題撰寫**（30 題）。現有 `prompt` 保留當大標、
  `hint` 是按提示才出不可挪用（會劇透）。要做：puzzle 型別 + 30 筆資料加 `brief`（或類似）欄位，題卡渲染那行。
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
- **iOS 實機補測**：Magic Link 登入流程（S8-06）本輪未測；game-replay iPhone 實機；apple-touch / PWA 圖標外觀。
- **課程內容撰寫 (S05)**：框架已好，補課文 ongoing。
- **dead-file 稽核（Eason 喊暫緩，未動）**：src ~11 orphan（ui/checkbox·label·progress·tooltip、
  composables/use-stockfish）、模板殘留 `docs/engine-reference/`、`CCGS Skill Testing Framework/`、
  引擎 specialist agents、`public/board/wood12_bg.jpg` 皆可清。
- **Phase C+ / D（未排程）**：捉雙/牽制賽後偵測（需精準度實測）；Claude API 動態講解（選配，最後）。
- **文件**：`epics/index.md` 試煉/學習迴圈狀態待補（純文件）。UI drift 報告
  `production/qa/ui-drift-audit-2026-06-07.md`：整體一致，H/M 級已套、L 級刻意不動。
- **全站字體使用規則 redesign（Eason 指定）**：修好 `.font-num`（Tailwind 對 `num` key 產空規則的 bug，
  已於 main.css 手動補顯式字串）後，全站數字/棋譜/評分**第一次真正顯示 Cubic 11**（先前全默默退回 Sarasa）。
  需重新檢視並明訂全站字型使用準則：哪裡用 Cubic 11（點陣）vs Sarasa（一般 UI 數字）vs font-display/lesson，
  逐頁掃過受影響處（首頁 stat 卡、學習/試煉進度與關卡編號、review/replay eval、history/profile 日期手數戰績、
  progress-bar、對局側板）判斷 Cubic 是否合適，必要處設例外；最後把規則寫回 Gambit 設計系統字型章節。

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
