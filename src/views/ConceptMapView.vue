<script setup lang="ts">
/**
 * Concept Map (Learning Loop #20). Two jobs, additive (GDD §3.5 + quick-spec concept-tab-tactic-entry):
 *  1. A calm REFLECTION of which tactics you've met (已學) and drilled (已練) — no score, no ranking,
 *     un-started tactics kept visually quiet, never「未達成」.
 *  2. A by-tactic LEARNING ENTRY: tapping any tactic opens its lesson via the Concept side-door
 *     (`?from=concept`), so a non-beginner can jump straight to a tactic even if it's linearly locked.
 *     The side-door lights 已學 through a separate signal and never advances linear progress (D1 pattern).
 *
 * No practice (試煉) entry lives here on purpose: one tactic maps to many puzzles, so there is no single
 * right target. Practice stays in the lesson-completion Bridge-1 invitation and the Dungeon.
 */
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronRight, Compass } from 'lucide-vue-next'
import { DarkPanel } from '@/components/ui/gambit'
import { concepts, getConceptById } from '@/data/concepts'
import type { ChessConcept } from '@/types/concept'
import { learned, practiced } from '@/modules/learning-loop/mastery'
import { puzzles } from '@/data/puzzles'
import { useLessonProgressStore } from '@/stores/lesson-progress'
import { useDungeonProgressStore } from '@/stores/dungeon-progress'
import { useConceptProgressStore } from '@/stores/concept-progress'

const router = useRouter()
const lessonProgress = useLessonProgressStore()
const dungeonProgress = useDungeonProgressStore()
const conceptProgress = useConceptProgressStore()

// Presentational only (not domain data): the silhouette + one-line blurb per concept.
const CONCEPT_PIECE: Record<ChessConcept, string> = {
  material: 'bQ', fork: 'bN', pin: 'bB', mate: 'bK',
  skewer: 'bR', discovered: 'bB', defense: 'bP', center: 'bN',
}
const CONCEPT_BLURB: Record<ChessConcept, string> = {
  material: '沒被保護的子',
  fork: '一次攻兩個子',
  pin: '釘住對方的子',
  mate: '把國王將死',
  skewer: '前子讓開吃後子',
  discovered: '移開子露出攻擊',
  defense: '讓子互相保護',
  center: '佔住棋盤中央',
}

// A puzzle counts as drilled whether cleared in the dungeon or practised from a lesson (GDD §4.2).
function isSolved(id: string): boolean {
  return dungeonProgress.isSolved(id) || conceptProgress.isPracticeSolved(id)
}

interface ConceptVM {
  id: ChessConcept
  label: string
  blurb: string
  piece: string
  lit: boolean
  isLearned: boolean
  isPracticed: boolean
  lessonId: string | undefined
}

const allVM = computed<ConceptVM[]>(() =>
  concepts.map((c) => {
    // 已學 reads the union of linear completion AND Concept-tab side-door learns (store.isLearned).
    const isLearned = learned(c.id, (id) => lessonProgress.isLearned(id))
    const isPracticed = practiced(c.id, puzzles, isSolved)
    return {
      id: c.id,
      label: c.label,
      blurb: CONCEPT_BLURB[c.id],
      piece: CONCEPT_PIECE[c.id],
      lit: isLearned || isPracticed,
      isLearned,
      isPracticed,
      lessonId: getConceptById(c.id)?.teaches[0],
    }
  }),
)

const litConcepts = computed(() => allVM.value.filter((v) => v.lit))
const dormantConcepts = computed(() => allVM.value.filter((v) => !v.lit))

// Banner progress (calm reflection, not a score): how many tactics you've met so far.
const familiarCount = computed(() => litConcepts.value.length)
const totalConcepts = computed(() => allVM.value.length)

// Tap-to-learn: open the tactic's lesson via the Concept side-door (bypasses the linear lock).
function learnConcept(v: ConceptVM): void {
  if (v.lessonId) router.push(`/learn/${v.lessonId}?from=concept`)
}

const base = import.meta.env.BASE_URL
const maskStyle = (piece: string) => ({
  WebkitMaskImage: `url(${base}pieces/silhouette/${piece}.svg)`,
  maskImage: `url(${base}pieces/silhouette/${piece}.svg)`,
})
</script>

<template>
  <div class="mx-auto max-w-md lg:max-w-3xl pb-8">
    <header class="px-[14px] pt-4">
      <h1 class="sr-only" tabindex="-1">概念地圖</h1>
      <!-- 與課程章節牌卡共用視覺語言：錢幣徽章 + kicker + 進度 + 漸層進度條 -->
      <div class="overflow-hidden rounded-[14px] shadow-[0_6px_20px_rgba(10,30,24,0.28)]">
        <DarkPanel no-pad>
          <div class="px-3.5 pb-3 pt-3.5">
            <div class="mb-2.5 flex items-center gap-2.5">
              <span
                class="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-card shadow-[0_0_0_2.5px_#f8b500,0_4px_14px_rgba(61,34,16,0.16),inset_0_1px_0_rgba(255,255,255,0.9)]"
              >
                <Compass :size="20" :stroke-width="1.8" class="text-primary" aria-hidden="true" />
              </span>
              <div class="min-w-0 flex-1">
                <p class="mb-0.5 font-sans text-[10px] font-bold uppercase tracking-[0.1em] text-gold">
                  戰術熟悉度
                </p>
                <p class="font-display text-[15px] font-bold leading-tight text-ink-on-deep">概念地圖</p>
                <p class="mt-0.5 font-sans text-[10px] text-ink-on-deep-dim">點任一戰術即可開始學習</p>
              </div>
              <span class="shrink-0 font-num text-[11px] text-ink-on-deep-dim">
                {{ familiarCount }}/{{ totalConcepts }}
              </span>
            </div>
            <div class="h-[3px] overflow-hidden rounded-full bg-white/[0.12]">
              <div
                class="h-full rounded-full bg-[linear-gradient(90deg,#3AB894,#F8B500)] transition-[width] duration-300 motion-reduce:transition-none"
                :style="{ width: `${totalConcepts ? (familiarCount / totalConcepts) * 100 : 0}%` }"
              />
            </div>
          </div>
        </DarkPanel>
      </div>
    </header>

    <!-- Familiar tactics — learned and/or practised -->
    <template v-if="litConcepts.length">
      <p class="px-[18px] pb-2 pt-4 font-sans text-[11px] font-bold tracking-[0.1em] text-primary">你熟悉的概念</p>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-2.5 px-[14px]">
        <button
          v-for="v in litConcepts"
          :key="v.id"
          type="button"
          data-testid="concept-tile-lit"
          class="glass-panel relative flex min-h-[112px] flex-col gap-2.5 overflow-hidden rounded-2xl p-3 text-left transition-colors hover:bg-white/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          :aria-label="`學習「${v.label}」`"
          @click="learnConcept(v)"
        >
          <span
            class="pointer-events-none absolute -right-3 -top-2.5 block h-16 w-16 bg-primary opacity-[0.09]"
            aria-hidden="true"
            :style="{ ...maskStyle(v.piece), WebkitMaskRepeat:'no-repeat', maskRepeat:'no-repeat', WebkitMaskPosition:'center', maskPosition:'center', WebkitMaskSize:'contain', maskSize:'contain' }"
          />
          <div class="relative z-[1] flex items-center gap-2.5">
            <span class="coin">
              <span class="block h-5 w-5 bg-primary" aria-hidden="true"
                :style="{ ...maskStyle(v.piece), WebkitMaskRepeat:'no-repeat', maskRepeat:'no-repeat', WebkitMaskPosition:'center', maskPosition:'center', WebkitMaskSize:'contain', maskSize:'contain' }" />
            </span>
            <div class="min-w-0">
              <div class="font-display text-base font-bold leading-tight text-ink">{{ v.label }}</div>
              <div class="mt-0.5 font-sans text-[10px] text-ink-faint">{{ v.blurb }}</div>
            </div>
          </div>

          <!-- Achievement chips: shown ONLY when earned (no empty placeholder dots → no checklist read) -->
          <div class="relative z-[1] mt-auto flex flex-row flex-wrap items-center gap-x-3 gap-y-1">
            <span v-if="v.isLearned" class="state state-learned"><span class="dot" />已學</span>
            <span v-if="v.isPracticed" class="state state-practiced"><span class="dot" />已練</span>
          </div>
        </button>
      </div>
    </template>

    <!-- Other tactics — quiet, never「未達成」, but still tappable to learn early (side-door) -->
    <template v-if="dormantConcepts.length">
      <p
        v-if="litConcepts.length"
        class="px-[18px] pb-2 pt-5 font-sans text-[11px] font-bold tracking-[0.1em] text-ink-faint"
      >其他戰術</p>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-2.5 px-[14px]" :class="litConcepts.length ? '' : 'pt-4'">
        <button
          v-for="v in dormantConcepts"
          :key="v.id"
          type="button"
          data-testid="concept-tile-dormant"
          class="glass-panel flex min-h-[104px] flex-col gap-2.5 rounded-2xl p-3 text-left transition-colors hover:bg-white/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          :aria-label="`學習「${v.label}」`"
          @click="learnConcept(v)"
        >
          <div class="flex items-center gap-2.5">
            <span class="coin coin-dim">
              <span class="block h-5 w-5 bg-ink-faint" aria-hidden="true"
                :style="{ ...maskStyle(v.piece), WebkitMaskRepeat:'no-repeat', maskRepeat:'no-repeat', WebkitMaskPosition:'center', maskPosition:'center', WebkitMaskSize:'contain', maskSize:'contain' }" />
            </span>
            <div class="min-w-0">
              <div class="font-display text-base font-bold leading-tight text-ink-muted">{{ v.label }}</div>
              <div class="mt-0.5 font-sans text-[10px] text-ink-faint">{{ v.blurb }}</div>
            </div>
          </div>
          <!-- Quiet directional cue: signals "tap to learn" without shouting -->
          <span class="mt-auto inline-flex items-center gap-0.5 self-start font-sans text-[11px] text-ink-faint">
            去學<ChevronRight :size="12" :stroke-width="2" />
          </span>
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.coin {
  position: relative; display: flex; height: 38px; width: 38px; flex: none;
  align-items: center; justify-content: center; border-radius: 9999px;
  background: #fcf9f3;
  box-shadow: 0 0 0 2px #f8b500, 0 3px 10px rgba(61, 34, 16, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.9);
}
.coin-dim {
  background: #f4ead8;
  box-shadow: 0 0 0 2px #e0d3bd, inset 0 1px 0 rgba(255, 255, 255, 0.7);
}
.state { display: inline-flex; align-items: center; gap: 7px; font-weight: 700; font-size: 12px; }
.state .dot { display: block; height: 9px; width: 9px; flex: none; border-radius: 9999px; }
.state-learned { color: #155747; }
.state-learned .dot { background: #3ab894; box-shadow: 0 0 0 3px rgba(58, 184, 148, 0.22), 0 0 8px rgba(58, 184, 148, 0.5); }
.state-practiced { color: #8f6200; }
.state-practiced .dot { background: #f8b500; box-shadow: 0 0 0 3px rgba(248, 181, 0, 0.22), 0 0 9px rgba(248, 181, 0, 0.6); }
@media (prefers-reduced-motion: reduce) {
  .state .dot { box-shadow: none; }
}
</style>
