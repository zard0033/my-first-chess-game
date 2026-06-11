import { onMounted, onBeforeUnmount, type Ref } from 'vue'

/**
 * Pins a board wrapper's width to a multiple of 8 so chessground fills it exactly.
 *
 * chessground rounds its board DOWN to a multiple of 8px (for integer square sizes). When the
 * available width lands just under a multiple of 8 (e.g. 375.76 → 368), it wastes nearly a full
 * 8px and renders the board off-centre inside the wooden frame (課程/試煉棋盤偏移). Flooring the
 * wrapper width to a multiple of 8 ourselves removes the gap entirely.
 *
 * Observes the PARENT (not the element) to avoid a feedback loop — setting the element's width
 * never changes the parent's, so ResizeObserver only fires on real layout changes.
 */
export function useBoardFit(elRef: Ref<HTMLElement | null>): void {
  let ro: ResizeObserver | null = null
  let lastSet = -1

  function fit(): void {
    const el = elRef.value
    const parent = el?.parentElement
    if (!el || !parent) return
    const cs = getComputedStyle(parent)
    const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight)
    const avail = parent.getBoundingClientRect().width - padX
    const target = Math.floor(avail / 8) * 8
    if (target <= 0 || target === lastSet) return
    lastSet = target
    el.style.width = `${target}px`
    el.style.marginLeft = 'auto'
    el.style.marginRight = 'auto'
  }

  onMounted(() => {
    const parent = elRef.value?.parentElement
    if (!parent) return
    ro = new ResizeObserver(fit)
    ro.observe(parent)
    fit()
  })

  onBeforeUnmount(() => {
    ro?.disconnect()
    ro = null
  })
}
