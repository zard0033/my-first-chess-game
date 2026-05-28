# Story 001: Route Table, Lazy Loading, and GitHub Pages SPA Fallback

> **Epic**: Navigation & Routing
> **Status**: Ready
> **Layer**: Foundation
> **Type**: Logic
> **Estimate**: S (2–3 hours)
> **Manifest Version**: 2026-05-29
> **Last Updated**: 2026-05-28

## Context

**GDD**: `design/gdd/navigation-and-routing.md`
**Requirements**: `TR-nav-routing-001`, `TR-nav-routing-004`, `TR-nav-routing-005`

**ADR Governing Implementation**: ADR-0004: Vue Router History Mode and GitHub Pages SPA Fallback
**ADR Decision Summary**: `createWebHistory()` for HTML5 history mode. Route table: `/` (HomeView, eager), `/play` (PlayView, lazy), `/review` (ReviewView, lazy), `/:pathMatch(.*)*` (NotFoundView, eager). GitHub Pages 404.html SPA fallback: captures `window.location.pathname`, redirects to `/index.html?redirect=<encoded>`, then router reads and navigates on app mount. Scroll behavior resets to top on each navigation; focus is restored to primary `<h1>`.

**Control Manifest Rules (Foundation layer)**:
- Required: `createWebHistory()` — never hash mode
- Required: Catch-all route `/:pathMatch(.*)*` MUST be the last entry in routes array
- Required: Lazy-load PlayView and ReviewView; eager-load HomeView and NotFoundView
- Required: `router.onError` reloads exactly once via `reloadAttempted` session flag
- Required: `404.html` SPA fallback shim committed at repo root
- Required: `scrollBehavior: () => ({ top: 0 })`; focus primary `<h1>` via `router.afterEach`
- Forbidden: Never use hash-mode routing (`createWebHashHistory`)
- Forbidden: Never include reserved routes (`/history`, `/settings`) in v0 router config
- Forbidden: Never use `_redirects` file (Netlify-only, ignored by GitHub Pages)

---

## Acceptance Criteria

- [ ] Vue Router is configured with `createWebHistory()`.
- [ ] Route table contains exactly: `/` (HomeView, eager), `/play` (PlayView, lazy), `/review` (ReviewView, lazy), `/:pathMatch(.*)*` (NotFoundView, eager, last entry).
- [ ] Navigating to `/play` and `/review` does not include their chunks in the initial bundle (verified via Vite bundle analysis).
- [ ] `router.onError` reloads the page at most once (session-scoped `reloadAttempted` flag in sessionStorage).
- [ ] A `404.html` file exists at the repo root that redirects to `index.html?redirect=<encoded-path>`.
- [ ] On app mount, if `window.location.search` contains `redirect=`, the router navigates to the decoded path.
- [ ] `scrollBehavior: () => ({ top: 0 })` is set; `router.afterEach` focuses the primary `<h1>`.
- [ ] Playwright E2E: navigating directly to `/play` (simulating a GitHub Pages deep-link) resolves to the Play screen (not a 404).

---

## Implementation Notes

- `src/router/index.ts`: export the router created with `createWebHistory()`.
- `404.html` at repo root — minimal HTML that reads `window.location.pathname` and redirects: `window.location.replace('/index.html?redirect=' + encodeURIComponent(window.location.pathname + window.location.search))`.
- `main.ts` or `App.vue` mounted hook: `const redirect = new URLSearchParams(window.location.search).get('redirect'); if (redirect) router.replace(redirect)`.
- `router.onError((error) => { if (!sessionStorage.getItem('routerReloadAttempted')) { sessionStorage.setItem('routerReloadAttempted', '1'); window.location.reload(); } })`.
- `router.afterEach(() => { nextTick(() => document.querySelector('h1')?.focus()) })`.

---

## QA Test Cases

- **AC-1**: createWebHistory confirmed
  - When: inspect router config object
  - Then: `router.options.history` type is `HTML5History` (not HashHistory)

- **AC-2**: Lazy chunks not in initial bundle
  - When: run `vite build` and inspect `dist/assets/`
  - Then: a separate chunk file exists for `/play` and `/review` routes; `index.js` does NOT contain `PlayView` or `ReviewView` code

- **AC-3**: 404.html deep-link (Playwright)
  - Given: app deployed or served locally with the 404.html at root
  - When: browser navigates directly to `/play`
  - Then: PlayView renders (not a 404 error page)

- **AC-4**: Catch-all route is last
  - When: inspect `router.options.routes` array
  - Then: the `/:pathMatch(.*)*` entry is the last element

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- `tests/unit/app-router/route-table.test.ts`
- `tests/e2e/spa-deep-link.spec.ts` (Playwright)

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: None (Foundation — first router story)
- Unlocks: Story 002 (guards need router to exist)
