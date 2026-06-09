<!-- STATUS -->
Epic: 跨頁 UI Redesign（2026-06-09）— 主計畫見 repo 內 `production/redesign-2026-06.md`（Phase 0–4，含進度）
Feature: Phase 0–4 全部完成。Phase 4 試煉地圖＝F（透視登高 funnel）已實作、驗證，等 commit + push
Task: 準備 push（commit message 已列，等 Eason 確認）
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
- **Phase 4 試煉（DungeonMapView + DungeonPuzzleView）**：✅ **實作完成，待 push**。`/redesign` 出 A–F 六個 mockup（d:\tmp\dungeon-map-mockup，throwaway），Eason 選定 **F＝蜿蜒登高 · 透視縱深**。
  - **實作內容**：DungeonMapView 完整重寫為透視 funnel（W=340, AMP_MAX=0.30→AMP_MIN=0.045，jade 立體金幣節點，3 樓層分段，起點/峰頂文字，距離霧化，locked 深度縮放/變淡，由下而上捲動至 current）；DungeonPuzzleView H/M 修正（金色內文→ink-on-deep 3 處，glass-panel 套用，字級修正，Modal 漸層加深）；GDD §3.1+AC-11/12+Dependencies 更新，記偏離理由（2026-06-09 拍板）。
  - **驗證**：vue-tsc 0、vitest 645 passed、Playwright 375/1280 截圖確認。
  - **待辦**：等 push 確認 → commit + git push origin main → 清 d:\tmp\dungeon-map-mockup。
- 流程鐵則：redesign 類任務先跑 `/redesign` 對真實畫面出 H/M/L 報告 → Eason 拍板 → 才施工，即使計畫檔已有清單。

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
