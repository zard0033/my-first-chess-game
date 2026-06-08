<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { onBeforeRouteLeave } from 'vue-router'
import { storeToRefs } from 'pinia'
import ChessBoard from '@/components/chess-board.vue'
import PlaySetupModal from '@/components/play-setup-modal.vue'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Pill } from '@/components/ui/gambit'
import type { MoveMadePayload } from '@/composables/use-chess-board'
import { useGameLifecycle } from '@/modules/game-lifecycle/use-game-lifecycle'
import { usePlayEngine } from '@/modules/chess-engine/play-engine'
import { useGameStore } from '@/stores/game-store'
import { useUiStore } from '@/stores/ui-store'
import { createLeaveGuard, useNavigationGuards } from '@/composables/use-navigation-guards'

const router = useRouter()
const gameStore = useGameStore()
const uiStore = useUiStore()
const { isGameInProgress } = storeToRefs(gameStore)

// NOTE: router is NOT passed to useGameLifecycle intentionally.
// onGameTerminal() disarms the navigation guard (setGameInProgress(false)) and writes
// completedGame, but does NOT auto-navigate — the GAME_OVER overlay gives the player
// the choice to review or start a new game (ADR-0005 §5).
const lifecycle = useGameLifecycle()
const { phase, playerColor, fen, terminal, moveHistory } = lifecycle

// In-game move record — SAN grouped into numbered pairs (white, black) for display.
const movePairs = computed(() => {
  const pairs: { n: number; w: string; b?: string }[] = []
  for (let i = 0; i < moveHistory.value.length; i += 2) {
    pairs.push({ n: i / 2 + 1, w: moveHistory.value[i], b: moveHistory.value[i + 1] })
  }
  return pairs
})
const canUndo = computed(() => phase.value === 'PLAYER_TURN' && moveHistory.value.length >= 2)
const canResign = computed(() => phase.value === 'PLAYER_TURN' || phase.value === 'AI_THINKING')

function handleUndo(): void {
  lifecycle.undo()
}
function handleResign(): void {
  lifecycle.resign()
}

const engine = usePlayEngine()

// Show the pre-game setup modal (strength + side) before any game starts (Lichess pattern).
const showSetup = ref(true)
// Skill Level (0–20) chosen for the current game — used for engine.play and win-recording.
const chosenLevel = ref(3)

onBeforeRouteLeave(createLeaveGuard(() => gameStore.isGameInProgress))
useNavigationGuards(isGameInProgress, (path) => router.push(path))

// Board is disabled during setup, while AI is thinking, or when the game is over.
const boardDisabled = computed(() =>
  showSetup.value || phase.value === 'AI_THINKING' || phase.value === 'GAME_OVER'
)

onMounted(async () => {
  try {
    await engine.init()
  } catch {
    console.warn('Stockfish unavailable — playing without AI')
  }
})

/** Ask the engine for a move from the current position and apply it. */
async function requestAiMove(): Promise<void> {
  if (engine.state.value !== 'IDLE') return
  try {
    const engineResult = await engine.play({ fen: fen.value, skillLevel: chosenLevel.value, movetimeMs: 3000 })
    if (!engineResult.bestMove || engineResult.bestMove === '(none)' || engineResult.bestMove === '0000') {
      lifecycle.handleAiMove('0000')
      return
    }
    lifecycle.handleAiMove(engineResult.bestMove)
  } catch {
    // Engine error — treat as AI resignation so the board doesn't stay permanently disabled
    lifecycle.handleAiMove('0000')
  }
}

function handleStart(payload: { color: 'white' | 'black'; level: number }): void {
  chosenLevel.value = payload.level
  showSetup.value = false
  lifecycle.startGame(payload.color, payload.level)
  // Player chose black → engine moves first.
  if (lifecycle.phase.value === 'AI_THINKING') void requestAiMove()
}

// Dismissing the setup with no game started → leave the page (back to home).
function handleClose(): void {
  router.push('/')
}

async function handleMoveMade(payload: MoveMadePayload): Promise<void> {
  gameStore.setGameInProgress(true)
  const result = lifecycle.handlePlayerMove(payload.from, payload.to, payload.promotion)
  if (result === false) return   // illegal or wrong phase
  if (result !== null) return    // terminal — overlay shows via phase reactivity

  // Non-terminal: wait for piece animation, then get AI move
  await payload.animationDoneAt
  void requestAiMove()
}

function handleNewGame(): void {
  lifecycle.resetToSetup()
  gameStore.clearCompletedGame()
  showSetup.value = true   // re-open setup so strength/side can be re-picked
}

function handleReview(): void {
  // isGameInProgress is already false (onGameTerminal set it before showing the overlay)
  // completedGame is already set (onGameTerminal set it)
  router.push('/review')
}

// ---- Result display helpers ----

const playerWon = computed(() => {
  const r = terminal.value?.result
  if (!r || r === '1/2-1/2') return false
  return (r === '1-0' && playerColor.value === 'white') || (r === '0-1' && playerColor.value === 'black')
})

const isDraw = computed(() => terminal.value?.result === '1/2-1/2')

const resultLabel = computed(() => {
  if (!terminal.value) return ''
  return isDraw.value ? '和局' : playerWon.value ? '你贏了！' : '你輸了'
})

const endReasonLabel = computed(() => {
  const map: Record<string, string> = {
    checkmate: '將死',
    stalemate: '逼和',
    threefold: '三次重複局面',
    'insufficient-material': '子力不足',
    'fifty-move': '五十步和棋',
    resignation: '認輸',
  }
  const reason = terminal.value?.endReason
  return reason ? (map[reason] ?? reason) : ''
})

// Record a win at the chosen Skill Level so the setup modal can nudge to the next rung.
watch(terminal, (t) => {
  if (t && playerWon.value) uiStore.recordWin(chosenLevel.value)
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
  <div class="flex min-h-full flex-col items-center bg-surface-deep p-4">
    <h1 class="sr-only" tabindex="-1">對局</h1>

    <!-- 回合徽章 -->
    <div
      v-if="phase === 'PLAYER_TURN' || phase === 'AI_THINKING'"
      class="mb-3 flex justify-center"
    >
      <Pill v-if="phase === 'PLAYER_TURN'" tone="jade">
        <span class="h-[7px] w-[7px] rounded-full bg-white" aria-hidden="true" />
        輪到你
      </Pill>
      <span
        v-else
        class="inline-flex items-center gap-2 rounded-full border-t border-white/10 bg-[linear-gradient(180deg,#1E5043,#183E35)] px-4 py-2 font-num text-[13px] text-ink-on-deep-dim shadow-[inset_0_1px_0_rgba(255,255,255,0.10)]"
      >AI 思考中 <span class="thinking-dots tracking-[2px]" aria-hidden="true">●●●</span></span>
    </div>

    <!-- Pre-game setup: strength + side. Confirming starts the game. -->
    <PlaySetupModal
      v-if="showSetup"
      :beaten-level="uiStore.highestBeatenLevel"
      @start="handleStart"
      @close="handleClose"
    />

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
        class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-ink/60 rounded"
      >
        <Card :accent="playerWon" class="z-50 min-w-[240px] p-6 text-center shadow-card-hover">
          <p
            class="mb-1 font-display text-xl font-bold"
            :class="playerWon ? 'text-gold-dark' : 'text-ink'"
          >{{ resultLabel }}</p>
          <p class="mb-5 text-sm text-ink-muted">{{ endReasonLabel }}</p>
          <div class="flex justify-center gap-3">
            <Button :variant="playerWon ? 'gold' : 'default'" @click="handleNewGame">再來一局</Button>
            <Button variant="secondary" @click="handleReview">複盤</Button>
          </div>
        </Card>
      </div>
    </div>

    <!-- In-game HUD: move record (棋譜) + 悔棋 / 投降. Shown only while a game is live. -->
    <div
      v-if="phase === 'PLAYER_TURN' || phase === 'AI_THINKING'"
      class="mt-4 w-full max-w-[min(92vw,28rem)]"
    >
      <div
        class="rounded-card border border-white/10 bg-surface-deep-2 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
      >
        <p class="mb-2 text-[11px] font-medium uppercase tracking-wider text-ink-on-deep-dim">棋譜</p>
        <div class="max-h-24 overflow-y-auto font-num text-[13px] leading-relaxed text-ink-on-deep">
          <span v-if="!movePairs.length" class="text-ink-on-deep-dim">尚無棋步</span>
          <span v-for="p in movePairs" :key="p.n" class="mr-3 inline-block tabular-nums">
            <span class="text-ink-on-deep-dim">{{ p.n }}.</span> {{ p.w }}<template v-if="p.b"> {{ p.b }}</template>
          </span>
        </div>
        <div class="mt-3 flex gap-2">
          <Button variant="secondary" size="sm" class="flex-1" :disabled="!canUndo" @click="handleUndo"
            >悔棋</Button
          >
          <Button variant="secondary" size="sm" class="flex-1" :disabled="!canResign" @click="handleResign"
            >投降</Button
          >
        </div>
      </div>
    </div>

    <!-- DEV ONLY: FEN injection tool for testing rare game states -->
    <div
      v-if="isDev"
      class="mt-4 p-3 bg-yellow-100 border border-yellow-400 rounded text-sm flex items-center gap-2"
    >
      <span class="font-mono font-bold text-yellow-800">DEV</span>
      <Input
        v-model="devFenInput"
        class="min-h-0 w-80 border-yellow-400 bg-white py-1 font-mono text-xs"
        placeholder="Paste FEN to inject board position…"
        @keyup.enter="injectFen"
      />
      <Button
        size="sm"
        class="bg-yellow-400 text-yellow-900 shadow-none hover:bg-yellow-500"
        @click="injectFen"
      >
        Set FEN
      </Button>
    </div>
  </div>
</template>

<style scoped>
@keyframes thinking-pulse {
  0%, 100% { opacity: 0.45; }
  50% { opacity: 1; }
}
.thinking-dots {
  animation: thinking-pulse 1.2s ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .thinking-dots {
    animation: none;
  }
}
</style>
