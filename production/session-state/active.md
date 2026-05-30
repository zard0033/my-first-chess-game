<!-- QA-PLAN: 2026-05-30 | System: Sprint 4 | Plan written: production/qa/qa-plan-sprint-4-2026-05-30.md -->

# Active Session State

**Last updated**: 2026-05-30
**Tests**: 314/314 pass
**Sprint**: 4 (`production/sprints/sprint-4.md`)

---

## 當前進度

### S4-01 ✅ COMPLETE WITH NOTES（2026-05-30）
- `src/views/PlayView.vue` — 移除 useChessBoard，接入 useGameLifecycle + usePlayEngine；GAME_OVER overlay + New Game + Review 按鈕
- `src/modules/game-lifecycle/use-game-lifecycle.ts` — 新增 setDevFen()（同時重置 _moves/_playerMoveTimes）
- Code review 修了 2 bugs：engine error 永久 disable + setDevFen stale _moves
- 7 張 Playwright 截圖於 `production/qa/evidence/s4-01-*.png`

### S4-02 ✅ COMPLETE WITH NOTES（2026-05-30）
- `src/config/engine-tuning.ts` — 新增 7 個 tuning constants（REVIEW_PREVIEW_DEPTH、REVIEW_TARGET_DEPTH 等）
- `src/modules/post-game-review/use-post-game-review.ts` — two-pass analysis loop composable
- `src/views/ReviewView.vue` — 接入 usePostGameReview、opening header、cpLoss display、navigation、biggest swing
- `tests/unit/post-game-review/two-pass-analysis.test.ts` — 30 tests，全通過
- **注意偏差**：state 型別用 `ANALYZING | CANCELLED` 而非 story spec 的 `ANALYZING_PASS1 | ANALYZING_PASS2 | ABORTED`

### S4-03 ✅ COMPLETE（2026-05-30）
- `src/modules/post-game-review/cploss.ts` — `computeCpLoss(evalI, evalNext)` + `isCpLossPreliminary(depthI, depthNext)` 純函式
- `tests/unit/post-game-review/cploss-formula.test.ts` — 15 tests，全通過

### S4-04 ✅ COMPLETE（2026-05-30）
- `src/modules/post-game-review/use-post-game-review.ts` — 提取 `computeBiggestSwingCursor` 為 export 純函式
- `tests/unit/post-game-review/biggest-swing.test.ts` — 11 tests，全通過

### S4-07 ✅ COMPLETE（2026-05-30）
- `src/modules/game-export/types.ts` — `ExportConfig` interface（readonly fields）
- `src/modules/game-export/assembler.ts` — `assembleExportPayload` 純同步函式 + Seven Tag Roster
- `tests/unit/game-export/pgn-prompt-assembly.test.ts` — 14 tests，全通過

### S4-05 ✅ COMPLETE（2026-05-30）
- `src/modules/post-game-review/use-post-game-review.ts` — sessionStorage 持久化（debounce 500ms、pv stripped、QuotaExceeded 靜默處理、remount restore）
- `tests/unit/post-game-review/sessionstorage.test.ts` — 8 tests，全通過

### S4-06 ✅ COMPLETE（2026-05-30）
- `src/views/ReviewView.vue` — isMobile matchMedia + displayAnnotations（bestMove only on mobile）+ displayEvaluation（null on mobile）+ MoveAnnotationDisplay 接入
- `production/qa/evidence/s4-06-mobile-calm.md` — advisory evidence（screenshot pending 手動驗證）

### S4-08 ✅ COMPLETE（2026-05-30）
- `src/modules/game-export/use-game-export.ts` — Tier-1/2/3 state machine（SHARING/COPYING/SUCCESS/FALLBACK）
- `tests/unit/game-export/tier-delivery.test.ts` — 11 tests，全通過

### S4-09 ✅ COMPLETE（2026-05-30）
- `src/composables/use-board-keyboard.ts` — useBoardKeyboard composable（IDLE/PIECE_SELECTED、Arrow/Enter/Escape/Home/End/PgUp/PgDn、100ms merge、squareAriaLabel）
- `src/components/chess-board.vue` — 整合 keyboard nav（focus cell、tabindex="-1" wrapper、assertive live region）
- `tests/unit/chess-board/keyboard-nav.test.ts` — 37 tests，全通過
- `tests/e2e/chess-board-a11y.spec.ts` — Playwright axe-core spec（pending CI run）

### 🎉 Sprint 4 COMPLETE
所有 S4-01 ~ S4-09 已完成。305/305 tests pass。

---

## Sprint 4 Story 狀態

| ID    | Story                           | 狀態                        |
| ----- | ------------------------------- | --------------------------- |
| S4-01 | PlayView ← useGameLifecycle     | done                        |
| S4-02 | Two-Pass Analysis Loop          | done                        |
| S4-03 | cpLoss Formula                  | done                        |
| S4-04 | biggestSwingCursor              | done                        |
| S4-05 | sessionStorage Persistence      | done                        |
| S4-06 | Mobile Calm Default             | done                        |
| S4-07 | PGN Assembly                    | done                        |
| S4-08 | Tier Delivery State Machine     | done                        |
| S4-09 | Keyboard Nav（S3-08 carryover） | done                        |

---

## ⚠️ 重要注意事項

- **ADR-0007 `REVIEW_TARGET_DEPTH = 22` 是 provisional** — iPhone Safari depth-22 spike 尚未執行。S4-02 實作時標記為 provisional，Sprint 5 前完成 spike。
- **Sprint 3 殘餘 conditions（不阻塞）**：S3-07 AC-3/AC-4（reduced-motion，forced-colors）advisory；S3-04 E2E pointer-events Playwright test（Sprint 4 QA）。
- **QA Plan**：`production/qa/qa-plan-sprint-4-2026-05-30.md`

---

## 歷史里程碑（參考）

- Sprint 1: 環境設定 + ADR spikes ✅
- Sprint 2: Foundation layer（chess-board + chess-engine + opening-id + app-router），全部 10 stories ✅；Stockfish WASM timeout bug fixed
- Sprint 3: Core layer（game-lifecycle + move-annotation），182/182 tests，APPROVED WITH CONDITIONS
- Sprint 4: Feature layer（post-game-review + game-export），進行中
