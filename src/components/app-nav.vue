<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

defineProps<{ onSignOut: () => void }>()

const authStore = useAuthStore()

// Primary destinations shown in both the desktop top bar and the mobile bottom tab bar.
// icon = inline SVG path(s) on a 24x24 viewBox, stroke-based to match the warm line palette.
const NAV_ITEMS = [
  {
    to: '/',
    label: '首頁',
    icon: 'M3 11.5 12 4l9 7.5M5 10v9h5v-5h4v5h5v-9',
  },
  {
    to: '/learn',
    label: '學習',
    icon: 'M4 5.5A1.5 1.5 0 0 1 5.5 4H19v13H5.5A1.5 1.5 0 0 0 4 18.5zM4 18.5A1.5 1.5 0 0 0 5.5 20H19v-3',
  },
  {
    to: '/play',
    label: '對局',
    icon: 'M8 5v14l11-7z',
  },
  {
    to: '/review',
    label: '複盤',
    icon: 'M4 12a8 8 0 1 0 2.3-5.6M4 4v3.5h3.5M12 8v4l3 2',
  },
] as const
</script>

<template>
  <!-- Top app bar — brand + (desktop) primary links + account actions -->
  <header class="bg-nav-bg text-nav-text">
    <div class="max-w-6xl mx-auto flex items-center gap-1 px-4 h-14">
      <RouterLink to="/" class="flex items-center gap-2 font-display font-semibold text-nav-active text-lg mr-2">
        <span aria-hidden="true" class="text-xl leading-none">♛</span>
        <span class="hidden sm:inline">棋道</span>
      </RouterLink>

      <!-- Desktop primary nav (mobile uses the bottom bar instead) -->
      <nav class="hidden md:flex items-center gap-1" aria-label="主要導覽">
        <RouterLink
          v-for="item in NAV_ITEMS"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-2 px-3 h-10 rounded-btn text-sm font-medium hover:bg-white/5 hover:text-nav-active transition-colors"
          active-class="bg-white/10 text-nav-active"
        >
          <svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path :d="item.icon" />
          </svg>
          {{ item.label }}
        </RouterLink>
      </nav>

      <span class="flex-1" />

      <RouterLink
        v-if="!authStore.userId"
        to="/sign-in"
        class="flex items-center h-10 px-3 rounded-btn text-sm font-medium hover:bg-white/5 hover:text-nav-active transition-colors"
        active-class="text-nav-active"
      >
        登入
      </RouterLink>
      <button
        v-else
        type="button"
        class="flex items-center h-10 px-3 rounded-btn text-sm font-medium hover:bg-white/5 hover:text-nav-active transition-colors"
        @click="onSignOut"
      >
        登出
      </button>
    </div>
  </header>

  <!-- Mobile bottom tab bar -->
  <nav
    class="md:hidden fixed bottom-0 inset-x-0 z-40 bg-nav-bg border-t border-white/10 pb-[env(safe-area-inset-bottom)]"
    aria-label="主要導覽"
  >
    <div class="flex">
      <RouterLink
        v-for="item in NAV_ITEMS"
        :key="item.to"
        :to="item.to"
        class="flex-1 flex flex-col items-center justify-center gap-1 min-h-[56px] py-1.5 text-nav-text text-[11px] font-medium"
        active-class="text-nav-active"
      >
        <svg viewBox="0 0 24 24" class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path :d="item.icon" />
        </svg>
        {{ item.label }}
      </RouterLink>
    </div>
  </nav>
</template>
