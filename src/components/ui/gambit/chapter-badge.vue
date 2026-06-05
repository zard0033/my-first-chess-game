<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{ glyph?: string; size?: number }>(), {
  glyph: '♜',
  size: 60,
})

// 金邊翡翠錢幣：白底 + 金外環 + 四方位刻點 + 中央棋子剪影
const dotSize = computed(() => Math.round(props.size * 0.065))
const center = computed(() => props.size / 2 - dotSize.value / 2)
const dots = computed(() => [
  { left: center.value, top: 1 },
  { left: props.size - dotSize.value - 2, top: center.value },
  { left: center.value, top: props.size - dotSize.value - 2 },
  { left: 1, top: center.value },
])
const glyphSize = computed(() => Math.round(props.size * 0.52))
</script>

<template>
  <div
    class="relative shrink-0 rounded-full bg-surface-card
           shadow-[0_0_0_2.5px_#f8b500,0_4px_14px_rgba(61,34,16,0.16),inset_0_1px_0_rgba(255,255,255,0.9)]"
    :style="{ width: `${size}px`, height: `${size}px` }"
  >
    <div
      v-for="(dot, i) in dots"
      :key="i"
      class="absolute rounded-full bg-primary/50"
      :style="{ left: `${dot.left}px`, top: `${dot.top}px`, width: `${dotSize}px`, height: `${dotSize}px` }"
    />
    <div class="absolute inset-0 flex items-center justify-center">
      <span
        class="text-primary leading-none [text-shadow:0_1px_2px_rgba(61,34,16,0.12)]"
        :style="{ fontSize: `${glyphSize}px` }"
        >{{ glyph }}</span
      >
    </div>
  </div>
</template>
