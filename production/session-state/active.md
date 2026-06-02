<!-- STATUS -->
Epic: tech-debt
Feature: Sprint 11
Task: S11 完成並 review 過；12 commit 未 push（Eason 暫緩）；功能方向待定
<!-- /STATUS -->

> **新 session 交接（2026-06-30）**：S11 全部完成、12 個本地 commit **未 push**（Eason 決定先不 push）。
> 下個功能方向 Eason 決定「都先不做」。lesson-system GDD 已 design-review **APPROVED**
> （見 `design/gdd/reviews/lesson-system-review-log.md`：0 blocking / 3 建議、無需新 ADR、scope M），
> 若日後選它可直接 `/create-stories lesson-system`。接續工作前先讀本檔。

# Active Session State

**Last updated**: 2026-06-30
**Tests**: 510/510 pass · **Build**: vue-tsc + vite ✅ green
**Engine**: Stockfish 18 Lite single-threaded（NNUE 內嵌，`stockfish@18.0.7`）— play+review+replay 共用
**最新 main**: S11 共 9 個本地 commit（**尚未 push** — 等 Eason 確認）；已過 code review（修掉一個 buildPgn 持久化 regression）
**Supabase**: 連線 OK，tables + RLS 已驗證

---

## 目前進度

Sprint 1–11 全部完成（細節見 `production/epics/index.md`）。

- **v0 / MVP / Phase 2（S1–10）**：chess-board…game-replay 全功能 ✅；引擎 SF16→SF18 Lite ✅
- **Sprint 11（spec↔code 偏移修復，全綠）**：
  - **S11-01**（docs）：move-annotation eval bar GDD 改 arctan 對齊 code（無 code 變動）
  - **S11-02**（logic）：game-export assembler 對齊 GDD Coach 模板 + 完整 PGN tags + RESULT_PLAIN + SUCCESS→IDLE timer；tuning 移到 `src/config/export-tuning.ts`；抽出共用 `buildPgn`
  - **S11-03**（logic）：`game_sessions.pgn` 改存真 PGN（共用 buildPgn），可與 lichess 等外部工具互通
  - **S11-04**（chore）：移除失效的 `Use NNUE` setoption no-op + 正名 + 更新測試

**本機驗證**：512 單元/整合測試全綠、`vue-tsc --noEmit` + `vite build` 綠燈、code review 通過（已修 buildPgn 在持久化路徑遇非法 move 會 crash/遺失遊戲的 regression，退回 raw UCI）。

---

## 待 Eason 決策 / 待辦

**1. 大型功能方向（重大決策，未動工）** — 擇一：
- **lesson-system**（S12 前置）：已 Designed（5 stories），需先補 ADR + `/design-review`
- **visual-identity**（board theme）：仍缺 GDD/ADR

**2. push 確認**：S11 六個本地 commit 待 Eason 看過 commit message 後授權 push。

**3. 剩餘小型收尾（Nice-to-have，未做）**：
- S11-05：SF16→SF18 歷史文件 reconciliation（forward-reference 註記，不重寫歷史）；含 control-manifest regen（`/create-control-manifest`）
- S11-06：CSP 加 `font-src 'self' data:`（pgn-viewer 內嵌字型，cosmetic）
- S10-05 動畫 polish — deferred（nice-to-have）

---

## 待測（需 Eason 實機）

- **iPhone 實機**：S10 Replay UI + SF18 Lite 分析；ADR-0007 OQ-5（iPhone 深度 / RSS 量測）仍開放
- **S8-06 iOS Magic Link** 實機補測
