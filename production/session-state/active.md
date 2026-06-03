<!-- STATUS -->
Epic: UI 遊戲化 + 學習地圖重設計
Feature: Kenney RPG UI 全站整合 + 菱形磚學習地圖
Task: 完成並 commit+push
<!-- /STATUS -->

> **新 session 交接（2026-06-03 第四輪，最新，先讀這段）**
> **RPG UI 全站遊戲化 + 菱形磚學習地圖（chess.com 風格）** 已完成並 commit+push。
> 驗證：`npm test` 536/536 綠、build 綠、typecheck 0 錯、console 無錯。
>
> ## ✅ 本輪完成（2026-06-03 第四輪）
>
> ### A. Kenney RPG UI 全站整合（CC0 素材）
> - **資產**：`public/ui/`（panel_beige、panelInset_beige、buttonLong_brown/beige 各 pressed、barYellow 分段）、`public/tiles/`（tileDirt_full、tileAutumn_full、tileStone_full 等 8 個磚塊）。
> - **Card**（`src/components/ui/card/card.vue`）：改用 `::before` + `border-image: url('/ui/panel_beige.png') 18 fill` + `isolation: isolate`，所有 Card 自動換成棕色 RPG 面板框。
> - **Button**（`src/components/ui/button/index.ts`）：default=buttonLong_brown（`bg-[length:100%_100%]`）、secondary=buttonLong_beige；`:active` 換 pressed 圖，視覺有按壓手感。
> - **Progress**（`src/components/ui/progress/progress.vue`）：黃金漸層填充 `#c9872e→#e8b843`＋暖灰軌道，高度 h-3。
> - **Dialog**（`src/components/ui/dialog/dialog-content.vue`）：同 Card 技法，改用 `panelInset_beige.png` 凹陷面板感。
>
> ### B. 字型 fallback 修正（全站）
> - `tailwind.config.ts` font stack 加 `'PingFang TC', 'Noto Sans CJK TC', 'Microsoft JhengHei', 'Microsoft YaHei'`。
> - 修正 Sarasa UI TC subset 未收錄的字（擎、弈、考、設…）在 Windows 上 fallback 到細明體的問題。
>
> ### C. 學習地圖：菱形磚版本（chess.com 風格）
> - `src/components/learn-path.vue` 完整重寫（第 N 次，定版）。
> - **菱形磚**（CSS `rotate(45deg)` 68px 正方形 → 96px 菱形視覺），socket + face 兩層 CSS 3D 深度。
> - **左右鋸齒**（gi%2=0 左、gi%2=1 右），AMPLITUDE=60px，ROW_STEP=108px，磚間隙 12px，完全不疊。
> - SVG 折線連接路徑：灰色虛線底軌＋金色已完成段落（stroke-dashoffset 描繪動畫）。
> - 方向：由下往上（node[0]=第一課在最底）。
> - Tier 段落標題卡繼承 RPG panel 樣式；current 金環脈動＋START pill；coach 立繪側站；capstone 放大圓角方。
> - `LearnView.vue` 加 `.learn-page::before`（fixed，`/learn/bg.png` 0.2 opacity 全頁鋪底，無遮罩感）。
>
> ### D. 素材壓縮
> - `public/learn/bg.png` 161KB（原 2.5MB）、`coach.png` 105KB（原 1.7MB）、`trophy.png` 89KB（原 1.6MB）。
>
> ### E. 歷史嘗試紀錄（給後來接手者）
> - Kenney **等角六角磚**（hexagon-tiles.zip）曾試用為主磚，但等角柱體有 60% 側面牆，15 個疊起來全是牆看不到地面——已放棄，改回 CSS 菱形。
> - 六角磚可考慮用於**背景地景裝飾**（路徑旁點綴），不適合當主路徑磚。
>
> ## 護欄（本輪完全不動）
> 棋盤 board-theme.css / chessground / lesson 內部邏輯 / 進度同步 / tests。
>
> ## 待辦 backlog（依優先序）
> 1. **Puzzles 闖關**（net-new，最高優先）。
> 2. **Profile 成長頁**（`ProfileView.vue` 目前空殼）。
> 3. **Learn Tier3/4 內容**（目前 v1=Tier1+2，14 課；Tier3 只有 1 課種子）。
> 4. **學習地圖小優化**（可選）：路徑旁加 hex 磚背景裝飾、節點改在磚塊上方偏頂位置讓棋子更立體。
> 5. 技術債：game-replay QA 未過（S10-04/05）；iOS Magic Link 實機補測。

# Active Session State

**Last updated**: 2026-06-03
**HEAD**: 待 push（工作區有未 commit 變更）
**Tests**: 536/536 pass · **Build**: 綠 · **typecheck**: src 0 錯

---

底下為歷史交接，保留供追溯。

---

<!-- 以下為 2026-06-03 第三輪交接 -->

> **新 session 交接（2026-06-03 第三輪）**
> **全站 shadcn-vue 整合 + 學習地圖 chess.com 風格** 已完成並 commit+push（main 與 origin 同步、工作區乾淨）。
> 驗證：`npm test` 536/536 綠、build 綠、src typecheck 0 錯。
