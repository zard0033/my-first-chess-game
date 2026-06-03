<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Application, Container, Graphics } from 'pixi.js'
// Strict CSP (no 'unsafe-eval') — this module swaps Pixi's eval-based shader gen for a safe path.
import 'pixi.js/unsafe-eval'

export interface BoardTile {
  key: string
  kind: 'lesson' | 'deco'
  x: number // horizontal offset from board centre (px)
  y: number // tile-centre y (px)
  state?: 'locked' | 'unlocked' | 'current' | 'done'
  lessonId?: string
  shade?: 0 | 1 // filler-tile checker variation
}

const props = defineProps<{ tiles: BoardTile[]; height: number }>()
const emit = defineEmits<{ open: [lessonId: string] }>()

const host = ref<HTMLDivElement | null>(null)
let app: Application | null = null
let ro: ResizeObserver | null = null

const TW = 96
const TH = 54
const DEPTH = 14

type Shade = { top: number; l: number; r: number }
const COLORS: Record<string, Shade> = {
  // lesson path — brighter than the floor so the route reads clearly
  locked: { top: 0x8a6a45, l: 0x6a5033, r: 0x523c26 },
  unlocked: { top: 0xbb8d4f, l: 0x956d3a, r: 0x73532b },
  current: { top: 0xe9be65, l: 0xc89a43, r: 0xa67e30 },
  done: { top: 0x68ad75, l: 0x4f865c, r: 0x3f6b49 },
  // filler floor — dim, slight checker variation
  deco0: { top: 0x473827, l: 0x352a1c, r: 0x292014 },
  deco1: { top: 0x50402b, l: 0x3d2f1f, r: 0x2f2415 },
}

function diamond(cx: number, cy: number, w = TW, h = TH): number[] {
  return [cx, cy - h / 2, cx + w / 2, cy, cx, cy + h / 2, cx - w / 2, cy]
}
function drawTile(g: Graphics, cx: number, cy: number, c: Shade): void {
  g.poly([cx - TW / 2, cy, cx, cy + TH / 2, cx, cy + TH / 2 + DEPTH, cx - TW / 2, cy + DEPTH]).fill(c.l)
  g.poly([cx, cy + TH / 2, cx + TW / 2, cy, cx + TW / 2, cy + DEPTH, cx, cy + TH / 2 + DEPTH]).fill(c.r)
  g.poly(diamond(cx, cy)).fill(c.top)
  g.poly([cx, cy - TH / 2, cx + TW / 2, cy, cx, cy - TH / 2 + 2, cx - TW / 2, cy]).fill({ color: 0xffffff, alpha: 0.07 })
}
function drawCheck(cont: Container, cx: number, cy: number): void {
  const g = new Graphics()
  g.moveTo(cx - 9, cy - 1).lineTo(cx - 2, cy + 7).lineTo(cx + 11, cy - 9).stroke({ width: 4.5, color: 0xffffff, cap: 'round', join: 'round' })
  cont.addChild(g)
}
function drawLock(cont: Container, cx: number, cy: number): void {
  const g = new Graphics()
  g.roundRect(cx - 7, cy - 1, 14, 11, 2).fill({ color: 0xffffff, alpha: 0.4 })
  g.moveTo(cx - 5, cy - 1).arc(cx, cy - 1, 5, Math.PI, Math.PI * 2).stroke({ width: 2.5, color: 0xffffff, alpha: 0.4 })
  cont.addChild(g)
}

async function build(): Promise<void> {
  const el = host.value
  if (!el) return
  const width = Math.max(el.clientWidth, 260)

  app = new Application()
  await app.init({ width, height: props.height, backgroundAlpha: 0, antialias: true, resolution: Math.min(window.devicePixelRatio || 1, 2), autoDensity: true })
  if (!host.value) { app.destroy(true); app = null; return }
  host.value.appendChild(app.canvas)
  app.stage.eventMode = 'static'

  const cx0 = width / 2
  const sorted = [...props.tiles].sort((a, b) => a.y - b.y || a.x - b.x)
  const glows: Graphics[] = []

  for (const tile of sorted) {
    const cx = cx0 + tile.x
    const cy = tile.y
    const cont = new Container()

    if (tile.kind === 'deco') {
      const g = new Graphics()
      drawTile(g, cx, cy, tile.shade ? COLORS.deco1 : COLORS.deco0)
      cont.addChild(g)
      app.stage.addChild(cont)
      continue
    }

    const st = tile.state ?? 'locked'
    if (st === 'current') {
      const glow = new Graphics()
      glow.poly(diamond(cx, cy, TW + 22, TH + 16)).fill({ color: 0xe9be65, alpha: 0.4 })
      cont.addChild(glow)
      glows.push(glow)
    }

    const g = new Graphics()
    drawTile(g, cx, cy, COLORS[st] ?? COLORS.locked)
    if (st !== 'locked' && tile.lessonId) {
      g.eventMode = 'static'
      g.cursor = 'pointer'
      const id = tile.lessonId
      g.on('pointertap', () => emit('open', id))
    }
    cont.addChild(g)

    if (st === 'done') drawCheck(cont, cx, cy)
    else if (st === 'locked') drawLock(cont, cx, cy)

    app.stage.addChild(cont)
  }

  if (glows.length) {
    let t = 0
    app.ticker.add((tk) => {
      t += tk.deltaMS / 1000
      const a = 0.28 + 0.22 * Math.sin(t * 3)
      for (const gl of glows) gl.alpha = a
    })
  }
}

function teardown(): void {
  if (ro) { ro.disconnect(); ro = null }
  if (app) { app.destroy(true, { children: true }); app = null }
}
async function rebuild(): Promise<void> { teardown(); await build() }

onMounted(async () => {
  await build()
  let lastW = host.value?.clientWidth ?? 0
  ro = new ResizeObserver(() => {
    const w = host.value?.clientWidth ?? 0
    if (Math.abs(w - lastW) > 8) { lastW = w; void rebuild() }
  })
  if (host.value) ro.observe(host.value)
})
onBeforeUnmount(teardown)
</script>

<template>
  <div ref="host" class="w-full" :style="{ height: `${height}px` }" />
</template>
