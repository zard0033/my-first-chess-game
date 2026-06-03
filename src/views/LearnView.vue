<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { lessons } from '@/data/lessons'
import { LESSON_TIER_LABELS, COACH } from '@/types/lesson'
import type { LessonTier } from '@/types/lesson'
import { useLessonProgressStore } from '@/stores/lesson-progress'
import LearnBoard, { type BoardTile } from '@/components/learn-board.vue'

const router = useRouter()
const progress = useLessonProgressStore()

const TIER_PIECE: Record<LessonTier, string> = { 1: 'wP', 2: 'wN', 3: 'wR', 4: 'wK' }

const trail = computed(() => [...lessons].reverse())
const nextLesson = computed(() =>
  [...lessons].find((l) => progress.isUnlocked(l) && !progress.isCompleted(l.id)) ?? null,
)

// 3-column isometric quilt
const HX = 46
const HY = 26
const PATHI = [0, 1, 0, -1]
const PAD = 38

// Fill the whole iso lattice (cells where a+b is even) so tiles touch edge-to-edge into
// one continuous quilt. Lessons walk the centre path; every other cell is a filler tile
// (outer ones carry a decorative piece), so there are no gaps — chess.com style.
const board = computed<{ tiles: BoardTile[]; height: number }>(() => {
  const tiles: BoardTile[] = []
  const tr = trail.value
  const N = tr.length
  for (let b = 0; b < N; b++) {
    const lesson = tr[b]
    const pathA = PATHI[b % 4]
    for (let a = -1; a <= 1; a++) {
      if (((a + b) & 1) !== 0) continue // cell exists only where (a+b) is even
      const x = a * HX
      const y = PAD + b * HY
      if (a === pathA) {
        const state = progress.isCompleted(lesson.id)
          ? 'done'
          : lesson.id === nextLesson.value?.id
            ? 'current'
            : progress.isUnlocked(lesson)
              ? 'unlocked'
              : 'locked'
        tiles.push({ key: lesson.id, kind: 'lesson', x, y, state, lessonId: lesson.id })
      } else {
        tiles.push({ key: `d-${a}-${b}`, kind: 'deco', x, y, shade: (((a + b) / 2) & 1) as 0 | 1 })
      }
    }
  }
  const height = PAD + (N - 1) * HY + 54 / 2 + 14 + 28
  return { tiles, height }
})

function onOpen(lessonId: string): void {
  router.push(`/learn/${lessonId}`)
}
</script>

<template>
  <div class="max-w-sm mx-auto px-4 pt-6 pb-16">
    <!-- Header: progress + resume -->
    <header class="card p-5 mb-6">
      <p class="text-xs font-medium uppercase tracking-wider text-ink-faint mb-1">教練 · {{ COACH.name }}</p>
      <div class="flex items-end justify-between gap-4">
        <h1 class="font-display font-bold text-2xl text-ink" tabindex="-1">學習地圖</h1>
        <span class="text-sm font-semibold text-ink-muted tabular-nums shrink-0">{{ progress.completedCount }} / {{ progress.totalCount }}</span>
      </div>
      <div class="mt-3 h-2 bg-surface-hover rounded-full overflow-hidden">
        <div class="h-full bg-primary rounded-full transition-[width] duration-500" :style="{ width: `${progress.progress * 100}%` }" />
      </div>
      <RouterLink
        v-if="nextLesson"
        :to="`/learn/${nextLesson.id}`"
        class="mt-4 flex items-center gap-3 -mx-1 px-3 py-2.5 rounded-card hover:bg-surface-hover transition-colors"
      >
        <span class="shrink-0 w-10 h-10 rounded-card bg-primary/10 grid place-items-center">
          <img :src="`/pieces/${TIER_PIECE[nextLesson.tier]}.svg`" alt="" class="w-6 h-6" draggable="false" />
        </span>
        <span class="min-w-0 flex-1">
          <span class="block text-[11px] font-medium uppercase tracking-wider text-ink-faint">下一課 · {{ LESSON_TIER_LABELS[nextLesson.tier] }}</span>
          <span class="block font-semibold text-ink truncate">{{ nextLesson.title }}</span>
          <span class="block text-xs text-ink-muted truncate">{{ nextLesson.summary }}</span>
        </span>
        <span class="shrink-0 inline-flex items-center h-9 px-4 rounded-full bg-primary text-primary-fg text-sm font-semibold">繼續</span>
      </RouterLink>
    </header>

    <!-- Pixi isometric board — sits directly on the page, no box -->
    <LearnBoard :tiles="board.tiles" :height="board.height" @open="onOpen" />
    <p class="text-center mt-2 text-xs font-medium tracking-wider uppercase text-ink-faint">起點</p>
  </div>
</template>
