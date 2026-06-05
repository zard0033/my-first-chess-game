<!-- STATUS -->
Epic: 試煉 / Dungeon 謎題模式（Phase 2，S13）
Feature: 可玩端到端（S13-01~05/07 完成，截圖驗證）；剩 S13-06 內容擴充
Task: 從 lichess CC0 題庫匯入 ~12 題；apply S13-07 migration
<!-- /STATUS -->

> **2026-06-05 — Dungeon Puzzle Mode 啟動**
> GDD `design/gdd/dungeon-puzzle-mode.md` 已 Approved（lean review）。視覺 SoT =
> `design/gambit-design-system/ui_kits/app/DungeonScreen.jsx`（**減去 streak**）。

## 本對話的關鍵決策（Eason）

1. **移除 streak** — 藍圖的「連殺」違反 Gambit「無 streak/timer/leaderboard」鐵則；
   改平靜進度（已解/總數）。
2. **闖關道場單一路線**，逐關線性解鎖；**無**每日一題概念。Home 卡片「今日謎題」
   → 改名**「試煉」**，連到 `/dungeon`。
3. **照藍圖直接實作**，不另做 mockup（藍圖已是 mockup）。
4. **進度跨裝置同步**（v0 納入）— 鏡像 lesson-progress：localStorage + Supabase
   `dungeon_progress` 表 + 登入 reconcile（union）。新增 story S13-07。

## ✅ 已完成

- **規劃**：GDD（8 段）+ review-log + systems-index #19 + epics/index 條目；
  epic `production/epics/dungeon-puzzle/` + 7 個 story（S13-01…07）。
- **S13-01（Complete）**：`src/types/puzzle.ts` + `src/data/puzzles/{level-1,2,3,index}.ts`
  + `tests/unit/data/puzzles.test.ts`。6 顆種子謎題（每層 2 顆）。資料測試抓出並修掉一個
  釘子 bug（l3-knight-fork-queen 白王 e1 釘住 e4 騎士 → 改 Kg1）。
- **S13-07（Code complete，DB 未 apply）**：`supabase/migrations/20260823000000_create_dungeon_progress.sql`
  + data-sync 加 `loadDungeonProgress`/`upsertDungeonProgress`（鏡像 lesson）。
  ⚠️ **migration 尚未 apply 到 Supabase，需與 Eason 協調後執行。**
- **S13-02（Complete）**：`src/stores/dungeon-progress.ts`（localStorage + sync + 線性解鎖
  + nodeState + solved/total/percent + reconcileOnLogin）。
- **S13-03（Complete）**：`src/modules/dungeon/use-dungeon-puzzle.ts`（§3.4 狀態機；submitMove
  只走玩家步並回傳對手回應，view 延遲後 commitOpponentReply；acceptAnyMate 用 isCheckmate）。
- **S13-04（Complete）**：`DungeonMapView`（菱形節點地圖、nodeState 解鎖、CTA、空狀態）
  + `/dungeon` route。
- **S13-05（Complete）**：`DungeonPuzzleView`（棋盤 + 兩段提示 + 對手回應延遲 + 答對面板）
  + `/dungeon/:puzzleId` route + `config/dungeon-tuning.ts`。snap-back 用 boardNonce remount。
- **棋子一致性修正**（Eason 反映）：「今日謎題」→「試煉」live entry（solvedCount/total）；
  App.vue 接 dungeon reconcileOnLogin。
- **徽章定案（ui-ux-pro-max 方向 A）**：木紋棋子塞進扁平金幣不協調 → 改用 **CSS mask 把真棋子
  SVG 當遮罩 + 填扁平 jade 剪影**。形狀同棋盤、風格融入 chrome。`ChapterBadge` piece prop 改 mask；
  Home + Learn 統一用 TIER_PIECE = {1:bP,2:bN,3:bR,4:bK}（Learn hero/摺疊圓圈也換）。
  原則：**棋盤=Gioco Wood 木紋層（不重新上色）；chrome=扁平 jade 剪影層**，兩層各自一致。
- **測試**：全套 **570 passed**（+34；route-table 更新）。**Playwright 截圖驗證**：Home 棋子、
  地圖、解謎、答對面板（Rxd4 → 正確！→ 進度 1/6）皆正確。

## 🚧 下一步（新對話接手）

- **S13-06**：從 **lichess CC0 題庫**（database.lichess.org，公眾領域）匯入 ~12 題；
  themes→motif，轉換 move 格式（lichess 先走對手 setup 步）；繁中教學文 clean-room 自寫。
  目前有 6 顆手寫種子題可玩。
- **待辦**：apply S13-07 migration 到 Supabase（找 Eason 約時間）。

## 💡 未來想法（backlog，未排程）

- **品牌 logo / 視覺識別設計**：用 `ui-ux-pro-max`（含 logo / design-system 模組）探討
  GAMBIT 的品牌 logo——目前字標是 Cinzel「GAMBIT」+ 金底國王剪影方塊（app-nav.vue）。
  想看看能否設計更完整的品牌 mark / favicon / app icon / 啟動畫面，與 Gambit 設計系統
  （deep-jade #103029、品牌金 #F8B500、木紋棋盤層 vs 扁平 jade chrome 層）一致。
  起手式：`ui-ux-pro-max` logo 模組 + 提供現有 SoT `design/gambit-design-system/`。

## 內容授權鐵則（2026-06-05 釐清）

- **lichess 題庫位置/解法 = CC0 公眾領域**，可商用、可匯入。
- **lila 程式碼（AGPL-3.0）/ chessops（GPL-3.0）/ Learn 課文 = 禁抄**（強 copyleft）。
- 教學文字一律繁中 clean-room 自寫。棋子用 Gioco Wood（CC BY-NC-SA，已標註）。

## 技術參考

- 謎題資料模型仿 `Lesson`；解法驗證用 chess.js（`.move()` 非法步會 throw；含 `isCheckmate()`）。
- 進度同步完全鏡像 `src/stores/lesson-progress.ts` + `src/stores/data-sync.ts`。
- 棋盤用 `src/components/chess-board.vue`；西洋棋用語：后/城堡/騎士/主教/國王/兵（禁車/馬/象）。
- 已知無關債：vue-tsc 在 auth/data-sync/game-history/history-view 測試檔有既有型別錯（非本次造成）。
- dev server 背景跑 localhost:5173。
