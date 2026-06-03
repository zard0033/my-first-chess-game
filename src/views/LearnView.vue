<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { lessons } from '@/data/lessons'
import { LESSON_TIER_LABELS, COACH } from '@/types/lesson'
import type { LessonTier } from '@/types/lesson'
import { useLessonProgressStore } from '@/stores/lesson-progress'
import { onMounted } from 'vue'
import LearnPath, { type PathNode } from '@/components/learn-path.vue'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

const router = useRouter()
const progress = useLessonProgressStore()

// Scroll to the current (or first unlocked) lesson tile on mount so the user
// sees their progress position rather than the advanced locked lessons at top.
onMounted(() => {
  // Use a short delay so the absolutely-positioned path tiles have rendered.
  setTimeout(() => {
    const el =
      document.querySelector<HTMLElement>('[aria-current="step"]') ??
      document.querySelector<HTMLElement>('.path button:not([disabled])')
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' })
  }, 60)
})

const TIER_PIECE: Record<LessonTier, string> = { 1: 'wP', 2: 'wN', 3: 'wR', 4: 'wK' }

const nextLesson = computed(() =>
  [...lessons].find((l) => progress.isUnlocked(l) && !progress.isCompleted(l.id)) ?? null,
)

// Lessons are pre-sorted by order — first = top of the path, last = bottom.
const pathNodes = computed<PathNode[]>(() =>
  lessons.map((l) => ({
    id: l.id,
    title: l.title,
    tier: l.tier,
    order: l.order,
    isCapstone: l.id.includes('capstone'),
    piece: TIER_PIECE[l.tier],
    state: progress.isCompleted(l.id)
      ? 'done'
      : l.id === nextLesson.value?.id
        ? 'current'
        : progress.isUnlocked(l)
          ? 'unlocked'
          : 'locked',
  })),
)

function onOpen(lessonId: string): void {
  router.push(`/learn/${lessonId}`)
}
</script>

<template>
  <div class="learn-page">
  <div class="mx-auto max-w-sm px-4 pb-16 pt-6">
    <!-- Header: progress + resume -->
    <Card class="mb-6 p-5">
      <p class="mb-1 text-xs font-medium uppercase tracking-wider text-ink-faint">教練 · {{ COACH.name }}</p>
      <div class="flex items-end justify-between gap-4">
        <h1 class="font-display text-2xl font-bold text-ink" tabindex="-1">學習地圖</h1>
        <span class="shrink-0 text-sm font-semibold tabular-nums text-ink-muted">{{ progress.completedCount }} / {{ progress.totalCount }}</span>
      </div>
      <Progress :model-value="progress.progress * 100" class="mt-3" />
      <RouterLink
        v-if="nextLesson"
        :to="`/learn/${nextLesson.id}`"
        class="-mx-1 mt-4 flex items-center gap-3 rounded-card px-3 py-2.5 transition-colors hover:bg-surface-hover"
      >
        <span class="grid h-10 w-10 shrink-0 place-items-center rounded-card bg-primary/10">
          <img :src="`/pieces/${TIER_PIECE[nextLesson.tier]}.svg`" alt="" class="h-6 w-6" draggable="false" />
        </span>
        <span class="min-w-0 flex-1">
          <span class="block text-[11px] font-medium uppercase tracking-wider text-ink-faint">下一課 · {{ LESSON_TIER_LABELS[nextLesson.tier] }}</span>
          <span class="block truncate font-semibold text-ink">{{ nextLesson.title }}</span>
          <span class="block truncate text-xs text-ink-muted">{{ nextLesson.summary }}</span>
        </span>
        <span class="inline-flex h-9 shrink-0 items-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-fg">繼續</span>
      </RouterLink>
    </Card>

    <!-- Serpentine learning path (chess.com / Duolingo style) -->
    <LearnPath :nodes="pathNodes" @open="onOpen" />
  </div>
  </div>
</template>

<style scoped>
/* Full-page chess-map parchment backdrop — sits behind ALL page content so
   the path area and surrounding regions share the same texture (no visible seam). */
.learn-page {
  min-height: 100vh;
  position: relative;
}
.learn-page::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  background-image: url('/learn/bg.png');
  background-size: 420px auto;
  background-repeat: repeat;
  opacity: 0.2;
  pointer-events: none;
}
</style>
