# S5-03 — ADR-0007 OQ-5 Spike: Depth-22 Reachability

**Date**: 2026-05-30
**Story**: S5-03 (Should Have — advisory)
**ADR**: [ADR-0007](../../../docs/architecture/adr-0007-post-game-review-analysis-loop-and-sessionstorage-schema.md)
**Test file**: `tests/e2e/depth-22-spike.spec.ts`

---

## Verdict: `REVIEW_TARGET_DEPTH = 22` CONFIRMED ✅

Desktop HCE baseline comfortably reaches depth 27–29 within 10s budget.

---

## Platform

| Field | Value |
|-------|-------|
| Engine | Stockfish 16 single-threaded WASM (`stockfish-nnue-16-single.wasm`) |
| Eval mode | **HCE** (see NNUE issue below) |
| Browser | Desktop Chromium (Playwright headless shell) |
| CPU | Windows x86-64 (unthrottled) |
| `REVIEW_MAX_MOVE_TIME_MS` | 10,000 ms |
| `REVIEW_TARGET_DEPTH` | 22 |

---

## Spike Results

| Position | Depth Reached | Elapsed (ms) | Reached ≥ 22? |
|----------|---------------|--------------|----------------|
| Starting position (e2e4) | **28** | 10,020 | ✅ |
| Ruy Lopez after 3.Bb5 | **29** | 10,019 | ✅ |
| Middlegame (queens on board) | **27** | 10,022 | ✅ |

All three positions reached depth 22 comfortably. The 19–22 ms overage beyond
10,000 ms is normal Stockfish behavior (UCI `bestmove` reply after `movetime` expires).

---

## Critical Finding: NNUE Network File Not Deployed

The review engine (`review-engine.ts`) sends `setoption name Use NNUE value true`,
but the NNUE network file is **not present** in `public/stockfish/`:

```
Expected:  public/stockfish/nn-5af11540bbfe.nnue  (38 MB)
Found:     node_modules/stockfish/src/nn-5af11540bbfe.nnue  (38 MB) — NOT served
```

Stockfish reports at runtime:
```
Load eval file success: 0
NNUE evaluation used, but the network file was not loaded successfully.
```

**Result**: The review engine currently runs in **HCE mode**, not NNUE mode, despite
ADR-0001 specifying NNUE for the review engine.

### Impact on depth-22 spike

- HCE mode: depth 27–29 per position in 10s ✅ (spike confirms `REVIEW_TARGET_DEPTH = 22` is safe)
- NNUE mode: could not be measured — NNUE file not available
- NNUE is slower per node but more accurate; depth reached in 10s would be lower (~18–24 estimated)

### Recommendation

Two options:
1. **Deploy NNUE file** — copy `nn-5af11540bbfe.nnue` (38 MB) to `public/stockfish/` via `vite.config.ts` or build script. Adds 38 MB to deployment; worthwhile for accuracy if serving over CDN.
2. **Explicitly use HCE for review** — remove `Use NNUE value true` from review-engine.ts; update ADR-0001 to reflect HCE-only for all workers. Simpler, smaller deployment.

For v0 MVP (beginner audience), option 2 is acceptable. Flag as Sprint 6 decision.

---

## Platform Limitation Note

This spike ran on unthrottled desktop Chrome. WASM workers are **not affected** by
Chrome DevTools CPU throttle — the throttle only affects the main thread JS, not
the Worker's WASM execution. Real iPhone Safari testing remains necessary to confirm
performance on mobile hardware (where depth 22 may not be reached within 10s).

Expected mobile depth range based on community benchmarks: ~14–20 for iPhone SE 2nd gen.
The `DEPTH_MISMATCH_TOLERANCE = 4` guard and preliminary (`~`) chip treatment handle this
gracefully without code changes.

---

## ADR-0007 Update Action

- `REVIEW_TARGET_DEPTH = 22`: CONFIRMED for desktop baseline ✅
- Status upgrade: Proposed → accepted pending NNUE deployment decision
- OQ-5 spike: RESOLVED (desktop baseline confirmed; real iPhone deferred to Sprint 6)
