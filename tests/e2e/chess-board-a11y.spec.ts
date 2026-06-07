/**
 * E2E accessibility tests for the chess board keyboard navigation.
 * Story: chess-board/story-005-keyboard-nav (AC-1)
 * Requires: @axe-core/playwright
 *
 * Run manually: npx playwright test tests/e2e/chess-board-a11y.spec.ts
 * (Excluded from vitest — Playwright-only)
 */
import { test } from '@playwright/test'

// AC-1: No axe violations of impact serious or critical on the chess board.
// This test is a placeholder — requires the app running on localhost:5173
// and @axe-core/playwright installed.
//
// To enable:
//   npm install --save-dev @axe-core/playwright
//   Then uncomment the checkA11y call below.

test.describe('ChessBoard accessibility — AC-1', () => {
  test.skip('axe-core: no serious/critical violations on board mount', async ({ page }) => {
    await page.goto('http://localhost:5173/')
    // Start a game first so the board renders
    // await page.getByRole('button', { name: /play/i }).click()

    // const { checkA11y } = await import('@axe-core/playwright')
    // await checkA11y(
    //   page.locator('[data-testid="chess-board"]'),
    //   { includedImpacts: ['serious', 'critical'] },
    // )
    // expect(violations).toHaveLength(0)
  })
})
