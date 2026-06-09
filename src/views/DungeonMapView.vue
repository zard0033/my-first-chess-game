<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Check, Lock, Shield, ArrowRight } from 'lucide-vue-next'
import { puzzles } from '@/data/puzzles'
import { useDungeonProgressStore } from '@/stores/dungeon-progress'

const router = useRouter()
const progress = useDungeonProgressStore()

// The funnel lays order 1 at the bottom (wide / near) and climbs to the locked high levels at the
// top (narrow / far). A returning player would otherwise land on the distant locked apex, so centre
// the current node on load. rAF defers past the router's afterEach h1 focus-reset.
onMounted(() => {
  requestAnimationFrame(() => {
    document.querySelector('[data-dungeon-current]')?.scrollIntoView({ block: 'center' })
  })
})

// ── funnel geometry ──────────────────────────────────────────────────────────
const W = 340
const ROW = 82
const PAD_B = 80
const PAD_T = 120
const BAND = 58
const AMP_MAX = 0.3 // bottom — widest spread
const AMP_MIN = 0.045 // top — converges toward the centre vanishing point

const LEVEL_NAMES: Record<number, string> = { 1: '入門', 2: '戰術', 3: '進階' }

const ordered = computed(() => puzzles.slice().sort((a, b) => a.order - b.order))

const currentOrder = computed(() => {
  const cur = ordered.value.find((p) => progress.nodeState(p) === 'current')
  return cur?.order ?? progress.solvedCount + 1
})

type MapNode = {
  puzzle: (typeof puzzles)[number]
  x: number
  y: number
  size: number
  opacity: number
  state: 'done' | 'current' | 'locked'
}

const layout = computed(() => {
  const list = ordered.value
  const n = list.length
  const nodes: MapNode[] = []
  const bands: { y: number; level: number; solved: number; total: number }[] = []

  // Walk bottom → top, inserting a floor-threshold gap when entering a new level.
  let yFromBottom = 0
  list.forEach((p, i) => {
    if (i > 0 && p.level !== list[i - 1].level) {
      yFromBottom += BAND
      bands.push({
        y: yFromBottom - BAND / 2,
        level: p.level,
        solved: list.filter((q) => q.level === p.level && progress.nodeState(q) === 'done').length,
        total: list.filter((q) => q.level === p.level).length,
      })
    }
    yFromBottom += ROW

    const t = n > 1 ? i / (n - 1) : 0 // 0 bottom → 1 top
    const amp = AMP_MIN + (AMP_MAX - AMP_MIN) * Math.pow(1 - t, 1.25)
    const side = i % 2 === 0 ? -1 : 1
    const x = W / 2 + side * amp * W

    const state = progress.nodeState(p) as MapNode['state']
    // Size / opacity taper only the locked future; done + current stay full-size (legible + tappable).
    const depth = Math.max(0, p.order - currentOrder.value)
    const scale = depth === 0 ? 1 : Math.max(0.5, 1 - depth * 0.055)
    const opacity = depth === 0 ? 1 : Math.max(0.4, 1 - depth * 0.04)
    const base = state === 'current' ? 52 : 46

    nodes.push({ puzzle: p, x, y: 0, size: base * scale, opacity, state })
    // store raw yFromBottom on the node temporarily via index alignment below
    ;(nodes[nodes.length - 1] as MapNode & { _yb: number })._yb = yFromBottom - ROW / 2
  })

  const totalHeight = yFromBottom + PAD_B + PAD_T
  nodes.forEach((nd) => {
    nd.y = totalHeight - PAD_B - (nd as MapNode & { _yb: number })._yb
  })
  bands.forEach((b) => {
    b.y = totalHeight - PAD_B - b.y
  })

  return { nodes, bands, totalHeight }
})

const mapHeight = computed(() => layout.value.totalHeight)

// Smooth serpentine connector through node centres (bottom → top), split into the climbed (gold)
// segment and the locked-ahead (muted) segment.
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return ''
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]
    const b = pts[i]
    const my = (a.y + b.y) / 2
    d += ` C ${a.x} ${my}, ${b.x} ${my}, ${b.x} ${b.y}`
  }
  return d
}
const sortedTopDown = computed(() => layout.value.nodes.slice().sort((a, b) => a.y - b.y))
const climbedPath = computed(() =>
  smoothPath(sortedTopDown.value.filter((p) => p.puzzle.order <= currentOrder.value)),
)
const aheadPath = computed(() =>
  smoothPath(sortedTopDown.value.filter((p) => p.puzzle.order >= currentOrder.value)),
)

function coinBackground(state: MapNode['state']): string {
  if (state === 'done') return 'radial-gradient(120% 120% at 50% 18%,#3AB894,#167A5E 55%,#0C5840)'
  if (state === 'current')
    return 'radial-gradient(120% 120% at 50% 18%,#FFC94D,#F8B500 55%,#C87820)'
  return 'radial-gradient(120% 120% at 50% 18%,#26302c,#1a201d 70%,#121613)'
}

function enter(node: MapNode): void {
  if (node.state === 'locked') return
  router.push(`/dungeon/${node.puzzle.id}`)
}
</script>

<template>
  <div
    class="min-h-dvh overflow-x-hidden pb-24 lg:pb-8"
    style="background: linear-gradient(to top, #0a1f1a 0%, #103029 38%, #15392f 78%, #1a4a3d 100%)"
  >
    <!-- Header -->
    <header class="flex items-center gap-2.5 border-b border-white/[0.06] px-4 py-3.5">
      <span
        class="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-gold/10 text-gold ring-1 ring-gold/20"
        aria-hidden="true"
      ><Shield :size="15" :stroke-width="1.8" /></span>
      <div class="flex-1">
        <p class="font-sans text-[9px] font-bold uppercase tracking-[0.12em] text-gold/60">試煉道場</p>
        <h1 class="font-display text-base text-ink-on-deep" tabindex="-1">登上試煉之峰</h1>
      </div>
      <!-- 平靜進度（無 streak / timer / leaderboard） -->
      <div class="glass-panel rounded-full px-3 py-1 font-num text-xs font-bold text-ink-on-deep">
        {{ progress.solvedCount }}/{{ progress.totalCount }}
      </div>
    </header>

    <!-- Empty state -->
    <div v-if="puzzles.length === 0" class="px-6 py-20 text-center">
      <p class="font-display text-lg text-ink-on-deep">謎題即將加入</p>
      <p class="mt-2 font-sans text-sm text-ink-on-deep-dim">敬請期待新的試煉關卡。</p>
    </div>

    <!-- Map -->
    <div v-else class="flex justify-center">
      <div class="relative" :style="{ width: `${W}px`, height: `${mapHeight}px` }">
        <svg :width="W" :height="mapHeight" class="absolute inset-0 overflow-visible" aria-hidden="true">
          <path :d="aheadPath" fill="none" stroke="rgba(212,197,162,0.2)" stroke-width="2.2" stroke-dasharray="2 12" stroke-linecap="round" />
          <path :d="climbedPath" fill="none" stroke="rgba(248,181,0,0.45)" stroke-width="3" stroke-dasharray="2 11" stroke-linecap="round" />
        </svg>

        <!-- Distance fog — the far end fades into the summit haze -->
        <div
          class="pointer-events-none absolute inset-x-0 top-0 z-10 h-[200px]"
          aria-hidden="true"
          style="background: linear-gradient(to top, transparent, rgba(22, 58, 47, 0.65) 55%, rgba(26, 74, 61, 0.92))"
        />
        <p class="absolute left-1/2 z-10 -translate-x-1/2 text-[10px] uppercase tracking-[0.22em] text-ink-on-deep-dim" style="top: 70px">‧ 峰頂 ‧</p>
        <p class="absolute left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.16em] text-ink-on-deep-dim" :style="{ top: `${mapHeight - 30}px` }">起點</p>

        <!-- Floor thresholds -->
        <div
          v-for="band in layout.bands"
          :key="`band-${band.level}`"
          class="absolute inset-x-0 z-10 flex items-center gap-2.5 px-3.5"
          :style="{ top: `${band.y - 9}px` }"
        >
          <span class="h-px flex-1" style="background: linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent)" />
          <span class="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 backdrop-blur-[8px]">
            <span class="font-display text-[13px] text-ink-on-deep">{{ LEVEL_NAMES[band.level] }}</span>
            <span class="text-[9px] font-bold uppercase tracking-[0.1em] text-ink-on-deep-dim">Lv {{ band.level }}</span>
            <span class="font-num text-[11px] text-ink-on-deep-dim">{{ band.solved }}/{{ band.total }}</span>
          </span>
          <span class="h-px flex-1" style="background: linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent)" />
        </div>

        <template v-for="node in layout.nodes" :key="node.puzzle.id">
          <!-- CTA bubble (current) -->
          <button
            v-if="node.state === 'current'"
            type="button"
            class="absolute z-20 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-gradient-to-b from-gold-light to-gold px-3 py-1.5 font-sans text-[11px] font-bold text-gold-ink shadow-[0_2px_12px_rgba(248,181,0,0.5)] transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface-dungeon"
            :style="{ left: `${node.x}px`, top: `${node.y - node.size / 2 - 30}px` }"
            @click="enter(node)"
          >
            進入試煉 <ArrowRight :size="12" />
          </button>

          <!-- Coin node -->
          <button
            type="button"
            :data-dungeon-current="node.state === 'current' ? '' : undefined"
            :disabled="node.state === 'locked'"
            :aria-current="node.state === 'current' ? 'step' : undefined"
            :aria-label="`${node.puzzle.title}（${node.state === 'done' ? '已完成' : node.state === 'current' ? '進行中' : '未解鎖'}）`"
            class="absolute z-[2] flex items-center justify-center rounded-full transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface-dungeon"
            :style="{
              left: `${node.x - node.size / 2}px`,
              top: `${node.y - node.size / 2}px`,
              width: `${node.size}px`,
              height: `${node.size}px`,
              opacity: node.opacity,
              background: coinBackground(node.state),
              boxShadow:
                node.state === 'current'
                  ? 'inset 0 1px 0 rgba(255,255,255,0.4),0 0 0 4px rgba(248,181,0,0.16),0 5px 16px rgba(248,181,0,0.4)'
                  : node.state === 'done'
                    ? 'inset 0 1px 0 rgba(255,255,255,0.28),0 3px 8px rgba(0,0,0,0.35)'
                    : 'inset 0 1px 0 rgba(255,255,255,0.06),0 2px 5px rgba(0,0,0,0.3)',
              cursor: node.state === 'locked' ? 'default' : 'pointer',
            }"
            @click="enter(node)"
          >
            <Check v-if="node.state === 'done'" :size="Math.round(node.size * 0.38)" :stroke-width="2.5" class="text-[#eafff6]" />
            <span
              v-else-if="node.state === 'current'"
              class="font-num font-bold leading-none text-gold-ink"
              :style="{ fontSize: `${Math.round(node.size * 0.34)}px` }"
            >{{ node.puzzle.order }}</span>
            <Lock v-else :size="Math.round(node.size * 0.34)" :stroke-width="2" class="text-ink-on-deep-dim" />
          </button>

          <!-- Label (centred under the coin) -->
          <div
            class="absolute z-[2] -translate-x-1/2 whitespace-nowrap text-center"
            :style="{ left: `${node.x}px`, top: `${node.y + node.size / 2 + 5}px`, opacity: node.opacity }"
          >
            <p
              class="font-sans"
              :class="node.state === 'current' ? 'font-bold text-ink-on-deep' : node.state === 'done' ? 'text-ink-on-deep/80' : 'text-ink-on-deep-dim'"
              :style="{ fontSize: `${(12.5 * Math.max(0.82, node.size / (node.state === 'current' ? 52 : 46))).toFixed(1)}px` }"
            >{{ node.puzzle.title }}</p>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
