# Gate Check: Production → Polish

**Date**: 2026-05-30
**Checked by**: gate-check skill (lean mode)
**Note**: Director Panel skipped — subagents not spawned per session policy (no explicit user request). Verdict based on artifact + quality checks.

---

## Context

`stage.txt` previously read `Pre-Production` (stale — project已有 sprints/epics/stories/實作). Actual stage is **Production**. Corrected to `Production` this session.

This gate validates readiness for Production → Polish. Result: **FAIL** — expected and healthy. v0 (Minimum Playable) is complete; MVP (Full Phase 1) accumulation systems are still in implementation.

---

## Required Artifacts: 6/11 present

- [x] `src/` 有實作程式碼 — 40 files, 11 subsystems
- [ ] **All core mechanics from GDD implemented** — ❌ MVP accumulation 系統 (#9–#14) 未實作
- [x] Main gameplay path playable end-to-end (v0 loop) — smoke check 確認
- [x] Test files in `tests/unit/` + `tests/integration/`
- [x] All Logic stories have unit test files
- [x] Smoke check PASS WITH WARNINGS — `production/qa/smoke-sprint6-2026-05-30.md`
- [x] QA plan exists — `production/qa/qa-plan-sprint-6-2026-05-30.md`
- [~] QA sign-off — 最近僅到 sprint4；Sprint 5、6 無 sign-off
- [ ] **≥ 3 distinct playtest sessions** — `production/playtests/` 空目錄 ❌
- [ ] Playtest reports cover new-player / mid-game / difficulty — ❌
- [ ] Fun hypothesis validated or revised — ❌

## Quality Checks

- [x] Tests passing — 341/341
- [x] No critical bugs — 棋盤視覺 bug 本 session 已修正並 commit (765ff6d)
- [x] v0 core loop plays as designed
- [?] Performance within budget — 未量測（記憶體量測移至 Sprint 7）
- [ ] Playtest findings reviewed — 無 playtest 資料
- [ ] No confusion loops identified — 需 playtest

---

## MVP System Implementation Status (systems-index.md)

**已實作 (v0 全部完成)**:
Chess Board · Chess Engine · Opening ID · Navigation · Game Lifecycle · Move Annotation · Post-Game Review · Game Export · Opening Knowledge Cards

**未實作 (MVP accumulation — 阻擋 Polish)**:
| # | System | Status |
|---|--------|--------|
| 9 | Authentication | Designed (GDD + ADR-0011), 零實作 |
| 10 | Difficulty System | Not Started |
| 11 | Data Sync (Supabase) | Designed (GDD + ADR-0011), 零實作 |
| 12 | Game History | Not Started |
| 13 | Skill Scoring | Not Started |
| 14 | Level Progression | Not Started |

---

## Blockers

1. **MVP accumulation 系統未實作** — #9–#14 全部只有設計或未開始。Supabase 整合 Sprint 6 才完成**設計**，實作排在 Sprint 7+。這是 MVP 核心價值 (Pillar 1 accumulation)，未實作不能進 Polish。

2. **零 playtest sessions** — `production/playtests/` 為空。需 ≥ 3 個 session 涵蓋新玩家/中盤/難度曲線。

3. **Sprint 5、6 無 QA sign-off** — 最近停在 Sprint 4。

---

## Chain-of-Verification

5 questions checked:
1. MVP 系統是否真未實作？ [TOOL ACTION] 讀 `systems-index.md` — #9–14 為 Designed/Not Started，無 `src/modules/` 實作 → 確認。
2. playtests 是否真為空？ [TOOL ACTION] Glob `production/playtests/**` → 無檔案 → 確認。
3. 是否把 FAIL 軟化成 CONCERNS？ 否 — MVP 核心系統未實作是硬性缺失。
4. 是否有過於寬鬆的 PASS？ smoke/QA plan/tests 確實通過，無高估。
5. 最小 PASS 路徑？ 實作 5 個 MVP 系統 + 3 playtest + Sprint QA sign-off — 跨多 sprint。

**Chain-of-Verification: 5 questions checked — verdict unchanged.**

---

## Verdict: FAIL（預期且健康）

專案處於 **Production 中段**。v0 完整運作，但 MVP accumulation 系統還有一半未實作。現在不是進 Polish 的時機。

### Minimal Path to PASS

1. 實作 MVP accumulation 系統（依 dependency 順序）：
   - Authentication (#9) → Data Sync (#11) → Game History (#12) / Skill Scoring (#13) → Level Progression (#14)
   - Difficulty System (#10) 可平行
2. 累積 ≥ 3 個 playtest sessions（新玩家、中盤、難度曲線）
3. Sprint 5–7 QA sign-off 補齊

### 下一步建議

- Sprint 7 規劃：Supabase 實作（Auth + Data Sync），依 ADR-0011
- `/sprint-plan new` 啟動 Sprint 7
