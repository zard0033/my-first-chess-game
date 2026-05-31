# Sprint 7 — 2026-08-21 to 2026-09-03

> **PR-SPRINT Gate**: Skipped — Lean mode.

> **QA Plan**: `production/qa/qa-plan-sprint-7-2026-05-30.md` (generated 2026-05-30)

## Sprint Goal

實作 Supabase Auth + Data Sync（GDD #9 + #11），使 v0 遊戲資料首次能跨裝置持久化，建立 MVP Pillar 1 基礎。

## Capacity

- Total calendar days: 14 (part-time solo developer)
- Effective hours: ~30h (2–3h/weekday; 3–4h/weekend)
- Buffer (20%): 6h reserved for unplanned work
- Available: ~24h ≈ 3.0 equivalent working days

## Tasks

### Must Have (Critical Path)

| ID | Task | Story File | Est. | Dependencies | Acceptance Criteria |
|----|------|------------|------|--------------|---------------------|
| S7-01 | Supabase 專案設定：`src/lib/supabase.ts` singleton + `.env.example` + CSP `connect-src` 更新 | [story-001](../epics/supabase/story-001-project-setup.md) | 0.38d / 3h | — | `createClient` 只在 lib 存在；`.env.example` 有兩個 var；`connect-src` 包含 Supabase URL |
| S7-02 | `useAuthStore`：`initAuth()` + `signIn()` + `signOut()` + `onAuthStateChange` handler | [story-002](../epics/supabase/story-002-auth-store.md) | 0.75d / 6h | S7-01 | AC-01~AC-05 pass；unit tests pass；無其他 store 直接讀 `supabase.auth` |
| S7-03 | Supabase migration：`game_sessions` + `skill_scores` 建表 + RLS policies | [story-003](../epics/supabase/story-003-migration.md) | 0.38d / 3h | S7-01 | migration SQL 存在；RLS `user_id = auth.uid()` 兩表皆設；AC-11~AC-12 可驗證 |
| S7-04 | `useDataSyncStore`：`syncGame()` + offline queue + `flushUnsyncedQueue()` + backoff | [story-004](../epics/supabase/story-004-data-sync-store.md) | 0.75d / 6h | S7-01, S7-02, S7-03 | AC-06~AC-09 pass；unit tests pass；`syncStatus` 反應 store state |
| S7-05 | Route guards：`/history` + `/profile` auth gate；`App.vue` 呼叫 `initAuth()` | [story-005](../epics/supabase/story-005-route-guards.md) | 0.25d / 2h | S7-02 | AC-10 pass；未登入者導向首頁；`initAuth()` 在 `App.vue` onMounted |

**Must Have total: ~2.5d / ~20h**

### Should Have (延伸目標)

| ID | Task | Story File | Est. | Dependencies | Acceptance Criteria |
|----|------|------------|------|--------------|---------------------|
| S7-06 | Sign In UI：email 輸入 + Magic Link 請求 + "Check your email" 狀態 + 錯誤提示 | [story-006](../epics/supabase/story-006-sign-in-ui.md) | 0.50d / 4h | S7-02 | Magic Link 請求成功；錯誤提示可見；觸控目標 ≥ 44×44px；無 hover-only 互動 |
| S7-07 | PostGameReview 同步徽章："Saving…" / "Saved" / "Not saved yet" 狀態顯示 | [story-007](../epics/supabase/story-007-sync-badge.md) | 0.25d / 2h | S7-04 | 徽章反映 `syncStatus`；Review 不等 sync 才掛載；AC-13 timing 合規 |

**Should Have total: ~0.75d / ~6h（累計 26h — Must Have 完成後視餘量決定是否展開）**

### Nice to Have (有餘力再做)

| ID | Task | Story File | Est. | Dependencies | Acceptance Criteria |
|----|------|------------|------|--------------|---------------------|
| S7-08 | ADR-0011 → Accepted：iOS PWA Magic Link hash fragment 裝置驗證 | [story-008](../epics/supabase/story-008-adr-accepted.md) | 0.25d / 2h | S7-02, S7-06, 實機測試 | iOS PWA `#access_token` fragment 處理確認；ADR status 更新為 Accepted |

**Nice to Have total: ~0.25d / ~2h**

## Carryover from Sprint 6

| Task | Reason | New Position |
|------|--------|-------------|
| 完整 Worker 記憶體量測 | 需 COOP/COEP headers（適合在 Supabase CSP 更新後一起設） | Sprint 8 |

## Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| iOS PWA Magic Link hash fragment 被 Safari 截掉 | Medium | High | AC-02 on-device 測試；ADR-0011 已標注為 Known Risk；S7-08 設為 Nice to Have 保留彈性 |
| Supabase local dev setup 時間超估（需 Docker Desktop） | Low | Medium | 估算已含 setup 時間；可用 Supabase cloud dev project 替代 |
| `useDataSyncStore` 離線 queue 邊界條件超出估算 | Medium | Low | Formula 2/3 在 GDD 已明確定義；unit test 先行 |

## Dependencies on External Factors

- **Supabase project provisioning**：需要 Supabase project URL + anon key（cloud 或 local Docker）
- **`.env.local` 設定**：`VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` dev 環境設定後才能跑整合測試
- **iOS 實機**：S7-08 ADR 驗證需要真實 iPhone（PWA 安裝 + hash fragment 測試）

## Definition of Done for this Sprint

- [ ] S7-01：`src/lib/supabase.ts` 存在；`grep -r "createClient" src/ --include="*.ts"` 只命中 `lib/supabase.ts`
- [ ] S7-02：`useAuthStore` unit tests pass；AC-01~AC-05 可手動驗證
- [ ] S7-03：`supabase/migrations/` 有兩個 SQL 檔；RLS policies 設定正確
- [ ] S7-04：`useDataSyncStore` unit tests pass；AC-06~AC-09 pass
- [ ] S7-05：AC-10 pass；router guards 整合測試
- [ ] All Logic/Integration stories 有 passing unit tests
- [ ] QA plan exists (`production/qa/qa-plan-sprint-7.md`)
- [ ] Smoke check passed (`/smoke-check sprint`)
- [ ] QA sign-off: APPROVED or APPROVED WITH CONDITIONS
- [ ] `production/session-state/active.md` updated with sprint outcomes

---

**Scope check:** Sprint 7 stories are within the supabase epic boundary (Auth #9 + Data Sync #11). Systems #10 (Difficulty), #12 (Game History), #13 (Skill Scoring), #14 (Level Progression) are explicitly out of scope. If any story expands beyond `useAuthStore` / `useDataSyncStore` boundaries, run `/scope-check supabase`.
