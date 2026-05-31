import { describe, it, expect } from 'vitest'
import { OPENING_CARDS } from '../../../src/data/opening-knowledge-cards'

// AC-07 / AC-08 validation for S6-03: 10 additional ECO content cards

describe('OPENING_CARDS data completeness (AC-07)', () => {
  it('test_cardCount_atLeast20Entries', () => {
    expect(Object.keys(OPENING_CARDS).length).toBeGreaterThanOrEqual(20)
  })

  it('test_sprint2Backlog_allTenCodesPresent', () => {
    // Verified ECO codes from lookupSync (GDD Appendix codes corrected where needed)
    const expected = ['C30', 'D10', 'E61', 'E20', 'D80', 'B90', 'B70', 'A80', 'C25', 'B06']
    for (const eco of expected) {
      expect(OPENING_CARDS[eco], `Missing card for ECO ${eco}`).toBeDefined()
    }
  })

  it('test_allCards_haveRequiredFields', () => {
    for (const [key, card] of Object.entries(OPENING_CARDS)) {
      expect(card.eco, `${key}.eco is empty`).toBeTruthy()
      expect(card.name, `${key}.name is empty`).toBeTruthy()
      expect(card.body, `${key}.body is empty`).toBeTruthy()
    }
  })

  it('test_allCards_ecoKeyMatchesEcoField', () => {
    for (const [key, card] of Object.entries(OPENING_CARDS)) {
      expect(card.eco, `Key ${key} does not match eco field ${card.eco}`).toBe(key)
    }
  })

  it('test_allCards_bodyWithinLengthBudget', () => {
    // ≤ 600 characters ≈ 4 sentences
    for (const [key, card] of Object.entries(OPENING_CARDS)) {
      expect(card.body.length, `${key} body too long (${card.body.length} chars)`).toBeLessThanOrEqual(600)
    }
  })
})

describe('OPENING_CARDS tone review (AC-08)', () => {
  const FORBIDDEN_PHRASES = [
    '應該走',
    '你錯過',
    '壞選擇',
    '漏算',
    '失誤',
    '你應該',
    '走錯了',
    'should have played',
    'you missed',
    'bad choice',
    'blundered',
    'mistake',
  ]

  it('test_allCards_bodyFreeOfJudgmentLanguage', () => {
    for (const [key, card] of Object.entries(OPENING_CARDS)) {
      const body = card.body.toLowerCase()
      for (const phrase of FORBIDDEN_PHRASES) {
        expect(body, `Card ${key} contains judgment phrase: "${phrase}"`).not.toContain(phrase)
      }
    }
  })
})
