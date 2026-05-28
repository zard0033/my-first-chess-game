# Unit Tests (Vitest)

Pure, isolated tests for business logic. No browser, no DOM, no network.

## What belongs here

- Chess rule formulas (cpLoss, fillRatio, depth-comparability guard)
- State machines (board state machine, export state machine)
- Pure composables and utility functions
- UCI message parser
- Opening index lookup logic
- Scoring formulas (MVP phase)

## What does NOT belong here

- Vue component rendering → use `tests/e2e/`
- Playwright interactions → use `tests/e2e/`
- Cross-system flows → use `tests/integration/`

## File layout

```
tests/unit/
  chess-engine/          # UCI protocol, AbortSignal, requestId guard
  chess-board/           # squareToRect(), keyboard nav logic
  opening-id/            # EPD lookup, longest-prefix match
  game-lifecycle/        # terminal detection, CompletedGame shape
  move-annotation/       # eval bar formula, fillRatio
  post-game-review/      # cpLoss F2, biggestSwingCursor, sessionStorage key
  game-export/           # assembleExportPayload purity and determinism
```

## Running

```bash
npm run test:unit
# or watch mode during development:
npm run test:unit -- --watch
```

## Config

Vitest is configured in `vite.config.ts` (or a dedicated `vitest.config.ts`):

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',   // pure logic tests — no jsdom needed for most
    globals: true,
    include: ['tests/unit/**/*.test.ts'],
  },
})
```

Components that require Vue/DOM should use `environment: 'jsdom'` via
a per-file `@vitest-environment jsdom` pragma or a separate config entry.
