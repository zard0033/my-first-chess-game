import { test, expect } from '@playwright/test'

test.describe('SPA deep-link redirect handling', () => {
  test('navigating to /?redirect=%2Fplay rewrites URL to /play', async ({ page }) => {
    // Simulate what 404.html produces: /?redirect=%2Fplay
    // main.ts reads the ?redirect param and calls history.replaceState before app mounts
    await page.goto('/?redirect=%2Fplay', { waitUntil: 'domcontentloaded' })

    // Assert URL was rewritten to /play by the redirect handler in main.ts
    await expect(page).toHaveURL('/play')
  })

  test('PlayView is visible after SPA redirect to /play', async ({ page }) => {
    await page.goto('/?redirect=%2Fplay', { waitUntil: 'domcontentloaded' })

    // Assert the Play view rendered (PlayView renders inside <main>)
    await expect(page.locator('main')).toBeVisible()
  })
})
