import { describe, it, expect } from 'vitest'
import { parseInlineMarkdown } from '../../../src/utils/parse-inline-markdown'
import { OPENING_CARDS } from '../../../src/data/opening-knowledge-cards'

// ---- parseInlineMarkdown (AC-06, EC-03) ----

describe('parseInlineMarkdown', () => {
  it('test_parseInlineMarkdown_bold_returnsBoldSpan', () => {
    // Arrange + Act
    const spans = parseInlineMarkdown('**bold** text')

    // Assert
    expect(spans[0]).toEqual({ text: 'bold', bold: true, italic: false })
    expect(spans[1]).toEqual({ text: ' text', bold: false, italic: false })
  })

  it('test_parseInlineMarkdown_italic_returnsItalicSpan', () => {
    const spans = parseInlineMarkdown('_italic_ text')

    expect(spans[0]).toEqual({ text: 'italic', bold: false, italic: true })
    expect(spans[1]).toEqual({ text: ' text', bold: false, italic: false })
  })

  it('test_parseInlineMarkdown_plain_returnsSingleSpan', () => {
    const spans = parseInlineMarkdown('plain text')

    expect(spans).toHaveLength(1)
    expect(spans[0]).toEqual({ text: 'plain text', bold: false, italic: false })
  })

  it('test_parseInlineMarkdown_empty_returnsEmptyArray', () => {
    expect(parseInlineMarkdown('')).toEqual([])
  })

  it('test_parseInlineMarkdown_mixedBoldAndItalic_returnsMixedSpans', () => {
    // Covers real card content like "Play **d5** or _c5_"
    const spans = parseInlineMarkdown('Play **d5** or _c5_')

    const boldSpan = spans.find(s => s.bold)
    const italicSpan = spans.find(s => s.italic)
    expect(boldSpan?.text).toBe('d5')
    expect(italicSpan?.text).toBe('c5')
  })

  it('test_parseInlineMarkdown_htmlContent_treatedAsPlainText', () => {
    // EC-03: HTML in body is NOT interpreted as markup — rendered as escaped text by Vue {{ }}
    const spans = parseInlineMarkdown('<script>alert(1)</script>')

    const allText = spans.map(s => s.text).join('')
    expect(allText).toBe('<script>alert(1)</script>')
    spans.forEach(s => {
      expect(s.bold).toBe(false)
      expect(s.italic).toBe(false)
    })
  })

  it('test_parseInlineMarkdown_unmatchedBold_treatedAsPlain', () => {
    // Unmatched ** → falls through to plain text collector
    const spans = parseInlineMarkdown('**no close')
    const allText = spans.map(s => s.text).join('')
    expect(allText).toBe('**no close')
    spans.forEach(s => expect(s.bold).toBe(false))
  })
})

// ---- OPENING_CARDS lookup (AC-01, AC-02, AC-03, EC-01, EC-02) ----

describe('OPENING_CARDS lookup', () => {
  it('test_lookup_knownEco_returnsCard', () => {
    // AC-01: C50 Italian Game is a known card
    const card = OPENING_CARDS['C50']

    expect(card).toBeDefined()
    expect(card.eco).toBe('C50')
    expect(card.name).toContain('Italian')
    expect(card.body.length).toBeGreaterThan(0)
  })

  it('test_lookup_unknownEco_returnsUndefined', () => {
    // AC-03 / EC-02: A99 has no authored card → component renders nothing
    const card = OPENING_CARDS['A99']

    expect(card).toBeUndefined()
  })

  it('test_lookup_nullEco_componentLogicReturnsNull', () => {
    // AC-02 / EC-01: null eco → card is null (mimics computed in component)
    const eco: string | null = null
    const card = eco !== null ? (OPENING_CARDS[eco] ?? null) : null

    expect(card).toBeNull()
  })

  it('test_lookup_allCards_bodyFreeOfRawHtml', () => {
    // EC-03: pre-authored card bodies must not contain raw HTML tags
    for (const [key, card] of Object.entries(OPENING_CARDS)) {
      expect(card.body, `card ${key} body contains raw HTML`).not.toMatch(/<[a-z][^>]*>/i)
    }
  })
})
