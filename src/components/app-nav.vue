<script setup lang="ts">
import { House, BookOpen, Target, Swords, CircleUserRound } from 'lucide-vue-next'
import brandMark from '@/assets/brand-mark.svg'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// Primary destinations — 首頁 + the three core features (學習 / 試煉 / 對局). Account/profile lives in
// the top-right header instead of a tab. Shared by the desktop top bar and the mobile bottom tab bar.
// icon = Lucide line-icon component (single icon family across the app).
const NAV_ITEMS = [
  { to: '/', label: '首頁', icon: House },
  { to: '/learn', label: '學習', icon: BookOpen },
  { to: '/dungeon', label: '試煉', icon: Target },
  { to: '/play', label: '對局', icon: Swords },
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
        <img
          :src="brandMark"
          alt=""
          aria-hidden="true"
          class="h-[22px] w-auto drop-shadow-[0_0_8px_rgba(248,181,0,0.35)]"
        />
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
          <component :is="item.icon" :size="16" :stroke-width="1.8" aria-hidden="true" />
          {{ item.label }}
        </RouterLink>
      </nav>

      <span class="flex-1" />

      <!-- Account: 登入 when signed out, profile entry when signed in (登出 lives in ProfileView). -->
      <RouterLink
        v-if="!authStore.userId"
        to="/sign-in"
        class="flex items-center h-9 px-4 rounded-full text-sm font-medium text-ink-on-deep-dim hover:text-ink-on-deep hover:bg-white/[0.08] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        active-class="!text-ink-on-deep"
      >
        登入
      </RouterLink>
      <RouterLink
        v-else
        to="/profile"
        aria-label="我的"
        class="flex items-center justify-center h-9 w-9 rounded-full text-ink-on-deep-dim hover:text-ink-on-deep hover:bg-white/[0.08] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        active-class="!text-white bg-primary"
      >
        <CircleUserRound :size="20" :stroke-width="1.8" aria-hidden="true" />
      </RouterLink>
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
        <component :is="item.icon" :size="24" :stroke-width="1.8" aria-hidden="true" />
        {{ item.label }}
      </RouterLink>
    </div>
  </nav>
</template>
