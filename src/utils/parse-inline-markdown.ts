export interface Span {
  text: string
  bold: boolean
  italic: boolean
}

/**
 * Tokenizes a card body string into a flat list of styled spans.
 * Supports **bold** and _italic_ inline markdown only.
 * HTML is treated as plain text — never interpreted as markup.
 */
// Underscore is only an italic delimiter at a word boundary, so coordinates / code-like tokens
// (e2_e4, g1_f3) aren't mangled into italic. Opening _ must follow start-of-string or whitespace;
// closing _ must be followed by end-of-string, whitespace, or punctuation.
const openItalic = (body: string, idx: number): boolean =>
  body[idx] === '_' && (idx === 0 || /\s/.test(body[idx - 1]))
const closeItalicAfter = (body: string, idx: number): boolean =>
  idx >= body.length || /[\s.,!?;:)\]，。！？；：）」』]/.test(body[idx])

export function parseInlineMarkdown(body: string): Span[] {
  const spans: Span[] = []
  let i = 0

  while (i < body.length) {
    // Bold: **text**
    if (i + 1 < body.length && body[i] === '*' && body[i + 1] === '*') {
      const end = body.indexOf('**', i + 2)
      if (end !== -1) {
        spans.push({ text: body.slice(i + 2, end), bold: true, italic: false })
        i = end + 2
        continue
      }
    }

    // Italic: _text_ (word-boundary delimited)
    if (openItalic(body, i)) {
      let end = -1
      for (let j = i + 1; j < body.length; j++) {
        if (body[j] === '_' && closeItalicAfter(body, j + 1)) { end = j; break }
      }
      if (end !== -1) {
        spans.push({ text: body.slice(i + 1, end), bold: false, italic: true })
        i = end + 1
        continue
      }
    }

    // Plain text: collect until next ** or boundary-_
    let next = i + 1
    for (let j = i + 1; j < body.length; j++) {
      const isBoldStart = body[j] === '*' && j + 1 < body.length && body[j + 1] === '*'
      const isItalicStart = openItalic(body, j)
      if (isBoldStart || isItalicStart) {
        next = j
        break
      }
      next = j + 1
    }
    spans.push({ text: body.slice(i, next), bold: false, italic: false })
    i = next
  }

  return spans.filter(s => s.text.length > 0)
}
