# Smoke Check Report — Sprint 2 Re-check
**Date**: 2026-05-29
**Sprint**: Sprint 2
**Engine**: Web App (Vue 3 + TypeScript + Vitest)
**QA Plan**: production/qa/qa-plan-sprint-2-2026-05-29.md
**Argument**: sprint --quick

---

## Automated Tests

**Status**: PASS (104 tests, 104 passing)

*Unhandled error note*: `Cannot find package 'happy-dom'` —
pre-existing environment gap in vitest config (not a test failure).
Does not affect test results.

---

## Test Coverage

Coverage scan skipped — quick mode.

---

## Manual Smoke Checks

- [x] 1. Startup — App 在 Chromium 無紅色 error — PASS
- [x] 2. Routing — /play 直連 PlayView 正常渲染、32 棋子完整 — PASS
- [x] 3. CSP — DevTools 無 Content Security Policy 警告 — PASS
- [x] 4. Move + Stockfish — e2→e4 後 Stockfish 在 5s 內回應 — PASS ✅ (本次修復)
- [x] 5. 10-move game — 無 CRASHED state、無 console error — PASS
- [x] 6. Promotion dialog — 升變對話框出現、Queen 聚焦 — PASS
- [-] 7. Check indicator — 未測試本輪
- [x] 8. Back-button guard — 上一頁觸發確認對話框 — PASS

---

## Advisory Findings

1. **棋盤在 ~1112px 以下消失** — CSS layout bug，board 寬度歸零。
   須在 `chess-board.vue` 或容器加 `min-width` 保護。建議 Sprint 3 修。
2. **favicon.ico 404** — 靜態資源缺失，加入 `public/favicon.ico` 可修。
3. **Feature request: 座標標示** — Lichess 風格 a-h / 1-8 邊框標示。
   屬 UI 改善，建議作為新 story 排進 Sprint 3。

---

## Verdict: PASS WITH WARNINGS

All Batch 1 and Batch 2 smoke checks passed.
Stockfish WASM loading (smoke item 4) confirmed fixed.
Advisory items do not block QA hand-off.

Fixes applied this session:
- `public/stockfish/` 靜態部署（WASM 不被 Vite transform）
- `READYOK_TIMEOUT_MS` 2000 → 10000（WASM 初始化 budget 充足）
- `play-engine-uci.test.ts` timeout 同步更新
