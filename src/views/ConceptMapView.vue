<script setup lang="ts">
/**
 * Concept Map (Learning Loop #20, Phase B — GDD §3.5). The loop's calm navigation hub: it shows
 * which concepts you've met (課程) and drilled (試煉), replacing the score-chasing loops rivals use.
 *
 * Calm rules (GDD §3.5, enforced by gambit-compliance.test): two boolean states only (課程 dot /
 * 試煉 dot); none of the competitive-progress mechanics and no「X/8」framing; un-started concepts
 * are kept visually quiet under a「之後會遇到」zone — never rendered as「未達成」/locked; lesson-only
 * concepts (no drill puzzles) surface as 課程-only and never half-lit. The Map is also a navigation
 * hub — a lit tile links to its teaching lesson, and its practice CTA deep-links into practice mode.
 */
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronRight } from 'lucide-vue-next'
import LearnTabs from '@/components/learn-tabs.vue'
import { concepts, getConceptById, conceptToMotifs } from '@/data/concepts'
import type { ChessConcept } from '@/types/concept'
import { learned, practiced } from '@/modules/learning-loop/mastery'
import { practiceTarget } from '@/modules/learning-loop/recommend'
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
  material: '得失與無保護的子',
  fork: '一子攻兩子',
  pin: '釘住不能動的子',
  mate: '基本殺王與底線',
  skewer: '逼開前子吃後子',
  discovered: '移子讓後方發動',
  defense: '讓子彼此撐腰',
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
  hasPuzzles: boolean
  lessonId: string | undefined
  practiceTargetId: string | null
}

const allVM = computed<ConceptVM[]>(() =>
  concepts.map((c) => {
    const isLearned = learned(c.id, (id) => lessonProgress.isCompleted(id))
    const isPracticed = practiced(c.id, puzzles, isSolved)
    const hasPuzzles = conceptToMotifs(c.id).length > 0
    const target = hasPuzzles ? practiceTarget(c.id, puzzles, isSolved) : null
    return {
      id: c.id,
      label: c.label,
      blurb: CONCEPT_BLURB[c.id],
      piece: CONCEPT_PIECE[c.id],
      lit: isLearned || isPracticed,
      isLearned,
      isPracticed,
      hasPuzzles,
      lessonId: getConceptById(c.id)?.teaches[0],
      practiceTargetId: target?.id ?? null,
    }
  }),
)

const litConcepts = computed(() => allVM.value.filter((v) => v.lit))
const dormantConcepts = computed(() => allVM.value.filter((v) => !v.lit))

function reviewLesson(v: ConceptVM): void {
  if (v.lessonId) router.push(`/learn/${v.lessonId}`)
}

function practise(v: ConceptVM): void {
  if (v.practiceTargetId) router.push(`/dungeon/${v.practiceTargetId}?from=lesson`)
}

const maskStyle = (piece: string) => ({
  WebkitMaskImage: `url(/pieces/${piece}.svg)`,
  maskImage: `url(/pieces/${piece}.svg)`,
})
</script>

<template>
  <div class="mx-auto max-w-md pb-8">
    <div class="px-[18px] pt-5">
      <p class="mb-2.5 font-sans text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">學習迴圈</p>
      <LearnTabs />
    </div>

    <header class="px-[18px] pt-3.5">
      <h1 class="font-display text-2xl font-bold text-ink" tabindex="-1">概念地圖</h1>
      <p class="mt-1.5 font-lesson text-sm leading-relaxed text-ink-muted">
        這些是你已經熟悉的棋藝概念。沒有分數、沒有排名——只是你和這些圖案越來越熟的軌跡。
      </p>
    </header>

    <!-- Lit concepts -->
    <template v-if="litConcepts.length">
      <p class="px-[18px] pb-2 pt-4 font-sans text-[11px] font-bold tracking-[0.1em] text-primary">你已點亮的概念</p>
      <div class="grid grid-cols-2 gap-2.5 px-[14px]">
        <div
          v-for="v in litConcepts"
          :key="v.id"
          data-testid="concept-tile-lit"
          class="relative flex min-h-[118px] flex-col gap-2.5 overflow-hidden rounded-2xl border border-line-subtle bg-surface-card p-3 shadow-card"
        >
          <!-- Stretched primary link: review the concept's lesson. Sits behind the content so the
               whole tile is one tap target without nesting an interactive inside an interactive. -->
          <button
            type="button"
            class="absolute inset-0 z-0 rounded-2xl transition-colors hover:bg-surface-hover"
            :aria-label="`複習「${v.label}」`"
            @click="reviewLesson(v)"
          />
          <span
            class="pointer-events-none absolute -right-3 -top-2.5 z-0 block h-16 w-16 bg-primary opacity-[0.09]"
            aria-hidden="true"
            :style="{ ...maskStyle(v.piece), WebkitMaskRepeat:'no-repeat', maskRepeat:'no-repeat', WebkitMaskPosition:'center', maskPosition:'center', WebkitMaskSize:'contain', maskSize:'contain' }"
          />
          <div class="pointer-events-none relative z-[1] flex items-center gap-2.5">
            <span class="coin">
              <span class="block h-5 w-5 bg-primary" aria-hidden="true"
                :style="{ ...maskStyle(v.piece), WebkitMaskRepeat:'no-repeat', maskRepeat:'no-repeat', WebkitMaskPosition:'center', maskPosition:'center', WebkitMaskSize:'contain', maskSize:'contain' }" />
            </span>
            <div class="min-w-0">
              <div class="font-display text-base font-bold leading-tight text-ink">{{ v.label }}</div>
              <div class="mt-0.5 font-sans text-[10px] text-ink-faint">{{ v.blurb }}</div>
            </div>
          </div>

          <div class="relative z-[1] mt-auto flex flex-col gap-1.5">
            <span v-if="v.isLearned" class="state state-learned pointer-events-none"><span class="dot" />課程</span>
            <span v-if="v.isPracticed" class="state state-practiced pointer-events-none"><span class="dot" />試煉</span>
            <button
              v-if="v.isLearned && !v.isPracticed && v.practiceTargetId"
              type="button"
              data-testid="concept-practise-cta"
              class="inline-flex min-h-[44px] items-center gap-0.5 self-start font-sans text-xs font-bold text-primary"
              @click="practise(v)"
            >去試煉<ChevronRight :size="13" :stroke-width="2" /></button>
          </div>
        </div>
      </div>
    </template>

    <p v-else class="px-[18px] pt-5 font-lesson text-sm text-ink-muted">完成第一課，這裡就會開始點亮。</p>

    <!-- Dormant concepts — quiet, informational, never「未達成」 -->
    <template v-if="dormantConcepts.length">
      <p class="px-[18px] pb-2 pt-5 font-sans text-[11px] font-bold tracking-[0.1em] text-ink-faint">之後的課程會帶你認識</p>
      <div class="grid grid-cols-2 gap-2.5 px-[14px]">
        <div
          v-for="v in dormantConcepts"
          :key="v.id"
          data-testid="concept-tile-dormant"
          class="flex min-h-[110px] flex-col gap-2.5 rounded-2xl border border-line-subtle bg-surface-card p-3"
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
          <p class="mt-auto font-sans text-[10.5px] text-ink-faint">學了這一課就會點亮</p>
        </div>
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
