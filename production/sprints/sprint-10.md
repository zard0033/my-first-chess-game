# Sprint 10 — 2026-06-16 to 2026-06-29

> **PR-SPRINT Gate**: Skipped — Lean mode.
>
> **QA Plan**: _pending — run `/qa-plan sprint` after stories are created._

## Sprint Goal

實現 **Game Replay (Phase 2)**：玩家可以回放過往對局，逐步棋步查看引擎分析。完成 Phase 1 → Phase 2 的過渡，為後續 AI 説明功能奠基。

## Capacity

- Total calendar days: 14 (part-time solo developer)
- Effective hours: ~30h (2–3h/weekday; 3–4h/weekend)
- Buffer (20%): 6h reserved for unplanned work
- Available: ~24h ≈ 3.0 equivalent working days

## Tasks

### Must Have (Critical Path)

| ID | Task | Est. | Dependencies | Acceptance Criteria |
|----|------|------|--------------|---------------------|
| S10-01 | pgn-viewer Vue 3 wrapper | 0.75d / 6h | — | Wrapper 組件可渲染 PGN，支持移動迭代，無錯誤 |
| S10-02 | ReplayView UI + navigation | 1.0d / 8h | S10-01 | UI 顯示棋盤 + 棋步列表 + 控制按鈕（播放/暫停/跳轉）；導航至/離開 ReplayView 正常 |
| S10-03 | Engine analysis overlay（Move 層級） | 0.75d / 6h | S10-02 | 每一步棋顯示評值棒 + 最佳著法箭頭；評值計算正確；無渲染性能問題 |

**Must Have total: ~2.5d / ~20h**

### Should Have

| ID | Task | Est. | Dependencies | Acceptance Criteria |
|----|------|------|--------------|---------------------|
| S10-04 | Game-level rating / notes（UI） | 0.5d / 4h | S10-03 | 對局評分面板（星級或評論）；可儲存至 localStorage |

**Should Have total: ~0.5d / ~4h**

### Nice to Have

| ID | Task | Est. | Dependencies | Acceptance Criteria |
|----|------|------|--------------|---------------------|
| S10-05 | Animation polish（棋步推進動畫） | 0.5d / 4h | S10-03 | 棋步 → 評值的 transition；60fps 預算內 |

**Nice to Have total: ~0.5d / ~4h**

## Carryover from Previous Sprint

| Task | Reason | New Estimate |
|------|--------|-------------|
| — | — | — |

## Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| pgn-viewer 與 Vue 3 相容性問題 | 15% | HIGH — 阻擋 S10-01 | 提前測試 pgn-viewer NPM 包；如不相容，手寫簡易 PGN 解析器 |
| Engine overlay 渲染性能（評值棒 + 箭頭） | 20% | MEDIUM — 超 60fps | 使用 rAF + SVG 層級最適化（S10-02 已有先例） |
| 對局存檔大小（PGN 序列化） | 10% | LOW — 無阻擋 | PGN 已在 S8-03 測試，無疑慮 |

## Dependencies on External Factors

- pgn-viewer npm 包相容性（需檢驗）

## Definition of Done for this Sprint

- [ ] All Must Have tasks completed
- [ ] All tasks pass acceptance criteria
- [ ] QA plan exists (`production/qa/qa-plan-sprint-10.md`)
- [ ] All Logic/Integration stories have passing unit/integration tests
- [ ] Smoke check passed (`/smoke-check sprint`)
- [ ] QA sign-off report: APPROVED or APPROVED WITH CONDITIONS
- [ ] No S1/S2 bugs in delivered features
- [ ] Code reviewed and merged
- [ ] Design documents updated for any deviations

## Next Steps

1. `/qa-plan sprint` — 生成 S10 QA 計劃
2. `/story-readiness [story-file]` — 驗證故事準備就緒
3. `/dev-story [story-file]` — 開始實作 S10-01（pgn-viewer wrapper）
4. Run tests frequently during implementation
