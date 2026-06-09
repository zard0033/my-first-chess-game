<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Check, Lock, ChevronRight } from 'lucide-vue-next'
import { lessons } from '@/data/lessons'
import { LESSON_TIER_LABELS } from '@/types/lesson'
import type { Lesson, LessonTier } from '@/types/lesson'
import { useLessonProgressStore } from '@/stores/lesson-progress'
import { DarkPanel, ChapterBadge } from '@/components/ui/gambit'
import LearnTabs from '@/components/learn-tabs.vue'
import { SHOW_CONCEPT_MAP } from '@/config/learning-loop-tuning'

const router = useRouter()
const progress = useLessonProgressStore()

// 棋子徽章：用棋盤同一套 Gioco Wood 棋子（扁平 jade 剪影），與 Home 一致。
const base = import.meta.env.BASE_URL
const TIER_PIECE: Record<LessonTier, string> = { 1: 'bP', 2: 'bN', 3: 'bR', 4: 'bK' }
const TIER_NUM: Record<LessonTier, string> = { 1: '一', 2: '二', 3: '三', 4: '四' }
const TIER_SUB: Record<LessonTier, string> = {
  1: '棋子走法 · 基本規則',
  2: '戰術組合 · 棋子配合',
  3: '控制中心 · 快速發展',
  4: '殘局技巧 · 王兵協同',
}

const nextLesson = computed(
  () => [...lessons].find((l) => progress.isUnlocked(l) && !progress.isCompleted(l.id)) ?? null,
)

interface Chapter {
  tier: LessonTier
  lessons: Lesson[]
  done: number
  total: number
}

const chapters = computed<Chapter[]>(() => {
  const map = new Map<LessonTier, Lesson[]>()
  for (const l of lessons) {
    const arr = map.get(l.tier) ?? []
    arr.push(l)
    map.set(l.tier, arr)
  }
  return [...map.entries()].map(([tier, ls]) => ({
    tier,
    lessons: ls,
    done: ls.filter((l) => progress.isCompleted(l.id)).length,
    total: ls.length,
  }))
})

// 作用中章節 = 含「下一課」的章節；全部完成時取最後一章
const activeTier = computed<LessonTier>(
  () => nextLesson.value?.tier ?? chapters.value[chapters.value.length - 1].tier,
)

function chapterStatus(c: Chapter): 'active' | 'done' | 'locked' {
  if (c.tier === activeTier.value) return 'active'
  return c.tier < activeTier.value ? 'done' : 'locked'
}

function lessonState(l: Lesson): 'done' | 'current' | 'locked' {
  if (progress.isCompleted(l.id)) return 'done'
  if (l.id === nextLesson.value?.id) return 'current'
  return 'locked'
}

function openLesson(l: Lesson): void {
  if (lessonState(l) !== 'locked') router.push(`/learn/${l.id}`)
}

function openChapter(c: Chapter): void {
  // 已完成章節：回顧第一課
  if (chapterStatus(c) === 'done') router.push(`/learn/${c.lessons[0].id}`)
}
</script>

<template>
  <div class="mx-auto max-w-md pb-8">
    <!-- 總進度標頭 -->
    <header class="border-b border-line-subtle px-[18px] pb-3 pt-5">
      <LearnTabs v-if="SHOW_CONCEPT_MAP" class="mb-3.5" />
      <h1 class="sr-only" tabindex="-1">棋藝課程</h1>
      <div class="flex justify-end">
        <span class="shrink-0 font-num text-sm tabular-nums text-ink-muted">
          {{ progress.completedCount }} / {{ progress.totalCount }} 課
        </span>
      </div>
      <div class="mt-2.5 h-1.5 overflow-hidden rounded-full bg-line-subtle">
        <div
          class="h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none"
          :style="{ width: `${progress.progress * 100}%` }"
        />
      </div>
    </header>

    <div class="flex flex-col gap-2.5 px-[14px] pt-3">
      <template v-for="c in chapters" :key="c.tier">
        <!-- 作用中章節：展開課程列表 -->
        <div
          v-if="chapterStatus(c) === 'active'"
          class="overflow-hidden rounded-[14px] shadow-[0_6px_20px_rgba(10,30,24,0.28)]"
        >
          <DarkPanel no-pad>
            <div class="px-3.5 pb-3 pt-3.5">
              <div class="mb-2.5 flex items-center gap-2.5">
                <ChapterBadge :piece="TIER_PIECE[c.tier]" :size="42" />
                <div class="min-w-0 flex-1">
                  <p
                    class="mb-0.5 font-sans text-[10px] font-bold uppercase tracking-[0.1em] text-gold"
                  >
                    第{{ TIER_NUM[c.tier] }}章
                  </p>
                  <p class="font-display text-[15px] font-bold leading-tight text-ink-on-deep">
                    {{ LESSON_TIER_LABELS[c.tier] }}
                  </p>
                  <p class="mt-0.5 font-sans text-[10px] text-ink-on-deep-dim">{{ TIER_SUB[c.tier] }}</p>
                </div>
                <span class="shrink-0 font-num text-[11px] text-ink-on-deep-dim">
                  {{ c.done }}/{{ c.total }}
                </span>
              </div>
              <div class="h-[3px] overflow-hidden rounded-full bg-white/[0.12]">
                <div
                  class="h-full rounded-full bg-[linear-gradient(90deg,#3AB894,#F8B500)] transition-[width] duration-300 motion-reduce:transition-none"
                  :style="{ width: `${(c.done / c.total) * 100}%` }"
                />
              </div>
            </div>
          </DarkPanel>

          <!-- 課程列 -->
          <div class="bg-surface-card">
            <button
              v-for="(l, i) in c.lessons"
              :key="l.id"
              type="button"
              class="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold"
              :class="[
                i < c.lessons.length - 1 && 'border-b border-black/[0.04]',
                lessonState(l) === 'current' &&
                  'bg-[linear-gradient(90deg,#FAF2DC,#FDF9EE)]',
                lessonState(l) === 'locked' ? 'cursor-default' : 'hover:bg-surface-hover',
              ]"
              :disabled="lessonState(l) === 'locked'"
              @click="openLesson(l)"
            >
              <!-- 狀態點 -->
              <span
                class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full"
                :class="{
                  'bg-primary-soft': lessonState(l) === 'done',
                  'bg-[linear-gradient(150deg,#ffc94d,#f8b500)] shadow-[0_0_6px_rgba(248,181,0,0.4)]':
                    lessonState(l) === 'current',
                  'bg-surface-raised': lessonState(l) === 'locked',
                }"
              >
                <Check
                  v-if="lessonState(l) === 'done'"
                  :size="10"
                  class="text-primary"
                  :stroke-width="3.5"
                />
                <span
                  v-else-if="lessonState(l) === 'current'"
                  class="font-num text-[9px] font-bold text-gold-ink"
                >{{ i + 1 }}</span>
                <Lock v-else :size="9" class="text-ink-faint" :stroke-width="2.5" />
              </span>

              <span
                class="flex-1 truncate font-sans text-xs"
                :class="{
                  'font-bold text-ink': lessonState(l) === 'current',
                  'text-ink-faint line-through decoration-ink-faint/35': lessonState(l) === 'done',
                  'text-ink-faint': lessonState(l) === 'locked',
                }"
              >{{ l.title }}</span>

              <span
                v-if="lessonState(l) === 'current'"
                class="shrink-0 rounded-full bg-[linear-gradient(180deg,#ffc94d,#f8b500)] px-2 py-0.5 font-sans text-[9px] font-bold text-gold-ink"
              >繼續</span>
              <span
                v-else-if="lessonState(l) === 'done'"
                class="shrink-0 font-sans text-[9px] text-ink-faint"
              >完成</span>
            </button>
          </div>
        </div>

        <!-- 其他章節：摺疊卡片 -->
        <button
          v-else
          type="button"
          class="flex items-center gap-3 rounded-[14px] border border-line bg-surface-raised px-3.5 py-3 text-left transition-colors"
          :class="
            chapterStatus(c) === 'done'
              ? 'hover:bg-surface-hover'
              : 'cursor-default opacity-[0.68]'
          "
          :disabled="chapterStatus(c) === 'locked'"
          @click="openChapter(c)"
        >
          <span class="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-surface-raised">
            <span
              class="block h-[21px] w-[21px]"
              :class="chapterStatus(c) === 'done' ? 'bg-primary' : 'bg-ink-faint'"
              aria-hidden="true"
              :style="{
                WebkitMaskImage: `url(${base}pieces/silhouette/${TIER_PIECE[c.tier]}.svg)`,
                maskImage: `url(${base}pieces/silhouette/${TIER_PIECE[c.tier]}.svg)`,
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                maskPosition: 'center',
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
              }"
            />
          </span>
          <div class="min-w-0 flex-1">
            <p class="mb-0.5 font-sans text-[9px] text-ink-faint">第{{ TIER_NUM[c.tier] }}章</p>
            <p
              class="font-display text-sm font-bold"
              :class="chapterStatus(c) === 'done' ? 'text-ink' : 'text-ink-muted'"
            >{{ LESSON_TIER_LABELS[c.tier] }}</p>
            <p class="mt-0.5 font-sans text-[10px] text-ink-faint">
              <template v-if="chapterStatus(c) === 'done'">{{ c.done }}/{{ c.total }} · 已完成</template>
              <template v-else>{{ c.total }} 課</template>
            </p>
          </div>
          <Lock
            v-if="chapterStatus(c) === 'locked'"
            :size="15"
            class="text-ink-faint"
            :stroke-width="1.8"
          />
          <ChevronRight v-else :size="15" class="text-ink-faint" :stroke-width="1.8" />
        </button>
      </template>
    </div>
  </div>
</template>
