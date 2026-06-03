<script setup lang="ts">
import { DialogDescription, type DialogDescriptionProps } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<DialogDescriptionProps & { class?: string }>()
</script>

<template>
  <DialogDescription
    :as="props.as"
    :as-child="props.asChild"
    :class="cn('text-sm text-ink-muted', props.class)"
  >
    <slot />
  </DialogDescription>
</template>
