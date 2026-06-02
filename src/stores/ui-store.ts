import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

/**
 * UI-layer preferences and transient display state.
 * Preferences persist to localStorage so they survive reloads (board coordinate
 * labels, future board theme override, sidebar state, etc.).
 */
const COORDS_KEY = 'ui:showCoordinates'

function loadBool(key: string, fallback: boolean): boolean {
  if (typeof localStorage === 'undefined') return fallback
  const raw = localStorage.getItem(key)
  return raw === null ? fallback : raw === 'true'
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

  return { showCoordinates, toggleCoordinates }
})
