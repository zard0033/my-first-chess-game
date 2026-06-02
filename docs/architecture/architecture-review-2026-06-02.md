# Architecture Review Report — Engine Compatibility (2026-06-02)

**Mode**: `engine` (engine compatibility audit)
**Engine of record**: Stockfish 18 Lite single-threaded (`stockfish@18.0.7`, NNUE embedded)
**Trigger**: S10-06 engine migration (SF16 → SF18 Lite) left version references inconsistent across ADRs and architecture docs.

---

## Engine Audit Results

**Version consistency: CONCERNS → reconciled.**

ADRs that reference the engine: ADR-0001, ADR-0002, ADR-0007, ADR-0008.
Before this review, only ADR-0001 reflected SF18 (via its 2026-06-02 amendment); the other three plus several living docs still described the SF16 two-build (HCE Play + NNUE Review) model.

| Document | Stale reference | Reconciliation applied |
|---|---|---|
| ADR-0001 | — | (current — amendment 2026-06-02) |
| ADR-0002 | `stockfish-nnue-16-single` worker paths, HCE/NNUE split | Forward-ref engine-migration note added; postMessage/single-thread/no-SAB decisions still hold |
| ADR-0007 | "NNUE network not deployed → review uses HCE" listed as **open blocker** | Marked **RESOLVED** — SF18 Lite embeds NNUE; review runs NNUE in-browser (verified) |
| ADR-0008 | two-build CSP, `stockfish-nnue-16.js` paths | Forward-ref note added; CSP requirements unchanged; flagged pgn-viewer `font-src` cosmetic follow-up |
| control-manifest.md | Engine header `SF16.1`; HCE/NNUE rules | Header updated to SF18 Lite; HCE-split rules flagged for next `/create-control-manifest` regen |
| tr-registry.yaml `TR-chess-engine-001` | "Two engines: HCE Play + NNUE Review" | Requirement text updated to single SF18 Lite build (ID unchanged, `revised` dated) |
| design/gdd/chess-engine-integration.md | HCE/NNUE two-build design, OQ#6, Formula-4 split | Superseded note added at top |
| docs/architecture/architecture.md | two-build engine model (2026-05-28 blueprint) | Superseded note added at top |
| docs/registry/architecture.yaml | `chess_engine_wasm_source` = SF16.1 | Updated to SF18 Lite (done in prior commit d602db8) |

**Reconciliation principle**: ADRs and the dated master-architecture blueprint are point-in-time records — annotated with forward-reference notes rather than rewritten. Machine-readable/current-truth docs (registry, tr-registry requirement text, control-manifest header) updated in place. ADR-0001 (amendment) is the single engine-of-record.

**Deprecated API check**: SF18 has no `Use NNUE` UCI option (SF18 is always-NNUE). `src/composables/use-stockfish.ts` and `src/modules/chess-engine/play-engine.ts:84` still send a now-ignored `Use NNUE` setoption — logged in tech-debt as optional cleanup (harmless no-op; removal would touch their unit tests).

**Engine specialist consultation**: skipped — this is a Web App (no traditional game engine); technical-preferences directs standard web/TS review, no engine specialist configured.

---

## Verdict: PASS (post-reconciliation)

Engine version is now consistent across all ADRs and living docs (SF18 Lite of record, with historical docs clearly annotated). No blocking cross-ADR conflicts. No coverage gaps introduced.

## Follow-ups (non-blocking, tracked in tech-debt-register.md)
1. control-manifest HCE/NNUE rule bodies — reconcile at next `/create-control-manifest` regen.
2. Dead `Use NNUE` setoption in use-stockfish.ts / play-engine.ts — optional cleanup (+ test updates).
3. CSP `font-src 'self' data:` for pgn-viewer's embedded icon font (cosmetic).
4. Non-engine spec↔code drifts found in the broader audit (move-annotation Formula 1, game-export prompt/PGN tags, `pgn` column stores UCI) — triage in S11.
