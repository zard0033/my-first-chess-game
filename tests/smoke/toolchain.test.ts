import { describe, it, expect } from 'vitest'

describe('toolchain smoke', () => {
  it('vitest runs and assertions pass', () => {
    expect(1 + 1).toBe(2)
  })

  it('strict TypeScript types compile', () => {
    const greet = (name: string): string => `Hello, ${name}`
    expect(greet('Eason')).toBe('Hello, Eason')
  })

  it('ESM imports resolve', async () => {
    const { strict } = await import('node:assert')
    expect(typeof strict.equal).toBe('function')
  })
})
