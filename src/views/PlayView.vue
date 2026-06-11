<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import ChessBoard from '@/components/chess-board.vue'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DarkPanel } from '@/components/ui/gambit'
import type { MoveMadePayload } from '@/composables/use-chess-board'
import { useGameLifecycle } from '@/modules/game-lifecycle/use-game-lifecycle'
import { usePlayEngine } from '@/modules/chess-engine/play-engine'
import { useGameStore } from '@/stores/game-store'
import { useUiStore } from '@/stores/ui-store'
import { useResumeGameStore } from '@/stores/resume-game'

const router = useRouter()
const gameStore = useGameStore()
const uiStore = useUiStore()
const resumeStore = useResumeGameStore()

// NOTE: router is NOT passed to useGameLifecycle intentionally.
// onGameTerminal() disarms the navigation guard (setGameInProgress(false)) and writes
// completedGame, but does NOT auto-navigate — the GAME_OVER overlay gives the player
// the choice to review or start a new game (ADR-0005 §5).
const lifecycle = useGameLifecycle()
const { phase, playerColor, fen, terminal, moveHistory, lastMove } = lifecycle

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

// Undo / resign both confirm via a popup so a stray tap can't revert or forfeit.
const confirmAction = ref<'undo' | 'resign' | null>(null)
const confirmOverlay = ref<HTMLElement | null>(null)
const CONFIRM_COPY = {
  undo: { title: '確定要悔棋嗎？', body: '這會收回你和對手的上一步。', cta: '確定悔棋', danger: false },
  resign: { title: '確定要認輸嗎？', body: '這盤棋會以認輸結束，無法復原。', cta: '確定認輸', danger: true },
} as const
// Move-record scroll container — auto-scrolled to the latest move.
const moveScroll = ref<HTMLElement | null>(null)

// Player-side identity row — real pawn piece icon (BASE_URL prefix avoids 404 on Pages subpath).
const pieceBase = import.meta.env.BASE_URL
const playerPawnSrc = computed(() => `${pieceBase}pieces/${playerColor.value === 'white' ? 'wP' : 'bP'}.svg`)
const sideLabel = computed(() => (playerColor.value === 'white' ? '你執白' : '你執黑'))

function runConfirm(): void {
  if (confirmAction.value === 'undo') lifecycle.undo()
  else if (confirmAction.value === 'resign') lifecycle.resign()
  confirmAction.value = null
}

// Focus the popup when it opens so Esc / keyboard works.
watch(confirmAction, async (v) => {
  if (v) {
    await nextTick()
    confirmOverlay.value?.focus()
  }
})

watch(
  () => moveHistory.value.length,
  async () => {
    await nextTick()
    if (moveScroll.value) moveScroll.value.scrollTop = moveScroll.value.scrollHeight
  },
)

const engine = usePlayEngine()

// Skill Level (0–20) chosen for the current game — used for engine.play and win-recording.
const chosenLevel = ref(3)

// Board is playable only on the player's turn (disabled while AI thinks, game over, or no game).
const boardDisabled = computed(() => phase.value !== 'PLAYER_TURN')

/** Start a game from a confirmed setup payload (from the global modal via the ui store). */
function startFromPayload(payload: { color: 'white' | 'black'; level: number }): void {
  void resumeStore.clear() // a fresh game replaces any saved in-progress one (含「另開新對局」)
  chosenLevel.value = payload.level
  lifecycle.startGame(payload.color, payload.level)
  // Player chose black → engine moves first.
  if (lifecycle.phase.value === 'AI_THINKING') void requestAiMove()
}

/** Restore the saved in-progress game (from the home "繼續對局" card). Returns false if it failed. */
function resumeSavedGame(): boolean {
  const snap = resumeStore.current
  if (!snap || !lifecycle.restoreGame(snap)) return false
  chosenLevel.value = snap.level
  gameStore.setGameInProgress(true)
  if (lifecycle.phase.value === 'AI_THINKING') void requestAiMove()
  return true
}

// Persist after every move so a refresh / tab-close / crash can still resume. Threshold: at least one
// move played (an untouched board is not worth a "繼續對局" card). Skipped once the game is over.
watch(
  () => moveHistory.value.length,
  (len) => {
    if (len >= 1 && (phase.value === 'PLAYER_TURN' || phase.value === 'AI_THINKING')) {
      resumeStore.saveLocal(lifecycle.getResumeSnapshot())
    }
  },
)

// Game finished → it is no longer resumable; drop the saved snapshot (local + cloud).
watch(terminal, (t) => {
  if (t) void resumeStore.clear()
})

// Leaving the board → push the latest local snapshot to the cloud (best-effort; no-op logged out).
onBeforeUnmount(() => {
  if (resumeStore.hasResume) void resumeStore.syncToCloud()
})

/** Consume a pending setup (set by the global modal) and start the game. */
function consumePending(): void {
  const g = uiStore.consumePendingGame()
  if (g) startFromPayload(g)
}

// Fires for new games requested while already on /play (e.g. 再來一局, or the 對局 nav tab).
watch(() => uiStore.pendingGame, (g) => { if (g) consumePending() })

// If the modal is dismissed with no game started, leave the empty board → back home.
watch(() => uiStore.showPlaySetup, (open) => {
  if (!open && !uiStore.pendingGame && !gameStore.isGameInProgress && phase.value !== 'GAME_OVER') {
    router.push('/')
  }
})

onMounted(async () => {
  try {
    await engine.init()
  } catch {
    console.warn('Stockfish unavailable — playing without AI')
  }
  // Resume intent (home "繼續對局") → restore the saved game; else a setup confirmation → start;
  // else open the setup modal. A failed restore falls back to setup so the player is never stuck.
  if (uiStore.consumeResume()) {
    if (!resumeSavedGame()) uiStore.openPlaySetup()
  } else if (uiStore.pendingGame) consumePending()
  else if (!gameStore.isGameInProgress) uiStore.openPlaySetup()
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
  confirmAction.value = null
  uiStore.openPlaySetup()   // re-open the global setup modal (over /play)
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

// ---- DEV: FEN injection tool (hidden by default; toggle with Ctrl+Shift+F in dev) ----

const isDev = import.meta.env.DEV
const devToolsOpen = ref(false)
const devFenInput = ref('')

function injectFen(): void {
  const trimmed = devFenInput.value.trim()
  if (trimmed) lifecycle.setDevFen(trimmed)
}

function handleDevToggle(e: KeyboardEvent): void {
  if (e.ctrlKey && e.shiftKey && (e.key === 'F' || e.key === 'f')) {
    e.preventDefault()
    devToolsOpen.value = !devToolsOpen.value
  }
}

if (isDev) {
  onMounted(() => window.addEventListener('keydown', handleDevToggle))
  onBeforeUnmount(() => window.removeEventListener('keydown', handleDevToggle))
}
</script>

<template>
  <div class="flex min-h-full flex-col items-center overflow-x-hidden bg-surface-deep p-4">
    <h1 class="sr-only" tabindex="-1">對局</h1>

    <!-- Desktop: board + panel as a centred two-column group; board scales with viewport height,
         panel stays adjacent to its right (no floating gap). Stacked + centred on mobile. -->
    <div
      class="flex w-full flex-col items-center gap-4 md:flex-row md:items-start md:justify-center md:gap-6"
    >
      <!-- framed board (wooden tray) + GAME_OVER overlay; scales by viewport height, capped so the
           adjacent panel still fits (no overlap / overflow). -->
      <div
        class="relative w-full shrink-0 max-w-[min(92vw,28rem)] rounded-[12px] bg-[linear-gradient(160deg,#6f4b30,#523722)] p-3 ring-1 ring-black/30 shadow-[0_12px_32px_rgba(10,30,24,0.45),inset_0_1px_0_rgba(255,228,194,0.20),inset_0_-2px_6px_rgba(0,0,0,0.38)] md:w-[min(74vh,calc(100vw_-_26rem),56rem)] md:max-w-none"
      >
        <ChessBoard
          :fen="fen"
          :playerColor="playerColor"
          :disabled="boardDisabled"
          :coordinates="true"
          :last-move="lastMove"
          @move-made="handleMoveMade"
        />

        <!-- GAME_OVER overlay — covers the board (leaves the wood frame visible) -->
        <div
          v-if="phase === 'GAME_OVER'"
          class="game-over-overlay absolute inset-2 z-50 flex flex-col items-center justify-center rounded-[6px] bg-ink/60"
        >
          <Card :accent="playerWon" class="go-card z-50 min-w-[240px] p-6 text-center shadow-card-hover">
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

      <!-- Right column: info panel (對手 + 棋譜 + 悔棋/投降), adjacent to the board on desktop. -->
      <div
        v-if="phase === 'PLAYER_TURN' || phase === 'AI_THINKING'"
        class="w-full max-w-[min(92vw,28rem)] md:w-[20rem] md:max-w-none"
      >
        <DarkPanel>
          <!-- 側板文字統一 Cubic 11（font-num），與 eval 一致 -->
          <div class="font-num">
          <!-- 密度列：回合狀態 ｜ 身分（執子 + 對手等級）合併成一條，省垂直空間，手機一屏可見。
               輪到你以金色 indicator 強調（Gambit 金＝focus/reward）；AI 思考時左段換成呼吸點。 -->
          <div
            class="mb-3 flex items-center gap-1.5 whitespace-nowrap rounded-[10px] border border-white/10 bg-white/[0.05] px-3 py-2 text-[14px] tabular-nums shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
          >
            <template v-if="phase === 'PLAYER_TURN'">
              <span
                class="turn-dot h-2.5 w-2.5 shrink-0 rounded-full bg-gold shadow-[0_0_8px_rgba(248,181,0,0.85)]"
                aria-hidden="true"
              />
              <span class="id-text shrink-0 font-bold text-ink-on-deep">輪到你</span>
            </template>
            <template v-else>
              <span class="id-text ai-breathe shrink-0 text-ink-on-deep-dim">思考中</span>
              <span class="thinking-dots shrink-0 tracking-[2px] text-ink-on-deep-dim" aria-hidden="true">●●●</span>
            </template>

            <span class="mx-0.5 h-3.5 w-px shrink-0 bg-white/15" aria-hidden="true" />

            <span
              class="inline-block h-5 w-5 shrink-0 bg-contain bg-center bg-no-repeat"
              :style="{
                backgroundImage: `url(${playerPawnSrc})`,
                ...(playerColor === 'black' ? { filter: 'brightness(var(--piece-dark-brightness))' } : {}),
              }"
              aria-hidden="true"
            />
            <span class="id-text shrink-0 font-bold text-ink-on-deep">{{ sideLabel }}</span>
            <span class="id-text min-w-0 shrink-0 truncate text-ink-on-deep-dim">· Lv.{{ chosenLevel }}</span>
          </div>

          <!-- 棋譜表：標題列收進框內（代碼區塊感）；下方序號 | 白 | 黑。
               面板貼合內容高度；棋譜捲動區加上限（手機 9rem、桌機 12rem），超出內捲、不撐大側板。 -->
          <div class="rounded-lg border border-white/10 bg-black/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <p class="border-b border-white/10 px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-wider text-ink-on-deep-dim">棋譜</p>
            <div
              ref="moveScroll"
              class="max-h-[9rem] overflow-y-auto p-2.5 font-num text-[14px] leading-relaxed tabular-nums text-ink-on-deep md:max-h-[12rem]"
            >
              <p v-if="!movePairs.length" class="text-ink-on-deep-dim">尚無棋步</p>
              <div
                v-for="p in movePairs"
                :key="p.n"
                class="grid grid-cols-[2.5rem_1fr_1fr] gap-1 px-1 py-0.5"
              >
                <span class="text-ink-on-deep-dim">{{ p.n }}.</span>
                <span>{{ p.w }}</span>
                <span>{{ p.b }}</span>
              </div>
            </div>
          </div>

          <!-- 控制：悔棋（中性）/ 投降（紅色 destructive）；兩者皆彈窗二次確認，防誤觸 -->
          <div class="mt-3 flex gap-2">
            <button
              type="button"
              class="min-h-[44px] flex-1 rounded-btn border border-white/10 bg-white/[0.06] text-sm font-semibold text-ink-on-deep transition-colors hover:bg-white/[0.10] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:pointer-events-none disabled:opacity-40"
              :disabled="!canUndo"
              @click="confirmAction = 'undo'"
            >悔棋</button>
            <button
              type="button"
              class="min-h-[44px] flex-1 rounded-btn border border-danger/50 bg-danger/15 text-sm font-semibold text-[#EC9C84] transition-colors hover:bg-danger/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:pointer-events-none disabled:opacity-40"
              :disabled="!canResign"
              @click="confirmAction = 'resign'"
            >投降</button>
          </div>
          </div>
        </DarkPanel>
      </div>
    </div>

    <!-- 悔棋 / 投降 確認彈窗（置中、全螢幕 dim；Esc 或點背景可取消） -->
    <div
      v-if="confirmAction"
      ref="confirmOverlay"
      class="game-over-overlay fixed inset-0 z-[60] flex items-center justify-center bg-ink/60 p-4"
      role="dialog"
      aria-modal="true"
      tabindex="-1"
      @keydown.esc="confirmAction = null"
      @click.self="confirmAction = null"
    >
      <Card class="go-card w-full max-w-[300px] p-6 text-center shadow-card-hover">
        <p class="mb-1 font-display text-lg font-bold text-ink">{{ CONFIRM_COPY[confirmAction].title }}</p>
        <p class="mb-5 text-sm text-ink-muted">{{ CONFIRM_COPY[confirmAction].body }}</p>
        <div class="flex justify-center gap-3">
          <Button variant="secondary" class="flex-1" @click="confirmAction = null">取消</Button>
          <Button
            :variant="CONFIRM_COPY[confirmAction].danger ? 'danger' : 'default'"
            class="flex-1"
            @click="runConfirm"
          >{{ CONFIRM_COPY[confirmAction].cta }}</Button>
        </div>
      </Card>
    </div>

    <!-- DEV ONLY: FEN injection tool — hidden by default, toggle with Ctrl+Shift+F -->
    <div
      v-if="isDev && devToolsOpen"
      class="mt-4 flex w-full max-w-[min(92vw,28rem)] flex-wrap items-center gap-2 rounded border border-yellow-400 bg-yellow-100 p-3 text-sm"
    >
      <span class="font-mono font-bold text-yellow-800">DEV</span>
      <Input
        v-model="devFenInput"
        class="min-h-0 w-full min-w-0 flex-1 border-yellow-400 bg-white py-1 font-mono text-xs"
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

@keyframes turn-dot-breathe {
  0%, 100% { opacity: 0.6; transform: scale(0.9); }
  50% { opacity: 1; transform: scale(1.1); }
}
.turn-dot {
  animation: turn-dot-breathe 2s ease-in-out infinite;
}

@keyframes ai-breathe {
  0%, 100% { opacity: 0.72; }
  50% { opacity: 1; }
}
.ai-breathe {
  animation: ai-breathe 2s ease-in-out infinite;
}

/* vue3-chessboard 預設用 70vh（視窗高）決定棋盤大小、無視容器寬，在固定寬的木框內會橫向溢出
   蓋住側板。覆寫成填滿木框寬、用 aspect-ratio 維持正方，讓棋盤跟著木框寬度走。 */
:deep(.main-wrap),
:deep(.main-board) {
  width: 100% !important;
  height: auto !important;
  max-width: none !important;
}
:deep(.cg-wrap) {
  width: 100% !important;
  height: auto !important;
  aspect-ratio: 1 / 1;
}

/* Cubic 11 像素字 glyph 在字框內偏上，與棋子圖示並排時看起來偏高；微幅下推對齊棋子視覺中心。 */
.id-text {
  transform: translateY(1.5px);
}

@keyframes game-over-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
.game-over-overlay {
  animation: game-over-in 200ms ease-out;
}
@keyframes go-card-in {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}
.go-card {
  animation: go-card-in 220ms ease-out;
}

@media (prefers-reduced-motion: reduce) {
  .thinking-dots,
  .turn-dot,
  .ai-breathe,
  .game-over-overlay,
  .go-card {
    animation: none;
  }
}
</style>
