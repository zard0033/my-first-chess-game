import { test, expect } from '@playwright/test'

test.describe('toolchain smoke (no app yet)', () => {
  test('playwright launches a browser and renders a blank page', async ({ page }) => {
    await page.goto('about:blank')
    await expect(page).toHaveURL('about:blank')
  })

  test.skip('app smoke — re-enable when first prototype lands in src/', async () => {
    // Placeholder. When src/main.ts + vite dev server exist, swap to:
    //   await page.goto('http://localhost:5173')
    //   await expect(page.locator('h1')).toBeVisible()
  })
})
