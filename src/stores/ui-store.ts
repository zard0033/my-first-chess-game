import { defineStore } from 'pinia'

/**
 * UI-layer preferences and transient display state.
 * ADR-0005 Decision §1: v0 has only gameStore for cross-system state.
 * This store is a Sprint 2+ placeholder for UI preferences (sidebar state,
 * board theme override, etc.) that don't fit in gameStore.
 */
export const useUiStore = defineStore('ui', () => {
  // Sprint 2: add board orientation preference, sidebar collapse state, etc.
  return {}
})
