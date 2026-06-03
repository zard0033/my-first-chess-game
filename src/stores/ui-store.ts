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

export const useUiStore = defineStore('ui', () => {
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

  return { highestBeatenLevel, recordWin }
})
