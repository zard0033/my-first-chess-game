<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, Target, BookOpen, Library } from 'lucide-vue-next'
import { lessons } from '@/data/lessons'
import { LESSON_TIER_LABELS } from '@/types/lesson'
import type { LessonTier } from '@/types/lesson'
import { useLessonProgressStore } from '@/stores/lesson-progress'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DarkPanel, ChapterBadge, StatCard, SectionLabel, ProgressBar } from '@/components/ui/gambit'

const router = useRouter()
const progress = useLessonProgressStore()

// 棋子剪影：依課程 tier 變化（呼應 hero 徽章「隨主角棋子變化」）
const TIER_GLYPH: Record<LessonTier, string> = { 1: '♟', 2: '♞', 3: '♜', 4: '♚' }

// 時間感問候
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 12) return '早安'
  if (h < 18) return '午安'
  return '晚安'
})

// 要續學的課：第一個已解鎖、未完成
const nextLesson = computed(
  () => [...lessons].find((l) => progress.isUnlocked(l) && !progress.isCompleted(l.id)) ?? null,
)
const lessonOrdinal = computed(() => progress.completedCount + 1)

function startGame() {
  router.push('/play')
}
function continueLearning() {
  router.push(nextLesson.value ? `/learn/${nextLesson.value.id}` : '/learn')
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-[18px] pt-[18px] pb-6">
    <!-- 問候 -->
    <p class="font-sans text-[13px] font-medium text-ink-muted">{{ greeting }}</p>
    <h1 class="font-display font-bold text-[26px] leading-tight text-ink mt-0.5" tabindex="-1">
      今天想下一盤嗎？
    </h1>

    <!-- 新對局 — 深青瓷焦點卡 -->
    <DarkPanel class="mt-4 cursor-pointer" @click="startGame">
      <div class="flex items-center gap-3.5">
        <div class="flex-1 min-w-0">
          <p class="font-sans text-[11px] font-bold tracking-[0.12em] text-gold">NEW GAME</p>
          <p class="font-display font-bold text-[22px] text-ink-on-deep mt-1.5">開始新對局</p>
          <p class="font-sans text-[13px] text-ink-on-deep-dim mt-1">自選強度與執子</p>
          <Button variant="gold" size="sm" class="mt-3.5" @click.stop="startGame">
            開始對局 <ArrowRight :size="16" />
          </Button>
        </div>
        <ChapterBadge glyph="♚" :size="62" />
      </div>
    </DarkPanel>

    <!-- 繼續學習 — cream accent 卡 -->
    <SectionLabel>繼續學習</SectionLabel>
    <Card accent class="p-4 cursor-pointer" @click="continueLearning">
      <template v-if="nextLesson">
        <div class="flex items-center gap-3">
          <div class="flex-1 min-w-0">
            <p class="font-sans text-xs font-bold text-primary-dark">
              {{ LESSON_TIER_LABELS[nextLesson.tier] }}
            </p>
            <p class="font-display font-bold text-xl text-ink mt-1">{{ nextLesson.title }}</p>
            <Button size="sm" class="mt-3" @click.stop="continueLearning">
              繼續 · 第 {{ lessonOrdinal }} 課 <ArrowRight :size="15" />
            </Button>
          </div>
          <ChapterBadge :glyph="TIER_GLYPH[nextLesson.tier]" :size="52" />
        </div>
        <div class="mt-3.5">
          <ProgressBar :value="progress.completedCount" :total="progress.totalCount" />
        </div>
      </template>
      <template v-else>
        <div class="flex items-center gap-3">
          <div class="flex-1 min-w-0">
            <p class="font-sans text-xs font-bold text-primary-dark">學習地圖</p>
            <p class="font-display font-bold text-xl text-ink mt-1">你已完成所有課程</p>
            <Button size="sm" class="mt-3" @click.stop="continueLearning">
              回到地圖 <ArrowRight :size="15" />
            </Button>
          </div>
          <ChapterBadge glyph="♚" :size="52" />
        </div>
      </template>
    </Card>

    <!-- 總覽 -->
    <SectionLabel>總覽</SectionLabel>
    <div class="flex gap-2.5">
      <StatCard
        :icon="BookOpen"
        label="學習進度"
        :value="`${progress.completedCount}/${progress.totalCount}`"
      />
      <StatCard :icon="Target" label="今日謎題" value="即將推出" locked />
      <StatCard :icon="Library" label="開局庫" value="即將推出" locked />
    </div>
  </div>
</template>
