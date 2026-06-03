<script setup lang="ts">
import { computed } from 'vue'
import {
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogClose,
  type DialogContentProps,
  type DialogContentEmits,
  useForwardPropsEmits,
} from 'reka-ui'
import { X } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const props = defineProps<DialogContentProps & { class?: string }>()
const emits = defineEmits<DialogContentEmits>()

const delegatedProps = computed(() => {
  const { class: _, ...rest } = props
  return rest
})
const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <DialogPortal>
    <DialogOverlay
      class="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
    />
    <DialogContent
      v-bind="forwarded"
      :class="
        cn(
          'rpg-dialog fixed left-1/2 top-1/2 z-50 grid w-full max-w-sm -translate-x-1/2 -translate-y-1/2 gap-4 p-6 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          props.class,
        )
      "
    >
      <slot />
      <DialogClose
        class="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-btn text-ink-muted opacity-70 transition-all hover:bg-surface-hover hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X class="h-5 w-5" />
        <span class="sr-only">關閉</span>
      </DialogClose>
    </DialogContent>
  </DialogPortal>
</template>

<style scoped>
.rpg-dialog {
  position: fixed;
  isolation: isolate;
  border: none;
  background: transparent;
  box-shadow: none;
  border-radius: 0;
}
.rpg-dialog::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  border-image: url('/ui/panelInset_beige.png') 18 fill;
  border-style: solid;
  border-width: 18px;
  pointer-events: none;
}
</style>
