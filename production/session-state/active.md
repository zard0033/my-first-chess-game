<!-- QA-PLAN: 2026-05-30 | System: Sprint 5 | Plan written: production/qa/qa-plan-sprint-5-2026-05-30.md -->

# Active Session State

**Last updated**: 2026-05-30
**Tests**: 324/324 pass
**Sprint**: 5 (`production/sprints/sprint-5.md`)

---

## 當前進度

### S5-01 ✅ COMPLETE（2026-05-30）
- `src/modules/chess-engine/play-engine.ts` — 加入 liveness probe（BACKGROUND_THRESHOLD_MS=60s, LIVENESS_PROBE_TIMEOUT_MS=1s）、`VisibilityEventTarget` 注入參數、`dispose()` 方法
- `tests/unit/chess-engine/visibility-liveness.test.ts` — 7 tests，全通過
- **偏差**：`VisibilityEventTarget` injectable 替代直接存取 `document`（Node.js 測試相容性）；`dispose()` 作為新增 API

### S5-02 ✅ COMPLETE（2026-05-30）
- `public/pieces/` — 12 SVG 棋子（wK/wQ/wR/wB/wN/wP/bK/bQ/bR/bB/bN/bP），和茶系重新著色
- `src/assets/board-theme.css` — 棋盤方格色彩覆寫 + piece CSS overrides
- `src/main.ts` — 匯入 board-theme.css
- `production/qa/evidence/board-theme-evidence.md` — Playwright 截圖 375px + 1440px，APPROVED
- **對比度** light #e8dcc8 vs dark #8b6f5c ≈ 3.5:1（通過 WCAG 3:1）

### S5-03 ✅ COMPLETE（2026-05-30）
- `tests/e2e/depth-22-spike.spec.ts` — Playwright spike；HCE 模式下 3 個局面分別達 depth 27/29/27 in 10s
- `production/qa/evidence/s5-03-depth22-spike-evidence.md` — 詳細測量記錄
- `docs/architecture/adr-0007-*.md` — Status 更新，OQ-5 desktop spike RESOLVED
- **關鍵發現**：NNUE 網路檔（38MB）未部署 → review engine 靜默使用 HCE；`REVIEW_TARGET_DEPTH = 22` 在 HCE 模式下 CONFIRMED ✅
- **後續**：Sprint 6 決定是否部署 NNUE 檔或正式切換 HCE

### S5-04 ✅ COMPLETE（2026-05-30）
- `vite.config.ts` — 加入 `manualChunks: { 'chess-board': ['vue3-chessboard', 'chessground', 'chess.js'], 'chess-openings': ['chess-openings'] }`
- `production/qa/smoke-chess-board-bundle.md` — 更新實際量測結果
- **結果**：chess-board chunk **56.33 kB gzip** ✅（< 120 kB 預算）；chess-openings chunk 137 kB（advisory）
- **附加效益**：chess.js 不再重複打包；game-store 從 38KB 縮至 0.58KB

### S5-05 ✅ COMPLETE（2026-05-30）
- `tests/e2e/memory-budget-spike.spec.ts` — Playwright spike；main thread heap 9.5MB
- `production/qa/evidence/chess-engine-memory-evidence.md` — 測量結果、限制說明、手動測量指引
- **結果**：Main thread heap 9.5 MB ✅；Worker WASM 記憶體估算 ~57 MB total（< 150 MB）
- **限制**：無 COOP/COEP headers 無法自動量測 Worker 記憶體；完整手動測量延至 Sprint 6

---

## Sprint 5 Story 狀態

| ID    | Story                                 | 狀態     |
| ----- | ------------------------------------- | -------- |
| S5-01 | iOS Visibility Liveness               | done     |
| S5-02 | Board Theme                           | done     |
| S5-03 | ADR-0007 depth-22 spike               | done     |
| S5-04 | Bundle Size Verification              | done     |
| S5-05 | Memory Budget Verification            | done     |

---

## ⚠️ Sprint 5 開放項目（移交 Sprint 6）

1. **NNUE 部署決策**：`nn-5af11540bbfe.nnue`（38MB）未部署 → review engine 使用 HCE。選項：(a) 部署 NNUE 檔，(b) 正式改為 HCE-only，更新 ADR-0001
2. **chess-openings chunk**：137 kB gzip，超過 120 kB budget（非 chess-board AC，但值得追蹤）
3. **完整記憶體量測**：需 Chrome DevTools 手動 heap snapshot（Worker WASM 記憶體）
4. **ADR-0007 Accepted**：OQ-5 desktop done，仍需 real iPhone + NNUE 部署決策才能達 Accepted

---

## 下一步（新 session 入口）

Sprint 5 全部 story DONE。建議：
1. 跑 `/smoke-check sprint` 做 Sprint 5 QA sign-off
2. 規劃 Sprint 6：解決 NNUE 決策 + Supabase 整合 + Phase 2 準備

Sprint 6 候選範圍：
- NNUE 部署決策（ADR-0001 更新）
- `opening-knowledge-cards` GDD 補完（sections 3/5/7/8）→ 解除 Blocked
- Supabase 整合（Magic Link auth + 對局儲存）
- Phase 2 準備（Claude API 解釋功能）

## 歷史里程碑（參考）

- Sprint 1: 環境設定 + ADR spikes ✅
- Sprint 2: Foundation layer（chess-board + chess-engine + opening-id + app-router），全部 10 stories ✅；Stockfish WASM timeout bug fixed
- Sprint 3: Core layer（game-lifecycle + move-annotation），182/182 tests，APPROVED WITH CONDITIONS
- Sprint 4: Feature layer（post-game-review + game-export + keyboard-nav），314/314 tests，COMPLETE ✅
- Sprint 5: iOS Liveness + Board Theme + depth-22 spike + bundle size + memory budget，324/324 tests，COMPLETE ✅
