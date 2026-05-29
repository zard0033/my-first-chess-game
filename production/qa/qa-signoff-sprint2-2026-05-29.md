# QA Sign-Off Report: Sprint 2
**Date**: 2026-05-29
**Scope**: S2-01 ~ S2-10 (10 stories)
**Stage**: Pre-Production
**Smoke Check**: PASS WITH WARNINGS (`production/qa/smoke-sprint2-recheck-2026-05-29.md`)

---

## Test Coverage Summary

| ID | Story | Type | Auto Test | Manual QA | Result |
|----|-------|------|-----------|-----------|--------|
| S2-01 | FEN Rendering & Position Sync | Logic | PASS | — | PASS |
| S2-02 | Dual Input (Drag + Tap-Tap) | Logic | PASS | — | PASS |
| S2-03 | squareToRect() Geometry | Logic | PASS | — | PASS |
| S2-04 | Play Engine — UCI Handshake | Logic | PASS | — | PASS |
| S2-05 | play() + AbortSignal + Race Guard | Logic | PASS | — | PASS |
| S2-06 | CSP + WASM Deployment Config | Config/Data | smoke: PASS | — | PASS |
| S2-07 | Route Table + SPA Fallback | Logic | PASS | — | PASS |
| S2-08 | Promotion Dialog | UI | — | BLOCKED | BLOCKED |
| S2-09 | Navigation Guards | Logic | PASS | — | PASS |
| S2-10 | Opening Lookup (ECO) | Logic | PASS | — | PASS |

**Summary**: 9 PASS, 0 FAIL, 1 BLOCKED

---

## Bugs Found

None.

---

## Blocked Items

| ID | Story | Reason | Suggested Fix |
|----|-------|--------|---------------|
| S2-08 | Promotion Dialog | Stockfish 持續回應，難以手動走到升變局面 | 加 DevTools FEN setter，或提供跳過 AI 的 test mode |

---

## Advisory Items (from smoke check)

1. 棋盤在 ~1112px 以下 viewport 消失 — CSS min-width 缺失，建議 Sprint 3 修
2. favicon.ico 404 — 加 `public/favicon.ico` 即可
3. Feature request: 棋盤座標標示（a-h / 1-8 Lichess 風格）

---

## Verdict: APPROVED WITH CONDITIONS

**Conditions**:
1. S2-08 Promotion Dialog 需補完手動 QA sign-off — 建議加入 FEN 注入 dev tool 後補測
2. 棋盤 ~1112px CSS collapse bug 需在 Sprint 3 修復

**Next Step**: Run `/retrospective` → `/sprint-plan Sprint 3`
