<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{ icon: Component; label: string; value: string; locked?: boolean }>()
</script>

<template>
  <!-- 總覽統計卡：cream 立體；locked 灰階 + 「即將推出」 -->
  <div
    class="flex-1 text-center rounded-card bg-surface-card
           border border-line border-t-white/[0.68] border-b-line-subtle
           shadow-[0_4px_12px_rgba(61,34,16,0.08),0_1px_3px_rgba(61,34,16,0.05),inset_0_1px_0_rgba(255,255,255,0.5)]
           px-2.5 py-3"
    :class="locked && 'opacity-55'"
  >
    <div class="flex justify-center mb-1.5" :class="locked ? 'text-ink-faint' : 'text-primary'">
      <component :is="icon" :size="20" :stroke-width="1.8" />
    </div>
    <div
      class="font-bold tabular-nums"
      :class="locked ? 'font-sans text-[13px] text-ink-faint' : 'font-num text-lg text-ink'"
    >
      {{ value }}
    </div>
    <div class="font-sans text-[11px] text-ink-muted mt-0.5">{{ label }}</div>
  </div>
</template>
