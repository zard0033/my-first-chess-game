<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { OPENING_CARDS } from '@/data/opening-knowledge-cards'
import { parseInlineMarkdown } from '@/utils/parse-inline-markdown'

interface Props {
  /** ECO code for OPENING_CARDS lookup. Null → render nothing. */
  eco: string | null
  /** Full opening header text (name + optional book-exit suffix). Null → render nothing. */
  headerText: string | null
}

const props = defineProps<Props>()

const card = computed(() => {
  if (props.eco === null) return null
  return OPENING_CARDS[props.eco] ?? null
})

// Default: collapsed on mobile (< 768px), expanded on desktop (≥ 768px)
const isExpanded = ref(false)

onMounted(() => {
  if (typeof window !== 'undefined') {
    isExpanded.value = window.matchMedia('(min-width: 768px)').matches
  }
})

function toggle(): void {
  isExpanded.value = !isExpanded.value
}

function handleKeydown(e: KeyboardEvent): void {
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault()
    toggle()
  }
}

const bodySpans = computed(() => {
  if (!card.value) return []
  return parseInlineMarkdown(card.value.body)
})
</script>

<template>
  <div
    v-if="headerText"
    class="w-full max-w-md mb-2"
  >
    <!-- Opening header — clickable toggle when a knowledge card exists -->
    <div
      :role="card ? 'button' : undefined"
      :tabindex="card ? 0 : undefined"
      :aria-expanded="card ? isExpanded : undefined"
      class="text-center text-sm text-ink-muted"
      :class="{ 'cursor-pointer select-none': card }"
      @click="card ? toggle() : undefined"
      @keydown="card ? handleKeydown($event) : undefined"
    >
      {{ headerText }}
      <span
        v-if="card"
        class="ml-1 text-xs text-ink-faint"
        aria-hidden="true"
      >{{ isExpanded ? '▲' : '▼' }}</span>
    </div>

    <!-- Knowledge card body — only when card exists and panel is expanded -->
    <div
      v-if="card && isExpanded"
      aria-live="polite"
      class="mt-2 rounded-card border border-line bg-surface-raised px-3 py-2 text-sm leading-relaxed text-ink-muted"
    >
      <span
        v-for="(span, idx) in bodySpans"
        :key="idx"
        :class="{ 'font-bold': span.bold, 'italic': span.italic }"
      >{{ span.text }}</span>
    </div>
  </div>
</template>
