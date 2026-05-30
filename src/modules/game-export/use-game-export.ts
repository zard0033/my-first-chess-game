import { ref, onScopeDispose } from 'vue'
import type { CompletedGame } from '../../stores/game-store'
import type { ExportConfig } from './types'
import { assembleExportPayload } from './assembler'

export type ExportState = 'IDLE' | 'SHARING' | 'COPYING' | 'SUCCESS' | 'FALLBACK'

/** Injectable navigator surface for unit testing. */
export interface NavigatorDeps {
  share?: (data: ShareData) => Promise<void>
  canShare?: (data: ShareData) => boolean
  clipboard?: { writeText: (text: string) => Promise<void> }
}

export function useGameExport(game: CompletedGame, config: ExportConfig, nav?: NavigatorDeps) {
  const state = ref<ExportState>('IDLE')
  const fallbackText = ref('')

  const _nav = nav ?? navigator

  async function onExportTap(): Promise<void> {
    if (state.value === 'SHARING' || state.value === 'COPYING') return

    const payload = assembleExportPayload(game, config)

    if (_nav.share && _nav.canShare?.({ text: payload })) {
      // Tier 1: Web Share API
      state.value = 'SHARING'
      try {
        await _nav.share({ text: payload })
        state.value = 'SUCCESS'
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          state.value = 'IDLE'
        } else {
          fallbackText.value = payload
          state.value = 'FALLBACK'
        }
      }
    } else if (_nav.clipboard) {
      // Tier 2: Clipboard API
      state.value = 'COPYING'
      try {
        await _nav.clipboard.writeText(payload)
        state.value = 'SUCCESS'
      } catch {
        fallbackText.value = payload
        state.value = 'FALLBACK'
      }
    } else {
      // Tier 3: FALLBACK textarea
      fallbackText.value = payload
      state.value = 'FALLBACK'
    }
  }

  function dismissFallback(): void {
    state.value = 'IDLE'
    fallbackText.value = ''
  }

  onScopeDispose(() => {
    // No timers to clear — placeholder for future cleanup
  })

  return { state, fallbackText, onExportTap, dismissFallback }
}
