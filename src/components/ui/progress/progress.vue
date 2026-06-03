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
    :class="cn('relative h-3 w-full overflow-hidden rounded-sm', props.class)"
    style="background: #c9b89a; box-shadow: inset 0 1px 3px rgba(61,34,16,0.25);"
  >
    <ProgressIndicator
      class="h-full w-full flex-1 transition-transform duration-500 ease-out rounded-sm"
      style="background: linear-gradient(90deg, #c9872e, #e8b843); box-shadow: 0 1px 2px rgba(168,115,32,0.4);"
      :style="`transform: translateX(-${100 - (modelValue ?? 0)}%)`"
    />
  </ProgressRoot>
</template>
