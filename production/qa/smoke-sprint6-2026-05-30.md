# Smoke Check Report — Sprint 6

**Date**: 2026-05-30
**Sprint**: Sprint 6 — Opening Knowledge Cards + Supabase 設計
**Engine**: TypeScript Web App (Vue 3 + Vitest + Vite 5)
**QA Plan**: `production/qa/qa-plan-sprint-6-2026-05-30.md`
**Argument**: sprint

---

## Automated Tests

**Status**: PASS ⚠️ (341/341 tests pass — exit code 1 due to pre-existing `happy-dom` missing package)

**Test count change**: 324 → 341 (+17 tests from Sprint 6 stories)
- +11 `opening-knowledge-card.test.ts` (S6-02)
- +6 `opening-knowledge-cards-data.test.ts` (S6-03)

**Pre-existing issues** (not caused by Sprint 6):
- `happy-dom` listed in `package.json` devDependencies but not installed in `node_modules` → Vitest exits with code 1, but all 341 tests pass. Predates Sprint 6.
- `[Vue warn] onScopeDispose()` in `game-export/tier-delivery.test.ts` — all 11 tests pass; pre-existing.

---

## Test Coverage

| Story | Type | Test File | Status |
|-------|------|-----------|--------|
| S6-01 EPIC 更新 | Config/Data | — | EXPECTED |
| S6-02 OpeningKnowledgeCard.vue | UI + Logic | `tests/unit/opening-knowledge-cards/opening-knowledge-card.test.ts` (11 tests) | **COVERED** ✅ |
| S6-03 10 ECO 內容卡 | Config/Data | `tests/unit/opening-knowledge-cards/opening-knowledge-cards-data.test.ts` (6 tests) | **COVERED** ✅ |
| S6-04 NNUE ADR | Config/Data | — | EXPECTED |
| S6-05 Supabase GDD | Config/Data | — | EXPECTED |
| S6-06 Supabase ADR | Config/Data | — | EXPECTED |
| S6-07 chunk advisory | Config/Data | — | EXPECTED |

**Summary**: 2 covered, 0 manual, 0 missing, 5 expected.

---

## Manual Smoke Checks

### Batch 1 — Core Stability

- [x] App 成功啟動 (`localhost:5173`) — PASS ✅
- [x] Play 畫面載入 — PASS ✅
- [x] 棋盤渲染（起始局面正確，修正後）— FIXED + VERIFIED ✅
- [x] 路由守衛：直接導航 `/review` 無棋局 → 正確重定向至首頁 — PASS ✅

### Batch 2 — Sprint 6 Changes + Regression

- [!] **棋盤格子視覺 BUG — 發現並修正** (詳見下方)
- [-] OpeningKnowledgeCard 知識卡顯示 — NOT VERIFIED（需完整走完義大利開局棋局）
- [-] 卡片 collapse/expand — NOT VERIFIED（需手動瀏覽器測試）
- [x] Build 完成無 TypeScript 錯誤 — PASS ✅

### Batch 3 — Data Integrity + Performance

- [-] Save/load — N/A（Supabase 尚未實作，ADR-0011 剛完成 Proposed 狀態）
- [-] Performance — not checked this session

### Build Output

| Chunk | Raw | Gzip | Note |
|-------|-----|------|------|
| `chess-openings-*.js` | 1,352.99 kB | 137.23 kB | S6-07 advisory 確認，在 < 150 kB 預算內 ✅ |
| `chess-board-*.js` | 170.57 kB | 56.33 kB | |
| `index-*.css` | 168.29 kB | 37.89 kB | |
| `ReviewView-*.js` | 23.70 kB | 12.90 kB | |
| `PlayView-*.js` | 21.37 kB | 8.22 kB | |
| `index-*.js` | 34.36 kB | 13.67 kB | |

---

## Bug Found and Fixed During Smoke Check

| Bug | 嚴重性 | 根因 | 修正 |
|-----|--------|------|------|
| 棋盤每格顯示為 4 個 mini 方塊（2×2 sub-grid） | Medium — 視覺錯誤，移子功能正常 | `src/assets/board-theme.css` 的 `background-size: 12.5%` 讓 2×2 SVG tile 縮進 1 個棋盤格，正確應為覆蓋 2×2 棋盤格（25%） | `background-size: 12.5% 12.5%` → `25% 25%` |

**引入版本**: Sprint 5 board-theme 功能（首次在此 smoke check 被發現）
**修正驗證**: Playwright 截圖確認棋盤為正確 8×8 格局 ✅
**待辦**: 此修正尚未 commit — 需在 QA sign-off 前提交。

---

## Missing Test Evidence (Advisory)

All Logic/Integration stories in Sprint 6 have test coverage. No blocking gaps.

**Advisory** — 下列需手動完成（不阻塞 QA hand-off，但 `/story-done` 需補充）:
- S6-02 AC-04/05: 知識卡 collapse/expand 需在真實瀏覽器中走完義大利開局 → resign → 確認卡片出現
  - Evidence 路徑：`production/qa/evidence/s6-02-knowledge-card-evidence.md`

---

## Verdict: PASS WITH WARNINGS

**可進入 QA hand-off。**

Warnings（修正後仍需追蹤）:
1. ⚠️ `board-theme.css` 視覺修正待 commit
2. ⚠️ S6-02 知識卡視覺路徑未完整驗證（需手動完整棋局）
3. ⚠️ `happy-dom` 套件缺失（pre-existing，不影響測試通過率）

QA hand-off: 將 `production/qa/qa-plan-sprint-6-2026-05-30.md` 交給 QA 執行。
