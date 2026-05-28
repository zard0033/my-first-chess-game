# Test Infrastructure

**Engine**: Web App — TypeScript + Vue 3
**Unit Test Framework**: Vitest ^1.x
**E2E Test Framework**: Playwright ^1.x
**CI**: `.github/workflows/tests.yml`
**Setup date**: 2026-05-29

## Directory Layout

```
tests/
  unit/           # Isolated unit tests — formulas, composables, state machines
  integration/    # Cross-system tests (Vitest, no browser required)
  e2e/            # Full-browser E2E tests (Playwright)
  smoke/          # Critical path checklist for /smoke-check gate
  evidence/       # Screenshot logs and manual test sign-off records
```

## Running Tests

```bash
# Unit + integration tests (Vitest)
npm run test:unit

# E2E tests (Playwright — requires a running dev server)
npm run test:e2e

# All tests (CI equivalent)
npm run test
```

> Note: `npm` scripts are configured in `package.json` (created when `src/` is
> initialised with `npm create vue@latest`). Typical config:
>
> ```json
> "scripts": {
>   "test:unit": "vitest run",
>   "test:e2e": "playwright test",
>   "test": "vitest run && playwright test"
> }
> ```

## Test Naming

- **Files**: `[system]-[feature].test.ts` (Vitest) / `[flow].spec.ts` (Playwright)
- **Describes**: `[SystemName] — [feature area]`
- **Tests**: `[scenario] → [expected outcome]`
- **Example**: `chess-engine-uci.test.ts` → `UCI handshake → readyok received within 2s`

## Story Type → Test Evidence

| Story Type | Required Evidence | Location | Gate |
|---|---|---|---|
| Logic (formulas, state machines) | Automated unit test — must pass | `tests/unit/[system]/` | BLOCKING |
| Integration (cross-system) | Integration test OR documented playtest | `tests/integration/[system]/` | BLOCKING |
| Visual/Feel (animation, UX feel) | Screenshot + lead sign-off | `tests/evidence/` | ADVISORY |
| UI (menus, screens, HUD) | Playwright E2E OR manual walkthrough doc | `tests/e2e/` or `tests/evidence/` | ADVISORY |
| Config/Data (balance tuning) | Smoke check pass | `production/qa/smoke-*.md` | ADVISORY |

## CI

Tests run automatically on every push to `main` and on every pull request.
A failed test suite blocks merging.
See `.github/workflows/tests.yml`.

## Minimum Coverage (per CLAUDE.md coding-standards.md)

Required test coverage at minimum:
- Chess move validation (chess.js wrapper)
- Stockfish UCI message parsing (Web Worker interface)
- Review data parsing (sessionStorage round-trip)
- Skill scoring formulas (MVP phase)
- Supabase data sync round-trip (MVP phase)
