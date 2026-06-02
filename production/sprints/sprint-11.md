# Sprint 11 — 2026-06-30 to 2026-07-13

> **PR-SPRINT Gate**: Skipped — Lean mode.
>
> **Theme**: Spec↔Code reconciliation (tech-debt paydown from the 2026-06-02 drift audit) + small cleanups. No new feature epic this sprint — the lesson-system vs visual-identity decision is deferred to Eason (product-direction call).

## Sprint Goal

清償 S10 drift audit 找出的三項 spec↔code 偏移，讓 GDD 與實作重新一致；順手移除失效的引擎 no-op。為日後接 game-export UI 與 PGN 外部互通（lichess）打底。低風險、全程測試驅動。

## Capacity

- Total calendar days: 14 (part-time solo developer)
- Effective hours: ~30h (2–3h/weekday; 3–4h/weekend)
- Buffer (20%): 6h reserved
- Available: ~24h ≈ 3.0 equivalent working days

## Tasks

### Must Have (Critical Path)

| ID | Task | Type | Est. | Dependencies | Acceptance Criteria |
|----|------|------|------|--------------|---------------------|
| S11-01 | move-annotation eval bar: 改 GDD Formula 1 對齊 code（arctan 曲線） | Docs | 0.25d / 2h | — | GDD Formula 1 + 變數表 + 範例 + 相關 AC + Tuning Knob 全部改為 arctan（`atan(evalNormCp/300)/π + 0.5`）；GDD 內部自洽；既有 `annotation-formulas` 測試（追蹤 code）仍全綠，無需改 code |
| S11-02 | game-export: assembler 對齊 GDD（Coach 模板 + 完整 PGN tags + 本地時區 Date + RESULT_PLAIN + SUCCESS→IDLE timer + config knobs） | Logic | 1.25d / 10h | — | 見下方 AC 明細；新增/更新單元測試全綠；payload 仍為純同步 string（iOS gesture 守則不破） |
| S11-03 | `game_sessions.pgn` 改存真 PGN（抽共用 serializer，與 export 共用） | Logic | 0.5d / 4h | S11-02 | `buildPgn(game, opening?)` 純函式；`data-sync.buildRow` 改用之；round-trip 可被 chess.js + lichess 解析；data-sync 測試更新且全綠 |

**Must Have total: ~2.0d / ~16h**

### Should Have

| ID | Task | Type | Est. | Dependencies | Acceptance Criteria |
|----|------|------|------|--------------|---------------------|
| S11-04 | 移除失效的 `Use NNUE` setoption no-op（`use-stockfish.ts` / `play-engine.ts`） | Chore | 0.25d / 2h | — | 兩處 `Use NNUE` setoption 移除；`play-engine-uci.test.ts` / `use-stockfish.test.ts` 同步更新；SF18 行為不變；測試全綠 |

**Should Have total: ~0.25d / ~2h**

### Nice to Have (deferred unless time permits)

| ID | Task | Type | Est. | Dependencies | Acceptance Criteria |
|----|------|------|------|--------------|---------------------|
| S11-05 | 引擎歷史文件 SF16→SF18 forward-reference 註記（`/architecture-review` reconciliation） | Docs | 0.5d / 4h | — | 歷史 ADR/GDD 加前向參照註記（不重寫歷史），current-truth 已更新者不動 |
| S11-06 | CSP 加 `font-src 'self' data:`（pgn-viewer 內嵌字型，cosmetic） | Chore | 0.1d / 1h | — | CSP 更新；無 console 字型違規；無回歸 |

## Carryover from Previous Sprint

| Task | Reason | New Estimate |
|------|--------|-------------|
| — | — | — |

## Deferred (require Eason decision — NOT in this sprint)

- **lesson-system（S12 前置）vs visual-identity（board theme）擇一** — 產品方向決策，留給 Eason。lesson-system 已 Designed（5 stories，需 ADR/design-review）；visual-identity 仍缺 GDD/ADR。
- **S10-05 動畫 polish** — nice-to-have，要做再排。
- **iPhone 實機補測**（S10 Replay + SF18 分析；S8-06 iOS Magic Link）— 需 Eason 的實機。

## Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| game-export Coach 模板大改造成既有「prompt structure」測試失敗 | 100%（預期） | LOW | 那些測試斷言舊的泛用字串，本來就要隨 GDD 改寫；以 GDD §3 模板為準重寫 |
| 本地時區 Date 在 CI（UTC）與本機（+8）產生不同 PGN | MEDIUM | LOW | 測試用固定 epoch + 斷言「合法 YYYY.MM.DD 格式」而非寫死某日，避開時區耦合 |
| 抽共用 PGN serializer 改動 export 與 data-sync 兩處 | LOW | MEDIUM | serializer 設為純函式、單一真相；兩邊各自測試 round-trip |

## Definition of Done for this Sprint

- [ ] All Must Have tasks completed
- [ ] All tasks pass acceptance criteria
- [ ] All Logic stories have passing unit tests
- [ ] Smoke check passed (`/smoke-check sprint`)
- [ ] No S1/S2 bugs introduced
- [ ] GDD ↔ code 重新一致；`docs/tech-debt-register.md` 對應條目標記為已清
- [ ] Code reviewed; local commits per story (push 待 Eason 確認)

## game-export (S11-02) AC 明細

對齊 `design/gdd/game-export-share.md`：

1. **Coach 模板**：payload 用 GDD §3 的 "Coach" 模板（role framing + `` ```pgn `` fenced block + 4 項 numbered ask）。
2. **PGN tags**：`Site` = `"Chess Training Companion (local)"`（非 URL）；AI 名稱 = `"Stockfish (level {N})"`（取 `game.aiSkillLevel`，缺則 `"Stockfish"`）；`Termination` tag 依 Core Rule 5 標準詞彙（v0 型別只到 6 種 endReason → 全部 `"normal"`）；`Date` 用本地時區 `YYYY.MM.DD`。
3. **RESULT_PLAIN**：依 GDD §3 表格由 `result` + `playerColor` + `endReason` 推導自然語句填入 `{{RESULT_PLAIN}}`。
4. **Opening / Review 選用 slot**：assembler 接受選用 `context { opening?, review? }`；有資料才填 `OPENING_LINE` / `REVIEW_HINT_LINE` 與 `Opening`/`ECO` tags，無則整行連換行刪除（不留空行）。
5. **SUCCESS→IDLE timer**：`useGameExport` 進入 SUCCESS 後 `feedbackDurationMs`（預設 2000）自動回 IDLE；`vi.useFakeTimers` 驗證；scope dispose 清 timer。
6. **Config knobs**：新增 `src/config/export-tuning.ts`（GDD §7 指定位置）放模板與 `eventTag`/`siteTag`/`aiNameTemplate`/`feedbackDurationMs`/`promptTokenBudget`/`maxPlyBeforeWarn` 預設；`ExportConfig` 新增欄位為選用，既有呼叫不破。
7. **Formula 1/2 size guards**（純函式，可選）：`estimatePayloadTokens` / long-game flag，附 GDD 對應 AC 測試。
8. **純同步守則不破**：`assembleExportPayload` 仍回傳 string、無 `async`/`await`（AC-6 靜態檢查持續通過）。

## Next Steps

1. `/dev-story` S11-01（docs）→ S11-02 → S11-03 → S11-04，逐一 TDD + 本地 commit
2. Run tests frequently during implementation
3. `/smoke-check sprint` 後更新 `active.md` 與 `epics/index.md`
4. push 待 Eason 確認（列出各 commit message）
