# Sprint 9 — 2026-06-02 to 2026-06-15

> **PR-SPRINT Gate**: Skipped — Lean mode.
>
> **QA Plan**: _pending — run `/qa-plan sprint` after stories are created._

## Sprint Goal

完成 Sprint 8 遺留驗證 + 決策 NNUE 部署策略 + 規劃下一階段新功能（Game Replay / Lesson System）。為 Phase 2 架構奠基。

## Capacity

- Total calendar days: 14 (part-time solo developer)
- Effective hours: ~30h (2–3h/weekday; 3–4h/weekend)
- Buffer (20%): 6h reserved for unplanned work
- Available: ~24h ≈ 3.0 equivalent working days

## Tasks

### Must Have (Critical Path)

| ID | Task | Est. | Dependencies | Acceptance Criteria |
|----|------|------|--------------|---------------------|
| S9-01 | S8-06 補測完成 + ADR-0011 → Accepted | 0.25d / 2h | iPhone rate limit 重置 | iPhone PWA Magic Link 完整流程通過；ADR-0011 status → Accepted；QA 簽核 |
| S9-02 | NNUE 部署決策（ADR-0009 或 quick-decision） | 0.5d / 4h | — | 決定是否啟用 NNUE；若啟用：stockfish.wasm NNUE switch 設定；若否：記錄決策理由 |

**Must Have total: ~0.75d / ~6h**

### Should Have

| ID | Task | Est. | Dependencies | Acceptance Criteria |
|----|------|------|--------------|---------------------|
| S9-03 | chess-openings 137kB 查詢：是否需優化或接受當前大小 | 0.25d / 2h | — | 重新量測 bundle 大小；決定是否需要 lazy-load；文件化決策 |
| S9-04 | Phase 2 功能規劃：Game Replay vs Lesson System 優先級 | 0.5d / 4h | — | 產品優先級確認；初稿設計文件；TR-ID 規劃 |
| S9-05 | 技術債清理：TR-IDs 註冊（opening-knowledge-cards） | 0.25d / 2h | — | `docs/architecture/tr-registry.yaml` 更新；ADR 跨參考驗證 |

**Should Have total: ~1.5d / ~12h**

### Nice to Have

| ID | Task | Est. | Dependencies | Acceptance Criteria |
|----|------|------|--------------|---------------------|
| S9-06 | Worker 記憶體完整量測（需 COOP/COEP headers） | 0.5d / 4h | — | 量測結果記錄；是否需調整 Stockfish 執行緒模式 |
| S9-07 | 視覺優化：History View 行距、卡片密度調整 | 0.5d / 4h | S8-04 | 視覺稽核通過；無新 accessibility issues |

**Nice to Have total: ~1.0d / ~8h**

## Carryover from Previous Sprint

| Task | Reason | New Estimate |
|------|--------|-------------|
| S8-06 ADR-0011 驗證 | iPhone rate limit 重置；原定時間內無法完成 | 0.25d / 2h（carry as S9-01） |

## Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| iPhone rate limit 重置延遲 | 20% | HIGH — 阻擋 S9-01 | 預留 2-3 小時緩衝；若延遲可先進行 S9-02 決策 |
| NNUE 決策涉及效能量測 | 30% | MEDIUM — 超時 | 設定 2h 時間盒；若超時改為推遲決策至 Sprint 10 |
| Phase 2 功能規劃資訊缺失 | 40% | MEDIUM — 設計卡關 | 與 Eason 確認產品優先級；不確定時優先 Game Replay（已有 pgn-viewer 預留） |

## Dependencies on External Factors

- iPhone rate limit 重置（~1 hour post-S8-06 測試）
- Eason 產品優先級確認（Phase 2 新功能選擇）

## Definition of Done for this Sprint

- [ ] S9-01 完成：ADR-0011 status → Accepted
- [ ] S9-02 完成：NNUE 決策文件化
- [ ] S9-03 完成（Should Have）：chess-openings 決策
- [ ] S9-04 初稿完成（Should Have）：Phase 2 功能規劃
- [ ] Sprint 8 官方結束：QA 簽核 + commit + push
- [ ] 無 S1/S2 bugs 導入
- [ ] 若有新故事：QA plan 存在

## Next Steps

1. iPhone 測試完成 → S9-01 簽核
2. `/qa-plan sprint` — 生成 S9 QA 計劃
3. `/story-readiness [story-file]` — 驗證故事準備就緒
4. `/dev-story [story-file]` — 開始實作
