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

    // Italic: _text_
    if (body[i] === '_') {
      const end = body.indexOf('_', i + 1)
      if (end !== -1) {
        spans.push({ text: body.slice(i + 1, end), bold: false, italic: true })
        i = end + 1
        continue
      }
    }

    // Plain text: collect until next ** or _
    let next = i + 1
    for (let j = i + 1; j < body.length; j++) {
      const isBoldStart = body[j] === '*' && j + 1 < body.length && body[j + 1] === '*'
      const isItalicStart = body[j] === '_'
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
