<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { lessons } from '@/data/lessons'
import { LESSON_TIERS, LESSON_TIER_LABELS, COACH } from '@/types/lesson'
import type { Lesson, LessonTier } from '@/types/lesson'
import { useLessonProgressStore } from '@/stores/lesson-progress'

const router = useRouter()
const progress = useLessonProgressStore()

const DIFFICULTY_LABELS: Record<Lesson['difficulty'], string> = {
  beginner: '入門',
  intermediate: '進階',
  advanced: '高階',
}

// Tiers that actually have lessons in the catalog, in ascending order.
const tiers = computed<LessonTier[]>(() => {
  const present = new Set(lessons.map((l) => l.tier))
  return (Object.values(LESSON_TIERS) as LessonTier[])
    .filter((t, i, arr) => arr.indexOf(t) === i && present.has(t))
    .sort((a, b) => a - b)
})

function lessonsInTier(tier: LessonTier): Lesson[] {
  return lessons.filter((l) => l.tier === tier)
}

function open(lesson: Lesson): void {
  if (!progress.isUnlocked(lesson)) return
  router.push(`/learn/${lesson.id}`)
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-8">
    <!-- Progress banner -->
    <header class="card p-6 mb-10">
      <p class="text-xs font-medium uppercase tracking-wider text-ink-faint mb-1">教練 · {{ COACH.name }}</p>
      <h1 class="font-display font-semibold text-2xl text-ink mb-4" tabindex="-1">課程</h1>
      <div class="flex items-center gap-4">
        <div class="flex-1 h-1.5 bg-surface-hover rounded-full overflow-hidden">
          <div
            class="h-full bg-primary rounded-full transition-[width] duration-500"
            :style="{ width: `${progress.progress * 100}%` }"
          />
        </div>
        <span class="text-sm font-medium text-ink-muted tabular-nums shrink-0">
          {{ progress.completedCount }} / {{ progress.totalCount }}
        </span>
      </div>
    </header>

    <section v-for="tier in tiers" :key="tier" class="mb-10">
      <h2 class="font-display font-semibold text-lg text-ink mb-4 border-l-4 border-primary pl-3 leading-tight">
        {{ LESSON_TIER_LABELS[tier] }}
      </h2>

      <ul class="space-y-3">
        <li v-for="lesson in lessonsInTier(tier)" :key="lesson.id">
          <button
            type="button"
            class="w-full text-left p-4 rounded-card min-h-[44px] flex items-start gap-3.5"
            :class="progress.isUnlocked(lesson)
              ? 'card-interactive cursor-pointer'
              : 'border border-line-subtle bg-surface-base/60 cursor-not-allowed opacity-70'"
            :disabled="!progress.isUnlocked(lesson)"
            :aria-label="progress.isUnlocked(lesson)
              ? `${lesson.title}${progress.isCompleted(lesson.id) ? '（已完成）' : ''}`
              : `${lesson.title}（未解鎖）`"
            @click="open(lesson)"
          >
            <span
              class="shrink-0 w-7 h-7 mt-0.5 rounded-full flex items-center justify-center text-sm"
              :class="progress.isCompleted(lesson.id)
                ? 'bg-success text-success-fg'
                : progress.isUnlocked(lesson)
                  ? 'border-2 border-line-strong text-transparent'
                  : 'bg-surface-hover text-ink-faint'"
              aria-hidden="true"
            >
              <template v-if="!progress.isUnlocked(lesson)">🔒</template>
              <template v-else-if="progress.isCompleted(lesson.id)">✓</template>
              <template v-else>·</template>
            </span>
            <span class="flex-1 min-w-0">
              <span class="flex items-center gap-2 flex-wrap">
                <span class="font-semibold text-ink" :class="{ 'text-ink-faint': !progress.isUnlocked(lesson) }">{{ lesson.title }}</span>
                <span
                  class="text-xs px-2 py-0.5 rounded-full bg-surface-hover text-ink-muted shrink-0"
                >{{ DIFFICULTY_LABELS[lesson.difficulty] }}</span>
              </span>
              <span class="block text-sm text-ink-muted mt-1 leading-relaxed">{{ lesson.summary }}</span>
            </span>
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>
