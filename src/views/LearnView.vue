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

// Each tier (= category) gets a chess-piece emblem for the themed map header.
const TIER_PIECE: Record<LessonTier, string> = {
  1: 'wP', // 基礎規則
  2: 'wN', // 基本戰術
  3: 'wR', // 開局原則
  4: 'wK', // 殘局技術
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

function tierDone(tier: LessonTier): number {
  return lessonsInTier(tier).filter((l) => progress.isCompleted(l.id)).length
}

// The single "continue here" lesson: first unlocked, not-yet-completed lesson by order.
const currentLessonId = computed<string | null>(() => {
  const next = [...lessons].find((l) => progress.isUnlocked(l) && !progress.isCompleted(l.id))
  return next?.id ?? null
})

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

    <section v-for="tier in tiers" :key="tier" class="mb-12">
      <!-- Themed tier header: piece emblem + label + per-tier progress -->
      <div class="flex items-center gap-3 mb-5">
        <span class="shrink-0 w-11 h-11 rounded-card bg-surface-raised border border-line flex items-center justify-center">
          <img :src="`/pieces/${TIER_PIECE[tier]}.svg`" alt="" class="w-7 h-7" draggable="false" />
        </span>
        <div class="min-w-0">
          <h2 class="font-display font-semibold text-lg text-ink leading-tight">{{ LESSON_TIER_LABELS[tier] }}</h2>
          <p class="text-xs text-ink-muted tabular-nums">{{ tierDone(tier) }} / {{ lessonsInTier(tier).length }} 完成</p>
        </div>
      </div>

      <!-- Node path: connected lesson nodes with a vertical spine -->
      <ul class="space-y-2.5">
        <li
          v-for="(lesson, i) in lessonsInTier(tier)"
          :key="lesson.id"
          class="relative pl-12"
        >
          <!-- spine connector (hidden under the last node) -->
          <span
            v-if="i < lessonsInTier(tier).length - 1"
            class="absolute left-[19px] top-9 bottom-[-0.625rem] w-0.5 bg-line"
            aria-hidden="true"
          />
          <!-- node circle -->
          <span
            class="absolute left-0 top-1 w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold z-10 ring-4 ring-surface-base"
            :class="progress.isCompleted(lesson.id)
              ? 'bg-success text-success-fg'
              : lesson.id === currentLessonId
                ? 'bg-primary text-primary-fg shadow-button'
                : progress.isUnlocked(lesson)
                  ? 'bg-surface-raised border-2 border-line-strong text-ink-muted'
                  : 'bg-surface-hover text-ink-faint'"
            aria-hidden="true"
          >
            <template v-if="progress.isCompleted(lesson.id)">✓</template>
            <template v-else-if="!progress.isUnlocked(lesson)">
              <svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>
            </template>
            <template v-else>{{ i + 1 }}</template>
          </span>

          <button
            type="button"
            class="w-full text-left p-4 rounded-card min-h-[44px]"
            :class="progress.isUnlocked(lesson)
              ? lesson.id === currentLessonId
                ? 'card-interactive cursor-pointer ring-2 ring-primary/40'
                : 'card-interactive cursor-pointer'
              : 'border border-line-subtle bg-surface-base/60 cursor-not-allowed opacity-70'"
            :disabled="!progress.isUnlocked(lesson)"
            :aria-label="progress.isUnlocked(lesson)
              ? `${lesson.title}${progress.isCompleted(lesson.id) ? '（已完成）' : lesson.id === currentLessonId ? '（繼續）' : ''}`
              : `${lesson.title}（未解鎖）`"
            @click="open(lesson)"
          >
            <span class="flex items-center gap-2 flex-wrap">
              <span class="font-semibold text-ink" :class="{ 'text-ink-faint': !progress.isUnlocked(lesson) }">{{ lesson.title }}</span>
              <span
                v-if="lesson.id === currentLessonId"
                class="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-fg shrink-0"
              >繼續</span>
              <span
                class="text-xs px-2 py-0.5 rounded-full bg-surface-hover text-ink-muted shrink-0"
              >{{ DIFFICULTY_LABELS[lesson.difficulty] }}</span>
            </span>
            <span class="block text-sm text-ink-muted mt-1 leading-relaxed">{{ lesson.summary }}</span>
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>
