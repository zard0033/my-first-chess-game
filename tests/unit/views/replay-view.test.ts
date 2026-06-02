// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

// --- Hoisted test doubles ---

const t = vi.hoisted(() => ({
  entries: [] as Array<Record<string, unknown>>,
  routerPush: vi.fn(),
  routeParams: { gameId: 'g1' } as { gameId: string },
  pgnStub: {
    toPly: vi.fn(),
    getCurrentPly: vi.fn(() => 0),
    setBestArrow: vi.fn(),
  },
  analyze: vi.fn(async () => ({ bestMove: 'e2e4', evalCp: 20, depthReached: 12 })),
  dispose: vi.fn(),
}))

vi.mock('@/components/pgn-viewer.vue', () => ({
  default: defineComponent({
    name: 'PgnViewer',
    emits: ['move-selected'],
    setup(_props, { expose }) {
      expose(t.pgnStub)
      return () => h('div', { class: 'pgn-stub' })
    },
  }),
}))

vi.mock('@/stores/game-history', () => ({
  useGameHistoryStore: () => ({ entries: t.entries }),
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: t.routeParams }),
  useRouter: () => ({ push: t.routerPush }),
}))

vi.mock('@/modules/chess-engine/review-engine', () => ({
  useReviewEngine: () => ({
    analyze: t.analyze,
    dispose: t.dispose,
    init: vi.fn(),
    state: { value: 'IDLE' },
  }),
}))

import ReplayView from '@/views/ReplayView.vue'

function makeEntry(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'g1',
    pgn: '1. e4 e5 2. Nf3 Nc6', // 4 half-moves
    openingDisplay: 'Italian Game',
    playerResult: 'Win',
    difficultyLabel: 'Medium',
    moveCount: 4,
    ...over,
  }
}

async function mountReplay() {
  const wrapper = mount(ReplayView)
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  vi.clearAllMocks()
  t.entries = [makeEntry()]
  t.routeParams = { gameId: 'g1' }
  t.pgnStub.getCurrentPly = vi.fn(() => 0)
})

describe('ReplayView', () => {
  it('test_replay_view_renders_board_overlay_controls_when_game_exists', async () => {
    const wrapper = await mountReplay()
    expect(wrapper.find('.pgn-stub').exists()).toBe(true)
    expect(wrapper.find('input[type="range"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Italian Game')
    wrapper.unmount()
  })

  it('test_replay_view_redirects_to_history_when_game_not_found', async () => {
    t.entries = [] // EC-03
    const wrapper = await mountReplay()
    expect(t.routerPush).toHaveBeenCalledWith('/history')
    expect(wrapper.text()).toContain('Game not found')
    wrapper.unmount()
  })

  it('test_replay_view_next_move_increments_ply_and_clamps', async () => {
    const wrapper = await mountReplay()
    const vm = wrapper.vm as unknown as { nextMove: () => void; currentPly: number; totalMoves: number }
    expect(vm.totalMoves).toBe(4)
    vm.nextMove()
    expect(vm.currentPly).toBe(1)
    for (let i = 0; i < 10; i++) vm.nextMove()
    expect(vm.currentPly).toBe(4) // clamped at total
    wrapper.unmount()
  })

  it('test_replay_view_prev_move_decrements_and_clamps_at_zero', async () => {
    const wrapper = await mountReplay()
    const vm = wrapper.vm as unknown as { prevMove: () => void; jumpToMove: (n: number) => void; currentPly: number }
    vm.jumpToMove(3)
    vm.prevMove()
    expect(vm.currentPly).toBe(2)
    for (let i = 0; i < 10; i++) vm.prevMove()
    expect(vm.currentPly).toBe(0)
    wrapper.unmount()
  })

  it('test_replay_view_jump_to_move_sets_ply', async () => {
    const wrapper = await mountReplay()
    const vm = wrapper.vm as unknown as { jumpToMove: (n: number) => void; currentPly: number }
    vm.jumpToMove(3)
    expect(vm.currentPly).toBe(3)
    wrapper.unmount()
  })

  it('test_replay_view_toggle_play_flips_is_playing', async () => {
    const wrapper = await mountReplay()
    const vm = wrapper.vm as unknown as { togglePlay: () => void; isPlaying: boolean }
    vm.togglePlay()
    expect(vm.isPlaying).toBe(true)
    vm.togglePlay()
    expect(vm.isPlaying).toBe(false)
    wrapper.unmount()
  })

  it('test_replay_view_zero_move_game_disables_navigation', async () => {
    t.entries = [makeEntry({ pgn: '', moveCount: 0 })] // EC-01
    const wrapper = await mountReplay()
    const vm = wrapper.vm as unknown as { totalMoves: number }
    expect(vm.totalMoves).toBe(0)
    const buttons = wrapper.findAll('button')
    const prev = buttons.find((b) => b.text().includes('Prev'))!
    const next = buttons.find((b) => b.text().includes('Next'))!
    expect(prev.attributes('disabled')).toBeDefined()
    expect(next.attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })

  it('test_replay_view_board_mirrors_current_ply', async () => {
    const wrapper = await mountReplay()
    const vm = wrapper.vm as unknown as { jumpToMove: (n: number) => void }
    vm.jumpToMove(2)
    await flushPromises()
    expect(t.pgnStub.toPly).toHaveBeenCalledWith(2)
    wrapper.unmount()
  })

  it('test_replay_view_arrow_right_key_advances_move', async () => {
    const wrapper = await mountReplay()
    const vm = wrapper.vm as unknown as { currentPly: number }
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    await flushPromises()
    expect(vm.currentPly).toBe(1)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(t.routerPush).toHaveBeenCalledWith('/history')
    wrapper.unmount()
  })

  it('test_replay_view_move_selected_syncs_ply_from_viewer', async () => {
    const wrapper = await mountReplay()
    t.pgnStub.getCurrentPly = vi.fn(() => 3)
    wrapper.findComponent({ name: 'PgnViewer' }).vm.$emit('move-selected', 'g1g1')
    await flushPromises()
    const vm = wrapper.vm as unknown as { currentPly: number }
    expect(vm.currentPly).toBe(3)
    wrapper.unmount()
  })

  it('test_replay_view_runs_engine_preanalysis_on_mount', async () => {
    await mountReplay()
    expect(t.analyze).toHaveBeenCalled()
    expect(t.analyze).toHaveBeenCalledWith(expect.objectContaining({ targetDepth: 12 }))
  })
})
