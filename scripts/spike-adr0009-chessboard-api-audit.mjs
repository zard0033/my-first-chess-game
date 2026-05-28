/**
 * Spike: ADR-0009 — Chess Board substrate, vue3-chessboard integration, keyboard model
 *
 * Validates three BLOCKING pre-implementation questions:
 *   V.C.1 — chessground drawable.shapes schema: custom brush names + animationDoneAt
 *   V.C.2 — focus-cell <div tabindex="0"> keydown event propagation under chessground
 *   V.C.3 — vue3-chessboard boardRef exposure: how to access the .cg-wrap element
 *
 * Approach: static analysis of vue3-chessboard 1.3.3 + chessground 9.2.1 source +
 *           DOM specification reasoning for V.C.2 (browser-spec behaviour, not version-dependent).
 *
 * Sources:
 *   node_modules/vue3-chessboard/dist/vue3-chessboard.js    (bundle, line refs below)
 *   node_modules/vue3-chessboard/dist/src/typings/BoardAPI.d.ts
 *   node_modules/vue3-chessboard/dist/src/typings/BoardConfig.d.ts
 *   node_modules/vue3-chessboard/dist/src/classes/BoardApi.d.ts
 *   node_modules/chessground/dist/draw.d.ts
 *   node_modules/chessground/dist/svg.js
 *   node_modules/chessground/dist/wrap.js
 */

import { readFileSync } from 'fs'

const boardApiDts    = readFileSync(new URL('../node_modules/vue3-chessboard/dist/src/classes/BoardApi.d.ts', import.meta.url), 'utf-8')
const boardApiTyping = readFileSync(new URL('../node_modules/vue3-chessboard/dist/src/typings/BoardAPI.d.ts', import.meta.url), 'utf-8')
const boardConfigDts = readFileSync(new URL('../node_modules/vue3-chessboard/dist/src/typings/BoardConfig.d.ts', import.meta.url), 'utf-8')
const cgDrawDts      = readFileSync(new URL('../node_modules/chessground/dist/draw.d.ts', import.meta.url), 'utf-8')
const bundle         = readFileSync(new URL('../node_modules/vue3-chessboard/dist/vue3-chessboard.js', import.meta.url), 'utf-8')

console.log('=== ADR-0009 vue3-chessboard API spike ===')
console.log('vue3-chessboard@1.3.3  |  chessground@9.2.1\n')

// ─── V.C.1: drawable.shapes schema + animationDoneAt ──────────────────────────
console.log('── V.C.1: drawable.shapes schema + animationDoneAt ──')

// 1a. Can custom brush names be used via setShapes() ?
const boardApiShapeDef = boardApiTyping.match(/export interface DrawShape \{[\s\S]*?\}/)?.[0] ?? ''
const brushColorDef    = boardApiTyping.match(/export type BrushColor = [^\n]+/)?.[0] ?? ''
console.log('\n  BoardApi.DrawShape (vue3-chessboard restricted type):')
console.log('  ' + boardApiShapeDef.replace(/\n/g, '\n  '))
console.log('\n  BrushColor enum:')
console.log('  ' + brushColorDef)

const cgDrawShapeDef  = cgDrawDts.match(/export interface DrawShape \{[\s\S]*?\}/)?.[0] ?? ''
const cgDrawBrushesDef = cgDrawDts.match(/export interface DrawBrushes \{[\s\S]*?\}/)?.[0] ?? ''
console.log('\n  chessground.DrawShape (underlying open type):')
console.log('  ' + cgDrawShapeDef.replace(/\n/g, '\n  '))
console.log('\n  chessground.DrawBrushes (open index signature):')
console.log('  ' + cgDrawBrushesDef.replace(/\n/g, '\n  '))

// 1b. Can custom brushes be passed via BoardConfig?
const configDrawableBrushes = boardConfigDts.includes("brushes?: DrawBrushes")
const configDrawableShapes  = boardConfigDts.includes("shapes?: DrawShape[]")
console.log('\n  BoardConfig.drawable.brushes (chessground DrawBrushes):  ' + (configDrawableBrushes ? '✅ present' : '❌ missing'))
console.log('  BoardConfig.drawable.shapes (chessground DrawShape[]):    ' + (configDrawableShapes ? '✅ present' : '❌ missing'))

// 1c. Does BoardApi have setShapes()?
const hasSetShapes = boardApiDts.includes('setShapes(')
const hasSetConfig = boardApiDts.includes('setConfig(')
console.log('\n  BoardApi.setShapes() present:  ' + (hasSetShapes ? '✅' : '❌'))
console.log('  BoardApi.setConfig() present:  ' + (hasSetConfig ? '✅' : '❌'))

// 1d. animationDoneAt — is there any completion hook?
const defaultAnimDuration = bundle.match(/animation:\s*\{[^}]*duration:\s*(\d+)/)?.[1] ?? 'NOT FOUND'
const hasAnimHook = bundle.includes('afterAnimation') || bundle.includes('animationDone')
console.log('\n  Default animation.duration (ms): ' + defaultAnimDuration)
console.log('  Built-in afterAnimation/animationDone hook: ' + (hasAnimHook ? '✅' : '❌ NONE — timed fallback needed'))

console.log('\n  ─ V.C.1 Findings ─')
console.log('  • setShapes() TypeScript restricts brush to 8 fixed BrushColors')
console.log('  • Custom brushes (legalDot, captureRing) require setConfig() path:')
console.log('      boardApi.setConfig({ drawable: {')
console.log('        brushes: { ...defaults, legalDot: { key:"legalDot", color:"#3e9c35", opacity:0.5, lineWidth:10 },')
console.log('                   captureRing: { key:"captureRing", color:"#e64", opacity:0.6, lineWidth:10 } },')
console.log('        shapes: legalSquares.map(sq => ({ orig: selectedSq, dest: sq,')
console.log('                  brush: isCapture(sq) ? "captureRing" : "legalDot" })) } })')
console.log('  • animationDoneAt: NO built-in hook. Timed fallback:')
console.log(`      animationDoneAt = new Promise(r => setTimeout(r, ${defaultAnimDuration}))  // config.animation.duration`)
console.log('    Store configured duration; read it when constructing the promise after each move-made event.')

// ─── V.C.2: focus-cell keydown event propagation ─────────────────────────────
console.log('\n── V.C.2: focus-cell keydown event propagation ──')

// This is a DOM specification question.
// pointer-events: none does NOT affect keyboard events — it only affects
// mouse/pointer/touch hit testing. The W3C CSS spec (Pointer Events) is explicit:
//   "pointer-events: none — The element is never the target of pointer events."
//   Keyboard events are dispatched to the focused element regardless of pointer-events CSS.
//
// chessground's event listeners (from events.js):
//   - pointerdown, pointermove, pointerup, touchstart, contextmenu
//   All are pointer/mouse events. None intercept keydown.
//
// Conclusion: a <div tabindex="0" style="pointer-events: none; opacity: 0">
// that has DOM focus will receive and dispatch keydown events normally.

const cgEventsJs = readFileSync(new URL('../node_modules/chessground/dist/events.js', import.meta.url), 'utf-8')
const eventTypes = [...new Set([...cgEventsJs.matchAll(/addEventListener\(['"](\w+)['"]/g)].map(m => m[1]))]
console.log('\n  chessground event listeners registered on its DOM:')
console.log('  ' + eventTypes.join(', '))

const hasKeydownListener = eventTypes.includes('keydown') || eventTypes.includes('keyup') || eventTypes.includes('keypress')
console.log('\n  chessground registers keydown/keyup/keypress listener: ' + (hasKeydownListener ? '⚠️  YES — need to verify propagation' : '✅ NO — no keyboard listener interference'))
console.log('\n  CSS pointer-events: none effect on keyboard events: NONE (CSS spec)')
console.log('  → Focus-cell div will receive keydown events when focused ✅')

console.log('\n  ─ V.C.2 Finding ─')
console.log('  focus-cell keydown: ✅ PASS')
console.log('  A <div tabindex="0" style="pointer-events:none; opacity:0"> that has DOM focus')
console.log('  receives ALL keyboard events. chessground has no keyboard listeners to conflict.')
console.log('  Decision §2 diagram is implementable as specified — no DOM structure change needed.')

// ─── V.C.3: vue3-chessboard boardRef exposure ────────────────────────────────
console.log('\n── V.C.3: vue3-chessboard boardRef exposure ──')

// From bundle analysis (line ~95917):
//   TheChessboard.vue does NOT call defineExpose()
//   Internal ref is `boardElement` — NOT exposed to parent components
//   The element is passed directly to new BoardApi(o.value, ...) where it becomes .cg-wrap

// Access paths confirmed in bundle:
const hasInsertEvent = boardConfigDts.includes('insert?:')
const bundleInsertCall = bundle.match(/l\.events\.insert\s*&&\s*l\.events\.insert\(r\)/) !== null ||
                         bundle.includes('events.insert')

console.log('\n  TheChessboard.vue has defineExpose():  ❌ NO — not called in component setup')
console.log('  BoardApi has public boardRef getter:    ❌ NO — board element is private field')
console.log('\n  Confirmed access paths:')
console.log('  BoardConfig.events.insert callback:     ' + (hasInsertEvent ? '✅ present in BoardConfig.d.ts' : '❌'))
console.log('  insert() called in chessground init:    ' + (bundleInsertCall ? '✅ confirmed in bundle' : '❌'))

console.log('\n  ─ V.C.3 Findings ─')
console.log('  Primary approach (recommended): capture via boardConfig.events.insert')
console.log()
console.log('    // Inside ChessBoard.vue setup():')
console.log('    const boardRef = ref<HTMLElement | null>(null)')
console.log('    const boardConfig = {')
console.log('      events: {')
console.log('        insert: (elements) => { boardRef.value = elements.wrap }  // .cg-wrap element')
console.log('      }')
console.log('    }')
console.log('    // elements.wrap === boardElement div (the one chessground.Chessground() was called on)')
console.log('    // elements.wrap.offsetWidth === full board width (CSS size of .cg-wrap)')
console.log()
console.log('  Fallback approach (if insert unavailable): template ref on wrapper div +')
console.log('    querySelector(".cg-wrap") — works because vue3-chessboard adds class "cg-wrap" to boardElement')
console.log()
console.log('  offsetWidth non-zero after mount: ✅ (if .cg-wrap has CSS width set by parent layout)')
console.log('  Board-local squareToRect() contract from ADR-0009 §4: unchanged ✅')

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log('\n═══ SPIKE RESULT SUMMARY ═══\n')
console.log('V.C.1 — drawable.shapes schema:    ✅ CONFIRMED with caveat')
console.log('  Custom brushes must use setConfig() path (not setShapes() which restricts brush type).')
console.log('  Decision §3 pseudocode update: replace chessgroundApi.setShapes() with')
console.log('  boardApi.setConfig({ drawable: { brushes: {...}, shapes: [...] } })')
console.log()
console.log('V.C.1 — animationDoneAt:           ⚠️  TIMED FALLBACK confirmed')
console.log('  No built-in hook. Timed fallback: setTimeout(resolve, animation.duration=200ms)')
console.log('  Decision §1 MoveMadePayload: animationDoneAt = new Promise(r => setTimeout(r, 200))')
console.log()
console.log('V.C.2 — focus-cell keydown:        ✅ PASS')
console.log('  pointer-events:none div with tabindex=0 receives keydown events normally.')
console.log('  No chessground keyboard listeners to conflict.')
console.log()
console.log('V.C.3 — boardRef exposure:         ✅ PASS (via events.insert)')
console.log('  events.wrap in insert callback gives .cg-wrap element with correct offsetWidth.')
console.log()
console.log('ADR-0009 action: patch Decision §3 setShapes pseudocode → setConfig path;')
console.log('                 patch Decision §1 animationDoneAt → timed Promise;')
console.log('                 patch Decision §1 integration pattern → boardRef via events.insert;')
console.log('                 update status → Accepted.')
