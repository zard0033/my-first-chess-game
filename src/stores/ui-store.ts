import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const BEATEN_KEY = 'ui:highestBeatenLevel'

function loadIntOrNull(key: string): number | null {
  if (typeof localStorage === 'undefined') return null
  const raw = localStorage.getItem(key)
  if (raw === null) return null
  const n = Number.parseInt(raw, 10)
  return Number.isNaN(n) ? null : n
}

export type PendingGame = { color: 'white' | 'black'; level: number }

export const useUiStore = defineStore('ui', () => {
  // Highest Stockfish Skill Level (0–20) the player has beaten — drives the
  // "you cleared this last time, try the next one" hint in the play-setup modal.
  const highestBeatenLevel = ref<number | null>(loadIntOrNull(BEATEN_KEY))

  // Play-setup modal is global (rendered in App.vue) so it opens over the CURRENT page;
  // only after the player confirms do we navigate to /play and start the game.
  const showPlaySetup = ref(false)
  const pendingGame = ref<PendingGame | null>(null)

  function openPlaySetup(): void {
    showPlaySetup.value = true
  }
  function closePlaySetup(): void {
    showPlaySetup.value = false
  }
  /** Player confirmed setup → stash the choice for PlayView and close the modal. */
  function requestGame(payload: PendingGame): void {
    pendingGame.value = payload
    showPlaySetup.value = false
  }
  /** PlayView pulls (and clears) the pending choice to start the game. */
  function consumePendingGame(): PendingGame | null {
    const g = pendingGame.value
    pendingGame.value = null
    return g
  }

  watch(highestBeatenLevel, (value) => {
    if (typeof localStorage === 'undefined') return
    if (value === null) localStorage.removeItem(BEATEN_KEY)
    else localStorage.setItem(BEATEN_KEY, String(value))
  })

  function recordWin(level: number): void {
    if (highestBeatenLevel.value === null || level > highestBeatenLevel.value) {
      highestBeatenLevel.value = level
    }
  }

  return {
    highestBeatenLevel,
    recordWin,
    showPlaySetup,
    pendingGame,
    openPlaySetup,
    closePlaySetup,
    requestGame,
    consumePendingGame,
  }
})
