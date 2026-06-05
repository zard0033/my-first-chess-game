<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ value: number; total: number }>()
const pct = computed(() => (props.total > 0 ? Math.round((props.value / props.total) * 100) : 0))
</script>

<template>
  <div class="flex items-center gap-2">
    <div class="flex-1 h-1.5 bg-line-subtle rounded-full overflow-hidden">
      <div
        class="h-full bg-primary rounded-full transition-[width] duration-300 motion-reduce:transition-none"
        :style="{ width: `${pct}%` }"
      />
    </div>
    <span class="font-num text-xs text-ink-muted tabular-nums">{{ value }}/{{ total }}</span>
  </div>
</template>
