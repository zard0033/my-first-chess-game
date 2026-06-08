/**
 * Generate pure-vector silhouette SVGs from the Gioco Wood piece set.
 *
 * The shipped piece SVGs paint their shape with `fill="url(#patternN)"`, where the
 * pattern resolves a base64 raster via `<use xlink:href>` → `<image>`. iOS Safari
 * fails to resolve that indirection when the SVG is consumed as a CSS `mask-image`,
 * so badge / concept / learn silhouettes render empty on iPhone. A flat vector mask
 * (solid-filled shape paths, no pattern/use/image) is the canonical, iOS-safe form —
 * and visually identical for our use, since the mask is tinted to a single colour anyway.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = path.join(root, 'public', 'pieces')
const out = path.join(src, 'silhouette')
fs.mkdirSync(out, { recursive: true })

const codes = ['wK', 'wQ', 'wR', 'wB', 'wN', 'wP', 'bK', 'bQ', 'bR', 'bB', 'bN', 'bP']

for (const code of codes) {
  const svg = fs.readFileSync(path.join(src, `${code}.svg`), 'utf8')
  // Grab every shape path whose fill is a raster pattern — these define the silhouette.
  const paths = [...svg.matchAll(/<path\b[^>]*fill="url\(#pattern[^>]*\/>/g)].map((m) => m[0])
  if (!paths.length) throw new Error(`no pattern-filled paths in ${code}.svg`)
  const solid = paths.map((p) =>
    p
      .replace(/fill="url\(#pattern\d+\)"/, 'fill="#000"')
      .replace(/stroke="#[0-9A-Fa-f]+"/, 'stroke="#000"'),
  )
  const body = `<svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">\n${solid
    .map((p) => '  ' + p)
    .join('\n')}\n</svg>\n`
  fs.writeFileSync(path.join(out, `${code}.svg`), body)
  console.log(`${code}: ${paths.length} path(s) -> silhouette/${code}.svg (${body.length}B)`)
}
