<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

defineProps<{ onSignOut: () => void }>()

const authStore = useAuthStore()

// Primary destinations — shared by the desktop top bar and the mobile bottom tab bar.
// icon = inline SVG path(s) on a 24×24 viewBox, stroke-based.
const NAV_ITEMS = [
  { to: '/', label: '首頁', icon: 'M3 11.5 12 4l9 7.5M5 10v9h5v-5h4v5h5v-9' },
  { to: '/learn', label: '學習', icon: 'M4 5.5A1.5 1.5 0 0 1 5.5 4H19v13H5.5A1.5 1.5 0 0 0 4 18.5zM4 18.5A1.5 1.5 0 0 0 5.5 20H19v-3' },
  { to: '/play', label: '對局', icon: 'M8 5v14l11-7z' },
  { to: '/history', label: '紀錄', icon: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01' },
] as const
</script>

<template>
  <!-- Top app bar — same wood as the board, with a dark wash + bevel for depth -->
  <header
    class="sticky top-0 z-30 border-b border-black/30 bg-nav-bg bg-cover bg-center shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_3px_12px_rgba(0,0,0,0.30)]"
    style="background-image: linear-gradient(rgba(40,27,15,0.74), rgba(33,22,12,0.82)), url('/board/wood12_bg.jpg')"
  >
    <div class="max-w-6xl mx-auto flex items-center gap-1 px-4 h-14">
      <RouterLink to="/" class="flex items-center gap-2 mr-3" aria-label="Gambit 首頁">
        <img src="/pieces/wQ.svg" alt="" class="w-7 h-7 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]" draggable="false" aria-hidden="true" />
        <span class="font-display font-bold text-lg tracking-tight text-nav-active">Gambit</span>
      </RouterLink>

      <!-- Desktop primary nav (mobile uses the bottom bar) -->
      <nav class="hidden md:flex items-center gap-1" aria-label="主要導覽">
        <RouterLink
          v-for="item in NAV_ITEMS"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-2 px-3.5 h-9 rounded-full text-sm font-medium text-nav-text hover:text-nav-active hover:bg-white/5 transition-colors"
          active-class="!text-nav-active bg-white/10"
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
        class="flex items-center h-9 px-4 rounded-full text-sm font-medium text-nav-text hover:text-nav-active hover:bg-white/5 transition-colors"
        active-class="!text-nav-active"
      >
        登入
      </RouterLink>
      <button
        v-else
        type="button"
        class="flex items-center h-9 px-4 rounded-full text-sm font-medium text-nav-text hover:text-nav-active hover:bg-white/5 transition-colors"
        @click="onSignOut"
      >
        登出
      </button>
    </div>
  </header>

  <!-- Mobile bottom tab bar -->
  <nav
    class="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-black/30 bg-nav-bg bg-cover bg-center shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_-3px_12px_rgba(0,0,0,0.30)] pb-[env(safe-area-inset-bottom)]"
    style="background-image: linear-gradient(rgba(40,27,15,0.74), rgba(33,22,12,0.82)), url('/board/wood12_bg.jpg')"
    aria-label="主要導覽"
  >
    <div class="flex">
      <RouterLink
        v-for="item in NAV_ITEMS"
        :key="item.to"
        :to="item.to"
        class="flex-1 flex flex-col items-center justify-center gap-1 min-h-[56px] py-2 text-nav-text text-[11px] font-medium transition-colors"
        active-class="!text-nav-active"
      >
        <svg viewBox="0 0 24 24" class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path :d="item.icon" />
        </svg>
        {{ item.label }}
      </RouterLink>
    </div>
  </nav>
</template>
