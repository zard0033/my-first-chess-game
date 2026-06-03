<script setup lang="ts">
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: string }>()
</script>

<template>
  <div :class="cn('rpg-card text-ink', props.class)">
    <slot />
  </div>
</template>

<style scoped>
.rpg-card {
  position: relative;
  isolation: isolate;
  border: none;
  background: transparent;
  box-shadow: none;
  border-radius: 0;
}
.rpg-card::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  border-image: url('/ui/panel_beige.png') 18 fill;
  border-style: solid;
  border-width: 18px;
  pointer-events: none;
}
</style>
