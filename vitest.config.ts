import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts', 'tests/smoke/**/*.test.ts'],
    exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**'],
    reporters: ['default'],
    coverage: {
      provider: 'v8',
      reportsDirectory: 'test-results/coverage',
    },
    outputFile: {
      json: 'test-results/vitest-results.json',
    },
  },
})
