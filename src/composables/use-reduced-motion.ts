/**
 * Composable that detects the prefers-reduced-motion media query.
 * When true, all animation durations should be collapsed to 0.
 * Consistent with Chess Board GDD Rule (all animations use transform + opacity only).
 */
import { ref, onMounted, onUnmounted } from 'vue'

export function useReducedMotion(): { prefersReducedMotion: ReturnType<typeof ref<boolean>> } {
  const prefersReducedMotion = ref(false)

  let mq: MediaQueryList | null = null

  function handleChange(e: MediaQueryListEvent | MediaQueryList): void {
    prefersReducedMotion.value = (e as MediaQueryListEvent).matches
  }

  onMounted(() => {
    if (typeof window === 'undefined') return
    mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    prefersReducedMotion.value = mq.matches
    mq.addEventListener('change', handleChange as EventListener)
  })

  onUnmounted(() => {
    mq?.removeEventListener('change', handleChange as EventListener)
  })

  return { prefersReducedMotion }
}
