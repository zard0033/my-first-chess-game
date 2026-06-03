<script setup lang="ts">
import { ProgressRoot, ProgressIndicator } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{ modelValue?: number; class?: string }>(), {
  modelValue: 0,
})
</script>

<template>
  <ProgressRoot
    :model-value="modelValue"
    :class="cn('relative h-2 w-full overflow-hidden rounded-full bg-surface-hover', props.class)"
  >
    <ProgressIndicator
      class="h-full w-full flex-1 rounded-full bg-primary transition-transform duration-500 ease-out"
      :style="`transform: translateX(-${100 - (modelValue ?? 0)}%)`"
    />
  </ProgressRoot>
</template>
