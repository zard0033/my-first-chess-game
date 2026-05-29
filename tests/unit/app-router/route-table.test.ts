// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { router } from '../../../src/router/index'

describe('route-table', () => {
  const routes = router.options.routes

  it('test_routeTable_catchAll_isLastEntry', () => {
    // Arrange
    const last = routes[routes.length - 1]

    // Act + Assert
    expect(last.path).toBe('/:pathMatch(.*)*')
  })

  it('test_routeTable_containsExactlyFourRoutes', () => {
    // Assert
    const paths = routes.map((r) => r.path)
    expect(paths).toEqual(['/', '/play', '/review', '/:pathMatch(.*)*'])
  })

  it('test_routeTable_playRoute_componentIsFunction', () => {
    // Arrange
    const play = routes.find((r) => r.path === '/play')!

    // Act + Assert — lazy component is a function
    expect(typeof play.component).toBe('function')
  })

  it('test_routeTable_reviewRoute_componentIsFunction', () => {
    // Arrange
    const review = routes.find((r) => r.path === '/review')!

    // Act + Assert — lazy component is a function
    expect(typeof review.component).toBe('function')
  })

  it('test_routeTable_homeRoute_componentIsNotFunction', () => {
    // Arrange
    const home = routes.find((r) => r.path === '/')!

    // Act + Assert — eager component is an object, not a loader function
    expect(typeof home.component).not.toBe('function')
  })

  it('test_routeTable_notFoundRoute_componentIsNotFunction', () => {
    // Arrange
    const notFound = routes.find((r) => r.path === '/:pathMatch(.*)*')!

    // Act + Assert — eager component is an object, not a loader function
    expect(typeof notFound.component).not.toBe('function')
  })

  it('test_routeTable_scrollBehavior_returnsTopZero', () => {
    // Arrange
    const scrollBehavior = router.options.scrollBehavior

    // Act + Assert
    expect(scrollBehavior).toBeDefined()
    const result = scrollBehavior!({} as any, {} as any, null)
    expect(result).toEqual({ top: 0 })
  })

  it('test_routeTable_noReservedRoutes_historyAbsent', () => {
    // Assert — /history must never appear in the route table
    const paths = routes.map((r) => r.path)
    expect(paths).not.toContain('/history')
  })

  it('test_routeTable_noReservedRoutes_settingsAbsent', () => {
    // Assert — /settings must never appear in the route table
    const paths = routes.map((r) => r.path)
    expect(paths).not.toContain('/settings')
  })
})
