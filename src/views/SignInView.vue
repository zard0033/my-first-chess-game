<script setup lang="ts">
import { ref } from 'vue'
import { Mail } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'

const authStore = useAuthStore()
const email = ref('')

async function handleSubmit() {
  await authStore.signIn(email.value)
}
</script>

<template>
  <!-- 全屏深青瓷沉浸：棋局即道場 -->
  <div
    class="flex min-h-dvh flex-col bg-[linear-gradient(175deg,#0C2318_0%,#103029_42%,#0A1F18_100%)]"
  >
    <div class="flex flex-1 flex-col items-center justify-center px-9">
      <!-- 金徽 -->
      <div
        class="mb-5 flex h-[76px] w-[76px] items-center justify-center rounded-[22px] bg-gradient-to-br from-gold-light to-gold text-[44px] leading-none text-gold-ink shadow-[0_0_40px_rgba(248,181,0,0.45),0_8px_22px_rgba(0,0,0,0.32)]"
        aria-hidden="true"
      >
        ♚
      </div>
      <h1 class="mb-1.5 font-brand text-[32px] font-black tracking-[0.08em] text-ink-on-deep" tabindex="-1">
        GAMBIT
      </h1>
      <p class="mb-9 font-display text-sm tracking-[0.22em] text-ink-on-deep-dim">棋 局 即 道 場</p>

      <p
        v-if="!authStore.pendingEmail"
        class="mb-6 max-w-sm text-center font-sans text-sm leading-relaxed text-ink-on-deep-dim"
      >登入後，對局與學習進度將雲端備份、跨裝置同步</p>

      <form
        v-if="!authStore.pendingEmail"
        class="flex w-full max-w-sm flex-col gap-3"
        @submit.prevent="handleSubmit"
      >
        <input
          v-model="email"
          type="email"
          required
          placeholder="you@example.com"
          class="w-full rounded-[13px] border border-white/[0.16] bg-white/[0.07] px-4 py-3.5 text-base text-ink-on-deep placeholder:text-ink-on-deep-dim/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        />
        <p v-if="authStore.authError" class="text-sm text-danger-light">{{ authStore.authError }}</p>
        <Button type="submit" variant="gold" :disabled="authStore.isAuthLoading" class="w-full gap-2">
          <Mail :size="16" /> {{ authStore.isAuthLoading ? '寄送中…' : '寄送登入連結' }}
        </Button>
      </form>

      <div v-else class="w-full max-w-sm text-center">
        <p class="mb-2 font-display text-lg text-ink-on-deep">查看你的信箱</p>
        <p class="text-sm text-ink-on-deep-dim">
          我們寄了一條登入連結到 <strong class="text-ink-on-deep">{{ email }}</strong>
        </p>
        <button
          type="button"
          class="mt-4 text-sm text-ink-on-deep-dim transition-colors hover:text-ink-on-deep"
          @click="authStore.pendingEmail = false"
        >
          改用其他信箱
        </button>
      </div>
    </div>

    <div class="px-9 pb-10 text-center">
      <RouterLink to="/" class="text-xs text-ink-on-deep-dim/50 transition-colors hover:text-ink-on-deep-dim">
        以訪客身分繼續瀏覽
      </RouterLink>
    </div>
  </div>
</template>
