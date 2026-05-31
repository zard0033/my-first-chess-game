<!-- QA-PLAN: 2026-05-30 | System: Sprint 7 | Plan written: production/qa/qa-plan-sprint-7-2026-05-30.md -->

# Active Session State

**Last updated**: 2026-05-30
**Tests**: 365/365 pass
**Sprint**: 7 (`production/sprints/sprint-7.md`)

---

## 當前進度

### Sprint 7 計畫 ✅ WRITTEN（2026-05-30）
- `production/sprints/sprint-7.md` — Sprint 7 計畫寫入
- `production/sprint-status.yaml` — Sprint 7 初始化（8 stories：S7-01~S7-08）

---

## Sprint 7 Story 狀態

| ID | Story | Status |
| -- | ----- | ------ |
| S7-01 | Supabase singleton + .env.example + CSP connect-src | ready-for-dev |
| S7-02 | useAuthStore（initAuth / signIn / signOut） | ready-for-dev（需 S7-01） |
| S7-03 | DB migration：game_sessions + skill_scores + RLS | ready-for-dev（需 S7-01） |
| S7-04 | useDataSyncStore（syncGame / offline queue） | backlog（需 S7-01/02/03） |
| S7-05 | Route guards + App.vue initAuth | backlog（需 S7-02） |
| S7-06 | Sign In UI | backlog（Should Have，需 S7-02） |
| S7-07 | PostGameReview sync badge | backlog（Should Have，需 S7-04） |
| S7-08 | ADR-0011 → Accepted | backlog（Nice to Have） |

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

**Sprint 7 計畫寫入完成**（2026-05-30）
- `production/sprints/sprint-7.md` — 8 stories，Must Have = 20h，Should Have = 6h
- `production/sprint-status.yaml` — Sprint 7 初始化
- ⚠️ 無 QA plan — 開始 implementation 前先跑 `/qa-plan sprint`

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
