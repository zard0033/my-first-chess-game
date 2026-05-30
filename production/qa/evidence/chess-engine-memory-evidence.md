# S5-05 — chess-engine Memory Budget Verification

**Date**: 2026-05-30
**Story**: chess-engine/story-007-memory-budget
**Test file**: `tests/e2e/memory-budget-spike.spec.ts`

---

## Verdict: ESTIMATED PASS ✅ (manual confirmation deferred)

Main thread JS heap is well within budget. Worker WASM memory estimated safely
under ceiling. Full manual Chrome DevTools measurement deferred to Sprint 6.

---

## AC-1: Play-only heap ≤ 65 MB

### Automated measurement (Playwright)

| Signal | Value | Source |
|--------|-------|--------|
| Main thread JS heap (app idle) | **9.5 MB** | `performance.memory.usedJSHeapSize` |
| Main thread JS heap (Play route) | **9.5 MB** | `performance.memory.usedJSHeapSize` |

**Limitation**: `performance.memory` is main-thread-only. WASM worker memory
(Stockfish) is NOT included. Cross-origin isolation (COOP + COEP headers) would
be needed for `performance.measureUserAgentSpecificMemory()` to report worker memory.

### Estimated total (Play mode)

| Component | Estimate | Basis |
|-----------|----------|-------|
| App shell + Vue runtime | 9.5 MB | Measured |
| Stockfish WASM binary loaded | ~2 MB | WASM file: 575 KB compressed → ~2 MB in memory |
| HCE Hash table (Hash=16) | 16 MB | `setoption name Hash value 16` |
| WASM stack + overhead | ~5 MB | Community benchmarks for sf16 single-threaded |
| **Total estimated** | **~32.5 MB** | Well under 65 MB budget |

**NNUE note**: NNUE network file (`nn-5af11540bbfe.nnue`, 38 MB) is NOT deployed —
both play and review engines use HCE. If NNUE were enabled, estimate would be ~70 MB
(within 150 MB ceiling but over 65 MB play-only threshold). See S5-03 evidence for detail.

---

## AC-2: Play + Review heap ≤ 150 MB

### Estimated total (Play + Review simultaneously)

| Component | Estimate |
|-----------|----------|
| App shell + Vue runtime | 9.5 MB |
| Play engine (HCE, Hash=16) | ~23 MB |
| Review engine (HCE, Hash=16) | ~23 MB |
| `analysisResults` array (40 positions) | < 1 MB |
| `sessionStorage` persisted data | < 1 MB |
| **Total estimated** | **~57 MB** |

Well under 150 MB hard ceiling. Even with NNUE enabled (if deployed): ~96 MB < 150 MB.

---

## Automated Measurement Limitation

Worker memory cannot be measured without cross-origin isolation headers:
```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

These headers are NOT currently set in the dev server or production build.
Adding them would also require all loaded resources (Stockfish WASM, piece SVGs)
to be served with `Cross-Origin-Resource-Policy: cross-origin` headers.

**Recommendation**: Add COOP + COEP headers in Sprint 6 if precise memory measurement
is needed, or measure manually via Chrome DevTools as described below.

---

## Manual Measurement Instructions (Chrome DevTools)

For accurate measurement on a real browser:

1. Open `http://localhost:5173` in Chrome (non-headless)
2. Open DevTools → Memory tab
3. Select "Heap snapshot" → Click "Take snapshot"
4. Navigate to `/play` — start a game and wait for first AI move
5. Take another heap snapshot → compare
6. Complete the game, navigate to `/review`
7. Wait for review analysis to complete
8. Take a final heap snapshot

Compare snapshot sizes:
- Snapshot 1 (idle): should be ~10 MB
- Snapshot 2 (play): should be < 65 MB
- Snapshot 3 (play + review): should be < 150 MB

---

## AC-3: iPhone Safari RSS (ADVISORY)

Not measured — requires real iPhone device. Deferred to Sprint 6 per sprint-5.md risk register.
Expected to be within 150 MB ceiling based on HCE-only mode (no 38 MB NNUE weights loaded).
