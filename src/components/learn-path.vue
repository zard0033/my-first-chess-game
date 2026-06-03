<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Lock, Check } from 'lucide-vue-next'

export type PathNodeState = 'locked' | 'unlocked' | 'current' | 'done'

export interface PathNode {
  id: string
  title: string
  tier: 1 | 2 | 3 | 4
  state: PathNodeState
  piece: string
}

const props = defineProps<{ nodes: PathNode[] }>()
const emit = defineEmits<{ open: [id: string] }>()

// Warm tier colour ramp (bright/active tiles).
const TIER_COLOR: Record<1 | 2 | 3 | 4, string> = {
  1: '#c9a27e',
  2: '#b07d52',
  3: '#8b6f5c',
  4: '#5e4327',
}
// Darker version for deco/connector tiles (flat, no elevation).
const TIER_DARK: Record<1 | 2 | 3 | 4, string> = {
  1: '#9e7f62',
  2: '#7a5630',
  3: '#5e4327',
  4: '#3c2518',
}
// 3D "base" shadow colour for active tiles.
const TIER_BASE: Record<1 | 2 | 3 | 4, string> = {
  1: '#7e5e42',
  2: '#5e3d1a',
  3: '#3e2810',
  4: '#241508',
}

// ── Geometry ──────────────────────────────────────────────────────────────────
// TILE: square side before 45° rotation.  Visual diamond diagonal = TILE × √2.
const TILE = 76         // lesson tile; visual ≈ 107 px
// STEP must be > TILE×√2 ≈ 107 px so same-column tiles don't overlap.
// STEP = 113 → same-column gap ≈ 6 px; diagonal gap ≈ 56 px.
const STEP = 113
// CONNECTOR tile: small flat dark tile placed at the midpoint between consecutive
// lesson tiles so it nearly TOUCHES both, acting as the visual bridge (no road line).
// halfDiag_LESSON + halfDiag_CONNECTOR ≈ lesson-to-connector distance → ~0 gap.
const CONN = 40         // connector square side; visual ≈ 56 px (≈ touching lesson)
const DECO_PIECE = 78   // piece image sitting on deco tile
const TOP_PAD = 52
const BOTTOM_PAD = 72

const containerRef = ref<HTMLElement | null>(null)
const W = ref(360)
let ro: ResizeObserver | null = null

onMounted(() => {
  if (containerRef.value) {
    W.value = containerRef.value.clientWidth
    ro = new ResizeObserver((e) => { W.value = e[0].contentRect.width })
    ro.observe(containerRef.value)
  }
})
onUnmounted(() => ro?.disconnect())

// Column positions: R – L = TILE×√2 + 10 ≈ 117.5 → ~10 px gap between same-row tiles.
const halfGap = computed(() => (TILE * Math.SQRT2 + 10) / 2)
const lx = computed(() => W.value / 2 - halfGap.value)
const rx = computed(() => W.value / 2 + halfGap.value)

// (No separate side-piece column; pieces sit on deco tiles instead.)

const containerHeight = computed(
  () => TOP_PAD + (props.nodes.length - 1) * STEP + BOTTOM_PAD,
)

// node[0] = first lesson → BOTTOM; last → TOP.
// Each row: lesson tile + deco tile at SAME y; lesson alternates L/R.
const layout = computed(() => {
  const H = containerHeight.value
  return props.nodes.map((node, i) => {
    const y = H - BOTTOM_PAD - i * STEP
    const lessonLeft = i % 2 === 1
    return {
      node,
      lessonX: lessonLeft ? lx.value : rx.value,
      decoX:   lessonLeft ? rx.value : lx.value,
      y,
      // Connector to NEXT lesson: midpoint between current and next.
      connX: W.value / 2,
      connY: y - STEP / 2,
    }
  })
})

function onActivate(node: PathNode): void {
  if (node.state === 'locked') return
  emit('open', node.id)
}
</script>

<template>
  <div ref="containerRef" class="path" :style="{ height: `${containerHeight}px` }">

    <template v-for="(item, idx) in layout" :key="item.node.id">

      <!-- ─── Connector tile: same bright/elevated style as lesson (bridges the path) ─── -->
      <div
        v-if="idx < layout.length - 1"
        class="tile connector"
        :style="{
          left: `${item.connX}px`,
          top: `${item.connY}px`,
          width: `${CONN}px`,
          height: `${CONN}px`,
          '--tc': TIER_COLOR[item.node.tier],
          '--base': TIER_BASE[item.node.tier],
        }"
        aria-hidden="true"
      />

      <!-- ─── Deco tile (flat dark companion) + piece sitting on it ─── -->
      <div
        class="tile deco"
        :style="{
          left: `${item.decoX}px`,
          top: `${item.y}px`,
          width: `${TILE}px`,
          height: `${TILE}px`,
          '--tc': TIER_DARK[item.node.tier],
        }"
        aria-hidden="true"
      />

      <!-- Piece image sitting ON the deco tile (shifted up so it "stands" on the tile) -->
      <img
        :src="`/pieces/${item.node.piece}.svg`"
        class="deco-piece-ext"
        draggable="false"
        :style="{
          left: `${item.decoX}px`,
          top: `${item.y - DECO_PIECE * 0.22}px`,
          width: `${DECO_PIECE}px`,
          height: `${DECO_PIECE}px`,
          opacity: item.node.state === 'locked' ? 0.20 : item.node.state === 'done' ? 0.55 : 0.82,
        }"
      />

      <!-- ─── Lesson tile (bright + 3D elevation via ::after base) ─── -->
      <button
        type="button"
        class="tile lesson"
        :class="`lesson--${item.node.state}`"
        :style="{
          left: `${item.lessonX}px`,
          top: `${item.y}px`,
          width: `${TILE}px`,
          height: `${TILE}px`,
          '--tc': TIER_COLOR[item.node.tier],
          '--base': TIER_BASE[item.node.tier],
        }"
        :disabled="item.node.state === 'locked'"
        :aria-label="
          item.node.state === 'locked'
            ? `${item.node.title}（未解鎖）`
            : item.node.state === 'done'
              ? `${item.node.title}（已完成）`
              : item.node.title
        "
        :aria-current="item.node.state === 'current' ? 'step' : undefined"
        @click="onActivate(item.node)"
      >
        <div class="tile__inner">
          <Lock v-if="item.node.state === 'locked'" class="h-5 w-5 opacity-70" />
          <img
            v-else
            :src="`/pieces/${item.node.piece}.svg`"
            class="tile__piece"
            draggable="false"
          />
          <span v-if="item.node.state === 'done'" class="tile__check">
            <Check class="h-2.5 w-2.5" :stroke-width="3.5" />
          </span>
        </div>
      </button>

    </template>

    <!-- Start label -->
    <span
      class="start-label"
      :style="{ top: `${containerHeight - BOTTOM_PAD + 18}px`, left: '50%' }"
    >起點</span>
  </div>
</template>

<style scoped>
.path {
  position: relative;
  width: 100%;
  user-select: none;
}

/* Piece image sitting on deco tile */
.deco-piece-ext {
  position: absolute;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 4; /* above deco tile, same level as lesson tile */
}

/* ── Base tile ── */
.tile {
  position: absolute;
  transform: translate(-50%, -50%) rotate(45deg);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

/* ── Connector: same bright/elevated style as lesson tiles ── */
.connector {
  background: var(--tc);
  border: 2px solid rgba(255, 255, 255, 0.26);
  /* Isometric depth: diagonal shadow suggesting elevated surface from oblique angle */
  box-shadow:
    4px 5px 0 0 var(--base),
    4px 5px 10px rgba(61, 34, 16, 0.22);
  z-index: 2;
  pointer-events: none;
}

/* ── Deco: flat dark companion at same row as lesson ── */
.deco {
  background: var(--tc);
  border: 1.5px solid rgba(255, 255, 255, 0.10);
  opacity: 0.70;
  z-index: 2;
  pointer-events: none;
}

/* ── Lesson tile ── */
.lesson {
  z-index: 3;
}
.lesson:not(.lesson--locked):hover {
  transform: translate(-50%, calc(-50% - 4px)) rotate(45deg);
  z-index: 4;
}
.lesson:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px #faf6f0, 0 0 0 6px var(--tc);
}

/* ── Inner (counter-rotate content to stay upright) ── */
.tile__inner {
  width: 100%;
  height: 100%;
  transform: rotate(-45deg);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  color: #fcf9f3;
}

.tile__piece {
  width: 56%;
  height: 56%;
  pointer-events: none;
}
.deco-piece { opacity: 0.45; }

/* Done check badge (bottom tip of diamond) */
.tile__check {
  position: absolute;
  bottom: -7px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 20px;
  border-radius: 9999px;
  background: #4a7c59;
  color: #fcf9f3;
  border: 2px solid #faf6f0;
  display: grid;
  place-items: center;
  z-index: 5;
}

/* ── Lesson states ── */

/* Locked: flat cream, no elevation */
.lesson--locked {
  background: #e8dfd0;
  border: 1px solid #d3c9b6;
  color: #a88c76;
  cursor: not-allowed;
  box-shadow: none;
}

/* Done: tier colour, isometric elevation, slightly muted */
.lesson--done {
  background: var(--tc);
  border: 2px solid rgba(255, 255, 255, 0.22);
  opacity: 0.88;
  /* Isometric oblique shadow: diagonal (right+down) suggests depth from angled viewpoint */
  box-shadow:
    6px 8px 0 0 var(--base),
    6px 8px 14px rgba(61, 34, 16, 0.20),
    inset -2px -2px 5px rgba(0, 0, 0, 0.10),
    inset 2px 2px 5px rgba(255, 255, 255, 0.12);
}

/* Unlocked: full isometric elevation */
.lesson--unlocked {
  background: var(--tc);
  border: 2px solid rgba(255, 255, 255, 0.30);
  box-shadow:
    6px 8px 0 0 var(--base),
    6px 8px 16px rgba(61, 34, 16, 0.24),
    inset -2px -2px 5px rgba(0, 0, 0, 0.10),
    inset 2px 2px 5px rgba(255, 255, 255, 0.14);
}

/* Current: strongest elevation + pulse glow */
.lesson--current {
  background: var(--tc);
  border: 2px solid rgba(255, 255, 255, 0.34);
  box-shadow:
    6px 8px 0 0 var(--base),
    6px 8px 16px rgba(61, 34, 16, 0.24),
    inset -2px -2px 5px rgba(0, 0, 0, 0.10),
    inset 2px 2px 5px rgba(255, 255, 255, 0.16);
  animation: dpulse 2.4s ease-in-out infinite;
}

@keyframes dpulse {
  0%, 100% {
    box-shadow:
      6px 8px 0 0 var(--base),
      0 0 0 4px rgba(139, 111, 92, 0.18),
      6px 8px 16px rgba(61, 34, 16, 0.22),
      inset -2px -2px 5px rgba(0, 0, 0, 0.10),
      inset 2px 2px 5px rgba(255, 255, 255, 0.16);
  }
  50% {
    box-shadow:
      6px 8px 0 0 var(--base),
      0 0 0 10px rgba(139, 111, 92, 0.28),
      6px 8px 20px rgba(61, 34, 16, 0.28),
      inset -2px -2px 5px rgba(0, 0, 0, 0.10),
      inset 2px 2px 5px rgba(255, 255, 255, 0.16);
  }
}

@media (prefers-reduced-motion: reduce) {
  .lesson--current { animation: none; }
  .lesson:not(.lesson--locked):hover {
    transform: translate(-50%, -50%) rotate(45deg);
  }
}

.start-label {
  position: absolute;
  transform: translateX(-50%);
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #a88c76;
  z-index: 2;
}
</style>
