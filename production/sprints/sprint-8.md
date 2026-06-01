# Sprint 8 — 2026-09-04 to 2026-09-17

> **PR-SPRINT Gate**: Skipped — Lean mode.

> **QA Plan**: _pending — run `/qa-plan sprint` before implementation begins._

## Sprint Goal

設計並實作 **Game History (#12)**：讀取 Supabase `game_sessions`，在 `/history` 呈現玩家過往對局清單，把 Sprint 7 的持久層轉成可見的 MVP 價值。

## Capacity

- Total calendar days: 14 (part-time solo developer)
- Effective hours: ~30h (2–3h/weekday; 3–4h/weekend)
- Buffer (20%): 6h reserved for unplanned work
- Available: ~24h ≈ 3.0 equivalent working days

## Tasks

### Must Have (Critical Path)

| ID | Task | Est. | Dependencies | Acceptance Criteria |
|----|------|------|--------------|---------------------|
| S8-01 | 撰寫 **Game History GDD (#12)**（8 sections；list 範圍界定，re-watch 標為 future）→ `/design-review` APPROVED | 0.5d / 4h | — | 8 sections 完整；design-review 通過；systems-index #12 更新為 Designed |
| S8-02 | 建立 `game-history` epic + stories（檢查是否需新 ADR：讀取 / 分頁 / 排序策略） | 0.25d / 2h | S8-01 | EPIC.md + story 檔存在；`epics/index.md` 更新；TR-ID 對應 GDD |
| S8-03 | `fetchGames()`：讀 `game_sessions`（`played_at desc`）+ row→display model 映射 + unit tests | 0.5d / 4h | S8-02 | 排序正確；result / end_reason 反向映射有測試；未登入回傳空；error 處理 |
| S8-04 | **HistoryView** UI：對局清單（結果 / 日期 / 開局 / 手數 / 難度）+ loading / empty / error 三態 | 0.75d / 6h | S8-03 | 取代現有 stub；觸控目標 ≥ 44×44px；無 hover-only；空清單有引導文案 |

**Must Have total: ~2.0d / ~16h**

### Should Have

| ID | Task | Est. | Dependencies | Acceptance Criteria |
|----|------|------|--------------|---------------------|
| S8-05 | History row → 單局摘要（唯讀展開：手數、結果、難度；**不含棋盤 replay**） | 0.5d / 4h | S8-04 | 點列展開摘要；reuse 既有 result 顯示元件 |

### Nice to Have

| ID | Task | Est. | Dependencies | Acceptance Criteria |
|----|------|------|--------------|---------------------|
| S8-06 | （carry S7-08）ADR-0011 → Accepted：iOS PWA Magic Link hash fragment 處理 + 實機驗證 | 0.25d / 2h | S8-02, Eason iPhone 手動測試 | 程式面確認 `#access_token` fragment 處理；Eason 在 iPhone PWA 跑 Magic Link 安裝流程通過；ADR status → Accepted |

## Carryover from Sprint 7

| Task | Reason | New Position |
|------|--------|-------------|
| S7-08 ADR-0011 iOS 驗證 | 需 iPhone 實機（Eason 可手動測試） | S8-06 |
| 完整 Worker 記憶體量測 | 需 COOP/COEP headers | 若有餘力（未排入正式 story） |

## Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| #12 GDD 把 re-watch 納入範圍 → 需要不存在的 PGN replay 元件 | Medium | High | GDD v1 範圍限 list + metadata；replay 明確 defer 到後續 sprint（pgn-viewer 仍 Phase 2 reserved） |
| 無真實 Supabase 資料可手測 | Medium | Low | unit test 以 mock supabase client；手測時先用已登入 session 同步幾局再驗 |
| 儲存的 `pgn` 實為 UCI 字串（非標準 PGN） | Low | Low | 清單只用 `move_count`；摘要顯示 UCI，標注「PGN 待 pgn-viewer」 |
| iOS PWA Magic Link hash fragment 被 Safari 截掉 | Medium | High | S8-06 程式面先處理 fragment；Eason 實機驗證；ADR-0011 已標 Known Risk |

## Dependencies on External Factors

- **真實 Supabase 資料**：手動驗證 HistoryView 需先以已登入 session 同步幾局對局。
- **iPhone 實機**：S8-06 需 Eason 在 iPhone Safari PWA 安裝後手動跑 Magic Link 流程。

## Definition of Done for this Sprint

- [ ] S8-01：Game History GDD 8 sections 完整；`/design-review` APPROVED；systems-index #12 更新
- [ ] S8-02：`game-history` epic + stories 建立；`epics/index.md` 更新
- [ ] S8-03：`fetchGames()` unit tests pass
- [ ] S8-04：HistoryView 三態完成；截圖驗證
- [ ] All Logic/Integration stories 有 passing unit tests
- [ ] QA plan exists (`production/qa/qa-plan-sprint-8.md`)
- [ ] Smoke check passed (`/smoke-check sprint`)
- [ ] QA sign-off: APPROVED or APPROVED WITH CONDITIONS
- [ ] `production/session-state/active.md` updated with sprint outcomes

---

**Scope check:** Sprint 8 聚焦 game-history epic（#12）。Skill Scoring (#13) 與 Level Progression (#14) 明確 out of scope。re-watch / PGN replay defer。若任何 story 超出 fetch + 清單 + 摘要範圍，run `/scope-check game-history`。
