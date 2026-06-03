<script setup lang="ts">
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: string }>()
</script>

<template>
  <h3 :class="cn('font-display text-lg font-semibold leading-tight text-ink', props.class)">
    <slot />
  </h3>
</template>
