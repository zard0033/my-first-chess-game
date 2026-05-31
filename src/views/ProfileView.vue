<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
</script>

<template>
  <div class="p-6">
    <h1 class="text-xl font-semibold text-gray-900" tabindex="-1">Profile</h1>
    <p class="mt-2 text-sm text-gray-500">{{ authStore.email }}</p>
    <p class="mt-4 text-sm text-gray-500">Your profile and stats will appear here.</p>
  </div>
</template>
