import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { useReplayNavigation } from '@/composables/use-replay-navigation'

describe('useReplayNavigation', () => {
  it('test_nav_next_move_increments_ply_and_clamps_at_total', () => {
    const total = ref(2)
    const nav = useReplayNavigation(total)
    nav.nextMove()
    expect(nav.currentPly.value).toBe(1)
    nav.nextMove()
    expect(nav.currentPly.value).toBe(2)
    nav.nextMove() // clamp
    expect(nav.currentPly.value).toBe(2)
  })

  it('test_nav_prev_move_decrements_ply_and_clamps_at_zero', () => {
    const total = ref(3)
    const nav = useReplayNavigation(total)
    nav.jumpToMove(2)
    nav.prevMove()
    expect(nav.currentPly.value).toBe(1)
    nav.prevMove()
    nav.prevMove() // clamp at 0
    expect(nav.currentPly.value).toBe(0)
  })

  it('test_nav_jump_to_move_sets_ply_within_range', () => {
    const total = ref(10)
    const nav = useReplayNavigation(total)
    nav.jumpToMove(5)
    expect(nav.currentPly.value).toBe(5)
    nav.jumpToMove(99) // over → clamp to total
    expect(nav.currentPly.value).toBe(10)
    nav.jumpToMove(-3) // under → clamp to 0
    expect(nav.currentPly.value).toBe(0)
  })

  it('test_nav_can_go_flags_reflect_bounds', () => {
    const total = ref(2)
    const nav = useReplayNavigation(total)
    expect(nav.canGoPrev.value).toBe(false)
    expect(nav.canGoNext.value).toBe(true)
    nav.jumpToMove(2)
    expect(nav.canGoNext.value).toBe(false)
    expect(nav.canGoPrev.value).toBe(true)
  })

  it('test_nav_zero_move_game_disables_both_controls', () => {
    const total = ref(0)
    const nav = useReplayNavigation(total)
    expect(nav.canGoNext.value).toBe(false)
    expect(nav.canGoPrev.value).toBe(false)
    nav.nextMove()
    expect(nav.currentPly.value).toBe(0)
  })

  describe('play / pause', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())

    it('test_nav_toggle_play_flips_is_playing_state', () => {
      const total = ref(3)
      const nav = useReplayNavigation(total)
      nav.togglePlay()
      expect(nav.isPlaying.value).toBe(true)
      nav.togglePlay()
      expect(nav.isPlaying.value).toBe(false)
    })

    it('test_nav_play_advances_ply_on_interval_and_stops_at_end', async () => {
      const total = ref(2)
      const nav = useReplayNavigation(total, { intervalMs: 1000 })
      nav.play()
      vi.advanceTimersByTime(1000)
      expect(nav.currentPly.value).toBe(1)
      vi.advanceTimersByTime(1000)
      expect(nav.currentPly.value).toBe(2)
      vi.advanceTimersByTime(1000) // reached end → auto-stop
      await nextTick()
      expect(nav.isPlaying.value).toBe(false)
    })

    it('test_nav_play_is_noop_when_already_at_end', () => {
      const total = ref(0)
      const nav = useReplayNavigation(total)
      nav.play()
      expect(nav.isPlaying.value).toBe(false)
    })
  })
})
