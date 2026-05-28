# ADR-0004: Vue Router History Mode and GitHub Pages SPA Fallback

## Status
Proposed

## Date
2026-05-28

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | Web APIs: Vue Router 4, Browser History API, GitHub Pages — Web App, no traditional game engine |
| **Domain** | Core / Navigation & Routing |
| **Knowledge Risk** | LOW — Vue Router 4 `createWebHistory`, `history.pushState`, `beforeunload`, and the GitHub Pages SPA fallback shim are all well within LLM training data and stable. |
| **References Consulted** | `design/gdd/navigation-and-routing.md` (Core Rules 1–12, Edge Cases, Route Table, Popstate handling sequence, Acceptance Criteria); `docs/architecture/adr-0001-stockfish-build-versioning.md` (GitHub Pages deployment constraint established) |
| **Post-Cutoff APIs Used** | None |
| **Verification Required** | GitHub Pages `404.html` deep-link SPA fallback — verifiable only after first live deploy to `*.github.io` (see Validation Criteria). Dev-server testing covers all other ACs. |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | None (Foundation layer — can be implemented before any gameplay system) |
| **Enables** | ADR-0005 (Pinia boundaries + game store guard reads this router config); all implementation stories for Play, Review, and navigation guards |
| **Blocks** | GitHub Pages production deploy of any deep-linkable build until `404.html` shim is in place |
| **Ordering Note** | ADR-0004 establishes route names and paths that ADR-0005's in-game guard targets; write ADR-0005 after this one |

## Context

### Problem Statement

The Navigation & Routing GDD mandates HTML5 history-mode routing (`/play`, `/review`) and the GitHub Pages deployment target has no per-route server handler. Without a formal decision on: (a) which history mode to use, (b) how GitHub Pages handles `/play` deep links, (c) how the popstate guard restores the URL deterministically, and (d) which routes are registered vs. reserved — a programmer could ship hash-mode routing (breaking shareable URLs), skip the `404.html` shim (breaking every deep link), or implement a double-URL-restoration race in the popstate path.

### Constraints

- **GitHub Pages has no per-route server handler** — the static file server returns its own `404` for any path other than `/` and explicit static files. All SPA routing must be client-side.
- **No COOP/COEP headers** — relevant only for SharedArrayBuffer (ADR-0002); does not affect routing.
- **Deployment target is GitHub Pages** — no server configuration, no `_redirects` file support (that is Netlify). The only available mechanism is `404.html`.
- **PWA-compatible start URL** — the `start_url` in the app manifest must be `/` (the Home route). The SPA fallback must work for all routes, including direct deep links entered from the Home Screen icon.

### Requirements

- Clean, shareable URLs (`/`, `/play`, `/review`) — no hash-based routing
- Every direct-link to a non-root route must resolve client-side without a blank page or 404 on GitHub Pages
- Popstate (browser Back) while a game is in progress must: (a) restore the URL to `/play` *synchronously before* the guard resolves, (b) show confirmation, (c) on confirm, push forward to the original target; on cancel, leave URL at `/play`
- Play and Review routes must lazy-load to protect the `< 3s` initial mobile load budget
- Catch-all unknown routes → `NotFoundView`
- Reserved MVP/Polish routes must be documented but NOT registered in v0

## Decision

### 1. HTML5 History Mode (`createWebHistory`)

Vue Router is initialized with `createWebHistory()`. URLs are clean paths (`/`, `/play`, `/review`) without a `#` fragment.

**Why not hash mode**: Hash mode (`createWebHashHistory`) produces URLs like `/#/play` — not shareable, not PWA-manifest-compatible as a `start_url` route, and not the native iOS/Android navigation feel the GDD targets. Hash mode also defeats the GitHub Pages SPA fallback entirely (GitHub Pages serves `/` for `/#/play` without issue, so the shim is unneeded — but then the app also loses all clean URL benefits). The GDD is explicit: `createWebHistory` with clean URLs.

**Known cost**: every route other than `/` requires the SPA fallback shim (Decision §2). This is the accepted price of history mode on a static host.

### 2. GitHub Pages SPA Fallback — `404.html` → `index.html` shim

GitHub Pages serves its own `404.html` when a path resolves to no file. We place a custom `404.html` at the repository root that:

1. Captures the current `window.location.pathname` (the deep-link path)
2. Redirects to `/index.html?redirect=<encoded-path>` (the standard spa-github-pages shim technique)
3. `index.html` reads `?redirect` on load and calls `history.replaceState` to restore the deep-link URL before Vue Router mounts

This allows `/play` (or any future route) deep-linked from a browser, bookmark, or Home Screen icon to load the SPA shell and then resolve client-side. Without this shim, GitHub Pages returns a `404 Not Found` HTML page instead of `index.html`.

**Why this technique over alternatives:**
- `_redirects` file: Netlify-only. Not supported by GitHub Pages.
- Custom domain + Cloudflare worker: overkill for a personal project; adds an external dependency.
- Hash mode: degrades URL quality (see Decision §1).
- Script in `index.html` that processes `?redirect`: this is the canonical GitHub Pages SPA trick (documented and widely used since 2016). Zero external dependencies, no build complexity.

### 3. v0 Route Table

Four routes are registered in v0. Two are reserved but NOT registered:

| Path | Name | Component | Loading | Guard |
|------|------|-----------|---------|-------|
| `/` | `home` | `HomeView` | Eager | None |
| `/play` | `play` | `PlayView` | Lazy | `beforeRouteLeave` (in-game confirm) + `beforeunload` |
| `/review` | `review` | `ReviewView` | Lazy | Redirect `/` if no CompletedGame in store |
| `/:pathMatch(.*)*` | `not-found` | `NotFoundView` | Eager (small) | None |

**Reserved (documented, NOT in router config):**
- `/history` — Game History (MVP)
- `/history/:gameId` — Game Detail (MVP)
- `/settings` — Settings (Polish)

Registering reserved routes now would create reachable-but-empty screens. They are documented here to fix their intended paths; the v0 router config must not include them.

**Catch-all ordering invariant**: `/:pathMatch(.*)*` must be the last entry in the routes array. A test asserts this is enforced.

### 4. Route-Level Lazy Loading

`PlayView` and `ReviewView` are dynamically imported. `HomeView` and `NotFoundView` are eager-loaded (they are the entry points and error handling respectively — neither is large).

```typescript
// src/router/index.ts (illustrative)
const routes = [
  { path: '/',      name: 'home',      component: HomeView }, // eager
  { path: '/play',  name: 'play',      component: () => import('../views/PlayView.vue') },
  { path: '/review',name: 'review',    component: () => import('../views/ReviewView.vue') },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView }, // eager, always last
]
```

Lazy loading is the mechanism that keeps the initial bundle under the `< 3s` mobile load budget — `PlayView` includes chessground, and `ReviewView` will include the engine-wrapper imports.

**Chunk-load failure recovery**: `router.onError` listens for dynamic-import failures (stale chunk hash after a deploy) and calls `window.location.reload()` exactly once. A session-scoped `reloadAttempted` flag prevents infinite loops.

### 5. Popstate Guard — Deterministic `history.pushState` Restore

When the browser Back button / swipe-back fires while `isGameInProgress === true`, the URL has already changed before the `beforeEach` guard runs. The implementation must follow this **exact sequence** (per GDD popstate handling sequence):

1. `beforeEach` detects a history-pop navigation with `isGameInProgress === true`
2. **Synchronously** call `history.pushState(null, '', '/play')` — re-push `/play` entry before awaiting the dialog. The URL bar shows `/play` again immediately.
3. Await the confirmation dialog
4. **Confirm**: call `router.push(originalTarget)` — navigates to where the player was heading
5. **Cancel**: no-op — URL already shows `/play` from step 2; a second Back press re-enters this same sequence (the re-pushed entry is what the second pop lands on)

**Why `history.pushState` and NOT `return false` from the guard**: Returning `false` from `beforeEach` on the popstate path AND manually calling `pushState` would both try to restore the URL — producing a double-restoration (URL flicker). Choose one mechanism. The implementation must suppress `return false` for the popstate path and use `pushState` exclusively; `return false` (guard abort) is used only for the in-app button path.

**Why not `router.go(1)`**: Only works if a forward stack entry still exists after the pop; `history.pushState` is deterministic regardless of stack state.

### 6. `beforeunload` for Full-Page Exit

A `window.addEventListener('beforeunload', handler)` is added when `isGameInProgress` becomes `true` (wired to the Pinia `gameStore.isGameInProgress` watcher) and removed when it becomes `false`. The handler sets `event.returnValue = confirmLeaveMessage`.

**Key invariant**: the `beforeunload` listener is armed/disarmed by `isGameInProgress` directly — not by the in-SPA guard state machine. The two exit channels are independent (see GDD Core Rule 12 note).

### 7. Scroll and Focus Reset

`scrollBehavior: () => ({ top: 0 })` is set on the router.

A `router.afterEach` hook focuses the new screen's primary `<h1>` / main landmark after each navigation. This fires only on successful (non-canceled) route changes — a canceled guard (player chooses "Stay") does not trigger afterEach.

### Architecture Diagram

```
GitHub Pages (static file server)
  │
  ├─ GET /        → index.html     ← served directly
  ├─ GET /play    → 404.html       ← SPA shim: redirect → /?redirect=/play → index.html
  ├─ GET /review  → 404.html       ← same shim
  │
  index.html (Vue app boots, reads ?redirect, calls history.replaceState)
  │
  createWebHistory router
  ├─ /           → HomeView   (eager)
  ├─ /play       → PlayView   (lazy chunk)
  │   └─ beforeRouteLeave guard ←── reads gameStore.isGameInProgress
  │   └─ beforeunload listener ←── armed/disarmed by isGameInProgress watcher
  │   └─ popstate path: history.pushState('/play') → confirm dialog → router.push(target)
  ├─ /review     → ReviewView (lazy chunk, redirect if !completedGame)
  └─ /:catchAll  → NotFoundView (eager)
```

### Key Interfaces

```typescript
// src/router/index.ts
export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/play', name: 'play', component: () => import('../views/PlayView.vue') },
    { path: '/review', name: 'review', component: () => import('../views/ReviewView.vue'),
      beforeEnter: (to, from, next) => {
        const game = useGameStore()
        game.completedGame ? next() : next('/')
      }
    },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView }
  ],
  scrollBehavior: () => ({ top: 0 }),
})

// public/404.html (SPA shim, committed to repo root)
// Redirects /play → /?redirect=%2Fplay → index.html reads it and calls
// history.replaceState({ path }, '', path) before app boots

// src/router/guards.ts — popstate guard (illustrative)
router.beforeEach((to, from, next) => {
  const game = useGameStore()
  if (from.name === 'play' && game.isGameInProgress && isHistoryPopNavigation) {
    history.pushState(null, '', '/play')   // synchronous URL restore
    showConfirmDialog().then(confirmed => {
      confirmed ? router.push(to) : undefined
    })
    return false   // suppress for popstate path? No — DON'T return false here;
                   // the pushState already handled it. For in-app button path: return false.
  }
  next()
})
```

## Alternatives Considered

### Alternative 1: Hash Mode (`createWebHashHistory`)

- **Description**: Use `/#/play` style URLs. No server-side fallback needed.
- **Pros**: Zero GitHub Pages configuration. No `404.html` shim. Works out of the box.
- **Cons**: `/#/play` URLs are not shareable in the same natural way. Not compatible with a PWA `start_url: /play`. Violates the GDD's "clean URL" requirement and the native-app feel target.
- **Rejection Reason**: GDD explicitly mandates `createWebHistory`. The clean URL cost is worth the SPA shim work.

### Alternative 2: GitHub Actions Custom Redirect via `_config.yml`

- **Description**: Use Jekyll front matter or GitHub Pages configuration to handle 404 redirects server-side.
- **Pros**: No client-side JavaScript in the 404 handler.
- **Cons**: GitHub Pages + Vite is already set to bypass Jekyll (`touch .nojekyll`). Re-enabling Jekyll introduces build pipeline conflicts. The `404.html` shim is simpler and battle-tested.
- **Rejection Reason**: Unnecessary complexity; `.nojekyll` is already the project standard.

### Alternative 3: Custom Domain + CDN Redirect Rules

- **Description**: Point a custom domain at GitHub Pages and use Cloudflare page rules or similar to redirect `*/play` → `/?redirect=/play`.
- **Pros**: Pure server-side redirect, no client-side JavaScript in `404.html`.
- **Cons**: Requires a custom domain, a CDN account, and external configuration outside the repository. Overkill for a personal learning project. Adds operational overhead and a monthly cost.
- **Rejection Reason**: Over-engineered for this project's scale and deployment model.

### Alternative 4: Per-Route Lazy Load Everything (Including Home)

- **Description**: Lazy-load all routes including `HomeView`.
- **Pros**: Smallest possible initial bundle.
- **Cons**: Adds a network round-trip on first visit — the player sees a loading state on the entry screen. `HomeView` is small; the saving is marginal (~5 KB gzip). More importantly, `HomeView` is the page that triggers the lazy-load of `PlayView` on navigation — loading them sequentially would add a round-trip on the most critical path (first game start).
- **Rejection Reason**: Marginal bundle saving at the cost of a worse first-paint experience. `HomeView` is eager; only Play and Review are lazy.

## Consequences

### Positive

- Clean shareable URLs, PWA-compatible start URL
- GitHub Pages deep-linking works for all v0 routes without external infrastructure
- Popstate race condition is eliminated by the deterministic `history.pushState` restore
- Lazy loading of Play + Review protects the initial load budget
- Reserved routes are documented at fixed paths (no MVP work will collide)

### Negative

- `404.html` shim must be deployed and validated on real GitHub Pages — dev server (Vite) does not need it (Vite handles SPA fallback automatically in dev mode)
- The popstate guard implementation is non-obvious; the two-path logic (in-app button vs. popstate) must be carefully implemented or it produces double-URL-restoration flicker

### Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| `404.html` shim not deployed before the first deep-link test | Low | Medium — deep links silently 404 | CI pipeline should run `vite build` and verify `public/404.html` exists in the output |
| popstate guard returns `false` AND calls `history.pushState` (double-restoration) | Low | Low — URL flicker | Code review + E2E test: `goBack()` while in-game → URL must show exactly one `/play` restoration |
| Chunk-load failure during lazy route navigation loops infinitely (no one-shot guard) | Low | Medium — infinite reload loop | `reloadAttempted` session flag in `router.onError` prevents second reload |
| Catch-all registered before a future named route (e.g., `/history`) | Low | Medium — history routes match catch-all | Unit test asserts catch-all is the last entry; enforced on every PR |

## GDD Requirements Addressed

| GDD System | Section / Requirement | How This ADR Addresses It |
|------------|----------------------|--------------------------|
| navigation-and-routing.md | Core Rule 1: `createWebHistory`, not hash mode | Decision §1: `createWebHistory` chosen; hash mode explicitly rejected |
| navigation-and-routing.md | Core Rule 3: v0 route table (4 live + reserved stubs) | Decision §3: exact route table specified with ordering invariant |
| navigation-and-routing.md | Core Rule 6: Route-level lazy loading | Decision §4: Play + Review lazy; Home + NotFound eager |
| navigation-and-routing.md | Core Rule 7: Scroll + focus reset on navigation | Decision §7: `scrollBehavior + afterEach focus` |
| navigation-and-routing.md | Core Rule 12: `beforeunload` for full-page exit | Decision §6: armed/disarmed by `isGameInProgress` watcher |
| navigation-and-routing.md | Edge Cases: Popstate / Back button — deterministic URL restore | Decision §5: exact `history.pushState` sequence documented |
| navigation-and-routing.md | Edge Cases: GitHub Pages SPA fallback | Decision §2: `404.html` → `index.html` shim |
| navigation-and-routing.md | Edge Cases: Chunk-load failure recovery | Decision §4: `router.onError` + one-shot reload guard |

## Performance Implications

- **CPU**: Negligible — router config is inert; popstate guard is O(1)
- **Memory**: Negligible
- **Load Time**: Lazy loading of PlayView and ReviewView reduces initial bundle by the size of chessground + vue3-chessboard (estimated ~60 KB gzip) — direct benefit to the `< 3s` mobile load budget
- **Network**: `404.html` adds one extra round-trip (GitHub Pages 404 → shim redirect → index.html) on deep-link cold start. This is a one-time cost at first load; subsequent navigations are in-SPA

## Migration Plan

No existing routing implementation to migrate. This ADR establishes the initial routing configuration for new implementation.

## Validation Criteria

1. **[Unit — catch-all ordering]** Test asserts `routes[routes.length - 1].path === '/:pathMatch(.*)*'` — the catch-all is the last entry.

2. **[Unit — lazy loading]** Build manifest inspection: `PlayView` and `ReviewView` chunk IDs do NOT appear in the initial entry chunk. `HomeView` IS in the entry chunk.

3. **[E2E — popstate guard]** Playwright: `goBack()` while `isGameInProgress = true` → confirm dialog appears AND URL is `/play` during dialog AND `goBack()` again still shows confirm (no escape).

4. **[E2E — in-game guard, in-app navigation]** Playwright: click Home button while `isGameInProgress = true` → URL remains `/play` AND dialog appears.

5. **[E2E — scroll reset]** On navigation `/play` → `/`, `document.documentElement.scrollTop === 0` AND `document.activeElement.tagName === 'H1'` (or main landmark).

6. **[E2E — beforeunload]** Playwright: `page.on('dialog')` captures the browser's `beforeunload` prompt when `isGameInProgress = true` and a hard reload is triggered.

7. **[Deployment gate — GitHub Pages deep link]** After first live deploy: direct navigation to `https://<user>.github.io/<repo>/play` → `PlayView` resolves client-side (no `404 Not Found` HTML). Documented in `production/qa/evidence/`.

## Related Decisions

- [ADR-0001](adr-0001-stockfish-build-versioning.md) — establishes GitHub Pages as the deployment target (motivates the SPA fallback requirement)
- [ADR-0005](adr-0005-pinia-store-boundaries-and-completed-game-transport.md) — in-game guard reads `gameStore.isGameInProgress` (owned by ADR-0005)
- `design/gdd/navigation-and-routing.md` — the GDD this ADR implements
