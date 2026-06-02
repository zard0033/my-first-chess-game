<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { onBeforeRouteLeave } from 'vue-router'
import { storeToRefs } from 'pinia'
import ChessBoard from '@/components/chess-board.vue'
import type { MoveMadePayload } from '@/composables/use-chess-board'
import { useGameLifecycle } from '@/modules/game-lifecycle/use-game-lifecycle'
import { usePlayEngine } from '@/modules/chess-engine/play-engine'
import { useGameStore } from '@/stores/game-store'
import { createLeaveGuard, useNavigationGuards } from '@/composables/use-navigation-guards'

const router = useRouter()
const gameStore = useGameStore()
const { isGameInProgress } = storeToRefs(gameStore)

// NOTE: router is NOT passed to useGameLifecycle intentionally.
// onGameTerminal() disarms the navigation guard (setGameInProgress(false)) and writes
// completedGame, but does NOT auto-navigate — the GAME_OVER overlay gives the player
// the choice to review or start a new game (ADR-0005 §5).
const lifecycle = useGameLifecycle()
const { phase, playerColor, fen, terminal } = lifecycle

const engine = usePlayEngine()

onBeforeRouteLeave(createLeaveGuard(() => gameStore.isGameInProgress))
useNavigationGuards(isGameInProgress, (path) => router.push(path))

// Board is disabled while AI is thinking or game is over
const boardDisabled = computed(() =>
  phase.value === 'AI_THINKING' || phase.value === 'GAME_OVER'
)

onMounted(async () => {
  try {
    await engine.init()
  } catch {
    console.warn('Stockfish unavailable — playing without AI')
  }
  lifecycle.startGame('white', 10)
})

async function handleMoveMade(payload: MoveMadePayload): Promise<void> {
  gameStore.setGameInProgress(true)
  const result = lifecycle.handlePlayerMove(payload.from, payload.to, payload.promotion)
  if (result === false) return   // illegal or wrong phase
  if (result !== null) return    // terminal — overlay shows via phase reactivity

  // Non-terminal: wait for piece animation, then get AI move
  await payload.animationDoneAt

  if (engine.state.value !== 'IDLE') return

  try {
    const engineResult = await engine.play({ fen: fen.value, skillLevel: 10, movetimeMs: 3000 })
    if (!engineResult.bestMove || engineResult.bestMove === '(none)' || engineResult.bestMove === '0000') return
    lifecycle.handleAiMove(engineResult.bestMove)
  } catch {
    // Engine error — treat as AI resignation so the board doesn't stay permanently disabled
    lifecycle.handleAiMove('0000')
  }
}

function handleNewGame(): void {
  lifecycle.resetToSetup()
  gameStore.clearCompletedGame()
  lifecycle.startGame('white', 10)
}

function handleReview(): void {
  // isGameInProgress is already false (onGameTerminal set it before showing the overlay)
  // completedGame is already set (onGameTerminal set it)
  router.push('/review')
}

// ---- Result display helpers ----

const resultLabel = computed(() => {
  const r = terminal.value?.result
  if (!r) return ''
  return r === '1-0' ? 'White wins' : r === '0-1' ? 'Black wins' : 'Draw'
})

const endReasonLabel = computed(() => {
  const map: Record<string, string> = {
    checkmate: 'by checkmate',
    stalemate: 'by stalemate',
    threefold: 'by threefold repetition',
    'insufficient-material': 'by insufficient material',
    'fifty-move': 'by 50-move rule',
    resignation: 'by resignation',
  }
  const reason = terminal.value?.endReason
  return reason ? (map[reason] ?? reason) : ''
})

// ---- DEV: FEN injection tool ----

const isDev = import.meta.env.DEV
const devFenInput = ref('')

function injectFen(): void {
  const trimmed = devFenInput.value.trim()
  if (trimmed) lifecycle.setDevFen(trimmed)
}
</script>

<template>
  <div class="flex flex-col items-center p-4">
    <h1 class="font-display text-2xl font-semibold mb-4 text-ink">Play</h1>

    <!-- Board + GAME_OVER overlay container -->
    <div class="relative">
      <ChessBoard
        :fen="fen"
        :playerColor="playerColor"
        :disabled="boardDisabled"
        @move-made="handleMoveMade"
      />

      <!-- GAME_OVER overlay — covers board area -->
      <div
        v-if="phase === 'GAME_OVER'"
        class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 rounded"
      >
        <div class="card p-6 shadow-card-hover text-center min-w-[240px] z-50">
          <p class="font-display text-xl font-semibold mb-1 text-ink">{{ resultLabel }}</p>
          <p class="text-sm text-ink-muted mb-5">{{ endReasonLabel }}</p>
          <div class="flex gap-3 justify-center">
            <button class="btn btn-primary" @click="handleNewGame">New Game</button>
            <button class="btn btn-secondary" @click="handleReview">Review</button>
          </div>
        </div>
      </div>
    </div>

    <!-- DEV ONLY: FEN injection tool for testing rare game states -->
    <div
      v-if="isDev"
      class="mt-4 p-3 bg-yellow-100 border border-yellow-400 rounded text-sm flex items-center gap-2"
    >
      <span class="font-mono font-bold text-yellow-800">DEV</span>
      <input
        v-model="devFenInput"
        class="border border-yellow-400 px-2 py-1 w-80 font-mono text-xs rounded"
        placeholder="Paste FEN to inject board position…"
        @keyup.enter="injectFen"
      />
      <button
        class="px-3 py-1 bg-yellow-400 hover:bg-yellow-500 rounded font-semibold"
        @click="injectFen"
      >
        Set FEN
      </button>
    </div>
  </div>
</template>
