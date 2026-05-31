# Sprint 6 — 2026-08-07 to 2026-08-20

> **PR-SPRINT Gate**: Skipped — Lean mode.
> **QA Plan**: ⚠️ NONE — run `/qa-plan sprint` before the first implementation story begins.

## Sprint Goal

完成 opening-knowledge-cards 功能（Pillar 2 首次閉環），並為 Supabase 整合打好設計地基，使 v0 MVP 達到可完整展示品質。

## Capacity

- Total calendar days: 14 (part-time solo developer)
- Effective hours: ~30h (2–3h/weekday; 3–4h/weekend)
- Buffer (20%): 6h reserved for unplanned work
- Available: ~24h ≈ 3.0 equivalent working days

## Tasks

### Must Have (Critical Path)

| ID | Task | Story File | Est. | Dependencies | Acceptance Criteria |
|----|------|------------|------|--------------|---------------------|
| S6-01 | opening-knowledge-cards: 更新 EPIC 狀態 + create stories | (sprint housekeeping) | 0.13d / 1h | GDD 已完整 ✅ | EPIC.md status 改 Ready；index.md 更新；story files 建立 |
| S6-02 | opening-knowledge-cards: OpeningKnowledgeCard.vue 組件實作 + PostGameReview 整合 | [story-001](../epics/opening-knowledge-cards/story-001-component.md) | 0.88d / 7h | S6-01 | AC-01~AC-06 pass；mobile collapse/expand 正確；HTML 不注入 DOM；unit tests pass |
| S6-03 | opening-knowledge-cards: 剩餘 10 張 ECO 內容卡著作 | [story-002](../epics/opening-knowledge-cards/story-002-content-cards.md) | 0.50d / 4h | S6-02 | AC-07: ≥ 20 ECO codes 有卡；AC-08: tone 無判斷語；內容通過 review |

**Must Have total: ~1.5d / ~12h**

### Should Have (延伸目標)

| ID | Task | Story File | Est. | Dependencies | Acceptance Criteria |
|----|------|------------|------|--------------|---------------------|
| S6-04 | NNUE 部署決策：更新 ADR-0001（HCE-only 或部署 38MB 檔） | (ADR update) | 0.25d / 2h | S5-03 spike ✅ | ADR-0001 status → Accepted；決策記錄在 Consequences；active.md open item 關閉 |
| S6-05 | Supabase 整合：GDD 草稿（auth + game storage） | design/gdd/ | 0.50d / 4h | — | GDD 8 sections complete；schema 初稿；ADR 需求列舉 |

**Should Have total: ~0.75d / ~6h（累計 18h — 在 24h budget ✅）**

### Nice to Have (有餘力再做)

| ID | Task | Story File | Est. | Dependencies | Acceptance Criteria |
|----|------|------------|------|--------------|---------------------|
| S6-06 | Supabase ADR：schema 設計 + auth 策略 | docs/architecture/ | 0.25d / 2h | S6-05 | ADR 草稿完成；TR-IDs 列舉 |
| S6-07 | chess-openings chunk advisory：評估是否拆分（137kB → < 120kB） | (spike) | 0.25d / 2h | S5-04 ✅ | 拆分可行性報告或 advisory 關閉記錄 |

**Nice to Have total: ~0.5d / ~4h（累計 22h ✅）**

## Carryover from Sprint 5

| Task | Reason | New Position |
|------|--------|-------------|
| NNUE 部署決策 | 需要 spike 結果才能決策 (S5-03 done ✅) | S6-04 Should Have |
| chess-openings 137kB advisory | 非阻塞，advisory only | S6-07 Nice to Have |
| 完整 Worker 記憶體量測 | 需 COOP/COEP headers | 移到 Sprint 7（Supabase 後再設 headers） |
| opening-knowledge-cards EPIC 解除 Blocked | GDD 已完整 | S6-01 Must Have |

## Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| ECO 內容卡著作比估計慢（每張卡需查資料） | Medium | Low | 10 張卡 4h 估算偏保守；如超時降為 Should Have |
| Supabase GDD 設計阻力（schema 不確定） | Medium | Low | GDD 是 Should Have；Sprint 7 實作 |
| OpeningKnowledgeCard 在 PostGameReview 整合衝突 | Low | Medium | PostGameReview 已有 panel slot 設計；依 GDD §3 Placement |

## Dependencies on External Factors

- **chess-openings 函式庫 ECO 回傳值**：S6-03 內容卡 ECO 代碼需對比 `lookupSync` 實際輸出（GDD Appendix 標注 "approx."）

## Definition of Done for this Sprint

- [ ] S6-01：EPIC.md status = Ready；index.md 更新；story files 存在
- [ ] S6-02：`tests/unit/opening-knowledge-cards/` unit tests pass；PostGameReview 整合可手動驗證
- [ ] S6-03：`src/data/opening-knowledge-cards.ts` ≥ 20 ECO codes；AC-08 tone 驗證
- [ ] All Logic/Integration stories 有 passing unit tests
- [ ] QA plan exists (`production/qa/qa-plan-sprint-6-2026-05-30.md`)
- [ ] Smoke check passed (`/smoke-check sprint`)
- [ ] QA sign-off: APPROVED or APPROVED WITH CONDITIONS
- [ ] `production/session-state/active.md` updated with sprint outcomes

---

**Scope check:** Sprint 6 stories are within the opening-knowledge-cards epic boundary (S6-01~S6-03) and design work (S6-04~S6-07). If S6-02 expands beyond the PostGameReview panel integration point, run `/scope-check opening-knowledge-cards`.
