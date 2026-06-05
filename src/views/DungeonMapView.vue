<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Check, Lock, Shield, ArrowRight } from 'lucide-vue-next'
import { puzzles } from '@/data/puzzles'
import { useDungeonProgressStore } from '@/stores/dungeon-progress'
import { useReducedMotion } from '@/composables/use-reduced-motion'

const router = useRouter()
const progress = useDungeonProgressStore()
const { prefersReducedMotion } = useReducedMotion()

const DIAMOND = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
const W = 320
const ROW_H = 92
const PAD_Y = 40

// Lay the track out bottom-to-top (order 1 at the bottom), zig-zagging left/right.
const nodes = computed(() => {
  const n = puzzles.length
  return puzzles.map((p, i) => {
    const fromBottom = i // puzzles are sorted by order ascending
    const y = PAD_Y + (n - 1 - fromBottom) * ROW_H
    const x = i % 2 === 0 ? W * 0.32 : W * 0.68
    return { puzzle: p, x, y, state: progress.nodeState(p) }
  })
})

const mapHeight = computed(() => PAD_Y * 2 + (puzzles.length - 1) * ROW_H)

// Dashed connector path through node centres (top → bottom).
const linePath = computed(() =>
  nodes.value
    .slice()
    .reverse()
    .map((nd, i) => `${i === 0 ? 'M' : 'L'} ${nd.x} ${nd.y}`)
    .join(' '),
)

function enter(node: { puzzle: { id: string }; state: string }): void {
  if (node.state === 'locked') return
  router.push(`/dungeon/${node.puzzle.id}`)
}
</script>

<template>
  <div class="min-h-dvh bg-[#070909] pb-24 lg:pb-8">
    <!-- Header -->
    <header class="flex items-center gap-2.5 border-b border-white/[0.05] px-4 py-3.5">
      <span
        class="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-gold/10 text-gold ring-1 ring-gold/20"
        aria-hidden="true"
      ><Shield :size="15" :stroke-width="1.8" /></span>
      <div class="flex-1">
        <p class="font-sans text-[9px] font-bold uppercase tracking-[0.12em] text-gold/60">試煉道場</p>
        <h1 class="font-num text-[11px] text-ink-on-deep-dim" tabindex="-1">選擇試煉關卡</h1>
      </div>
      <!-- 平靜進度（無 streak / timer / leaderboard） -->
      <div class="rounded-full bg-white/[0.06] px-3 py-1 font-num text-xs font-bold text-ink-on-deep-dim">
        {{ progress.solvedCount }}/{{ progress.totalCount }}
      </div>
    </header>

    <!-- Empty state -->
    <div v-if="puzzles.length === 0" class="px-6 py-20 text-center">
      <p class="font-display text-lg text-ink-on-deep">謎題即將加入</p>
      <p class="mt-2 font-sans text-sm text-ink-on-deep-dim">敬請期待新的試煉關卡。</p>
    </div>

    <!-- Map -->
    <div v-else class="relative mx-auto" :style="{ width: `${W}px`, height: `${mapHeight}px` }">
      <svg :width="W" :height="mapHeight" class="absolute inset-0 overflow-visible">
        <path :d="linePath" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="2" stroke-dasharray="3 11" stroke-linecap="round" />
      </svg>

      <template v-for="node in nodes" :key="node.puzzle.id">
        <!-- Breathe ring (current only) -->
        <div
          v-if="node.state === 'current' && !prefersReducedMotion"
          class="dungeon-breathe absolute"
          :style="{ left: `${node.x - 34}px`, top: `${node.y - 34}px`, width: '68px', height: '68px', clipPath: DIAMOND, background: '#f8b500' }"
        />

        <!-- Node face -->
        <button
          type="button"
          :disabled="node.state === 'locked'"
          :aria-label="`${node.puzzle.title}（${node.state === 'done' ? '已完成' : node.state === 'current' ? '進行中' : '未解鎖'}）`"
          class="absolute flex items-center justify-center transition-transform active:scale-95"
          :style="{
            left: `${node.x - (node.state === 'current' ? 30 : 26)}px`,
            top: `${node.y - (node.state === 'current' ? 30 : 26)}px`,
            width: `${(node.state === 'current' ? 30 : 26) * 2}px`,
            height: `${(node.state === 'current' ? 30 : 26) * 2}px`,
            clipPath: DIAMOND,
            cursor: node.state === 'locked' ? 'default' : 'pointer',
            background:
              node.state === 'done' ? 'linear-gradient(150deg,#D49028,#8A5810)'
              : node.state === 'current' ? 'linear-gradient(150deg,#FFC94D,#F8B500,#C87820)'
              : 'linear-gradient(150deg,#1A1C1A,#0E100E)',
            opacity: node.state === 'locked' ? 0.55 : 1,
          }"
          @click="enter(node)"
        >
          <Check v-if="node.state === 'done'" :size="15" :stroke-width="2.8" class="text-[#fff4dc]" />
          <span v-else-if="node.state === 'current'" class="font-num text-[13px] font-bold leading-none text-[#1A0800]">{{ node.puzzle.order }}</span>
          <Lock v-else :size="12" :stroke-width="2" class="text-white/25" />
        </button>

        <!-- CTA bubble (current) -->
        <button
          v-if="node.state === 'current'"
          type="button"
          class="absolute z-10 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-gradient-to-b from-gold-light to-gold px-3 py-1.5 font-sans text-[11px] font-bold text-gold-ink shadow-[0_2px_12px_rgba(248,181,0,0.5)] active:scale-95"
          :style="{ left: `${node.x}px`, top: `${node.y - 64}px` }"
          @click="enter(node)"
        >
          進入試煉 <ArrowRight :size="12" />
        </button>

        <!-- Label -->
        <div
          class="absolute whitespace-nowrap"
          :style="node.x <= W / 2
            ? { left: `${node.x + 36}px`, top: `${node.y - 11}px` }
            : { right: `${W - node.x + 36}px`, top: `${node.y - 11}px`, textAlign: 'right' }"
        >
          <p class="font-sans text-[9px] text-white/30">Level {{ node.puzzle.level }}</p>
          <p
            class="font-sans text-[11px]"
            :class="node.state === 'current' ? 'font-bold text-gold/90' : node.state === 'done' ? 'text-[#c8a050]/80' : 'text-white/25'"
          >{{ node.puzzle.title }}</p>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
@keyframes dungeon-breathe {
  0%, 100% { opacity: 0.18; transform: scale(0.92); }
  50%      { opacity: 0.5; transform: scale(1.06); }
}
.dungeon-breathe {
  animation: dungeon-breathe 2.4s ease-in-out infinite;
}
</style>
