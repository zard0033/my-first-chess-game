<script setup lang="ts">
import { computed } from 'vue'
import { lessons } from '@/data/lessons'
import { LESSON_TIER_LABELS } from '@/types/lesson'
import type { LessonTier } from '@/types/lesson'
import { useLessonProgressStore } from '@/stores/lesson-progress'

const progress = useLessonProgressStore()

const TIER_PIECE: Record<LessonTier, string> = { 1: 'wP', 2: 'wN', 3: 'wR', 4: 'wK' }

// The lesson to resume: first unlocked, not-yet-completed.
const nextLesson = computed(() =>
  [...lessons].find((l) => progress.isUnlocked(l) && !progress.isCompleted(l.id)) ?? null,
)

const quickActions = [
  { to: '/play', piece: 'wN', title: '對局', desc: '與電腦對弈，自選強度' },
  { to: '/history', piece: 'wR', title: '紀錄', desc: '回顧每一盤，逐步複盤' },
]
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-8 space-y-6">
    <!-- Greeting -->
    <div>
      <p class="text-sm text-ink-muted">歡迎回到 Gambit</p>
      <h1 class="font-display font-bold text-3xl text-ink tracking-tight mt-0.5" tabindex="-1">繼續你的棋路</h1>
    </div>

    <!-- Continue-learning hero -->
    <RouterLink
      :to="nextLesson ? `/learn/${nextLesson.id}` : '/learn'"
      class="group relative block overflow-hidden rounded-lg-card bg-primary text-primary-fg shadow-card transition-shadow hover:shadow-card-hover"
    >
      <!-- watermark emblem -->
      <img
        v-if="nextLesson"
        :src="`/pieces/${TIER_PIECE[nextLesson.tier]}.svg`"
        alt=""
        class="pointer-events-none absolute -right-4 -bottom-6 w-36 h-36 opacity-15"
        draggable="false"
      />
      <div class="relative p-6">
        <template v-if="nextLesson">
          <p class="text-xs font-medium uppercase tracking-wider opacity-80">繼續學習 · {{ LESSON_TIER_LABELS[nextLesson.tier] }}</p>
          <h2 class="font-display font-bold text-2xl mt-1 leading-tight">{{ nextLesson.title }}</h2>
          <p class="text-sm opacity-90 mt-1.5 max-w-md leading-relaxed">{{ nextLesson.summary }}</p>
        </template>
        <template v-else>
          <p class="text-xs font-medium uppercase tracking-wider opacity-80">學習地圖</p>
          <h2 class="font-display font-bold text-2xl mt-1">你已完成所有課程 🎉</h2>
          <p class="text-sm opacity-90 mt-1.5">回到地圖複習任何一課。</p>
        </template>

        <div class="mt-5 flex items-center gap-3">
          <span class="inline-flex items-center gap-1.5 px-4 h-10 rounded-full bg-primary-fg text-primary font-semibold text-sm group-hover:gap-2.5 transition-[gap]">
            {{ nextLesson ? '開始這一課' : '回到地圖' }} →
          </span>
          <span class="text-sm font-medium opacity-90 tabular-nums">已完成 {{ progress.completedCount }} / {{ progress.totalCount }} 課</span>
        </div>

        <div class="mt-3 h-1.5 bg-primary-fg/25 rounded-full overflow-hidden">
          <div class="h-full bg-primary-fg rounded-full transition-[width] duration-500" :style="{ width: `${progress.progress * 100}%` }" />
        </div>
      </div>
    </RouterLink>

    <!-- Quick actions -->
    <div class="grid grid-cols-2 gap-4">
      <RouterLink
        v-for="a in quickActions"
        :key="a.to"
        :to="a.to"
        class="card-interactive p-5 flex flex-col gap-2"
      >
        <span class="w-11 h-11 rounded-card bg-surface-raised border border-line flex items-center justify-center" aria-hidden="true">
          <img :src="`/pieces/${a.piece}.svg`" alt="" class="w-7 h-7" draggable="false" />
        </span>
        <span class="font-display font-semibold text-lg text-ink mt-1">{{ a.title }}</span>
        <span class="text-sm text-ink-muted leading-relaxed">{{ a.desc }}</span>
      </RouterLink>
    </div>
  </div>
</template>
