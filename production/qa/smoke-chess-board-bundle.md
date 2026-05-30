# Smoke Check — chess-board/story-007 Bundle Size (2026-05-30)

**Story**: chess-board/story-007-bundle-size
**Type**: Config/Data (advisory)
**Verdict**: PASS (manual check — formal bundler report deferred)

## Check Method

`vite build` output inspected. `vue3-chessboard` (chessground + chess.js) is the dominant chunk.
No additional chess libraries were added beyond the allowed list in `technical-preferences.md`.

## Allowed libraries (chess domain)

- `vue3-chessboard` ^1.x — chess board UI ✅
- `chess.js` — bundled with vue3-chessboard ✅
- `stockfish@16.0.0` (WASM) — loaded as worker, not bundled ✅

## Status

No violations detected. Formal bundle size measurement (< 3s on mobile 4G) to be verified
during performance spike in Sprint 5 alongside iPhone Safari depth-22 spike.
