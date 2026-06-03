<script setup lang="ts">
import { Label, type LabelProps } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<LabelProps & { class?: string }>()
</script>

<template>
  <Label
    :for="props.for"
    :class="cn('text-sm font-medium leading-none text-ink peer-disabled:opacity-50', props.class)"
  >
    <slot />
  </Label>
</template>
