<script setup lang="ts">
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: string }>()
</script>

<template>
  <div :class="cn('rounded-card border border-line bg-surface-card text-ink shadow-card', props.class)">
    <slot />
  </div>
</template>
