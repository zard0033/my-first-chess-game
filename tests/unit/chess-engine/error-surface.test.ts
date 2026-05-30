/**
 * Unit tests for engine error classes and error surface contract.
 * Story: chess-engine/story-004-error-degradation
 * AC-1..AC-3
 */
import { describe, it, expect } from 'vitest'
import {
  EngineUnavailableError,
  CanceledError,
  EngineTimeoutError,
} from '../../../src/modules/chess-engine/play-engine'
import {
  EngineDisposedError,
  EngineUnavailableError as ReviewEngineUnavailableError,
  CanceledError as ReviewCanceledError,
} from '../../../src/modules/chess-engine/review-engine'

// ---- AC-1: Four typed error classes with distinct names ----

describe('error classes — AC-1: distinct names', () => {
  it('test_engineUnavailableError_name_isCorrect', () => {
    const err = new EngineUnavailableError('worker failed')
    expect(err.name).toBe('EngineUnavailableError')
    expect(err).toBeInstanceOf(Error)
    expect(err.message).toBe('worker failed')
  })

  it('test_canceledError_name_isCorrect', () => {
    const err = new CanceledError()
    expect(err.name).toBe('CanceledError')
    expect(err).toBeInstanceOf(Error)
  })

  it('test_engineTimeoutError_name_isCorrect', () => {
    const err = new EngineTimeoutError()
    expect(err.name).toBe('EngineTimeoutError')
    expect(err).toBeInstanceOf(Error)
  })

  it('test_engineDisposedError_name_isCorrect', () => {
    const err = new EngineDisposedError()
    expect(err.name).toBe('EngineDisposedError')
    expect(err).toBeInstanceOf(Error)
  })

  it('test_fourErrorNames_areDistinct', () => {
    const names = [
      new EngineUnavailableError('x').name,
      new CanceledError().name,
      new EngineTimeoutError().name,
      new EngineDisposedError().name,
    ]
    const unique = new Set(names)
    expect(unique.size).toBe(4)
  })
})

// ---- Review engine variants are consistent ----

describe('review engine error classes — name consistency', () => {
  it('test_reviewEngineUnavailableError_name_matches', () => {
    const err = new ReviewEngineUnavailableError('review worker failed')
    expect(err.name).toBe('EngineUnavailableError')
    expect(err).toBeInstanceOf(Error)
  })

  it('test_reviewCanceledError_name_matches', () => {
    const err = new ReviewCanceledError()
    expect(err.name).toBe('CanceledError')
    expect(err).toBeInstanceOf(Error)
  })
})

// ---- AC-1: errors are instanceof Error (catchable via catch) ----

describe('error classes — instanceof Error', () => {
  it('test_allErrorClasses_areInstanceofError', () => {
    const errors: Error[] = [
      new EngineUnavailableError('x'),
      new CanceledError(),
      new EngineTimeoutError(),
      new EngineDisposedError(),
    ]
    for (const err of errors) {
      expect(err).toBeInstanceOf(Error)
    }
  })

  it('test_allErrors_catchableAsDomainType', () => {
    function throwAndCatch(e: Error): string {
      try { throw e } catch (caught) {
        if (caught instanceof EngineUnavailableError) return 'unavailable'
        if (caught instanceof CanceledError) return 'canceled'
        if (caught instanceof EngineTimeoutError) return 'timeout'
        if (caught instanceof EngineDisposedError) return 'disposed'
        return 'unknown'
      }
    }
    expect(throwAndCatch(new EngineUnavailableError('x'))).toBe('unavailable')
    expect(throwAndCatch(new CanceledError())).toBe('canceled')
    expect(throwAndCatch(new EngineTimeoutError())).toBe('timeout')
    expect(throwAndCatch(new EngineDisposedError())).toBe('disposed')
  })
})
