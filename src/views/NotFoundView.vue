<script setup lang="ts">
import { Button } from '@/components/ui/button'
</script>

<template>
  <div class="flex flex-col items-center p-8">
    <h1 class="mb-4 font-display text-3xl font-semibold text-ink" tabindex="-1">Page Not Found</h1>
    <Button variant="link" as-child>
      <RouterLink to="/">Back to Home</RouterLink>
    </Button>
  </div>
</template>
