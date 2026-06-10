<!-- STATUS -->
Epic: Redesign 回饋修正（2026-06-10）— Eason 對 Phase 0–4 成果的 feedback
Feature: B5 內頁 redesign 完成並 push（課程 jade 對話框＋木框＋桌機 board 主/對話 26rem 次/按鈕並排；試煉木框/log框/inline 達成；wrong 延遲 600ms setPosition 滑回；main-wrap 700px fix），含 learn pager overflow-x 修正，一筆推送
Task: 試煉答錯滑回部署實機確認；annotation 2-4px 偏移 polish 後續；B3（概念地圖分類）仍待規劃
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

## 進行中：跨頁 UI Redesign（2026-06-09）

> 主計畫（Phase 0–4 細項與進度）：repo 內 `production/redesign-2026-06.md`。每 Phase 細節在 git log + 計畫檔。

- **Phase 0 共用語言 + Phase 1 對局頁 PlayView**：done，已 commit（`6e35394`）。
- **Phase 2 首頁 HomeView**：done，已 commit（`ff4a675`）。桌機 hero｜繼續學習 雙欄等高 + 總覽全寬、問候 16px、StatCard grid+lock+置中、CTA 箭頭 18、`md:max-w-4xl`。
- **Phase 3 學習（LearnView + ConceptMapView + LessonView）**：done，已 commit（`727ec56`）。ConceptMap jade banner 沉點 + 概念卡 glass + 桌機 4 欄；LearnView 分隔線 + `lg:max-w-2xl` + 字級收斂 + 繼續/完成等高 pill；LessonView 完成卡暖棕調；learn-tabs token 化。vue-tsc 0、645 passed、Playwright 375/1280 實測。
- **Phase 4 試煉（DungeonMapView + DungeonPuzzleView）**：✅ **已完成並 push**。`/redesign` 出 A–F 六個 mockup，Eason 選定 **F＝蜿蜒登高 · 透視縱深**。
  - **實作內容**：DungeonMapView 完整重寫為透視 funnel（W=340, AMP_MAX=0.30→AMP_MIN=0.045，jade 立體金幣節點，3 樓層分段，起點/峰頂文字，距離霧化，locked 深度縮放/變淡，由下而上捲動至 current）；DungeonPuzzleView H/M 修正（金色內文→ink-on-deep 3 處，glass-panel 套用，字級修正，Modal 漸層加深）；GDD §3.1+AC-11/12+Dependencies 更新，記偏離理由（2026-06-09 拍板）。
  - **驗證**：vue-tsc 0、vitest 645 passed、Playwright 375/1280 截圖確認。
- **Redesign 回饋 A1/B2/B4/C + 試煉地圖 chrome + 學習頁 IG 分頁**：✅ **2026-06-10 push 完成，Eason 測試中**。
  - A1: header h-12→h-14；B2: 概念地圖 DarkPanel banner；B4: 課程內頁 font-lesson/font-sans；
  - C: 試煉地圖 chrome redesign Option A（ghost 延伸線、頂部淨空、底部固定 CTA）；
  - IG pager: LearnPager.vue（scroll-snap），learn-tabs 受控元件，/learn + /learn/concepts 同指向同元件，桌機版寬度限制修正。
- 流程鐵則：redesign 類任務先跑 `/redesign` 對真實畫面出 H/M/L 報告 → Eason 拍板 → 才施工，**即使 Eason 在對話中已給明確方向也不例外**。

## 🚧 待辦 / 開放項

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
