<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const email = ref('')

async function handleSubmit() {
  await authStore.signIn(email.value)
}
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-[calc(100vh-49px)] px-4">
    <h1 class="font-display text-2xl font-semibold mb-6 text-ink" tabindex="-1">Sign in</h1>

    <form v-if="!authStore.pendingEmail" @submit.prevent="handleSubmit" class="w-full max-w-sm">
      <label for="email" class="block text-sm mb-1 text-ink">Email address</label>
      <input
        id="email"
        v-model="email"
        type="email"
        required
        class="w-full border border-line rounded px-3 py-3 mb-4 text-base min-h-[44px] bg-surface-card text-ink focus:outline-none focus:border-primary"
        placeholder="you@example.com"
      />
      <div v-if="authStore.authError" class="text-danger text-sm mb-3" role="alert">
        {{ authStore.authError }}
      </div>
      <button
        type="submit"
        :disabled="authStore.isAuthLoading"
        class="btn btn-primary w-full"
      >
        {{ authStore.isAuthLoading ? 'Sending…' : 'Send Magic Link' }}
      </button>
    </form>

    <div v-else class="text-center">
      <p class="font-display text-lg mb-2 text-ink">Check your email</p>
      <p class="text-sm text-ink-muted">We sent a link to <strong>{{ email }}</strong></p>
      <button
        @click="authStore.pendingEmail = false"
        class="mt-4 text-sm underline text-ink-muted hover:text-ink min-h-[44px] px-2"
      >
        Use a different email
      </button>
    </div>
  </div>
</template>
