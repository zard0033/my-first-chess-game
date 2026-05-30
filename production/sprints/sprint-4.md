# Sprint 4 — 2026-07-10 to 2026-07-23

> **PR-SPRINT Gate**: Skipped — Lean mode.
> **QA Plan**: ⚠️ NONE — run `/qa-plan sprint` before the first implementation story begins.

## Sprint Goal

完成 v0 核心玩法閉環（PlayView.vue ← useGameLifecycle 整合）並實作 Post-Game Review 旗艦功能：兩輪分析 → cpLoss 計算 → 最大搖擺游標，讓玩家在對局結束後立即看到逐步顯示的分析結果。

## Capacity

- Total calendar days: 14 (part-time solo developer)
- Effective hours: ~30h (2–3h/weekday; 3–4h/weekend)
- Buffer (20%): 6h reserved for unplanned work
- Available: ~24h ≈ 3.0 equivalent working days

## Tasks

### Must Have (Critical Path)

| ID | Task | Story File | Est. | Dependencies | Acceptance Criteria |
|----|------|------------|------|--------------|---------------------|
| S4-01 | PlayView.vue ← useGameLifecycle 整合：GAME_OVER overlay + New Game btn + Review 導航 | [story-003](../epics/game-lifecycle/story-003-play-view-integration.md) | 0.5d / 4h | S3-02 ✅ S3-03 ✅ | GAME_OVER 覆蓋層出現時 useGameLifecycle 已回傳 GAME_OVER 狀態；New Game 按鈕呼叫 resetGame()；Navigate to Review 按鈕正確呼叫 disarm 然後 router.push('/review') |
| S4-02 | post-game-review: Two-Pass Analysis Loop | [story-001](../epics/post-game-review/story-001-two-pass-analysis.md) | 1.0d / 8h | S4-01, S3-06 ✅ | Pass 1 全 N 個位置；Pass 2 90s ceiling；AbortController markRaw；ucinewgame 在 analyze() 之前；state LOADING→PASS1→PASS2→COMPLETE |
| S4-03 | post-game-review: cpLoss Formula + Depth-Comparability Guard | [story-002](../epics/post-game-review/story-002-cploss-formula.md) | 0.31d / 2.5h | S4-02 | F2 = max(0, E[i]+E[i+1])；depth 差 > 4 → preliminary；tuning knobs in engine-tuning.ts |
| S4-04 | post-game-review: biggestSwingCursor — Computed Once at COMPLETE | [story-003](../epics/post-game-review/story-003-biggest-swing.md) | 0.19d / 1.5h | S4-02, S4-03 | 僅在 COMPLETE 計算一次；僅 isPlayerMove + 兩側 pass:'deep' + bestMove 非 null；tie-break = lowest index |

**Must Have total: ~2.0d / ~16h** (8h margin 在 24h budget 內)

### Should Have (延伸目標)

| ID | Task | Story File | Est. | Dependencies | Acceptance Criteria |
|----|------|------------|------|--------------|---------------------|
| S4-05 | post-game-review: sessionStorage Persistence — Throttled Writes, pv Stripped | [story-004](../epics/post-game-review/story-004-sessionstorage.md) | 0.25d / 2h | S4-02 | key `pgr:analysis:<gameId>`；pv 不持久化；try/catch setItem；rAF/500ms debounce |
| S4-06 | post-game-review: Mobile Calm Default — Viewport-Responsive Annotation | [story-005](../epics/post-game-review/story-005-mobile-calm.md) | 0.25d / 2h | S4-02, S4-01 | < 768px → best-move arrow only，no playedMove，no eval bar；matchMedia 響應 resize |
| S4-07 | game-export: PGN Serialization + Claude.ai Prompt Assembly | [story-001](../epics/game-export/story-001-pgn-prompt-assembly.md) | 0.31d / 2.5h | S3-03 ✅ | assembleExportPayload 純同步 string return；PGN 含 Seven Tag Roster；Claude.ai prompt 確定性 |

**Should Have total: ~0.81d / ~6.5h** (累計 22.5h — 在 24h budget 內 ✅)

### Nice to Have (有餘力再做)

| ID | Task | Story File | Est. | Dependencies | Acceptance Criteria |
|----|------|------------|------|--------------|---------------------|
| S4-08 | game-export: Tier-1/2/3 Clipboard Delivery State Machine | [story-002](../epics/game-export/story-002-tier-delivery.md) | 0.44d / 3.5h | S4-07 | Tier 決策在 tap handler 同步執行 (before any await)；iOS AbortError → IDLE；Fallback textarea auto-select |
| S4-09 | chess-board: Keyboard Navigation — useBoardKeyboard (S3-08 carryover) | [story-005](../epics/chess-board/story-005-keyboard-nav.md) | 0.81d / 6.5h | S2-01 ✅ S2-02 ✅ | Roving tabindex；arrow keys；Enter/Escape；ARIA live regions；axe-core 0 serious/critical |

## Carryover from Sprint 3

| Task | Reason | New Position |
|------|--------|-------------|
| S3-08 Keyboard Navigation | Deliberately backlogged (Nice-to-Have) | S4-09 (Nice to Have) |
| S3-07 AC-3/AC-4 (reduced-motion, forced-colors) | Advisory, non-blocking | 若有空在 S4-09 一起測 |
| S3-04 E2E pointer-events Playwright test | Deferred to Sprint 4 | 加入 S4-02 QA 計畫中 |

## Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| PGR-001 比預估複雜 (8h L story，最重) | Medium | High | 先寫 unit tests 固定 API；Pass 1 完成後算作部分完成 |
| iPhone Safari depth-22 可達性未驗證 (ADR-0007 open question) | Certain | Medium | S4-02 的 REVIEW_TARGET_DEPTH=22 標記為 provisional；spike 在 Sprint 5 前排程 |
| S4-01 story file 不存在，需在 sprint 開始前建立 | Certain | Low | Sprint 計畫核准後立即建立（已在本次 /sprint-plan 建立） |
| game-export Tier-2 iOS navigator.share() 無真機驗證 | Medium | Low | S4-08 為 Nice-to-Have，可延至 Sprint 5 |

## Dependencies on External Factors

- **iPhone device session** (ADR-0007 depth-22 reachability + ADR-0008 iOS CSP): 仍待辦，影響 S4-02 的 REVIEW_TARGET_DEPTH 最終值。Sprint 4 使用 provisional depth-22，Sprint 5 前完成 spike。
- **S3-07 AC-3/AC-4 reduced-motion/forced-colors**: Advisory，不阻塞 Sprint 4 任何 story。

## Definition of Done for this Sprint

- [x] All Must Have tasks (S4-01 through S4-04) completed and tests passing
- [x] `useGameLifecycle` wired into PlayView.vue — GAME_OVER overlay, New Game, Review navigation all functional in browser
- [x] Post-Game Review two-pass analysis runs on a completed game; results display progressively in ReviewView
- [x] cpLoss formula + depth-comparability guard pass all unit tests
- [x] biggestSwingCursor computed exactly once at COMPLETE
- [x] All Logic stories have passing unit tests in `tests/unit/post-game-review/`
- [x] QA plan exists (`production/qa/qa-plan-sprint-4-2026-05-30.md`)
- [x] Smoke check passed (`production/qa/smoke-sprint4-2026-05-30.md`) — 305/305
- [x] QA sign-off: APPROVED WITH CONDITIONS (`production/qa/qa-signoff-sprint4-2026-05-30.md`)
- [ ] `production/sprint-status.yaml` updated at sprint close — deferred
- [x] `production/session-state/active.md` updated with sprint outcomes

> ⚠️ **No QA Plan**: This sprint contains implementation stories. Run `/qa-plan sprint`
> before the first story (S4-01) begins. QA sign-off requires a QA plan — the
> Production → Polish gate will block without one.

---

**Scope check:** Sprint 4 stories span game-lifecycle (S4-01), post-game-review (S4-02–06), and game-export (S4-07–08) epics. If any story expands beyond its epic boundary, run `/scope-check [epic]` before implementation continues.
