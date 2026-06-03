<script setup lang="ts">
// Decorative starting position — board is the protagonist, even at rest (aria-hidden).
const BACK = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
type Cell = { piece: string | null; light: boolean }
const board: Cell[] = []
for (let row = 0; row < 8; row++) {
  for (let col = 0; col < 8; col++) {
    let code: string | null = null
    if (row === 0) code = 'b' + BACK[col]
    else if (row === 1) code = 'bP'
    else if (row === 6) code = 'wP'
    else if (row === 7) code = 'w' + BACK[col]
    board.push({ piece: code, light: (row + col) % 2 === 0 })
  }
}

const features = [
  { to: '/learn', piece: 'wP', title: '學習課程', desc: '從規則到戰術，跟教練貝絲一步步看懂棋盤。' },
  { to: '/play', piece: 'wN', title: '對局練習', desc: '與沉著的引擎對弈，壓力來自局面本身。' },
  { to: '/history', piece: 'wR', title: '棋局複盤', desc: '回顧走過的每一步，看清當時真正發生了什麼。' },
]
</script>

<template>
  <div class="max-w-6xl mx-auto px-6 py-12 lg:py-20">
    <!-- Hero -->
    <div class="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
      <div class="order-2 lg:order-1 text-center lg:text-left">
        <h1
          class="font-display font-semibold text-display-sm sm:text-display text-ink leading-tight mb-5"
          tabindex="-1"
        >
          在安靜的棋盤前，<br />把每一步想清楚。
        </h1>
        <p class="text-ink-muted text-lg leading-relaxed mb-8 max-w-md mx-auto lg:mx-0">
          與教練貝絲·哈蒙一起，從零開始學象棋。沒有計時、沒有評分，只有你與局面。
        </p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
          <RouterLink to="/learn" class="btn btn-primary text-base px-8">開始學習</RouterLink>
          <RouterLink to="/play" class="btn btn-secondary text-base px-8">隨手下一盤</RouterLink>
        </div>
      </div>

      <!-- Decorative board -->
      <div class="order-1 lg:order-2 flex justify-center">
        <div
          class="grid grid-cols-8 w-full max-w-[22rem] aspect-square rounded-card overflow-hidden shadow-card ring-1 ring-line-strong/40 bg-cover"
          style="background-image: url('/board/wood12.jpg'); background-size: 100% 100%"
          aria-hidden="true"
        >
          <div
            v-for="(cell, i) in board"
            :key="i"
            class="relative"
          >
            <img
              v-if="cell.piece"
              :src="`/pieces/${cell.piece}.svg`"
              alt=""
              class="absolute inset-0 w-full h-full p-[6%] select-none pointer-events-none"
              draggable="false"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Feature cards -->
    <div class="grid sm:grid-cols-3 gap-4 mt-16 lg:mt-24">
      <RouterLink
        v-for="f in features"
        :key="f.to"
        :to="f.to"
        class="card-interactive p-6 flex flex-col gap-2 min-h-[44px]"
      >
        <span class="w-10 h-10 rounded-card bg-surface-raised border border-line flex items-center justify-center" aria-hidden="true">
          <img :src="`/pieces/${f.piece}.svg`" alt="" class="w-6 h-6" draggable="false" />
        </span>
        <span class="font-display font-semibold text-lg text-ink mt-1">{{ f.title }}</span>
        <span class="text-sm text-ink-muted leading-relaxed">{{ f.desc }}</span>
      </RouterLink>
    </div>
  </div>
</template>
