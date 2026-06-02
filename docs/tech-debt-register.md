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

### Spec↔code drift found by audit (needs confirmation during S11 triage)
- **move-annotation Formula 1** (`src/modules/move-annotation/annotation-formulas.ts:33`): code uses an arctan eval-bar curve; the GDD specifies a linear clamp (`evalBarClampCp`, `evalCp=120 → 0.56`). Tests track the code, so code+tests agree but contradict the GDD. Decide: fix code to GDD, or update GDD+AC to the arctan curve. *(agent-reported, not independently re-verified)*
- **game-export** (`src/modules/game-export/`): the GDD's structured "Coach" prompt template is not implemented (generic 3-line string); PGN tags deviate (`Site` hardcoded URL, AI name lacks `(level N)`, `Termination` tag never emitted); no SUCCESS→IDLE auto-revert timer; `ExportConfig` missing several GDD tuning knobs. *(agent-reported, not independently re-verified)*
- **`game_sessions.pgn` stores UCI, not real PGN** (`src/stores/data-sync.ts:47` writes `game.moves.join(' ')`): the inline comment says "replaced with proper PGN when PGN viewer is added" — the PGN viewer landed in S10, so this is now ripe to close. Does NOT break replay (chess.js `loadPgn` parses the LAN movetext fine — verified), but the column can't round-trip to external tools (lichess) as true PGN. *(verified: stores UCI)*
