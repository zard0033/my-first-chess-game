<script setup lang="ts">
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: string; accent?: boolean }>()
</script>

<template>
  <!-- Gambit cream 立體卡：上亮邊 + 暖棕柔陰影 + 頂端 inset sheen；accent 為 jade 左 rule -->
  <div
    :class="cn(
      'relative bg-surface-card text-ink rounded-lg-card',
      'border border-line border-t-white/70 border-b-line-subtle',
      'shadow-[0_6px_16px_rgba(61,34,16,0.09),0_2px_4px_rgba(61,34,16,0.06),inset_0_1px_0_rgba(255,255,255,0.55)]',
      props.accent && 'border-l-4 border-l-primary',
      props.class,
    )"
  >
    <slot />
  </div>
</template>
