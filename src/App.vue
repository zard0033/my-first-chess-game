<script setup lang="ts">
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <nav class="flex gap-4 px-4 py-2 border-b border-gray-200 bg-white">
      <RouterLink
        to="/"
        class="text-sm font-medium text-gray-700 hover:text-gray-900"
        active-class="text-blue-600 font-semibold"
      >
        Play
      </RouterLink>
      <RouterLink
        to="/review"
        class="text-sm font-medium text-gray-700 hover:text-gray-900"
        active-class="text-blue-600 font-semibold"
      >
        Review
      </RouterLink>
      <RouterLink
        to="/history"
        class="text-sm font-medium text-gray-700 hover:text-gray-900"
        active-class="text-blue-600 font-semibold"
      >
        History
      </RouterLink>
    </nav>
    <main class="flex-1">
      <RouterView />
    </main>
  </div>
</template>
