<script setup lang="ts">
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: string }>()
</script>

<template>
  <!-- 區塊標籤：uppercase、ink-muted、字距 -->
  <div
    :class="cn(
      'font-sans text-xs font-bold text-ink-muted tracking-[0.06em] uppercase mx-0.5 mt-5 mb-2.5',
      props.class,
    )"
  >
    <slot />
  </div>
</template>
