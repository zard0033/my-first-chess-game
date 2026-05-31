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
    <h1 class="text-2xl font-semibold mb-6" tabindex="-1">Sign in</h1>

    <form v-if="!authStore.pendingEmail" @submit.prevent="handleSubmit" class="w-full max-w-sm">
      <label for="email" class="block text-sm mb-1">Email address</label>
      <input
        id="email"
        v-model="email"
        type="email"
        required
        class="w-full border rounded px-3 py-3 mb-4 text-base min-h-[44px]"
        placeholder="you@example.com"
      />
      <div v-if="authStore.authError" class="text-red-600 text-sm mb-3" role="alert">
        {{ authStore.authError }}
      </div>
      <button
        type="submit"
        :disabled="authStore.isAuthLoading"
        class="w-full bg-green-700 text-white py-3 rounded min-h-[44px] font-medium disabled:opacity-50"
      >
        {{ authStore.isAuthLoading ? 'Sending…' : 'Send Magic Link' }}
      </button>
    </form>

    <div v-else class="text-center">
      <p class="text-lg mb-2">Check your email</p>
      <p class="text-sm text-gray-600">We sent a link to <strong>{{ email }}</strong></p>
      <button
        @click="authStore.pendingEmail = false"
        class="mt-4 text-sm underline min-h-[44px] px-2"
      >
        Use a different email
      </button>
    </div>
  </div>
</template>
