# Sprint 5 — 2026-07-24 to 2026-08-06

> **PR-SPRINT Gate**: Skipped — Lean mode.
> **QA Plan**: ⚠️ NONE — run `/qa-plan sprint` before the first implementation story begins.

## Sprint Goal

完成剩餘基礎可靠性 story（iOS 可見性探測）與視覺識別（棋盤主題），並確認效能/記憶體預算達標，使 v0 MVP 達到可正式發布品質。

## Capacity

- Total calendar days: 14 (part-time solo developer)
- Effective hours: ~30h (2–3h/weekday; 3–4h/weekend)
- Buffer (20%): 6h reserved for unplanned work
- Available: ~24h ≈ 3.0 equivalent working days

## Tasks

### Must Have (Critical Path)

| ID | Task | Story File | Est. | Dependencies | Acceptance Criteria |
|----|------|------------|------|--------------|---------------------|
| S5-01 | chess-engine: iOS Visibility-Change Liveness Probe + Worker Respawn | [story-005](../epics/chess-engine/story-005-ios-visibility.md) | 0.38d / 3h | Story-001/002 ✅ | visibilitychange fires probe after 60s background；readyok→alive；timeout→respawn；requestId 保留；unit tests pass |
| S5-02 | visual-identity: Board Theme — Custom Piece Set & Board Colors | [story-001](../epics/visual-identity/story-001-board-theme.md) | 0.63d / 5h | chess-board FEN ✅ | 12 SVG pieces in src/assets/pieces/；chessground 渲染自訂棋子；和茶系色調；WCAG 3:1 對比；evidence doc |

**Must Have total: ~1.0d / ~8h**

### Should Have (延伸目標)

| ID | Task | Story File | Est. | Dependencies | Acceptance Criteria |
|----|------|------------|------|--------------|---------------------|
| S5-03 | ADR-0007 spike: iPhone Safari depth-22 可達性驗證 | (spike — no story file) | 0.25d / 2h | S4-02 ✅ | 在真機或 Chrome DevTools 確認 depth-22 可達；更新或確認 ADR-0007 provisional 標記 |
| S5-04 | chess-board: Bundle Size Verification (≤ 120KB gzip) | [story-007](../epics/chess-board/story-007-bundle-size.md) | 0.25d / 2h | Stories 001-006 ✅ | vite build chess-board chunk ≤ 120KB gzip；記錄於 production/qa/smoke-chess-board-bundle.md |

**Should Have total: ~0.5d / ~4h (累計 12h — 在 24h budget 內)**

### Nice to Have (有餘力再做)

| ID | Task | Story File | Est. | Dependencies | Acceptance Criteria |
|----|------|------------|------|--------------|---------------------|
| S5-05 | chess-engine: Memory Budget Verification (≤ 150MB) | [story-007](../epics/chess-engine/story-007-memory-budget.md) | 0.25d / 2h | Stories 001-005 ✅ | Chrome Heap Play-only ≤ 65MB；Play+Review ≤ 150MB；evidence/chess-engine-memory-evidence.md |
| S5-06 | opening-knowledge-cards: GDD 完成（sections 3/5/7/8） | (design work) | 0.50d / 4h | 設計決策 | GDD 四個缺漏 section 補完；epic status 從 Blocked → Ready |

**Nice to Have total: ~0.75d / ~6h (累計 18h — 在 24h budget 內 ✅)**

## Carryover from Sprint 4

| Task | Reason | New Position |
|------|--------|-------------|
| ADR-0007 depth-22 spike | 需要真機測試，Sprint 4 無設備 | S5-03 Should Have |
| S4-06 AC-3/AC-4 reduced-motion/forced-colors | Advisory，non-blocking | 若有空在 S5-02 一起驗 |

## Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| iPhone 真機不可用 → ADR-0007 spike 無法完成 | Medium | Low | Spike 為 Should Have；Chrome DevTools 替代；標記 advisory |
| 自訂棋子 SVG 設計時間超估 | Medium | Medium | 使用 lichess open-license set recolor，不從零設計 |
| Bundle 超過 120KB | Low | Medium | manualChunks 已在 vite.config.ts — 測量後調整 |
| opening-knowledge-cards GDD 設計阻力 | High | Low | Nice to Have — 不阻塞 v0 MVP |

## Dependencies on External Factors

- **iPhone 真機**（ADR-0007 + ADR-0008 iOS CSP）: Should Have，無真機以 Chrome DevTools 替代並標記 advisory
- **open-license chess piece SVG 來源**（lichess lila repo）：S5-02 依賴 lichess piece sets，需網路存取

## Definition of Done for this Sprint

- [ ] S5-01：`tests/unit/chess-engine/visibility-liveness.test.ts` pass
- [ ] S5-02：12 SVG pieces 存在；chessground 渲染；`production/qa/evidence/board-theme-evidence.md` + 截圖
- [ ] S5-03：ADR-0007 provisional 標記更新或確認
- [ ] S5-04：`production/qa/smoke-chess-board-bundle.md` 記錄 ≤ 120KB
- [ ] All Logic/Integration stories 有 passing unit tests
- [ ] QA plan exists (`production/qa/qa-plan-sprint-5-2026-05-30.md`)
- [ ] Smoke check passed (`production/qa/smoke-sprint5-*.md`)
- [ ] QA sign-off: APPROVED or APPROVED WITH CONDITIONS
- [ ] `production/session-state/active.md` updated with sprint outcomes

> ⚠️ **No QA Plan**: This sprint contains implementation stories. Run `/qa-plan sprint`
> before the first story (S5-01) begins. QA sign-off requires a QA plan — the
> Production → Polish gate will block without one.

---

**Scope check:** Sprint 5 stories span chess-engine (S5-01) and visual-identity (S5-02) epics, plus measurement/verification stories. If any story expands beyond its epic boundary, run `/scope-check [epic]` before implementation continues.
