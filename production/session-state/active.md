<!-- STATUS -->
Epic: UI 現代化 + 學習地圖
Feature: shadcn-vue 全站整合 + 學習地圖 chess.com 風格
Task: 完成並 commit+push
<!-- /STATUS -->

> **新 session 交接（2026-06-03 第三輪，最新，先讀這段）**
> **全站 shadcn-vue 整合 + 學習地圖 chess.com 風格** 已完成並 commit+push（main 與 origin 同步、工作區乾淨）。
> 驗證：`npm test` 536/536 綠、build 綠、src typecheck 0 錯。
>
> ## ✅ 本輪完成（2026-06-03）
>
> ### A. shadcn-vue / Reka UI 全站整合
> - **基礎**：`src/lib/utils.ts`（cn()）、`main.css :root` HSL 暖色對映、`tailwind.config.ts` 加語意色 + radius + animate plugin。
> - **核心元件** `src/components/ui/`：Button / Card / Dialog / Badge / Alert / Progress / Input / Label / Checkbox / Slider / Skeleton / Tooltip（暖色 token；Button class prop 用 `HTMLAttributes['class']`）。
> - **全站遷移**：play-setup-modal→Dialog；promotion-dialog 改暖色；Lesson/Play/Review/History/Replay/SignIn/NotFound 全換 shadcn 元件；opening-knowledge-card/history-row/replay-analysis-overlay 冷灰改暖。
> - **Lesson 回饋**：只換視覺外殼，dots/rings/✗✓角標/走錯重試/進度同步邏輯 + 測試不動。
> - **測試改動**：`replay-view.test.ts` 1 處 `input[type=range]` → `[role="slider"]`（reka-ui Slider）。
>
> ### B. LessonView 布局重構
> - 棋盤撐滿手機全寬（移除 px-4）。
> - 座標預設常開（移除開關 + ui-store `showCoordinates`）。
> - 功能鈕移至 sticky 底欄（`bottom-14` 避免被 tab bar 遮住）。
>
> ### C. app-nav 顏色現代化
> - 漸層由 `rgba(40,27,15,0.74)` 調為 `rgba(80,55,30,0.58)`，`nav.bg` 對齊棋盤深色格 `#8b6f5c`。
>
> ### D. 學習地圖重做（PixiJS → chess.com 菱形磚）
> - **棄 PixiJS**，移除 `learn-board.vue` 與 `pixi.js` 依賴（CSP 不需動，`wasm-unsafe-eval` 是 Stockfish 用的）。
> - **新元件** `src/components/learn-path.vue`：chess.com 風格菱形（`rotate(45deg)`）、兩欄交錯、底到頂漸進（node[0] = 第一課在最底）、auto-scroll 至當前課程。
> - **視覺架構**：課程磚（亮色 tier + `6px 8px` 斜向等角陰影 + inset highlight）、裝飾磚（暗色平面同排搭配）、串接磚（亮色小菱形串接相鄰課程磚）、棋子圖坐在裝飾磚上。
> - TILE=76、STEP=113（確保同欄磚不重疊，gap≈6px）、CONN=40（幾何緊鄰課程磚）。
>
> ## 護欄（本輪完全不動）
> 棋盤與棋子（board-theme.css / chessground / 棋子圖）是整站暖色錨點，一字未改。
>
> ## 待辦 backlog（依優先序）
> 1. **Puzzles 闖關**（net-new，最高優先）。
> 2. **Profile 成長頁**（目前空殼）。
> 3. **Learn Tier3/4 內容**（目前 v1=Tier1+2，14 課；Tier3 只有 1 課種子）。
> 4. 技術債：game-replay QA 未過（S10-04/05）；iOS Magic Link 實機補測。
>
> 底下舊交接（第一/二輪 UI 精修 / lesson-system）已過時，保留供追溯。

# Active Session State

**Last updated**: 2026-06-03
**HEAD**: `a847c0e`（feat(ui): 介面現代化 + Pixi 等角學習地圖）· 工作區乾淨、已 push
**Tests**: 536/536 pass · **Build**: 綠 · **typecheck**: src 0 錯

---

## ✅ 本次 session 完成（2026-06-03，已 commit `a847c0e`）

**導覽列**（`src/components/app-nav.vue`）
- wood12 木紋質感 + 暗色疊層 + 浮雕陰影；品牌 = Gambit + gioco_wood 皇后 icon；字型全改 **Sarasa UI TC**（tailwind `display` 字族指向 Sarasa，棄用 Noto Serif 宋體）。
- 手機底部 tab bar / 桌機頂部；第 4 格「複盤」→「紀錄」(/history)。

**首頁**（`src/views/HomeView.vue`）
- landing 改**個人儀表板**：繼續學習主卡（下一課 + summary 簡述 + 進度條）+ 對局/紀錄快速入口。

**學習地圖（PixiJS，重點）**
- 裝 `pixi.js@8`；新增 `src/components/learn-board.vue`：Pixi `Graphics` **程式化畫等角立體磚塊**（頂面 + 左右側面厚度 = CSS 做不到的 3D）。
- `LearnView.vue` 算佈局：**3 欄等角格陣**（a∈{-1,0,1}、(a+b) 偶數的格子），課程走中央連續路徑、其餘填充地板格（checker 明暗），**由下而上**（lesson1 在底）。
- 狀態：locked(暗棕+鎖)、unlocked(亮木)、current(金+脈動 glow)、done(綠+✓)；點 unlocked/current 格 → emit open 進課。
- **無外框**直接攤在頁面；頂部資訊框顯示下一課標題 + summary（已移除地圖泡泡）。
- ⚠️ **CSP**：index.html CSP 無 `unsafe-eval`，learn-board.vue 必須 `import 'pixi.js/unsafe-eval'`（已加），否則 WebGL renderer 報錯、canvas 不出現。
- 響應式：ResizeObserver 寬度變化 rebuild。

**對局**：`play-setup-modal.vue` 加 × 關閉鈕（+ Esc / 點外關閉），`PlayView` handleClose → 回首頁。

**內容術語校正**：車→城堡、象→主教、馬→騎士、學象棋→學西洋棋（`src/data/lessons/*.ts` + `opening-knowledge-cards.ts`）。

**素材授權**（`public/CREDITS.md`）：棋盤 wood12（CC0）、棋子 gioco_wood（**CC BY-NC-SA 4.0，僅限個人非商業，公開/商業化前必須換**）；來源 sharechess.github.io。黑棋色是嵌入 PNG，只能用 board-theme.css 的 `--piece-dark-brightness` 提亮，不能改 hex。

---

## ▶ 下一步：整合 shadcn-vue / Reka UI（第一優先，Eason 點名）

**目標**：導入 shadcn-vue（底層 Reka UI）提升一般介面與互動元件質感，後續新功能（Puzzles/Profile/設定）都用它建。

**前提**：Vue 3 + Vite 5 + **Tailwind v3** + TS。已有自訂暖色 token（surface/ink/primary/nav/success/danger/hint…）。**環境非互動式** → `npx shadcn-vue init` 的互動 prompt 可能卡住，多半要**手動鋪設**。

**步驟**：
1. 裝：`reka-ui`、`class-variance-authority`、`clsx`、`tailwind-merge`、`tailwindcss-animate`、`lucide-vue-next`。
2. `src/lib/utils.ts` 加 `cn()`（clsx + tailwind-merge）。
3. **主題對映**：shadcn 用 `--background/--foreground/--primary/--border/--ring…`（HSL）。把這些**對映到現有暖色**（primary=umber #8b6f5c、background=surface-base #faf6f0、foreground=ink #3d2210、border=line #e0d3bd…），讓 shadcn 元件天生暖色、不要引入它預設冷色。寫在 `src/assets/main.css` 的 `:root`。
4. `tailwind.config.ts` 加 shadcn 語意色（指向 CSS 變數）+ borderRadius 變數 + `tailwindcss-animate` plugin；**與現有 surface/ink/primary token 並存、勿覆蓋**。
5. 手寫核心元件（從 shadcn-vue 文件複製）放 `src/components/ui/`：Button、Card、Dialog（Play 設定 modal 可改）、Tabs、Tooltip。
6. 先示範升級 1-2 處（`.btn`→Button、Play modal→Dialog），其餘漸進。

**勿打壞**：剛 commit 的 nav/home/learn 已驗證好看，shadcn **並存**即可，別大改其視覺；Pixi 地圖與暖色 token 維持。

---

## 待辦 backlog（依優先序）
1. **shadcn-vue/Reka 整合**（↑ 下一步，第一優先）。
2. **Puzzles 闖關**（net-new，level-up 核心：題庫/計分/闖關地圖/連勝；建議 `/to-prd` 或開 epic 規格化）。
3. **Profile 成長頁**（`ProfileView.vue` 目前空殼：連勝/謎題分/完成課程儀表板）。
4. **Learn Tier 3+4 內容**（目前只有 v1=Tier1+2 共 14 課；Tier3 開局只 1 課種子、Tier4 殘局未寫）。
5. 計時對局（Play 目前無限時間，先擱置）。
- **技術債**：game-replay QA 未過（S10-04/05）；iOS Magic Link 實機補測（S8-06）。

---

<!-- 以下為 2026-06-02 lesson-system / UI 第一輪精修的歷史交接，已過時，保留供追溯 -->

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
1. ~~套用 migration~~ ✅ **2026-06-02 Eason 已在 Supabase dashboard 跑 SQL，`lesson_progress` 表已建立**。
2. ~~**UI 整體精修**~~ ✅ **2026-06-02 完成（兩輪）**：
   - 第一輪：token 色票替換（深棕 nav、和茶系暖色）、11 view 全部更新、Learn 連結補上 nav。
   - 第二輪「殿堂美學」：self-host 字型（Sarasa UI TC 內文 + Noto Serif TC 標題明體，432KB subset）、`.btn`/`.card` @layer components、微深度陰影 token、Home 雙欄英雄（棋盤棋子 SVG 裝飾）、Learn 進度 banner + tier accent bar、Lesson 教練卡（貝頭像 + 引言）、focus-reset outline 修正。build 0 錯、536/536 綠。
3. （備忘）Supabase CLI 尚未安裝、專案未 link；目前 migrations 靠手動貼 SQL。

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
