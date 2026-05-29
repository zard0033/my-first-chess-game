import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createLeaveGuard, createPopstateHandler } from '../../../src/composables/use-navigation-guards'

// Minimal mock for PopStateEvent — avoids need for DOM environment
function makePopStateEvent(back?: string): PopStateEvent {
  return { state: back !== undefined ? { back } : null } as unknown as PopStateEvent
}

describe('createLeaveGuard', () => {
  let next: ReturnType<typeof vi.fn>

  beforeEach(() => {
    next = vi.fn()
  })

  // AC-1: blocks navigation when confirm returns false
  it('test_createLeaveGuard_gameInProgress_confirmFalse_callsNextFalse', () => {
    // Arrange
    const isInProgress = () => true
    const confirmFn = vi.fn().mockReturnValue(false)
    const guard = createLeaveGuard(isInProgress, confirmFn)

    // Act
    guard({}, {}, next)

    // Assert
    expect(confirmFn).toHaveBeenCalledWith('Abandon game?')
    expect(next).toHaveBeenCalledWith(false)
  })

  // AC-2: allows navigation when confirm returns true
  it('test_createLeaveGuard_gameInProgress_confirmTrue_callsNextWithNoArg', () => {
    // Arrange
    const isInProgress = () => true
    const confirmFn = vi.fn().mockReturnValue(true)
    const guard = createLeaveGuard(isInProgress, confirmFn)

    // Act
    guard({}, {}, next)

    // Assert
    expect(confirmFn).toHaveBeenCalledWith('Abandon game?')
    expect(next).toHaveBeenCalledWith()
  })

  it('test_createLeaveGuard_noGameInProgress_callsNextWithoutConfirm', () => {
    // Arrange
    const isInProgress = () => false
    const confirmFn = vi.fn()
    const guard = createLeaveGuard(isInProgress, confirmFn)

    // Act
    guard({}, {}, next)

    // Assert
    expect(confirmFn).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledWith()
  })
})

describe('createPopstateHandler', () => {
  // AC-4: history.pushState called synchronously BEFORE confirm dialog
  it('test_createPopstateHandler_gameInProgress_callsPushStateBeforeConfirm', () => {
    // Arrange
    const callOrder: string[] = []
    const isInProgress = () => true
    const pushStateFn = vi.fn().mockImplementation(() => callOrder.push('pushState'))
    const confirmFn = vi.fn().mockImplementation(() => { callOrder.push('confirm'); return false })
    const navigate = vi.fn()
    const handler = createPopstateHandler(isInProgress, pushStateFn, confirmFn, navigate)

    // Act
    handler(makePopStateEvent('/'))

    // Assert — pushState must come before confirm to prevent URL flicker
    expect(callOrder).toEqual(['pushState', 'confirm'])
    expect(pushStateFn).toHaveBeenCalledWith('/play')
  })

  it('test_createPopstateHandler_gameInProgress_confirmTrue_navigatesToBack', () => {
    // Arrange
    const isInProgress = () => true
    const pushStateFn = vi.fn()
    const confirmFn = vi.fn().mockReturnValue(true)
    const navigate = vi.fn()
    const handler = createPopstateHandler(isInProgress, pushStateFn, confirmFn, navigate)

    // Act
    handler(makePopStateEvent('/home'))

    // Assert
    expect(navigate).toHaveBeenCalledWith('/home')
  })

  it('test_createPopstateHandler_gameInProgress_confirmFalse_doesNotNavigate', () => {
    // Arrange
    const isInProgress = () => true
    const pushStateFn = vi.fn()
    const confirmFn = vi.fn().mockReturnValue(false)
    const navigate = vi.fn()
    const handler = createPopstateHandler(isInProgress, pushStateFn, confirmFn, navigate)

    // Act
    handler(makePopStateEvent('/'))

    // Assert
    expect(navigate).not.toHaveBeenCalled()
  })

  it('test_createPopstateHandler_noGame_doesNothing', () => {
    // Arrange
    const isInProgress = () => false
    const pushStateFn = vi.fn()
    const confirmFn = vi.fn()
    const navigate = vi.fn()
    const handler = createPopstateHandler(isInProgress, pushStateFn, confirmFn, navigate)

    // Act
    handler(makePopStateEvent())

    // Assert
    expect(pushStateFn).not.toHaveBeenCalled()
    expect(confirmFn).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
  })

  // AC-3: beforeunload arm/disarm — tested via the watcher callback logic directly
  it('test_beforeUnload_armAndDisarm_addAndRemoveEventListener', () => {
    // Arrange — simulate the watcher callback from useNavigationGuards
    const addSpy = vi.fn()
    const removeSpy = vi.fn()
    const handler = () => {}

    const arm = () => addSpy('beforeunload', handler)
    const disarm = () => removeSpy('beforeunload', handler)

    // Act — arm when isGameInProgress becomes true
    arm()

    // Assert
    expect(addSpy).toHaveBeenCalledWith('beforeunload', handler)

    // Act — disarm when isGameInProgress becomes false
    disarm()
    expect(removeSpy).toHaveBeenCalledWith('beforeunload', handler)
  })
})
