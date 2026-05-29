import { watch, onMounted, onUnmounted } from 'vue'
import type { Ref } from 'vue'

/**
 * Returns a beforeRouteLeave guard.
 * If a game is in progress, shows a confirm dialog; blocks navigation if user declines.
 */
export function createLeaveGuard(
  isInProgress: () => boolean,
  confirmFn: (msg: string) => boolean = window.confirm.bind(window),
) {
  return (_to: unknown, _from: unknown, next: (result?: false) => void): void => {
    if (isInProgress()) {
      if (!confirmFn('Abandon game?')) {
        next(false)
        return
      }
    }
    next()
  }
}

/**
 * Returns a popstate handler.
 * Synchronously restores the URL BEFORE showing the confirm dialog (prevents flicker).
 */
export function createPopstateHandler(
  isInProgress: () => boolean,
  pushStateFn: (url: string) => void,
  confirmFn: (msg: string) => boolean,
  navigate: (path: string) => unknown,
) {
  return (event: PopStateEvent): void => {
    if (!isInProgress()) return
    pushStateFn('/play')
    const ok = confirmFn('Abandon game?')
    if (ok) navigate((event.state as { back?: string } | null)?.back ?? '/')
  }
}

/**
 * Wires up beforeunload and popstate guards for PlayView.
 * Call from within a component's setup().
 */
export function useNavigationGuards(
  isGameInProgress: Ref<boolean>,
  routerPush: (path: string) => unknown,
): void {
  const beforeUnloadHandler = (event: BeforeUnloadEvent): void => {
    event.returnValue = ''
  }

  watch(
    isGameInProgress,
    (val) => {
      if (val) window.addEventListener('beforeunload', beforeUnloadHandler)
      else window.removeEventListener('beforeunload', beforeUnloadHandler)
    },
    { immediate: true },
  )

  const popstateHandler = createPopstateHandler(
    () => isGameInProgress.value,
    (url) => history.pushState(null, '', url),
    window.confirm.bind(window),
    routerPush,
  )

  onMounted(() => window.addEventListener('popstate', popstateHandler))
  onUnmounted(() => {
    window.removeEventListener('popstate', popstateHandler)
    window.removeEventListener('beforeunload', beforeUnloadHandler)
  })
}
