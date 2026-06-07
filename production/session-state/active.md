<!-- STATUS -->
Epic: Learning Loop 概念連結（#20）— Phase A+B+C done；UI drift 修正 done；全數已 push
Feature: 下一步 = 待 Eason 指定方向（候選見「其他待辦/風險」）
Task: 2026-06-07 修 #7 reactivity bug + 清 20 vue-tsc 型別債 + 更正 game-replay/CSP 過期狀態；vue-tsc 0、629 passed；待 commit
<!-- /STATUS -->

> **新 session 接手指引**：本檔是交接快照。詳盡規格在各 GDD / EPIC；此處只給「現況 + 下一步 + 鐵則」。
> 全專案進度總覽見 `production/epics/index.md`（注意：該檔較舊，試煉/學習迴圈狀態以本檔為準，待補更新）。

---

## 現況快照（2026-06-07）

- **核心產品已全線可用**：對局 → 賽後檢討(#7) → 課程(#18) / 試煉(#19)，雲端登入 + 跨裝置同步。
- **試煉道場 (#19, S13)**：**全部完成**。30 題（每層 10）、地圖、解題、跨裝置進度。
  S13-07 `dungeon_progress` 表已建並驗證（REST：200 []、匿名寫入擋 401/42501）。
- **學習迴圈 (#20)**：GDD Approved（round 2）。**Phase A + B + C 完成**。
- **測試**：全套 **627 passed**（+15：classify 13 / review-view-signpost 2）。技術債＝20 個既有 vue-tsc 型別錯（未增加）。
- **dev server** 背景跑 localhost:5173。

### 學習迴圈 Phase A（已完成）
- 概念底層 `src/types/concept.ts` + `src/data/concepts/`（8 概念、`MOTIF_TO_CONCEPT`、`ALL_PUZZLE_MOTIFS`）。
- 8 課貼 `concepts?` 標。橋1：LessonView 完成卡片 + 側門練習（`?from=lesson`，繞 dungeon `nodeState` 鎖、
  解題只寫 `concept-progress`、不動 dungeon `solved`/`currentOrder` — D1 零變動 invariant）。
- `recommend.ts`（candidates/recommended/practiceTarget）。

### 學習迴圈 Phase B（已完成，本批）
- **橋2（試煉→課程）**：`DungeonPuzzleView` 常駐「複習『X』這個概念」link；`reviewLinkForMotif()`
  在 `data/concepts/index.ts`。常駐、不綁錯誤次數（AC-4）。
- **概念地圖**：`/learn/concepts` + `ConceptMapView.vue`；`learned/practiced` 純函式在
  `modules/learning-loop/mastery.ts`（practiced = dungeonSolved ∪ practiceSolved ≥ `CONCEPT_PRACTICED_THRESHOLD`）。
  視覺＝暖 cream 棋子格 + 微光圓點（翡翠＝課程 / 金＝試煉，圓點＝點亮）；用詞精煉 2 字「課程/試煉」；
  dormant 收「之後會帶你認識」（非未達成、無鎖）；lesson-only 只亮「課程」。整格 stretched-link→課程、
  「去試煉」CTA 獨立 ≥44px。
- **學習頁 IA**：頂部 segmented control「課程/概念」（`components/learn-tabs.vue`，route-driven、
  gated on `SHOW_CONCEPT_MAP`）。
- 測試 +17（mastery 8 / reviewLink 2 / ConceptMapView 4 / gambit-compliance 3；route-table 更新）。
  Playwright 全驗過。

---

## ✅ Phase C 完成（2026-06-07，本批）

橋3：賽後檢討偵測「高把握」訊號 → 掛中立、opt-in、預設不顯示的概念標記。v1 只認 mate + material。

- **`src/modules/learning-loop/classify.ts`**：`classify()` + `hungUndefendedMaterial()` 純函式 +
  `selectMistakeSignposts()`（依 cpLoss 排序取 top-N）。訊號 1 mate 重用 #7 F2b（`放任被將死` =
  `!hadMate && nowMated` 的 evalMate transition，零新邏輯）；訊號 2 material 用 chess.js replay 真實對局線，
  `attackers()` 幾何判定。**en passant / 升變吃子排除**。
- **⚠️ 規格矛盾裁決**：§4.4 文字（review-log line 12「pinned defender ≠ defender」）與 **AC-6(b)**（被釘防禦子→
  `none`）方向相反。採 **AC-6(b)**（可測試契約＋全節 prefer-silence 北極星）：有幾何防禦子但無合法 recapture（只
  剩被釘）→ 保守沉默 `none`。實作＝`attackers(s)` 空→material；非空但無合法 recapture→none；有 recapture 且
  value≥P→none（補償）；有 recapture 但 value<P→material。
- **ReviewView 接線**：`mistakeSignposts` computed 讀 `gameStore.completedGame`（reactive）；
  `顯示細節` opt-in toggle → `data-testid="review-detail-panel"` 內含 `data-testid="concept-signpost"`，
  露「相關概念：X」+「複習這個概念」(→/learn/:lessonId) +「去試煉」(→/dungeon/:id?from=lesson 側門)。
  cursor 換手時 reset opt-in。中立 cream/jade、無 gold（非 reward）。
- **#7 reciprocal**：`post-game-review.md` GDD amendment 已就位（line 34）；本批實作 detail panel。
- **tuning**：`MISTAKE_CONCEPT_MAX_LINKS=1`、`CLASSIFIER_SIGNALS=['mate','material']` 加進 learning-loop-tuning.ts。
- **測試**：classify.test.ts 13（AC-5/6a-d/7 + 選取）、review-view-signpost.test.ts 2（AC-9 預設不顯示 / AC-9b
  opt-in gating，標記置於 index 0 用 mate 訊號繞過 nav）。
- **未做（刻意）**：捉雙/牽制賽後偵測延 Phase C+；去試煉 drill link 復用 `?from=lesson` 側門（完成後回 /learn，
  非回 review — 可接受的小 UX 皺褶，避免擴張 DungeonPuzzleView guard）；epic story 檔仍未補（B/C 都沒開正式 story）。
- **✅ 既有 reactivity bug 已修（2026-06-07）**：`use-post-game-review.ts` 的 `_completedGame` 由非 reactive `let`
  改為 `shallowRef`。原 bug＝`totalPositions`/`canGoNext`/`biggestSwingCursor` 等 computed 依賴它但無 reactive dep，
  read 為 0 後永久 cache 0，restore→COMPLETE 路徑 nav 卡死。+2 regression test（reactivity.test.ts）。629 passed、型別錯仍 20。

---

## 🚧 其他待辦 / 風險

- **✅ UI drift 修正已套（2026-06-07，Eason 看 mockup 拍板 C）**：
  H-1 加 `surface.dungeon #0b211b` + `dungeon-2 #0e2a22`（暖 jade，取代冷近黑 `#070909`）；
  DungeonMap/Puzzle bg 改用 token。H-2 鎖定節點字 `text-white/25~30` → `text-ink-on-deep-dim`（過 AA）。
  M-1 加 `success/danger.on-deep` token，History 勝負改用之。M-2 App/Review/NotFound `min-h-screen`→`min-h-dvh`。
  L-1（試煉亮金 raw hex 收 token）刻意未做（視覺無傷、勿動沒壞的）。627 passed、型別錯仍 20、Playwright 已驗兩屏。
- **稽核原始 drift 報告**：`production/qa/ui-drift-audit-2026-06-07.md`。**結論：整體相當一致，無「醜到要重設計」的屏。**
  零 emoji、零象棋用語、棋子用詞全對、金只當 reward。真正 drift 集中在：
  **H-1（需 Eason 拍板）** 試煉道場是刻意近黑世界 `#070909` vs SoT deep-jade `#103029`——全站唯一跨屏色系分歧，
  決定暖化(A) 或收成具名 `surface-dungeon` token(B)；**H-2** 試煉鎖定節點標籤對比 <AA（a11y）；
  **M-1** History 勝負用 off-palette raw hex（token 缺口，需 on-deep success/danger token）；
  **M-2** App/Review/NotFound 用 `min-h-screen` 而試煉用 `min-h-dvh`（內部不一致，建議一律 dvh）。
  其餘 L 級建議不動。**等 Eason 看報告決定修哪些（勿動沒壞的）。** History/Profile/Review 需登入/完賽資料，
  以程式碼層判讀（巡屏只到 Home/Learn/ConceptMap/DungeonMap/DungeonPuzzle）。
- **game-replay (#S10)**：**QA 已 APPROVED**（`qa/qa-signoff-sprint10-2026-06-02.md`，含 S10-04 rating + Playwright
  browser 驗證）。S10-05 動畫 polish 正式 deferred。剩 non-blocking：iPhone 實機（與 S8-06 一起）。
  CSP font-src cosmetic ✅ 已修（index.html CSP 已含 `font-src 'self' data:`）。
  2026-06-07 複驗：完整 replay 測試面 48 passed，無退化。（先前「待 QA」為過期註記，已更正。）
- **課程內容撰寫 (lesson-system S05)**：框架已好，補課文 ongoing。
- **iOS Magic Link 實機補測 (game-history S8-06)**：需真機驗登入。
- **epics/index.md 過期**：game-replay 已更正為 Shipped；試煉/學習迴圈仍待補（純文件）。
- **✅ vue-tsc 既有債 20 個已清（2026-06-07）**：全在測試檔（src/build 本就零錯）。8 unused import、11 mock 型別對齊
  （Supabase subscription cast `as unknown as`、AuthOtpResponse 補 data、fakeTimers 包 block、firstResolve 還原型別）、
  1 真欄位漏（history-view factory 補必填 `pgn`）。vue-tsc 0 errors、629 passed。
- **Phase C+ / D**：捉雙/牽制賽後偵測（需精準度實測）；Claude API 動態講解（選配，最後）。

## 💡 backlog（未排程）
- 品牌 logo / 視覺識別：用 `ui-ux-pro-max` logo 模組 + SoT `design/gambit-design-system/`。
  現字標＝Cinzel「GAMBIT」+ 金底國王剪影（app-nav.vue）。

---

## 🔑 鐵則 / 技術參考

- **Push guardrail**：`git push origin main`，**絕不 bare `git push`**（origin=你的 fork，upstream=模板）。
  push 前先列 commit message 等你確認。
- **設計 SoT**：`design/gambit-design-system/`（deep-jade #103029 錨、品牌金 #F8B500 只 focus/reward、
  暖 cream 內容、BIZ UDPMincho 標題 / Sarasa 內文 / LXGW 課文 / Cubic 數字）。Lucide icon、無 emoji、
  touch ≥44px、平靜語氣、**無 streak/timer/leaderboard**。
- **西洋棋用語**：后/城堡/騎士/主教/國王/兵；**禁象棋 車/馬/象**。
- **內容授權**：lichess 題庫位置/解法＝CC0 可商用；lila/chessops/Learn 課文＝禁抄（copyleft）；
  教學文一律繁中 clean-room 自寫；棋子 Gioco Wood（CC BY-NC-SA，已標）。
- **Supabase migration**：走 Dashboard SQL Editor 手動套（無 CLI link）；見 `supabase/README.md`。
- **同步鏡像**：dungeon/concept 進度鏡像 `lesson-progress` + `data-sync`（monotonic、union reconcile）。
- **解法驗證**：chess.js（`.move()` 非法步 throw；`isCheckmate()`）。棋盤 `components/chess-board.vue`。
- **截圖落點**（Playwright MCP）：`D:\Personal` 根目錄（非 repo）；測完自清。
