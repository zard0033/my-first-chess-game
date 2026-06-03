<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Lock, Check, Crown } from 'lucide-vue-next'
import { LESSON_TIER_LABELS } from '@/types/lesson'

export type PathNodeState = 'locked' | 'unlocked' | 'current' | 'done'

export interface PathNode {
  id: string
  title: string
  tier: 1 | 2 | 3 | 4
  state: PathNodeState
  piece: string
  isCapstone: boolean
  order: number
}

const props = defineProps<{ nodes: PathNode[] }>()
const emit = defineEmits<{ open: [id: string] }>()

// ── Geometry ──────────────────────────────────────────────────────────────────
// Diamond tile: a CSS square rotated 45°.
// Visual diagonal = TILE × √2 ≈ 96px.  Gap between adjacent tiles ≈ 10px.
const TILE = 68
const TILE_VIS = Math.round(TILE * Math.SQRT2)  // 96px
const AMPLITUDE = 60          // px left/right of container centre
const ROW_STEP = 108          // vertical centre-to-centre (gap = 108-96 = 12px)
const HEADER_H = 72
const BOT_PAD = 130           // room for coach + pill
const TOP_PAD = 12

// Tier colour ramp (warm RPG palette, used for socket + face gradient)
const C = {
  face:   { 1: '#cda173', 2: '#b27c4c', 3: '#8f7059', 4: '#6a4c2c' },
  top:    { 1: '#e2c193', 2: '#cb9a64', 3: '#a98a6f', 4: '#8a6840' },
  socket: { 1: '#9a7549', 2: '#7d5325', 3: '#5f4632', 4: '#3f2a12' },
} as const

// ── Container width ────────────────────────────────────────────────────────────
const containerRef = ref<HTMLElement | null>(null)
const W = ref(360)
let ro: ResizeObserver | null = null

onMounted(() => {
  if (containerRef.value) {
    W.value = containerRef.value.clientWidth
    ro = new ResizeObserver(([e]) => { W.value = e.contentRect.width })
    ro.observe(containerRef.value)
  }
})
onUnmounted(() => ro?.disconnect())

const trophyError = ref(false)
const coachError  = ref(false)

// ── Group by tier ──────────────────────────────────────────────────────────────
const groups = computed(() => {
  const gs: { tier: 1 | 2 | 3 | 4; nodes: PathNode[] }[] = []
  for (const n of props.nodes) {
    const last = gs[gs.length - 1]
    if (last && last.tier === n.tier) last.nodes.push(n)
    else gs.push({ tier: n.tier, nodes: [n] })
  }
  return gs
})

// ── Layout ─────────────────────────────────────────────────────────────────────
interface PlacedNode {
  node: PathNode
  x: number
  y: number
  gi: number   // global lesson index (for animation delay + col parity)
}
interface Header {
  tier: 1 | 2 | 3 | 4
  y: number
  piece: string
  done: number
  total: number
  chapterIdx: number
}

const layout = computed(() => {
  const cx = W.value / 2

  // Build top-down, then y-flip so node[0] (first lesson) lands at the bottom.
  let y = TOP_PAD
  const rawNodes: PlacedNode[] = []
  const rawHeaders: Header[] = []
  let gi = 0

  for (let ci = 0; ci < groups.value.length; ci++) {
    const g = groups.value[ci]
    rawHeaders.push({
      tier: g.tier, y,
      piece: g.nodes[0].piece,
      done: g.nodes.filter(n => n.state === 'done').length,
      total: g.nodes.length,
      chapterIdx: ci,
    })
    y += HEADER_H

    for (const node of g.nodes) {
      const col = gi % 2             // 0 = left, 1 = right
      const nx = col === 0 ? cx - AMPLITUDE : cx + AMPLITUDE
      rawNodes.push({ node, x: nx, y: y + TILE / 2, gi })
      y += ROW_STEP
      gi++
    }
  }

  const height = y + BOT_PAD

  // Y-flip: first lesson (rawNodes[0]) ends up near the bottom.
  const nodes = rawNodes.map(n => ({ ...n, y: height - n.y }))
  const headers = rawHeaders.map(h => ({ ...h, y: height - h.y - HEADER_H }))

  // SVG zigzag connector between node centres
  const pts = nodes.map(n => ({ x: n.x, y: n.y }))
  const polyPts = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

  // Gold progress: from node[0] through to the current node (or last done)
  const curIdx = props.nodes.findIndex(n => n.state === 'current')
  const progEnd = curIdx >= 0 ? curIdx : props.nodes.filter(n => n.state === 'done').length - 1
  const progPts = progEnd > 0
    ? pts.slice(0, progEnd + 1).map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
    : ''

  // Current node info for coach + pill
  const curNode = curIdx >= 0 ? nodes[curIdx] : null
  const COACH_W = 82
  const coachStyle = curNode ? (() => {
    const col = curNode.gi % 2
    const side = col === 0 ? 1 : -1   // coach on the opposite side
    let x = curNode.x + side * (TILE_VIS / 2 + 36)
    x = Math.max(COACH_W / 2 + 4, Math.min(W.value - COACH_W / 2 - 4, x))
    return { left: `${x}px`, top: `${curNode.y + 10}px` }
  })() : null

  return {
    nodes, headers, height, polyPts, progPts,
    curNode, coachStyle,
    ctaLabel: props.nodes.some(n => n.state === 'done') ? '繼續' : '開始',
  }
})

// ── Inline styles ──────────────────────────────────────────────────────────────
type Tier = 1 | 2 | 3 | 4

function tileStyle(p: PlacedNode) {
  const t = p.node.tier as Tier
  const locked = p.node.state === 'locked'
  return {
    left: `${p.x}px`,
    top: `${p.y}px`,
    '--face':   locked ? '#d8cdb9' : C.face[t],
    '--top':    locked ? '#e8dfd0' : C.top[t],
    '--socket': locked ? '#b8a898' : C.socket[t],
    '--d':      `${Math.min(p.gi, 8) * 45}ms`,
    zIndex: props.nodes.length - p.gi + 1,
  }
}

function onActivate(node: PathNode) {
  if (node.state === 'locked') return
  emit('open', node.id)
}
</script>

<template>
  <div ref="containerRef" class="path" :style="{ height: `${layout.height}px` }">

    <!-- SVG connector trail -->
    <svg
      class="trail"
      :width="W"
      :height="layout.height"
      :viewBox="`0 0 ${W} ${layout.height}`"
      aria-hidden="true"
    >
      <!-- base dashed track -->
      <polyline
        v-if="layout.polyPts"
        :points="layout.polyPts"
        class="trail__base"
      />
      <!-- gold progress segment -->
      <polyline
        v-if="layout.progPts"
        :points="layout.progPts"
        class="trail__gold trail__gold--draw"
      />
    </svg>

    <!-- Section headers -->
    <div
      v-for="h in layout.headers"
      :key="`hdr-${h.tier}`"
      class="chapter-header"
      :style="{ top: `${h.y}px` }"
    >
      <div class="chapter-header__inner">
        <span class="chapter-header__badge">
          <img :src="`/pieces/${h.piece}.svg`" alt="" draggable="false" />
        </span>
        <span class="min-w-0 flex-1">
          <span class="chapter-label">第 {{ h.chapterIdx + 1 }} 章</span>
          <span class="chapter-title">{{ LESSON_TIER_LABELS[h.tier] }}</span>
        </span>
        <span class="chapter-count">{{ h.done }} / {{ h.total }}</span>
      </div>
    </div>

    <!-- Diamond tiles -->
    <button
      v-for="p in layout.nodes"
      :key="p.node.id"
      type="button"
      class="tile"
      :class="[`tile--${p.node.state}`, { 'tile--cap': p.node.isCapstone }]"
      :style="tileStyle(p)"
      :disabled="p.node.state === 'locked'"
      :aria-label="
        p.node.state === 'locked' ? `${p.node.title}（未解鎖）`
        : p.node.state === 'done'  ? `${p.node.title}（已完成）`
        : p.node.title
      "
      :aria-current="p.node.state === 'current' ? 'step' : undefined"
      @click="onActivate(p.node)"
    >
      <span class="tile__face">
        <span class="tile__inner">
          <Lock v-if="p.node.state === 'locked'" class="tile__icon tile__icon--lock" />
          <template v-else-if="p.node.isCapstone">
            <img
              v-if="!trophyError"
              :src="'/learn/trophy.png'"
              class="tile__trophy"
              alt=""
              draggable="false"
              @error="trophyError = true"
            />
            <Crown v-else class="tile__icon tile__icon--crown" />
          </template>
          <img
            v-else
            :src="`/pieces/${p.node.piece}.svg`"
            class="tile__piece"
            alt=""
            draggable="false"
          />
        </span>
      </span>
      <!-- Done badge -->
      <span v-if="p.node.state === 'done'" class="tile__check" aria-hidden="true">
        <Check class="h-3 w-3" :stroke-width="3.5" />
      </span>
    </button>

    <!-- START / 繼續 pill -->
    <span
      v-if="layout.curNode"
      class="cta-pill"
      :style="{
        left: `${layout.curNode.x}px`,
        top:  `${layout.curNode.y - TILE_VIS / 2 - 12}px`,
      }"
      aria-hidden="true"
    >{{ layout.ctaLabel }}</span>

    <!-- Coach standee -->
    <img
      v-if="layout.curNode && !coachError"
      :src="'/learn/coach.png'"
      class="coach"
      alt=""
      draggable="false"
      :style="layout.coachStyle ?? {}"
      @error="coachError = true"
    />
  </div>
</template>

<style scoped>
/* ── Container ── */
.path {
  position: relative;
  width: 100%;
  user-select: none;
  background: transparent;
}

/* ── Trail ── */
.trail {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: visible;
}
.trail__base {
  fill: none;
  stroke: #d4c5a2;
  stroke-width: 4;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 6 10;
}
.trail__gold {
  fill: none;
  stroke: #d6a23a;
  stroke-width: 5;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: drop-shadow(0 1px 3px rgba(168, 115, 32, 0.4));
}
.trail__gold--draw {
  animation: trail-draw 1s ease-out both;
}
@keyframes trail-draw {
  from { stroke-dasharray: 1; stroke-dashoffset: 1; }
  to   { stroke-dasharray: 1; stroke-dashoffset: 0; }
}

/* ── Section header ── */
.chapter-header {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: min(100%, 340px);
  height: 72px;
  z-index: 50;
  display: flex;
  align-items: center;
  padding: 0 4px;
}
.chapter-header__inner {
  position: relative;
  isolation: isolate;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 14px;
}
.chapter-header__inner::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  border-image: url('/ui/panel_beige.png') 18 fill;
  border-style: solid;
  border-width: 18px;
  pointer-events: none;
}
.chapter-header__badge {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  background: linear-gradient(180deg, #f3e6d2, #e6d3b4);
  box-shadow: inset 0 1px 1px rgba(255,255,255,.6), inset 0 -1px 2px rgba(120,86,48,.2);
}
.chapter-header__badge img { width: 22px; height: 22px; }
.chapter-label {
  display: block;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: #a88c76;
}
.chapter-title {
  display: block;
  font-size: 1rem;
  font-weight: 700;
  color: #3d2210;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.chapter-count {
  flex-shrink: 0;
  font-size: 0.75rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #7a5c44;
}

/* ── Diamond tile: CSS square rotated 45° ── */
.tile {
  position: absolute;
  width: 68px;
  height: 68px;
  transform: translate(-50%, -50%) rotate(45deg);
  border-radius: 14px;
  background: var(--socket);
  border: none;
  padding: 0;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  animation: tile-in 0.4s cubic-bezier(0.34, 1.5, 0.6, 1) both;
  animation-delay: var(--d, 0ms);
}
.tile--cap {
  width: 80px;
  height: 80px;
  border-radius: 18px;
}

@keyframes tile-in {
  from { opacity: 0; transform: translate(-50%, -50%) rotate(45deg) scale(0.4); }
  to   { opacity: 1; transform: translate(-50%, -50%) rotate(45deg) scale(1); }
}

/* face: lifts 6px off the socket, gives 3D depth */
.tile__face {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(135deg, var(--top), var(--face));
  box-shadow:
    inset 0 2px 3px rgba(255, 255, 255, .45),
    inset 0 -2px 5px rgba(0, 0, 0, .15);
  transform: translateY(-6px);
  transition: transform .1s ease;
  display: grid;
  place-items: center;
}
.tile:active:not([disabled]) .tile__face { transform: translateY(-2px); }

.tile:focus-visible { outline: none; }
.tile:focus-visible .tile__face {
  box-shadow:
    inset 0 2px 3px rgba(255,255,255,.45),
    inset 0 -2px 5px rgba(0,0,0,.15),
    0 0 0 4px #faf6f0, 0 0 0 7px var(--face);
}

/* inner: counter-rotate so content stays upright */
.tile__inner {
  transform: rotate(-45deg);
  width: 54%;
  height: 54%;
  display: grid;
  place-items: center;
}
.tile__piece  { width: 100%; height: 100%; pointer-events: none; filter: drop-shadow(0 1px 1px rgba(0,0,0,.18)); }
.tile__trophy { width: 100%; height: 100%; pointer-events: none; }
.tile__icon         { width: 100%; height: 100%; }
.tile__icon--lock   { color: #b09a82; }
.tile__icon--crown  { color: #ffe9b0; }

/* done check badge at the corner of the diamond */
.tile__check {
  position: absolute;
  bottom: -3px;
  right: -3px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #4a7c59;
  color: #fcf9f3;
  border: 3px solid #faf6f0;
  display: grid;
  place-items: center;
  z-index: 5;
  transform: rotate(-45deg);  /* counter-rotate badge */
}

/* ── State overrides ── */
.tile--locked {
  cursor: not-allowed;
}
.tile--locked .tile__face {
  background: linear-gradient(135deg, #e8dfd0, #d8cdb9);
  box-shadow: inset 0 1px 2px rgba(255,255,255,.4);
  transform: translateY(-2px);
}

.tile--done .tile__face {
  transform: translateY(-4px);
}

.tile--current {
  z-index: 100 !important;
}
.tile--current .tile__face {
  box-shadow:
    inset 0 2px 3px rgba(255,255,255,.45),
    inset 0 -2px 5px rgba(0,0,0,.15),
    0 0 0 4px rgba(214, 162, 58, .95),
    0 0 0 9px rgba(214, 162, 58, .28),
    0 6px 18px rgba(168, 115, 32, .4);
  animation: glow 2s ease-in-out infinite;
}
@keyframes glow {
  0%, 100% { box-shadow: inset 0 2px 3px rgba(255,255,255,.45), inset 0 -2px 5px rgba(0,0,0,.15), 0 0 0 4px rgba(214,162,58,.9), 0 0 0 9px rgba(214,162,58,.22), 0 6px 18px rgba(168,115,32,.3); }
  50%       { box-shadow: inset 0 2px 3px rgba(255,255,255,.45), inset 0 -2px 5px rgba(0,0,0,.15), 0 0 0 5px rgba(214,162,58,1),   0 0 0 13px rgba(214,162,58,.36), 0 8px 22px rgba(168,115,32,.45); }
}

/* ── CTA pill ── */
.cta-pill {
  position: absolute;
  transform: translate(-50%, -100%);
  padding: 5px 14px;
  border-radius: 9999px;
  background: linear-gradient(180deg, #e6b955, #d6a23a);
  color: #3d2210;
  font-size: .72rem;
  font-weight: 800;
  letter-spacing: .08em;
  white-space: nowrap;
  box-shadow: 0 4px 10px rgba(168, 115, 32, .4);
  pointer-events: none;
  z-index: 200;
  animation: pill-bounce 1.6s ease-in-out infinite;
}
.cta-pill::after {
  content: '';
  position: absolute;
  left: 50%; bottom: -5px;
  transform: translateX(-50%);
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid #d6a23a;
}
@keyframes pill-bounce {
  0%, 100% { transform: translate(-50%, -100%); }
  50%       { transform: translate(-50%, calc(-100% - 6px)); }
}

/* ── Coach standee ── */
.coach {
  position: absolute;
  transform: translate(-50%, -50%);
  width: 82px;
  height: auto;
  pointer-events: none;
  mix-blend-mode: multiply;
  filter: drop-shadow(0 4px 8px rgba(61, 34, 16, .22));
  z-index: 150;
}

/* ── Reduced motion ── */
@media (prefers-reduced-motion: reduce) {
  .tile               { animation: none; opacity: 1; }
  .tile--current .tile__face { animation: none; }
  .cta-pill           { animation: none; }
  .trail__gold--draw  { animation: none; }
  .tile:active:not([disabled]) .tile__face { transform: translateY(-6px); }
}
</style>
