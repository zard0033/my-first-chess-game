import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

/**
 * UI-layer preferences and transient display state.
 * Preferences persist to localStorage so they survive reloads (board coordinate
 * labels, future board theme override, sidebar state, etc.).
 */
const COORDS_KEY = 'ui:showCoordinates'
const BEATEN_KEY = 'ui:highestBeatenLevel'

function loadBool(key: string, fallback: boolean): boolean {
  if (typeof localStorage === 'undefined') return fallback
  const raw = localStorage.getItem(key)
  return raw === null ? fallback : raw === 'true'
}

function loadIntOrNull(key: string): number | null {
  if (typeof localStorage === 'undefined') return null
  const raw = localStorage.getItem(key)
  if (raw === null) return null
  const n = Number.parseInt(raw, 10)
  return Number.isNaN(n) ? null : n
}

export const useUiStore = defineStore('ui', () => {
  // Show a–h / 1–8 coordinate labels around the board (default off).
  const showCoordinates = ref(loadBool(COORDS_KEY, false))

  watch(showCoordinates, (value) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(COORDS_KEY, String(value))
  })

  function toggleCoordinates(): void {
    showCoordinates.value = !showCoordinates.value
  }

  // Highest Stockfish Skill Level (0–20) the player has beaten — drives the
  // "you cleared this last time, try the next one" hint in the play-setup modal.
  const highestBeatenLevel = ref<number | null>(loadIntOrNull(BEATEN_KEY))

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

  return { showCoordinates, toggleCoordinates, highestBeatenLevel, recordWin }
})
