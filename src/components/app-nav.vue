<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

defineProps<{ onSignOut: () => void }>()

const authStore = useAuthStore()

// Primary destinations — shared by the desktop top bar and the mobile bottom tab bar.
// icon = inline SVG path(s) on a 24×24 viewBox, stroke-based (Lucide-style line icons).
const NAV_ITEMS = [
  { to: '/', label: '首頁', icon: 'M3 11.5 12 4l9 7.5M5 10v9h5v-5h4v5h5v-9' },
  { to: '/learn', label: '學習', icon: 'M4 5.5A1.5 1.5 0 0 1 5.5 4H19v13H5.5A1.5 1.5 0 0 0 4 18.5zM4 18.5A1.5 1.5 0 0 0 5.5 20H19v-3' },
  { to: '/play', label: '對局', icon: 'M8 5v14l11-7z' },
  { to: '/profile', label: '我的', icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20c0-3.6 3.6-6.5 8-6.5s8 2.9 8 6.5' },
] as const
</script>

<template>
  <!-- Top app bar — 純色深青瓷（取代木紋照片底），頂端微光 sheen -->
  <header
    class="sticky top-0 z-30 border-b border-white/[0.06] bg-[linear-gradient(180deg,#1E5043_0%,#183E35_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
  >
    <div class="max-w-6xl mx-auto flex items-center gap-1 px-4 h-14">
      <!-- 品牌字標：金徽（國王剪影）+ Cinzel GAMBIT wordmark -->
      <RouterLink to="/" class="flex items-center gap-2 mr-3" aria-label="GAMBIT 首頁">
        <span
          class="w-[30px] h-[30px] rounded-lg bg-gradient-to-b from-gold-light to-gold flex items-center justify-center text-gold-ink text-[19px] leading-none shadow-[0_0_10px_rgba(248,181,0,0.35)]"
          aria-hidden="true"
          >♚</span
        >
        <span class="font-brand font-black text-xl tracking-[0.04em] text-ink-on-deep">GAMBIT</span>
      </RouterLink>

      <!-- Desktop primary nav (mobile uses the bottom bar) -->
      <nav class="hidden md:flex items-center gap-1" aria-label="主要導覽">
        <RouterLink
          v-for="item in NAV_ITEMS"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-2 px-3.5 h-9 rounded-full text-sm font-medium text-ink-on-deep-dim hover:text-ink-on-deep hover:bg-white/[0.08] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          active-class="!text-white !font-bold bg-primary"
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
        class="flex items-center h-9 px-4 rounded-full text-sm font-medium text-ink-on-deep-dim hover:text-ink-on-deep hover:bg-white/[0.08] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        active-class="!text-ink-on-deep"
      >
        登入
      </RouterLink>
      <button
        v-else
        type="button"
        class="flex items-center h-9 px-4 rounded-full text-sm font-medium text-ink-on-deep-dim hover:text-ink-on-deep hover:bg-white/[0.08] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        @click="onSignOut"
      >
        登出
      </button>
    </div>
  </header>

  <!-- Mobile bottom tab bar — 深青瓷漸層；active = 實心 jade pill + 金指示條（SoT §5.1） -->
  <nav
    class="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-white/[0.06] bg-[linear-gradient(180deg,#183E35_0%,#142F28_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.10)] pb-[env(safe-area-inset-bottom)]"
    aria-label="主要導覽"
  >
    <div class="flex gap-1 px-2.5 pt-2 pb-1">
      <RouterLink
        v-for="item in NAV_ITEMS"
        :key="item.to"
        :to="item.to"
        class="relative flex-1 flex flex-col items-center justify-center gap-1 min-h-[52px] py-2 rounded-xl text-[11px] font-medium text-ink-on-deep-dim transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        active-class="!text-white !font-bold bg-primary after:content-[''] after:absolute after:-bottom-px after:left-[30%] after:right-[30%] after:h-[3px] after:rounded-full after:bg-gold"
      >
        <svg viewBox="0 0 24 24" class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path :d="item.icon" />
        </svg>
        {{ item.label }}
      </RouterLink>
    </div>
  </nav>
</template>
