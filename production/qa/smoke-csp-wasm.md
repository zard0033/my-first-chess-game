# Smoke: CSP + WASM Deployment

> **Story**: chess-engine/story-006-csp-wasm-deployment.md
> **Date**: 2026-05-29
> **Verified by**: /dev-story + /code-review (Config/Data — direct implementation)

## AC-1: CSP meta tag with exact content

```
$ grep -c 'wasm-unsafe-eval' index.html
1
```

**Result**: ✅ PASS — 1 match found

## AC-2: CSP meta tag precedes all script/link tags

```
$ awk '/Content-Security-Policy/{csp=NR} /<script|<link/{if(!csp || csp>NR) exit 1}' index.html
```

**Result**: ✅ PASS — exits 0 (no violation)

CSP is on line 6 (`<head>`); `<script>` is on line 12 (`<body>`). Ordering is correct.

> **Note**: Story's awk command had inverted exit codes (`exit 1` instead of `exit 0` on success).
> The corrected awk `if(!csp || csp>NR) exit 1` is used in CI and here. Deviation noted in
> implementation summary.

## AC-3: No bare `unsafe-eval` in CSP

```
$ grep "unsafe-eval" index.html | grep -v wasm
(0 matches)
```

**Result**: ✅ PASS — only `wasm-unsafe-eval` appears; no bare `unsafe-eval`

## AC-4: WASM loads without CSP violation in browser

**Result**: ⏳ DEFERRED — requires S2-04 (chess-engine UCI handshake) to be Complete before
the Stockfish worker can be tested. This item will be verified during S2-04 story-done or
a dedicated smoke session.

---

## Summary

| AC | Status |
| -- | ------ |
| AC-1 CSP tag exists | ✅ PASS |
| AC-2 Ordering correct | ✅ PASS |
| AC-3 No unsafe-eval | ✅ PASS |
| AC-4 WASM browser smoke | ⏳ DEFERRED (S2-04) |
