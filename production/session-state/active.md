<!-- QA-PLAN: 2026-06-01 | System: Sprint 8 | Plan pending: run /qa-plan sprint after S8-02 stories created -->

# Active Session State

**Last updated**: 2026-06-01
**Tests**: 444/444 pass
**Sprint**: 8 (`production/sprints/sprint-8.md`)
**Supabase**: 連線 OK，tables 建立，RLS 驗證通過

---

## 新 Session 入口（S8-03 起）

**接手指令**：`請繼續開發 Sprint 8，從 S8-03 開始，按規劃完成到 S8-05，然後做 smoke check + QA sign-off`

**授權**：全自主，重大決策才問 Eason

---

## 當前進度

### Sprint 8 進行中

| ID | Task | Status |
| -- | ---- | ------ |
| S8-01 | Game History GDD (#12) + /design-review | ✅ **APPROVED** (pass 5, 2026-06-01) — 6 blockers resolved in-session |
| S8-01b | ADR-0011 → Accepted | ✅ done (2026-06-01) |
| S8-02 | game-history epic + stories | ✅ **done** (2026-06-01) — 4 stories + EPIC.md + index.md updated; no new ADR needed |
| S8-03 | fetchGames() + loadGameHistory() + unit tests | ✅ **done** (2026-06-01) — 38 new tests; 424/424 total pass |
| S8-04 | HistoryView UI | ✅ **done** (2026-06-01) — 16 new tests; 440/440 total pass |
| S8-05 | Row expand summary | ✅ **done** (2026-06-01) — 4 store tests; single-row invariant browser verified |
| S8-06 | ADR-0011 iOS 實機驗證 (Eason 手測) | ⚠️ **PASS WITH CONDITIONS** — PWA standalone ✅, emailRedirectTo fix ✅, rate limit 阻擋完整流程；rate limit 重置後再測 |

**design-review 結果**（2026-06-01 pass 5）：APPROVED — 6 blockers resolved in-session: load-more fetchGeneration race guard, iOS tap-to-expand scroll disambiguation, stalemate AC-21b, fetchGeneration observable store property, AC-12 precondition implementation-agnostic, cached-data error state for PWA Refresh failure. Also applied: Formula 2 out-of-range console.warn, cold→cold failure transition explicit, transition table completeness.
**S8-02 完成**（2026-06-01）：game-history EPIC.md + 4 stories + epics/index.md 更新。無需新 ADR（ADR-0005 + ADR-0011 已覆蓋）。
**S8-03 完成**（2026-06-01）：5 files created/modified；38 new tests；全部 AC 通過（AC-06a~f, AC-07a~i, AC-08a~c, AC-10, AC-13, AC-14, AC-15, AC-17, AC-18, AC-19~22, AC-21b, AC-23）。
**S8-04 完成**（2026-06-01）：HistoryView.vue + history-row.vue + @vue/test-utils 安裝；16 new tests；全部 AC 通過（AC-01~27 除 16b/24 為 store test 覆蓋）。
**Sprint 8 QA Sign-Off**（2026-06-01）：**APPROVED WITH CONDITIONS**
- Sign-off 報告：`production/qa/qa-signoff-sprint8-2026-06-01.md`
- 條件：S8-06 iOS Magic Link 完整流程待 rate limit 重置後補測（約 1hr）；ADR-0011 → Accepted 待此條件完成
- GitHub Pages 部署完成：https://zard0033.github.io/my-first-chess-game/
- 新增：tsconfig.app.json、deploy.yml、emailRedirectTo 修正

**下一步**：rate limit 重置後在 iPhone 補測 S8-06 → ADR-0011 → Accepted → Sprint 8 正式關閉

---

### Sprint 7 Must Have ✅ ALL DONE（2026-05-31）

| ID | Story | Status |
| -- | ----- | ------ |
| S7-01 | Supabase singleton + .env.example + CSP connect-src | ✅ done |
| S7-02 | useAuthStore（initAuth / signIn / signOut） | ✅ done |
| S7-03 | DB migration：game_sessions + skill_scores + RLS | ✅ done |
| S7-04 | useDataSyncStore（syncGame / offline queue） | ✅ done |
| S7-05 | Route guards + App.vue initAuth | ✅ done |
| S7-06 | Sign In UI | ✅ done |
| S7-07 | PostGameReview sync badge | ✅ done |
| S7-08 | ADR-0011 → Accepted | backlog（Nice to Have） |

**Commits（未 push）**：9352d16, 4136f78, 6d41fdd, dfce561
**Supabase 已連線**：.env.local 設定完成，tables 建立，RLS 驗證通過

---

## Session Extract — /dev-story 2026-05-30

- Story: production/epics/opening-knowledge-cards/story-001-component.md
- Files changed: src/utils/parse-inline-markdown.ts, src/components/opening-knowledge-card.vue, src/views/ReviewView.vue
- Test written: tests/unit/opening-knowledge-cards/opening-knowledge-card.test.ts (11 tests, 335/335 total pass)
- Blockers: None
- Next: /code-review then /story-done story-001-component.md; manual evidence AC-04/05 at production/qa/evidence/s6-02-knowledge-card-evidence.md

## Session Extract — /story-done 2026-05-30

- Verdict: COMPLETE WITH NOTES
- Story: production/epics/opening-knowledge-cards/story-001-component.md — OpeningKnowledgeCard.vue Component
- Tech debt logged: 3 items (docs/tech-debt-register.md)
- Next recommended: S6-03 — 剩餘 10 張 ECO 內容卡著作

---

## Sprint 5 開放項目（移交 Sprint 6）

1. **NNUE 部署決策** → S6-04 Should Have
2. **chess-openings 137kB advisory** → S6-07 Nice to Have
3. **完整 Worker 記憶體量測** → 移至 Sprint 7（需 COOP/COEP headers）
4. **ADR-0007 Accepted 條件**：OQ-5 desktop RESOLVED；仍需 real iPhone + NNUE 決策

---

## 下一步（新 session 入口）

**Sprint 7 QA Sign-Off: APPROVED**（2026-06-01）
- 7/8 stories PASS（S7-08 SKIPPED — 需 iOS 實機，carry to Sprint 8）
- Sign-off report：`production/qa/qa-signoff-sprint7-2026-06-01.md`
- Evidence 文件：s7-03/05/06/07 全部寫入 `production/qa/evidence/`
- 截圖：7 張新截圖（s7-05/06/07）已存入 evidence/
- 下一步：git commit + push（未 commit commits：9352d16, 4136f78, 6d41fdd, dfce561 + QA evidence）→ `/sprint-plan` 規劃 Sprint 8
- Sprint 8 第一項：S7-08 ADR-0011 iOS PWA Magic Link 驗證

**Sprint 7 Smoke Check PASS WITH WARNINGS**（2026-05-31）
- 386/386 tests pass，0 errors
- S7-06 ✅、S7-07 ✅（3 狀態截圖 + evidence 文件）、smoke check ✅
- Smoke report：`production/qa/smoke-2026-05-31.md`
- S7-07 evidence：`production/qa/evidence/s7-07-sync-badge-evidence.md`
- S7-06 screenshots：`evidence/s7-06-sign-in-ui-screenshot.png`、`evidence/s7-06-home-nav-screenshot.png`
- 未 commit（等 sprint 完成後一次 commit）
- 下一步：`/team-qa sprint` 做 QA sign-off

## Session Extract — /story-done 2026-05-30

- Verdict: COMPLETE WITH NOTES
- Story: production/epics/supabase/story-001-project-setup.md — Supabase Project Setup
- Tech debt logged: None
- Next recommended: S7-02 + S7-03 unblocked

## Session Extract — /story-done 2026-05-31

- Verdict: COMPLETE
- Story: production/epics/supabase/story-002-auth-store.md — useAuthStore
- Code review fixes: pendingEmail/authError cleared on SIGNED_IN; signOut error exposed; subscription handle stored; _applySession extracted
- Tests after fixes: 365/365 pass (15 in auth-store.test.ts)
- S7-05 constraint documented: route guards must check isAuthLoading (not just userId)
- Next recommended: S7-03 (ready-for-dev) + S7-05 now unblocked

## Session Extract — autonomous dev 2026-05-31

- S7-03 COMPLETE: supabase/migrations/ × 2 SQL files; RLS on both tables; 5/5 AC verified
- S7-05 COMPLETE: beforeEach guard + isAuthLoading wait; ProfileView stub; 6 new tests; 372/372 total
- Commits: 9352d16 (S7-02), 4136f78 (S7-03), 6d41fdd (S7-05)
- Sprint 7 Must Have status: S7-01 ✅ S7-02 ✅ S7-03 ✅ S7-04 backlog S7-05 ✅
- Next: S7-04 useDataSyncStore (backlog → now unblocked: S7-01/02/03 all done)

## Session Extract — autonomous dev 2026-05-31 (continued)

- S7-04 COMPLETE: useDataSyncStore, sync-tuning.ts, App.vue flush watcher; 14 tests; 386/386
- Commit: dfce561
- Sprint 7 Must Have: **全部完成** (S7-01~05 all done)
- Next: S7-06 Sign In UI (Should Have) — OR — 先 push + .env.local 設定 Supabase 憑證再繼續

**S6-06 完成記錄**（2026-05-30）：
- 建立 `docs/architecture/adr-0011-supabase-authentication-and-data-sync-strategy.md`（Status: Proposed）
- 更新 `design/gdd/supabase-integration.md`：useDataSync → useDataSyncStore（命名正式化為 Pinia store 慣例）
- 更新 `docs/registry/architecture.yaml`：+2 state_ownership、+3 interfaces、+1 api_decision、+2 forbidden_patterns、last_updated 更新

**S6-07 完成記錄**（2026-05-30）：
- 建立 `docs/chess-openings-chunk-advisory.md`
- 結論：137kB < 150kB 預算，CLOSED。lazy-load 需改同步 interface（已登錄 architecture.yaml）→ Defer Sprint 7

**S6-05 完成記錄**（2026-05-30）：
- 建立 `design/gdd/supabase-integration.md`（Authentication #9 + Data Sync #11 合併設計）
- 8 sections 全部完成：Overview、Player Fantasy、Detailed Design（Auth Flow + Schema + Sync Protocol + Offline + Interactions）、Formulas（3 個公式）、Edge Cases（10 個）、Dependencies、Tuning Knobs、Acceptance Criteria（AC-01~AC-13）

## 歷史里程碑（參考）

- Sprint 1: 環境設定 + ADR spikes ✅
- Sprint 2: Foundation layer（chess-board + chess-engine + opening-id + app-router），全部 10 stories ✅；Stockfish WASM timeout bug fixed
- Sprint 3: Core layer（game-lifecycle + move-annotation），182/182 tests，APPROVED WITH CONDITIONS
- Sprint 4: Feature layer（post-game-review + game-export + keyboard-nav），314/314 tests，COMPLETE ✅
- Sprint 5: iOS Liveness + Board Theme + depth-22 spike + bundle size + memory budget，324/324 tests，COMPLETE ✅
- Sprint 6: opening-knowledge-cards 實作（Pillar 2 閉環）+ Supabase 設計地基，進行中
