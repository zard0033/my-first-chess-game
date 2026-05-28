# ADR-0008: Content Security Policy Headers and WASM Deployment Configuration

## Status
Proposed

> **Next action to reach Accepted**: Verify on real iOS Safari 16+ device that:
> (a) `worker-src 'self' blob:` in a `<meta>` CSP tag is honoured and does not block Stockfish workers,
> (b) `'wasm-unsafe-eval'` in `<meta>` CSP allows WASM compilation inside the worker,
> (c) PWA service worker installs normally under this policy.
> This is Validation Criterion 1 (iOS Safari spike). Chrome/Firefox verification can run in parallel.

## Date
2026-05-28

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | Web App — W3C Content Security Policy Level 2/3 (browser-enforced) |
| **Domain** | Security / Deployment |
| **Knowledge Risk** | LOW for Chrome 95+ and Firefox 108+. MEDIUM for iOS Safari 16+ — `worker-src` in `<meta>` CSP tag and `'wasm-unsafe-eval'` were both added in Safari 15.4; our target (iOS 16 = Safari 16.x) is within that range, but real-device verification is required before → Accepted (see QQ-07). |
| **References Consulted** | `design/gdd/chess-engine-integration.md` (TR-chess-engine-007, thread model), `docs/architecture/architecture.md` (ChessEngine module, thread model §4, open question QQ-07), `docs/architecture/adr-0002-web-worker-isolation-and-uci-protocol.md` (Web Worker IPC, no SharedArrayBuffer), `docs/architecture/adr-0004-vue-router-history-mode-and-github-pages-spa-fallback.md` (GitHub Pages deployment target) |
| **Post-Cutoff APIs Used** | None |
| **Verification Required** | iOS Safari 16+ real-device spike — Validation Criterion 1. Blocks → Accepted. (Referenced as C-6 in architecture.md Lead Programmer Feasibility note.) |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | ADR-0001 (Proposed) — establishes the two-build WASM model (HCE + NNUE) that requires `worker-src`; ADR-0002 (Proposed) — establishes `postMessage`-only IPC, no SharedArrayBuffer, single-threaded WASM (determines that no COOP/COEP headers are needed); ADR-0004 (Proposed) — establishes GitHub Pages as deployment target (constrains CSP delivery mechanism to `<meta>` tag) |
| **Enables** | None |
| **Blocks** | None — CSP is additive security hardening. Stockfish loads and runs correctly without any CSP policy. The absence of this ADR does not block v0 implementation; it must be present before the first public GitHub Pages deploy. |
| **Ordering Note** | Implement before the first production deploy to GitHub Pages. The CSP `<meta>` tag must be present in the built `index.html`. Development builds (Vite dev server on localhost) are not blocked by this — see Decision §5. |

## Context

### Problem Statement

GitHub Pages serves only static files. Unlike Netlify (`_headers` file), Vercel (`vercel.json`), or Cloudflare Pages, GitHub Pages provides no mechanism to inject custom HTTP response headers. The standard CSP delivery method — an HTTP `Content-Security-Policy` response header — is therefore unavailable for this project's deployment target.

The only delivery mechanism that works on GitHub Pages is a `<meta http-equiv="Content-Security-Policy">` tag embedded in `index.html`.

TR-chess-engine-007 requires:
```
CSP: script-src 'wasm-unsafe-eval'; worker-src 'self' blob:
```

Without a CSP, the app ships with no scripting injection protection and no restriction on which origins can run WASM. This ADR formalises: (a) why the `<meta>` tag approach is correct for GitHub Pages, (b) the complete directive set required for Stockfish WASM + Web Workers, (c) the `index.html` injection point, and (d) iOS Safari compatibility constraints.

### Constraints

- **GitHub Pages serves static files only** — no server-side header injection, no `_headers` file (Netlify-specific), no dynamic middleware
- **Must not block Stockfish workers** — `worker-src` must allow the worker JS origin and any `blob:` URL the lichess Stockfish fork may create internally
- **Must not block WASM compilation inside workers** — `WebAssembly.compile()` / `WebAssembly.instantiate()` runs inside the Web Worker; some browser/CSP combinations require `'wasm-unsafe-eval'` in `script-src` (inherited by workers from the parent page)
- **Must work on iOS Safari 16+** — `worker-src` in `<meta>` CSP and `'wasm-unsafe-eval'` both require Safari 15.4+; iOS 16 ships with Safari 16.x, within range
- **`<meta>` CSP has known limitations** — cannot include `report-uri`/`report-to` directives; cannot include `frame-ancestors`; both are acceptable in v0 (no violation-reporting infrastructure, no iframe embedding)
- **No `SharedArrayBuffer`** — confirmed by ADR-0002: the no-SharedArrayBuffer decision means COOP/COEP HTTP headers (which would require a different deployment approach) are not needed here

### Requirements

- Stockfish HCE (Web Worker 1) and NNUE (Web Worker 2) must load and run under the policy
- WASM compilation inside workers must not be blocked
- Must not use `'unsafe-eval'` — allows arbitrary JavaScript `eval()`; too broad
- Must not use `'unsafe-inline'` for scripts — Vite production builds are code-split with no inline scripts
- Must be present in the production `index.html` before any `<script>` tag
- Must not introduce a regression to any existing functionality (including PWA service worker install)

## Decision

### 1. Delivery Mechanism: `<meta>` Tag in `index.html`

Add a `<meta http-equiv="Content-Security-Policy">` tag to the `<head>` section of the Vite project's `index.html` template. Vite passes `index.html` through to the production output unchanged (aside from injecting script/link tags for bundled assets).

```html
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self' blob:; img-src 'self' data:; object-src 'none'; base-uri 'self'"
/>
```

**Placement**: immediately before any `<script>` or `<link rel="stylesheet">` tags in `<head>`. This ensures the policy is applied before the browser begins parsing any resource requests.

**Why not `_headers` file**: GitHub Pages does not process Netlify-format `_headers` files. A file named `_headers` in the repository output is served as a static asset, not as server configuration. This approach only works on Netlify and Cloudflare Pages.

**Why not server redirect shim**: GitHub Pages's only server-side behaviour is the 404 → `index.html` fallback (established by ADR-0004). There is no available hook to inject response headers.

### 2. Complete Directive Set

```
default-src 'self';
script-src  'self' 'wasm-unsafe-eval';
worker-src  'self' blob:;
img-src     'self' data:;
object-src  'none';
base-uri    'self'
```

**Per-directive rationale:**

| Directive | Value | Reason |
|-----------|-------|--------|
| `default-src` | `'self'` | Baseline: all resource types not covered by a specific directive fall back to same-origin. Restricts connect, font, media, frame, and manifest sources. |
| `script-src` | `'self' 'wasm-unsafe-eval'` | `'self'` allows Vite-built JS bundles. `'wasm-unsafe-eval'` allows `WebAssembly.compile()` / `WebAssembly.instantiate()` inside Web Workers without opening the broader `eval()` attack surface. Does NOT allow `eval()`, `new Function()`, or `setTimeout(string)`. |
| `worker-src` | `'self' blob:` | `'self'` allows workers loaded from same-origin paths (the Stockfish JS wrapper). `blob:` allows workers created via `new Worker(URL.createObjectURL(blob))` — see Decision §4. |
| `img-src` | `'self' data:` | `'self'` covers piece SVG/PNG files served from the build output. `data:` covers data-URI piece images that chessground may embed as inline CSS backgrounds. |
| `object-src` | `'none'` | Blocks all plugin-type content (Flash, Java applets, Silverlight). No plugins are used; this eliminates an entire class of object-injection attack. |
| `base-uri` | `'self'` | Prevents `<base href>` injection attacks that would redirect all relative URLs to an attacker-controlled origin. |

**Deliberately omitted:**

- `'unsafe-eval'` — too broad; permits arbitrary `eval()` in addition to WASM. `'wasm-unsafe-eval'` is the correct, targeted source expression.
- `'unsafe-inline'` for scripts — not needed; Vite production builds use code-split chunks, zero inline scripts.
- `report-uri` / `report-to` — no violation reporting infrastructure in v0. Deferred to MVP (would require a server endpoint or third-party CSP reporting service).
- `frame-ancestors` — not available in `<meta>` CSP (CSP Level 3 restriction); not needed since the app is not intended to be embedded in iframes.

### 3. `'wasm-unsafe-eval'` Browser Compatibility

| Browser | `wasm-unsafe-eval` support | Notes |
|---------|---------------------------|-------|
| Chrome 95+ | ✅ Supported | Chrome 94 whitelisted WASM eval by default; `'wasm-unsafe-eval'` is the explicit source expression since v95 |
| Firefox 108+ | ✅ Supported | — |
| Safari 15.4+ | ✅ Supported | iOS 16 ships Safari 16.x; iOS Safari 16.0–16.3 already required for ADR-0002 (no SharedArrayBuffer) |
| Edge 95+ (Chromium) | ✅ Supported | Follows Chrome |
| Chrome < 95 / Firefox < 108 | ⚠️ Not supported | Below project's minimum target; no mitigation needed |

**Target browsers**: iOS Safari 16+, Chrome 95+, Firefox 108+, Edge 95+. All are within the supported range. No fallback needed.

**Note on older Chrome (pre-94)**: Before Chrome 94, WASM instantiation required `'unsafe-eval'`. Chrome 94 whitelisted WASM eval regardless of CSP. Chrome 95 introduced the explicit `'wasm-unsafe-eval'` expression. Our minimum Chrome target (via the WASM + Web Worker requirements from ADR-0002) is effectively Chrome 94+, which does not need `'unsafe-eval'` for WASM.

### 4. Why `worker-src blob:` Is Required

The lichess Stockfish fork JS wrapper may create its internal worker via either of two patterns:

```javascript
// Pattern A: direct path (covered by 'self')
new Worker('/assets/stockfish-nnue-16.js')

// Pattern B: blob URL (requires blob:)
const blob = new Blob([workerBootstrapCode], { type: 'text/javascript' })
new Worker(URL.createObjectURL(blob))
```

Pattern B is used by some WASM-over-Worker libraries to pass configuration into the worker without a round-trip. Without a code audit of the specific vendor build in use, the exact pattern cannot be guaranteed. Including `blob:` in `worker-src` covers both patterns without meaningful additional attack surface: an attacker who controls script execution on the page could already create blob workers with or without a permissive `worker-src`, since blob URL creation happens synchronously in the main thread.

**If a future code audit confirms Pattern A only**, `blob:` can be removed from `worker-src`.

### 5. Development Builds

The CSP `<meta>` tag is present in `index.html` at all times, including during `vite dev`. Vite's HMR client is injected as a module script from `localhost`, which is same-origin with the dev server — `script-src 'self'` covers it.

One exception: if Vite injects any inline script (e.g., for hot-reload preamble), it would be blocked by the absence of `'unsafe-inline'`. In practice, Vite 5 injects its HMR client as a `<script type="module" src="/@vite/client">`, which is a same-origin URL request — not inline. If a Vite upgrade changes this behaviour, the dev-only workaround is a separate `index.dev.html` that omits the CSP tag, injected via:

```typescript
// vite.config.ts
html: { inject: process.env.NODE_ENV === 'production' ? cspPlugin() : null }
```

For v0, the `<meta>` tag in `index.html` with no dev/prod split is acceptable. The Vite dev server runs on `localhost` and is not a security boundary.

### Architecture Diagram

```
Production build output (served from GitHub Pages):

  dist/
    index.html                          ← Contains <meta CSP> before any <script>
    assets/
      index.[hash].js                   ← script-src 'self' ✓
      vendor.[hash].js                  ← script-src 'self' ✓
      stockfish-hce.js                  ← worker-src 'self' ✓ (Worker 1: Play)
      stockfish-nnue-16.js              ← worker-src 'self' ✓ (Worker 2: Review)
      stockfish-nnue-16.wasm            ← default-src 'self' ✓ (fetched inside worker)
      *.svg / *.png (piece images)      ← img-src 'self' ✓

  CSP enforcement timeline:
  1. Browser fetches index.html
  2. Parses <head> — applies <meta CSP> immediately
  3. Loads bundles from /assets/ — script-src 'self' ✓
  4. User starts game → Worker 1 spawned: /assets/stockfish-hce.js — worker-src 'self' ✓
  5. User enters Review → Worker 2 spawned: /assets/stockfish-nnue-16.js — worker-src 'self' ✓
  6. Inside Worker 2: fetch('/assets/stockfish-nnue-16.wasm') — default-src 'self' ✓
  7. Inside Worker 2: WebAssembly.instantiate(wasmBytes) — script-src 'wasm-unsafe-eval' ✓
```

### Key Interfaces

This ADR concerns deployment configuration, not runtime TypeScript APIs. There are no new TypeScript types or function signatures.

The sole deliverable is the `<meta>` tag added to `index.html`:

```html
<!-- index.html — inside <head>, before <script> and <link rel="stylesheet"> tags -->
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self' blob:; img-src 'self' data:; object-src 'none'; base-uri 'self'"
/>
```

## Alternatives Considered

### Alternative 1: Netlify / Cloudflare Pages Deployment with HTTP Header File

- **Description**: Migrate deployment from GitHub Pages to Netlify or Cloudflare Pages. Both support custom HTTP headers via a `_headers` file in the output directory. Add `Content-Security-Policy` as a true HTTP response header.
- **Pros**: HTTP headers are the canonical, preferred CSP delivery mechanism. `report-uri` and `frame-ancestors` are available. Policy is applied before any byte of the HTML document is parsed.
- **Cons**: Requires changing deployment platform from GitHub Pages, which is the established target (ADR-0004). Introduces a new platform dependency (Netlify/Cloudflare account, build pipeline changes) purely for CSP delivery.
- **Rejection Reason**: GitHub Pages deployment is fixed by ADR-0004. Migrating platforms for a single security feature is disproportionate. The `<meta>` tag delivers equivalent functional CSP for this use case.

### Alternative 2: No CSP (Ship Without a Policy)

- **Description**: Do not add any Content Security Policy. Ship to GitHub Pages without CSP directives.
- **Pros**: Zero implementation work. Zero risk of CSP misconfiguration breaking the app.
- **Cons**: TR-chess-engine-007 requires CSP directives. No XSS injection protection. An injected script from a stored-XSS attack could intercept game moves or WASM outputs.
- **Rejection Reason**: TR-chess-engine-007 is an explicit requirement. The `<meta>` tag implementation is low-risk and one-line, making this the wrong trade-off.

### Alternative 3: `'unsafe-eval'` Instead of `'wasm-unsafe-eval'`

- **Description**: Use the broader `'unsafe-eval'` in `script-src` to ensure WASM compilation works across all browser versions, including pre-Chrome 95 and pre-Safari 15.4.
- **Pros**: Maximum compatibility; no version-gating.
- **Cons**: `'unsafe-eval'` permits `eval()`, `new Function()`, `Function('return this')()`, and `setTimeout(string)` in addition to WASM. This is a significant XSS enabler — an attacker who achieves DOM injection can execute arbitrary code without needing a same-origin script.
- **Rejection Reason**: The target browsers (iOS Safari 16+, Chrome 95+, Firefox 108+) all support `'wasm-unsafe-eval'`. There is no reason to accept `'unsafe-eval'` for compatibility with browsers below the established project minimum.

### Alternative 4: Service Worker Intercept to Inject Headers

- **Description**: Register a Service Worker that intercepts all page responses and synthesises a new `Response` object with an injected `Content-Security-Policy` header.
- **Pros**: Would deliver CSP as a (simulated) HTTP header rather than a `<meta>` tag.
- **Cons**: Service Workers are registered by code in the main document. The initial `index.html` response is not intercepted by the Service Worker on first load — the Worker is not yet registered when the browser evaluates the initial document's CSP. The `<meta>` tag in `index.html` governs the initial load; the Service Worker approach cannot replace it for the first page view. Additionally, this adds significant complexity for zero additional security benefit.
- **Rejection Reason**: Service Workers cannot modify the CSP of the response that loaded them. The `<meta>` tag is required regardless.

## Consequences

### Positive

- Establishes a security baseline: injected scripts blocked by `script-src 'self'`; arbitrary `eval()` blocked; plugin content blocked; base tag injection blocked
- Compatible with the single-threaded WASM + two-worker model from ADR-0001 and ADR-0002 — no COOP/COEP headers needed
- Zero runtime cost — CSP enforcement is entirely in the browser's networking/security layer
- Negligible build impact — one `<meta>` tag adds ~200 bytes to `index.html`
- `'wasm-unsafe-eval'` does not open the `eval()` attack surface; it permits only WebAssembly compilation APIs

### Negative

- `<meta>` CSP is fractionally weaker than HTTP header CSP: the policy activates after the HTML parser processes the `<head>`, not at response receipt. In practice, since inline scripts are blocked and the `<meta>` tag precedes all `<script>` tags, this timing difference is not exploitable.
- `blob:` in `worker-src` is broader than a strict same-path whitelist — but for the reasons in Decision §4, it is both necessary (pending vendor code audit) and low additional attack surface.
- No CSP violation reporting in v0 — violations are silently dropped (visible only in DevTools). This is acceptable until an MVP monitoring infrastructure exists.

### Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| iOS Safari 16 does not honour `worker-src` in `<meta>` CSP | Low (Safari 15.4 added it) | High — Stockfish workers blocked | Validation Criterion 1 (real-device spike before → Accepted) |
| `'wasm-unsafe-eval'` not honoured on iOS Safari 16 | Low (Safari 15.4 added it) | High — WASM compilation fails | Same spike as above; fallback: add `'unsafe-eval'` with explicit trade-off documentation |
| Vite dev server HMR blocked by CSP | Low (Vite 5 injects via module script, not inline) | Low — development-only; app still runs | Decision §5 documents the mitigation path |
| Future library addition requires `'unsafe-inline'` or CDN source | Low | Medium — requires CSP update before deploy | All new library additions pass through ADR review; `technical-preferences.md` allowed-libraries table |
| chessground piece images use a source not covered by `img-src 'self' data:` | Low | Low — images fail silently or with console error | `data:` covers inline data URIs; verify in Validation Criterion 2 |

## GDD Requirements Addressed

| GDD System | Section / Requirement | How This ADR Addresses It |
|------------|----------------------|--------------------------|
| chess-engine-integration.md | TR-chess-engine-007: `CSP: script-src 'wasm-unsafe-eval'; worker-src 'self' blob:` | Decision §2: complete directive set including `'wasm-unsafe-eval'` in `script-src` and `'self' blob:` in `worker-src`; delivered via `<meta>` tag since GitHub Pages does not support HTTP response headers |

## Performance Implications

- **CPU**: None. CSP enforcement runs inside the browser's networking security layer before any JavaScript executes.
- **Memory**: None.
- **Load Time**: None. The `<meta>` tag is a directive to the browser; it does not trigger any network requests or script evaluation.
- **Bundle Size**: Negligible. Adds ~200 bytes to `index.html`.

## Migration Plan

No existing production deployment. The `<meta>` tag is added to `index.html` before the first GitHub Pages deploy. No existing code paths are affected.

## Validation Criteria

1. **[Spike — iOS Safari 16+ real device (BLOCKING for → Accepted)]**
   - Build the app for production (`vite build`)
   - Load `dist/index.html` from a local HTTPS server (or deploy to a test GitHub Pages branch)
   - Open on iPhone (iOS 16+) in Safari
   - Check DevTools Console (via macOS Web Inspector): assert zero CSP violation errors
   - Start a game: assert Stockfish HCE worker loads and Play mode is functional
   - Finish game, enter Review: assert Stockfish NNUE worker loads and analysis runs
   - Assert WASM compilation succeeds (no `wasm-unsafe-eval` violation in Console)
   - Install as PWA: assert service worker registers without CSP violation

2. **[Manual — Desktop Chrome and Firefox]**
   - Open production build URL in Chrome (DevTools → Console)
   - Play a full game + review session
   - Assert: zero CSP violation messages in Console
   - Open in Firefox; repeat
   - Assert: all assertions pass in both browsers

3. **[Build verification — automated]**
   ```bash
   # Must pass in CI after vite build:
   grep -q 'Content-Security-Policy' dist/index.html
   grep -q 'wasm-unsafe-eval' dist/index.html
   grep -q 'worker-src' dist/index.html
   # CSP meta tag must precede first <script> tag:
   awk '/Content-Security-Policy/{csp=NR} /<script/{if(csp && NR>csp){exit 0} else{exit 1}}' dist/index.html
   ```

4. **[Visual — piece images]**
   - Load the app in a browser with Network panel open
   - Assert: no piece image requests fail with `(blocked:csp)` error
   - Specifically check chessground's piece loading mechanism matches `img-src 'self' data:` coverage

## Related Decisions

- [ADR-0001](adr-0001-stockfish-build-versioning.md) — establishes the two-build WASM model (HCE + NNUE) that necessitates `worker-src` in the CSP
- [ADR-0002](adr-0002-web-worker-isolation-and-uci-protocol.md) — establishes `postMessage`-only IPC and single-threaded WASM with no SharedArrayBuffer (means COOP/COEP headers are not needed alongside this CSP)
- [ADR-0004](adr-0004-vue-router-history-mode-and-github-pages-spa-fallback.md) — establishes GitHub Pages as deployment target, which is the direct cause of using `<meta>` CSP instead of HTTP headers
- `design/gdd/chess-engine-integration.md` — TR-chess-engine-007 is the requirement this ADR implements
