<script setup lang="ts">
/**
 * Learn-section segmented control (Learning Loop #20, Phase B). Two peer lenses on the same
 * learning: 課程 (the linear curriculum, /learn) and 概念 (the Concept Map mastery view,
 * /learn/concepts). Route-driven so each view is deep-linkable; the active tab is derived from
 * the current route, never local state.
 */
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const tabs = [
  { label: '課程', to: '/learn' },
  { label: '概念', to: '/learn/concepts' },
] as const

function isActive(to: string): boolean {
  return to === '/learn/concepts' ? route.path === '/learn/concepts' : route.path === '/learn'
}

function go(to: string): void {
  if (!isActive(to)) router.push(to)
}
</script>

<template>
  <div class="flex gap-1 rounded-full bg-[#ddd0b8] p-1">
    <button
      v-for="t in tabs"
      :key="t.to"
      type="button"
      class="min-h-[44px] flex-1 rounded-full py-2 font-sans text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
      :class="isActive(t.to) ? 'bg-surface-card text-primary-dark shadow-[0_1px_4px_rgba(61,34,16,0.14)]' : 'text-ink-muted'"
      :aria-current="isActive(t.to) ? 'page' : undefined"
      @click="go(t.to)"
    >{{ t.label }}</button>
  </div>
</template>
