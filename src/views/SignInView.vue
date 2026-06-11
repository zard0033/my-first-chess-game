<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Mail, MailCheck, ArrowRight } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { GUEST_ENTRY_KEY } from '@/router'
import brandMark from '@/assets/brand-mark.svg'
import { Button } from '@/components/ui/button'

const authStore = useAuthStore()
const router = useRouter()
const email = ref(localStorage.getItem('gambit:last-email') ?? '')

async function handleSubmit() {
  await authStore.signIn(email.value)
}

function continueAsGuest() {
  sessionStorage.setItem(GUEST_ENTRY_KEY, '1')
  router.push('/')
}
</script>

<template>
  <!-- 全屏深青瓷沉浸：棋局即道場 -->
  <div
    class="flex min-h-dvh flex-col bg-[linear-gradient(175deg,#0C2318_0%,#103029_42%,#0A1F18_100%)]"
  >
    <div class="flex flex-1 flex-col items-center justify-center px-9">
      <!-- 品牌字標：金色國王剪影（brand-mark），金色留給 CTA -->
      <img
        :src="brandMark"
        alt=""
        aria-hidden="true"
        class="mb-6 h-24 w-auto drop-shadow-[0_0_28px_rgba(248,181,0,0.4)]"
      />
      <h1 class="mb-2 font-brand text-[32px] font-black tracking-[0.08em] text-ink-on-deep" tabindex="-1">
        GAMBIT
      </h1>
      <p class="mb-10 font-sans text-xs uppercase tracking-[0.3em] text-ink-on-deep-dim">Master the board</p>

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
          class="w-full rounded-[13px] border border-white/[0.16] bg-white/[0.07] px-4 py-3.5 text-base text-ink-on-deep placeholder:text-ink-on-deep-dim/75 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        />
        <p v-if="authStore.authError" class="text-sm text-danger-light">{{ authStore.authError }}</p>
        <Button type="submit" variant="gold" :disabled="authStore.isAuthLoading" class="w-full gap-2">
          <Mail :size="16" /> {{ authStore.isAuthLoading ? '寄送中…' : '寄送登入連結' }}
        </Button>
      </form>

      <div v-else class="flex w-full max-w-sm flex-col items-center text-center">
        <MailCheck :size="32" class="mb-3 text-gold" aria-hidden="true" />
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

    <div class="px-9 pb-10">
      <div class="mx-auto flex max-w-sm flex-col">
        <div class="mb-4 flex items-center gap-3 text-ink-on-deep-dim/35">
          <span class="h-px flex-1 bg-current"></span>
          <span class="font-sans text-xs">或</span>
          <span class="h-px flex-1 bg-current"></span>
        </div>
        <button
          type="button"
          class="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-[13px] border border-white/[0.16] font-sans text-sm text-ink-on-deep transition-colors hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          @click="continueAsGuest"
        >
          以訪客身分繼續 <ArrowRight :size="15" />
        </button>
      </div>
    </div>
  </div>
</template>
