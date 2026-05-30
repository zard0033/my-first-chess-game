# Smoke Check — chess-board/story-007 Bundle Size (2026-05-30)

**Story**: chess-board/story-007-bundle-size
**Type**: Config/Data (advisory)
**Verdict**: PASS ✅

## Build Command

```
npx vite build  (production mode)
```

Vite 5.4.21 — 96 modules transformed.

## Chunk Breakdown

| Chunk | Raw | Gzip | Budget | Result |
|-------|-----|------|--------|--------|
| `chess-board-*.js` (vue3-chessboard + chessground + chess.js) | 170.57 kB | **56.33 kB** | ≤ 120 kB | ✅ PASS |
| `chess-openings-*.js` (ECO database) | 1,352.99 kB | 137.23 kB | — (no budget set) | ⚠️ advisory |
| `game-store-*.js` | 0.58 kB | 0.35 kB | — | ✅ |
| `index-*.js` (Vue router + app shell) | 34.36 kB | 13.67 kB | — | ✅ |
| `PlayView-*.js` | 21.37 kB | 8.22 kB | — | ✅ |
| `ReviewView-*.js` | 17.50 kB | 6.81 kB | — | ✅ |

## Piece-Set SVGs (static assets — not in JS budget)

| File count | Total size (uncompressed) |
|------------|--------------------------|
| 12 SVG files (wK/wQ/wR/wB/wN/wP/bK/bQ/bR/bB/bN/bP) | 7.8 KB |

SVGs are served from `public/pieces/` as separate static files (not inlined into JS).

## manualChunks Applied (vite.config.ts)

```ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'chess-board': ['vue3-chessboard', 'chessground', 'chess.js'],
        'chess-openings': ['chess-openings'],
      },
    },
  },
},
```

## AC-1 Verdict: chess-board JS + chess.js + piece-set SVGs ≤ 120 kB gzipped

- chess-board JS chunk: **56.33 kB gzip** ✅
- Piece-set SVGs: 7.8 kB (static, not in JS budget) ✅
- **Total JS budget used: 56.33 kB / 120 kB = 47%**

## Advisory: chess-openings chunk (137.23 kB gzip)

The ECO opening database (`chess-openings` npm package) is 137.23 kB gzip. This is above the
chess-board chunk budget but is a separate subsystem (not counted in AC-1). The package ships
a pre-compiled binary polyglot book — no viable way to tree-shake it. Acceptable for v0.

Action: consider lazy-loading `opening-index.ts` in a future sprint if initial load TTI is a concern.

## AC-2 (Performance frame trace @perf) — DEFERRED

Tagged `@perf` — excluded from default suite. Requires CDP trace on throttled Chromium.
Deferred to dedicated performance spike (Sprint 6 candidate).

## AC-3 (Lighthouse TTI ≤ 3s) — DEFERRED

Requires `lhci autorun` in CI. Deferred to Sprint 6 CI hardening.

## Notes

- `stockfish@16.0.0` WASM: loaded as a Web Worker, NOT bundled into any JS chunk ✅
- `chess.js` was previously duplicated across `chess-board` and `game-store` chunks;
  consolidated into `chess-board` chunk via `manualChunks`
