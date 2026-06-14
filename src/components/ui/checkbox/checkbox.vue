<script setup lang="ts">
import { CheckboxRoot, CheckboxIndicator } from 'reka-ui'
import { Check } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const props = defineProps<{ modelValue?: boolean; id?: string; class?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
</script>

<template>
  <CheckboxRoot
    :id="id"
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event === true)"
    :class="
      cn(
        'peer relative h-5 w-5 shrink-0 rounded-[5px] border border-line-strong bg-surface-card transition-colors before:absolute before:-inset-3 before:content-[\'\'] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-40 data-[state=checked]:border-primary data-[state=checked]:bg-primary',
        props.class,
      )
    "
  >
    <CheckboxIndicator class="flex items-center justify-center text-primary-fg">
      <Check class="h-3.5 w-3.5" :stroke-width="3" />
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
