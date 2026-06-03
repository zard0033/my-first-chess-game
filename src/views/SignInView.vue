<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

const authStore = useAuthStore()
const email = ref('')

async function handleSubmit() {
  await authStore.signIn(email.value)
}
</script>

<template>
  <div class="flex min-h-[calc(100vh-49px)] flex-col items-center justify-center px-4">
    <h1 class="mb-6 font-display text-2xl font-semibold text-ink" tabindex="-1">Sign in</h1>

    <form v-if="!authStore.pendingEmail" @submit.prevent="handleSubmit" class="w-full max-w-sm">
      <Label for="email" class="mb-1.5 block">Email address</Label>
      <Input
        id="email"
        v-model="email"
        type="email"
        required
        class="mb-4 text-base"
        placeholder="you@example.com"
      />
      <Alert v-if="authStore.authError" variant="danger" class="mb-3 py-2.5">
        <AlertDescription class="text-danger">{{ authStore.authError }}</AlertDescription>
      </Alert>
      <Button type="submit" :disabled="authStore.isAuthLoading" class="w-full">
        {{ authStore.isAuthLoading ? 'Sending…' : 'Send Magic Link' }}
      </Button>
    </form>

    <div v-else class="text-center">
      <p class="mb-2 font-display text-lg text-ink">Check your email</p>
      <p class="text-sm text-ink-muted">We sent a link to <strong>{{ email }}</strong></p>
      <Button
        variant="link"
        class="mt-4 text-sm text-ink-muted hover:text-ink"
        @click="authStore.pendingEmail = false"
      >
        Use a different email
      </Button>
    </div>
  </div>
</template>
