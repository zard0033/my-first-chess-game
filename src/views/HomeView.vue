<template>
  <div class="flex flex-col items-center p-8">
    <h1 class="text-3xl font-bold mb-6" tabindex="-1">Chess Training Companion</h1>
    <div class="flex flex-col items-center gap-3">
      <RouterLink
        to="/play"
        class="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Start Playing
      </RouterLink>
      <RouterLink
        to="/learn"
        class="px-6 py-3 bg-emerald-600 text-white rounded hover:bg-emerald-700"
      >
        學習課程
      </RouterLink>
    </div>
  </div>
</template>
