<!-- STATUS -->
Epic: lesson-system → 收尾
Feature: UI 整體精修（下一個任務，建議開新 session）
Task: 先建設計系統 token（tailwind theme 目前空的），再逐畫面套用和茶系視覺
<!-- /STATUS -->

> **新 session 交接（UI 整體精修）**：lesson-system 功能已完成（第一課可玩、進度雲端化上線、移動回饋 chess.com 化、座標開關）。
> 下一任務是 **UI 整體精修**。先讀本檔「UI 精修 kickoff」段，再開工。**注意：lesson-system 整批仍未 commit/push。**

> **新 session 交接（2026-06-02）**：lesson-system 開發中。**內容 v1（Tier 1 基礎規則 + Tier 2 基本戰術）已完成並驗證**
> （523/523 測試綠）。GDD 已大幅改版定案。**下一步是把 UI 做出來讓 Eason 親手玩一課** →
> S12-02（進度 store）→ S12-03（課程清單）→ S12-04（LessonView，含漸進式燈泡提示）+ 路由。
> 接手前先讀本檔、GDD、EPIC，再讀下方「S12-04 整合筆記」。**注意：未 commit、未 push。**

# Active Session State

**Last updated**: 2026-06-02
**Tests**: 523/523 pass（含新增 `tests/unit/data/lessons.test.ts` 11 項）· **Build**: 未重跑（僅改 data/types/docs，未動既有程式）
**未 commit**：本次 lesson-system 全部變更都還在工作區，尚未 git add/commit/push。

---

## 已完成（本 session）

### 設計定案（GDD `design/gdd/lesson-system.md` 已全面改版）
- **課綱 4 tier 由淺至深**：Tier1 基礎規則 → Tier2 基本戰術 → Tier3 開局原則 → Tier4 殘局技術，每 tier 結尾一個 capstone 整合關卡，共 ~23 課。**v1 = Tier 1+2、v2 = Tier 3+4**。
- **教練人設 = 貝絲·哈蒙 (Beth Harmon)**，《后翼棄兵》女主角。口吻：冷靜、看圖案不背步、理解優先。（IP 提醒：個人用 OK，公開發布前需評估，見 EPIC 護欄。）
- **教學哲學（GDD §3 binding rules）**：① scenario 先行 ② 每個互動步驟講 WHY、successText 給可遷移原則 ③ 命名圖案、後課回扣前課（spiral）④ 每 tier capstone ⑤ 貝絲口吻。
- **提示系統 = 漸進式燈泡（GDD §3 Hint System + AC-14）**：預設只有 💡；走錯一次燈泡發亮但不自動彈；點 💡 → 顯示 Socratic 文字提示（不報棋步）+ **才浮現「揭曉答案」鈕**；點該鈕 → 畫出答案箭頭。答案永遠跳不過提示這關。
- **授權/技術護欄（EPIC.md）**：clean-room 參考 lichess Learn，**禁止移植 lila(AGPL)/chessops(GPL) 程式或文字**；用 chess.js(BSD)，**每個教學 FEN 必含雙王**（國王擺角落）。

### 程式/資料（已寫、已測）
- `src/types/lesson.ts`：`Lesson`/`LessonStep` 型別、`LessonCategory`(rules|tactics|opening-principles|endgame)、`LessonTier`(1-4)、`scenario?`、`LESSON_TIERS`、`LESSON_TIER_LABELS`、`COACH`(貝絲)。
- `src/data/lessons/rules.ts`：Tier 1，8 課（orders 1-8，含 capstone `rules-capstone`）。
- `src/data/lessons/tactics.ts`：Tier 2，6 課（orders 9-14，含 capstone `tactics-capstone`）。
- `src/data/lessons/control-the-center.ts`：Tier 3 種子（order 15）。
- `src/data/lessons/index.ts`：aggregator，匯出 `lessons`(依 order 排序) + `getLessonById`。
- `tests/unit/data/lessons.test.ts`：驗證閘——唯一 id/order、排序、tier=category、**每個 FEN 用 chess.js 合法、expectedMove 合法、輪到方=playerColor、互動步驟必有 hint+answer arrows**。

### 文件
- `production/epics/lesson-system/EPIC.md`：加了「Content Sourcing & Licensing」護欄區。
- `production/epics/lesson-system/story-001-*.md`：Notes 記錄 per-tier 檔案分組偏移 + scope 擴張。

---

## ✅ S12-02/03/04 完成（2026-06-02，瀏覽器實測通過）

- **S12-02** `src/stores/lesson-progress.ts`：Pinia + localStorage（key `pgr:lessons:progress`，shape `{completed:[]}`），corrupt 當空、order 連續解鎖述詞、progress=完成/總數。測試 `tests/unit/stores/lesson-progress-store.test.ts` 7 項綠。
- **S12-03** `src/views/LearnView.vue`：`/learn` 課程清單，依 tier 分組（AC-13）、鎖定/✅/○ 狀態、進度條。
- **S12-04** `src/views/LessonView.vue`：`/learn/:lessonId`。棋盤(chess-board) + move-annotation-display overlay；narration 立即顯示 arrows+highlights，互動步驟只顯示 highlights、arrows 為「揭曉答案」才畫（AC-14 漸進式燈泡：走錯→燈泡發光不彈窗→點💡顯示 Socratic 提示+揭曉答案鈕→點鈕畫箭頭）。走錯合法步靠 boardNonce remount 歸位。完成→markComplete→回清單。
- 路由 `/learn`、`/learn/:lessonId` lazy-load、免 auth；route-table 測試已更新。**全 530 測試綠。**
- **實測（Playwright）**：第一課 5 步全跑通——narration、互動推兵 e2-e4、走錯 e2-e3 燈泡發光+歸位、揭曉答案箭頭精準、吃子 e4xd5、完成後進度 1/15+第2課解鎖+localStorage 持久化。console 無錯。
- **整合要點（給後續）**：move-annotation-display 在自身 onMounted 才掛 ResizeObserver，故 LessonView 用 `v-if="boardEl"` 等 board 元素就緒後再掛 overlay，否則箭頭不顯示。chess-board 的 squareToRect/boardRef 經 defineExpose 取得（已驗證幾何對齊）。

## ✅ 進度雲端化 + 走錯 UX 改版（2026-06-02 第二輪，實測通過）

### 進度雲端化（跟帳號跨裝置）
- **Migration** `supabase/migrations/20260822000000_create_lesson_progress.sql`：table `lesson_progress(user_id, lesson_id, completed_at)`，PK(user_id,lesson_id)，RLS USING(user_id=auth.uid())。**⚠️ 尚未套用到 Supabase 專案**（要跑 `supabase db push` 或在 dashboard 執行 SQL）。
- **data-sync store**（ADR-0011：所有 supabase.from() 集中此處）新增 `loadLessonProgress()`、`upsertLessonProgress(ids)`。
- **lesson-progress store**：localStorage 當離線快取，登入後 `reconcileOnLogin()` 做 union（先 push 本地→雲端，再 pull 雲端→本地）；`markComplete` 同時寫 localStorage + best-effort 雲端 upsert（登出時 no-op，下次登入 flush）。完成是單調遞增，故 union 不衝突。
- **App.vue**：userId watch 內加 `lessonProgressStore.reconcileOnLogin()`（跟 data-sync flush 並列）。
- 測試：data-sync 新增 6 項（load/upsert 的登出 no-op、mapping、error 降級、user-scoped rows）。

### 走錯 UX 改 chess.com 風格（取代原本「閃回原位」）
- 走錯合法步：**棋子停在錯誤格不歸位**；紅色標示路線（起訖格紅底 + 細紅箭頭）；教練紅色面板給反饋（Socratic hint）+「重試」+「揭曉答案」；棋盤鎖住。點「重試」才 remount 歸位（boardNonce++，使用者主動，不再自動閃回）。走對：from/to 綠色高亮（chessground 原生 lastMove）+ 綠色成功訊息。
- **箭頭變細**：move-annotation-display 新增可選 `shaftScale` prop（預設 1，不影響 ReviewView），LessonView 傳 0.5。
- everWrong 旗標：走錯後即使重試，💡提示按鈕持續發光（強調提示可用）。
- **全 536 測試綠、build 綠、console 無錯**。Playwright 實測：走錯→紅路線+面板、揭曉答案→細藍箭頭、重試→歸位、走對→綠色全部通過。

## ✅ 第三輪：移動回饋改 chess.com 樣式 + 座標（2026-06-02，實測通過）
- **走錯回饋**：拿掉紅色箭頭線（Eason 嫌醜）。改為棋子停在錯誤格 + 紅格 tint + **右上角紅色 ✗ 角標** + 教練紅色面板 + 重試（LessonView 用 squareToRect 定位的 div 角標）。
- **走對回饋**：from/to 綠格（chessground 原生 lastMove）+ **右上角綠色 ✓ 角標**。
- **座標**：用 **chessground 原生 `coordinates`**（CSS %-based、響應式，手機 390px 實測不跑版——放棄自訂 overlay 因有跑版風險）。chess-board 加 `coordinates` prop（預設 false，Play/Review 不變），LessonView 綁 `ui.showCoordinates` 並在 header 放勾選開關。`ui-store` 加 `showCoordinates`（持久化 `ui:showCoordinates`）。
- **座標樣式**（board-theme.css）：chessground 預設色在和茶系主題上糊掉且列號跑右邊。CSS 覆寫：實心深色 `#3d2210` + **真 `-webkit-text-stroke`（非 shadow blur）**、`!important` 蓋過 chessground 的 nth-child 每格配色、**列號移到左邊**、**檔位靠右下角**（`text-align:right`）。
- 全 536 測試綠、型別 0 錯。

### ✅ select 提示改 chess.com 原生 dots/rings（Eason 確認要做，已完成）
- chess-board.vue：`movable.showDests: false → true`、移除 select 事件的自訂 arrow 繪製（`showLegalMoves` 函式刪除）。選子改顯示 chessground 原生 `.move-dest` 實心點 + `.oc` 吃子圈。
- 保留 `buildLegalMoveShapes`/`BOARD_BRUSHES`/`clearSelectionShapes`（鍵盤導航 a11y 仍用），故 input.test.ts 不需改、續綠。
- 影響 Play/Review（共用元件）：兩處選子也會變原生點/圈——屬一致性提升。
- 角標位置：Eason 偏好原本「壓在格子角上（一半凸出）」，已從「格內」改回原版。
- 實測：選子 e2→e3/e4 兩個實心點；選子 e4→e5 點 + d5 吃子圈。✅

## 待辦（Eason 點名）
1. ~~套用 migration~~ ✅ **2026-06-02 Eason 已在 Supabase dashboard 跑 SQL，`lesson_progress` 表已建立**。進度雲端化全鏈路上線（程式已接好＋單元測試覆蓋；真正跨裝置同步待 Eason 手動以 Magic Link 登入驗證）。
2. **UI 整體精修**：LearnView/LessonView 仍是功能性版型，要套設計系統做視覺精修。
3. （備忘）Supabase CLI 尚未安裝、專案未 link；目前 migrations 靠手動貼 SQL。若之後 migrations 變多，值得裝 CLI + `supabase link` 改成 `db push`。

## 決策紀錄
- **2026-06-02 Auth：維持 Magic Link**（不改 email+密碼）。曾評估改密碼登入以避開 iPhone PWA 的 Magic Link deep-link 痛點（信件開 Safari 不開 PWA，見 ADR-0011），但因登入不頻繁（session 持久化、單裝置通常只登一次）、且密碼還是得做忘記密碼流程，Eason 決定先維持。待 iPhone 實機試過再評估。

---

## UI 精修 kickoff（下一個 session 先讀這段，省探勘）

**核心問題（已勘查）**：`tailwind.config.ts` 的 `theme.extend` 是**空的**——全 app 沒有設計 token，UI 都用 Tailwind 預設色（`blue-600`/`gray-100`/`gray-200`…）。但棋盤是「和茶系」暖色（light `#e8dcc8`、dark `#8b6f5c`、深字 `#3d2210`、白子 `#f4ead8`，見 `src/assets/board-theme.css`）。結果：**棋盤暖、其餘介面冷藍灰，視覺脫節**。這是精修的根因。

**建議做法（順序）**：
1. **先立設計系統 token**（不要逐畫面亂調色）。在 `tailwind.config.ts` `theme.extend` 定義和茶系色票（primary/surface/text/border/success/danger…對齊棋盤暖調）、字級 scale、間距 scale、圓角。可考慮跑 `/art-bible` 或 `/design-system` skill 先定調，或直接定 token（這 app 規模小，直接定 token 較快）。
2. **改造共用層**：`src/App.vue` 的 nav、按鈕樣式統一成 token（目前 nav 是白底灰字、按鈕散落 `bg-blue-600`/`bg-emerald-600` 等）。
3. **逐畫面套用**：Home、Learn(catalog)、Lesson、Play、Review、History、Replay、Profile、SignIn。優先 Home + Learn + Lesson（lesson-system 的門面）。

**既有規範要遵守**（讀這兩份）：`design/ux/accessibility-requirements.md`、`design/ux/interaction-patterns.md`。CLAUDE.md 硬規則：觸控目標 ≥44×44px、無 hover-only 互動、iOS Safari 16+、間距只用設計系統值。

**精修時別動到的功能行為**：lesson 的移動回饋（dots/rings、✗/✓ 角標、重試）、座標開關、進度同步邏輯——這些剛驗證過，只調視覺不改邏輯。棋盤 `board-theme.css` 的和茶系是視覺錨點，沿用它的色票延伸到整個 app。

**畫面清單參考**：`src/views/` 下 HomeView、LearnView、LessonView、PlayView、ReviewView、HistoryView、ReplayView、ProfileView、SignInView、NotFoundView。共用元件在 `src/components/`。

## （原）下一步說明（已完成，保留供追溯）

順序：**S12-02 → S12-03 → S12-04 + 路由**。完成後請 Eason 親手體驗第一課。

### S12-04 整合筆記（接手前必讀，省探勘）
- **棋盤元件** `src/components/chess-board.vue`：props 只有 `fen` / `playerColor` / `disabled`；emit `move-made` `{from,to,promotion,fen,animationDoneAt}`。`movable.color` 限定玩家顏色、chess.js 驗證合法性 → **走「合法但非 expectedMove」的棋抓得到**（GDD 走錯流程靠這個）。`defineExpose({ boardRef, squareToRect })`。
- **棋盤沒有 arrows/highlights prop**：教練箭頭/highlight 要用 SVG overlay 元件 `src/components/move-annotation-display.vue`（疊在棋盤上、靠 boardRef + squareToRect 定位）。接手時先讀它的 props，確認怎麼餵 arrows/highlights；參考 `src/views/ReplayView.vue` 如何把 board + annotation overlay + 側欄組起來。
- **互動步驟箭頭顯示規則**（GDD）：narration 步驟的 `arrows`/`highlights` 立即顯示；**互動步驟只立即顯示 `highlights`，`arrows` 是「揭曉答案」才畫**。
- **進度 store（S12-02）**：Pinia + localStorage，key `pgr:lessons:progress`，shape `{ completed: string[] }`，corrupt 資料當空（不丟錯）。unlock 述詞：order==1 或「order===this.order-1 的課在 completed」（catalog 須 order 連續，目前 1-15 連續）。參考既有 store 的 localStorage 慣例（grep `pgr:` 前綴用法）。progress = completedCount/totalLessons。
- **路由**：`src/router/index.ts` 加 `/learn`(catalog) 與 `/learn/:lessonId`(LessonView)，**lazy-load、不需 auth**（別加進 AUTH_REQUIRED_ROUTES）。locked/不存在的 lessonId → redirect `/learn`。
- **TR 缺口**：GDD 新增的 AC-13（tier 分組）、AC-14（燈泡）尚未在 `docs/architecture/tr-registry.yaml` 建 TR（TR-lesson-system-011+）。S12-03/04 前可補跑 `/architecture-review`，或先實作後補。

### v2（之後）
Tier 3 開局（控中心已有 + 快速出子 + 王翼安全 + 別太早出后 + capstone）、Tier 4 殘局（升變競賽 + 后王將殺 + 車王將殺 + capstone）。先等 S12-04 跑起來、Eason 確認手感再量產。

---

## 待 Eason / 待辦
- **未 commit/push**：lesson-system 整批變更待 Eason 看過再決定 commit。
- 之前 S11 的收尾（S11-05 SF 歷史文件、S11-06 CSP font-src）、iPhone 實機測試仍未做。
