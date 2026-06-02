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
  <div class="max-w-3xl mx-auto px-4 py-6">
    <header class="mb-6">
      <h1 class="text-2xl font-bold mb-1" tabindex="-1">課程</h1>
      <p class="text-sm text-gray-600">教練：{{ COACH.name }}</p>
      <div class="mt-3 flex items-center gap-3">
        <div class="flex-1 h-2 bg-gray-200 rounded overflow-hidden">
          <div
            class="h-full bg-blue-600 transition-[width] duration-300"
            :style="{ width: `${progress.progress * 100}%` }"
          />
        </div>
        <span class="text-sm text-gray-600 tabular-nums">
          {{ progress.completedCount }} / {{ progress.totalCount }}
        </span>
      </div>
    </header>

    <section v-for="tier in tiers" :key="tier" class="mb-8">
      <h2 class="text-lg font-semibold text-gray-800 mb-3">
        {{ LESSON_TIER_LABELS[tier] }}
      </h2>

      <ul class="space-y-2">
        <li v-for="lesson in lessonsInTier(tier)" :key="lesson.id">
          <button
            type="button"
            class="w-full text-left p-4 rounded-lg border min-h-[44px] flex items-start gap-3 transition-colors"
            :class="progress.isUnlocked(lesson)
              ? 'border-gray-200 bg-white hover:bg-gray-50 cursor-pointer'
              : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'"
            :disabled="!progress.isUnlocked(lesson)"
            :aria-label="progress.isUnlocked(lesson)
              ? `${lesson.title}${progress.isCompleted(lesson.id) ? '（已完成）' : ''}`
              : `${lesson.title}（未解鎖）`"
            @click="open(lesson)"
          >
            <span class="text-xl leading-6 shrink-0" aria-hidden="true">
              <template v-if="!progress.isUnlocked(lesson)">🔒</template>
              <template v-else-if="progress.isCompleted(lesson.id)">✅</template>
              <template v-else>○</template>
            </span>
            <span class="flex-1 min-w-0">
              <span class="flex items-center gap-2">
                <span class="font-semibold">{{ lesson.title }}</span>
                <span
                  class="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 shrink-0"
                >{{ DIFFICULTY_LABELS[lesson.difficulty] }}</span>
              </span>
              <span class="block text-sm text-gray-500 mt-0.5">{{ lesson.summary }}</span>
            </span>
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>
