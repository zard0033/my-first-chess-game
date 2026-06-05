<!-- STATUS -->
Epic: 視覺重構 — Gambit Design System 落地
Feature: 階段 4 逐頁套用
Task: 其餘畫面套 Gambit（learn/play/review/lesson/history/profile/replay + modal）
<!-- /STATUS -->

> **第七輪（2026-06-05）— Gambit Design System 整合**
> Claude Design 產出的 Gambit Design System 確立為**新視覺 SoT**，逐步套用到整個 `src/`。

## ✅ 已完成

### 地基（已 commit 8405e92）
- 安置 `design/gambit-design-system/`（12 畫面藍圖）為新 SoT
- 自架 5 字型 woff2：BIZ UDPMincho（標題）/ LXGW WenKai TC（課程）/ Cubic 11（數字）/ Cinzel（品牌）/ Sarasa·Noto（沿用）；subset 繁中常用+ASCII+數字+標點 → `fonts.css` + `tailwind` family（display/lesson/num/brand）
- 根 CLAUDE.md 加視覺非協商鐵則；GDD 對齊（game-concept/lesson-system）
- 清模板殘留（README/CONTRIBUTING/SECURITY/UPGRADING）+ 舊重構產物（visual-design-system.md 等）

### 階段 4（**尚未 commit** — 使用者要全做完再 commit）
- **A** 基礎元件去 RPG 皮膚：`ui/button`（jade/gold/ghost variants）、`ui/card`（cream 立體 + accent prop）、`ui/dialog`（cream/glass）
- **B** 新建 `ui/gambit/`：DarkPanel / ChapterBadge / StatCard / SectionLabel / Pill / ProgressBar
- **C** `app-nav` 木紋底 → 深青瓷 + Cinzel「GAMBIT」+ 金徽；底部 tab = 首頁/學習/對局/我的（active 實心 jade pill + 金指示條）
- **D** 已套頁面：**HomeView**（儀表板）✅、**SignInView**（沉浸深青瓷，保留 email magic link）✅、**NotFoundView**（傾倒國王 404）✅

## 🚧 待辦（階段 4 剩餘）
1. 逐頁套：ProfileView / HistoryView / LearnView / LessonView / PlayView / ReviewView / ReplayView + 對局設定 modal（GameSetupModal）
2. **E** 清 RPG 貼圖孤兒 `public/ui/*.png`（button/card/dialog 已不引用）
3. 全做完後一次 commit
4. 待確認的 layout 問題：SignIn 理想全屏無 header/tab（現在仍在 app-nav 框內）

## 技術參考
- 藍圖：`design/gambit-design-system/ui_kits/app/*.jsx`（React，當視覺藍圖手刻 Vue）
- 棋盤/棋子/標註/eval = 上游所有，**不重新上色**
- dev server 背景跑 localhost:5173；截圖驗證每頁
