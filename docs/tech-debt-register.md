# Tech Debt Register

Tracks advisory deviations accepted at story close. Review at sprint retrospective.

---

- **2026-05-30** (OpeningKnowledgeCard.vue Component — S6-02): TR-IDs use `OKC-NN` format instead of standard `TR-opening-knowledge-cards-NNN`; not registered in `tr-registry.yaml`. Run `/architecture-review` to register formally. — tracked from `production/epics/opening-knowledge-cards/story-001-component.md`

- **2026-05-30** (OpeningKnowledgeCard.vue Component — S6-02): `parseInlineMarkdown` silently drops `__double__` underscore syntax (empty italic span filtered). Not a runtime risk for hand-authored cards, but tokenizer would need a lookahead fix to handle it correctly. — tracked from `production/epics/opening-knowledge-cards/story-001-component.md`

- **2026-05-30** (OpeningKnowledgeCard.vue Component — S6-02): Conditional `@click="card ? toggle() : undefined"` pattern in Vue template registers a no-op handler when `card` is null. Consider refactoring to v-if/v-else split or guard-inside-toggle for clarity. — tracked from `production/epics/opening-knowledge-cards/story-001-component.md`

---

## Drift audit 2026-06-02 (S10 spec↔implementation review) — triage for S11

### Engine docs reconciliation (SF16 → SF18 Lite, S10-06)
- **Historical/narrative docs still describe the SF16 two-build HCE/NNUE model** and should be reconciled at the next `/architecture-review`: `docs/architecture/architecture.md`, `docs/architecture/control-manifest.md` (header line 3 + HCE rules ~85/96/98/145), `docs/architecture/adr-0002` (cold-start/`stockfish-nnue-16-single` notes), `adr-0007` (NNUE-not-deployed note now resolved), `adr-0008` (worker-src two-build CSP + `stockfish-nnue-16.js` paths), `design/gdd/chess-engine-integration.md` (HCE Play / NNUE Review split, Formula 4 memory budget), `tr-registry.yaml` (TR-chess-engine-001 "Two engines: HCE Play + NNUE Review"). Current-truth docs already updated: ADR-0001 (amendment), CLAUDE.md, technical-preferences, `docs/registry/architecture.yaml`. **Decision pending**: rewrite vs mark-superseded — ADRs are point-in-time records, so prefer forward-reference notes over rewriting history.
- **Dead `Use NNUE` setoption** in `src/composables/use-stockfish.ts` (value true) and `src/modules/chess-engine/play-engine.ts:84` (value false) — SF18 ignores the option. Harmless no-op; removing requires updating `play-engine-uci.test.ts:217` and `use-stockfish.test.ts:59`. Optional cleanup.

### Spec↔code drift found by audit — RESOLVED in S11 (2026-06-30)
- **✅ move-annotation Formula 1** (S11-01): GDD updated to arctan curve to match code (`atan(evalNormCp/300)/π + 0.5`). Formula 1, variable table, examples, two numeric ACs, Tuning Knob (`evalBarClampCp`→`evalBarSoftnessCp`), Settings references and OQ-4 all aligned. GDD now self-consistent with code + tests (no code change). Note documented that arctan never pegs to 0/1 for non-mate cp.
- **✅ game-export** (S11-02): assembler rewritten to GDD "Coach" template; PGN tags fixed (`Site`=local label, AI name=`Stockfish (level N)`, `Termination` standard vocabulary, local-TZ `Date`); `RESULT_PLAIN` mapping implemented; optional opening/review context slots with clean line-omission; `feedbackDurationMs` SUCCESS→IDLE timer added to `useGameExport`; tuning knobs moved to `src/config/export-tuning.ts`; pure `buildPgn` extracted. 42 game-export tests green.
- **✅ `game_sessions.pgn` real PGN** (S11-03): `data-sync.buildRow` now calls shared `buildPgn(game)` → standard tagged PGN that round-trips to chess.js + external tools. Replay unaffected.
- **✅ Dead `Use NNUE` setoption** (S11-04): removed from `use-stockfish.ts` + `play-engine.ts`; tests + array names updated.

### Engine docs reconciliation (SF16→SF18) — RESOLVED via forward-reference notes (S11-05 audit, 2026-06-30)
Re-audited: the forward-reference / superseded notes the 2026-06-02 drift entry called for were
**already added during S10-06** and are present across every listed doc:
- **ADR-0002 / ADR-0007 / ADR-0008** — each carries an "Engine migration note (2026-06-02, S10-06)" /
  RESOLVED strikethrough pointing to ADR-0001's amendment. Bodies intentionally NOT rewritten
  (ADRs are point-in-time records). ✅
- **architecture.md / chess-engine-integration.md (GDD) / control-manifest.md** — each has a top-of-file
  "⚠️ Engine superseded (2026-06-02, S10-06)" banner flagging the inline SF16/HCE references as historical
  and pointing to ADR-0001. ✅
- **tr-registry.yaml** `TR-chess-engine-001` — already states "Single engine: Stockfish 18 Lite … shared by
  Play + Review + Replay" with a `revised` note. ✅

**Still open (1 item):** `control-manifest.md` inline HCE/NNUE-split rules (§Engine chunk budgets,
`Use NNUE` toggles) are flagged stale by its banner but not yet regenerated — run
`/create-control-manifest update` deliberately (it rewrites the whole manifest). Tracked, not blocking.

### CSP — RESOLVED (S11-06)
- **✅ CSP `font-src 'self' data:`** added to `index.html` (pgn-viewer inline icon font). Build green.
