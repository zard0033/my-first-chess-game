# QA Test Plan — Sprint 8

**Sprint**: Sprint 8 — Game History
**Date**: 2026-06-01
**Stage**: Production
**Smoke Check**: PASS WITH WARNINGS (smoke-2026-06-01.md — 444/444 tests)

---

## Scope

Sprint 8 delivers the Game History epic (#12): a data layer (`fetchGames()` + store) that reads `game_sessions` from Supabase and a `/history` UI that renders the player's past games in list, empty, error, and loading states, plus an interactive row-expand summary panel. QA covers the two Must Have stories (S8-03 data layer, S8-04 HistoryView UI) as BLOCKING automated gates, and the Should Have story (S8-05 row expand) as an ADVISORY Playwright interaction check. S8-06 ADR-0011 iOS PWA Magic Link verification is included as a manual test (Eason iPhone).

---

## Story Classification

| Story | Title | Type | Automated Gate | Manual QA | Status |
|-------|-------|------|----------------|-----------|--------|
| S8-01 | Game History GDD (#12) | Config/Design | None | None | EXPECTED |
| S8-02 | game-history epic + stories scaffolding | Config/Design | None | None | EXPECTED |
| S8-03 | Game History Data Layer | Logic | BLOCKING — 38 unit tests | None | Complete |
| S8-04 | HistoryView UI | UI | BLOCKING — 16 unit tests | ADVISORY screenshots | Complete |
| S8-05 | History row expand summary | UI Interaction | Store unit tests PASS | ADVISORY Playwright | Complete |
| S8-06 | ADR-0011 iOS PWA Magic Link | Verification | N/A | **MANUAL — Eason iPhone** | Ready |

---

## Automated Test Requirements

### S8-03 — Game History Data Layer (BLOCKING, 38 tests)

- `tests/unit/utils/game-history-mappers.test.ts` — 22 tests (AC-06a–f, AC-07a–i, AC-08a–c, AC-19–23)
- `tests/unit/stores/game-history-store.test.ts` — 16 tests (AC-10, AC-13, AC-14, AC-15, AC-17, AC-18, setExpandedRow ×4)

**Status**: 444/444 all green ✅

### S8-04 — HistoryView UI (BLOCKING, 16 tests)

- `tests/unit/views/history-view.test.ts` — 16 tests (AC-01~AC-27)

**Status**: all green ✅ | AC-12 expanded panel wiring confirmed

---

## Manual QA Scope

### S8-04 Advisory Screenshots

Evidence already captured in `production/qa/evidence/`:
- `s8-04-history-loading-state.png` — loading state (skeleton + aria-busy) ✅
- `s8-04-history-list-expanded.png` — list state with expanded row ✅

### S8-06 — iOS PWA Magic Link (Eason iPhone — MANUAL)

**Preconditions**:
1. iPhone Safari 已安裝本 App 為 PWA（Add to Home Screen）
2. 有可用的 email 可收 Magic Link
3. App 已部署至 GitHub Pages（或 dev server 可從 iPhone 存取）

**Test Steps**:

| # | Step | Expected |
|---|------|----------|
| 1 | 在 iPhone Safari 開啟 App | App 正常載入，Home 頁顯示 |
| 2 | 從 Home Screen icon 開啟 App（PWA 模式） | App 以 standalone 模式啟動 |
| 3 | 點 Sign In，輸入 email，點 Send Magic Link | 顯示「Check your email」訊息 |
| 4 | 開啟 email，點 Magic Link | 應跳回 App（PWA standalone 模式）並完成登入 |
| 5 | 確認登入狀態 | Nav bar 顯示 Sign out；userId 非 null |
| 6 | 導航到 /history | HistoryView 載入（空清單或對局清單） |

**Pass criteria**:
- Magic Link 點擊後能回到 App 並完成登入（`#access_token` fragment 正確處理）
- 整個流程在 PWA standalone 模式下完成（不跑出 Safari 瀏覽器）

**Fail criteria**:
- Magic Link 點擊後開啟一般 Safari 而非 PWA
- `#access_token` hash fragment 被 Safari 截掉，登入失敗

---

## Out of Scope

| Item | Reason |
|------|--------|
| PGN replay / re-watch | 明確 defer 到後續 sprint |
| Skill Scoring (#13) / Level Progression (#14) | Sprint 8 範圍外 |
| COOP/COEP Worker memory measurement | 需 server headers，無 capacity |

---

## Entry Criteria

- [x] Smoke check PASS WITH WARNINGS 報告存在：`production/qa/smoke-2026-06-01.md`
- [x] Build 啟動無 crash（dev server 確認）
- [x] S8-03 Status: Complete
- [x] S8-04 Status: Complete
- [x] S8-05 Status: Complete
- [ ] S8-06 iPhone 測試：需 Eason 手動執行

---

## Exit Criteria

- [x] S8-03 38 tests green
- [x] S8-04 16 tests green；AC-12 confirmed
- [x] S8-05 store tests green；Playwright advisory 記錄
- [ ] S8-06 iOS PWA Magic Link 手測結果記錄（PASS / FAIL）
- [ ] 無 `text-red-*` / `text-green-*` on result column（control manifest）
- [ ] 無 `supabase.from(...)` in `src/stores/game-history.ts`（control manifest）
- [ ] QA sign-off 發出
