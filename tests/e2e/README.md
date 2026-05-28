# E2E Tests (Playwright)

Full-browser tests running against the real dev server.
Verifies complete user flows end-to-end including Vue rendering, DOM, and
browser APIs (Clipboard, Web Share stubs).

## What belongs here

- Full chess game flow: load → move → engine response → game end → review
- Keyboard navigation on the chess board (roving tabindex, arrow keys)
- axe-core WCAG 2.1 AA accessibility audit on each screen
- Export flow: button tap → clipboard write → "Copied!" feedback
- Fallback textarea reveal and dismiss
- Route navigation guards (in-game guard, beforeunload)

## Running

```bash
# Requires dev server running (npm run dev) OR:
npm run test:e2e    # launches dev server automatically if configured in playwright.config.ts
```

## Config (`playwright.config.ts` at project root)

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 14'] } },
  ],

  // Launch dev server before tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
})
```

## File layout

```
tests/e2e/
  chess-board.spec.ts        # Board render, piece movement, promotion
  keyboard-nav.spec.ts       # Roving tabindex, arrow keys, WCAG flow
  game-lifecycle.spec.ts     # Start, play, game-end, route to review
  post-game-review.spec.ts   # Review screen, eval bar, best-move arrow
  game-export.spec.ts        # Clipboard copy, fallback textarea
  accessibility.spec.ts      # axe-core audit on each route
```
