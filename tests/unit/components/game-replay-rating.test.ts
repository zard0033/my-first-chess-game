// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import GameReplayRating from '@/components/game-replay-rating.vue'

const GAME_ID = 'game-123'
const KEY = `pgr:replay:${GAME_ID}`

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

afterEach(() => localStorage.clear())

describe('GameReplayRating', () => {
  it('test_rating_click_star_persists_to_localstorage', async () => {
    const wrapper = mount(GameReplayRating, { props: { gameId: GAME_ID } })
    const stars = wrapper.findAll('button')
    await stars[2].trigger('click') // 3rd star → rating 3

    const stored = JSON.parse(localStorage.getItem(KEY)!)
    expect(stored.rating).toBe(3)
    wrapper.unmount()
  })

  it('test_rating_loads_saved_value_on_mount', async () => {
    localStorage.setItem(KEY, JSON.stringify({ rating: 4, notes: 'good game' }))
    const wrapper = mount(GameReplayRating, { props: { gameId: GAME_ID } })
    await wrapper.vm.$nextTick()

    const stars = wrapper.findAll('button')
    expect(stars[3].attributes('aria-pressed')).toBe('true') // 4th star selected
    expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('good game')
    wrapper.unmount()
  })

  it('test_rating_click_selected_star_clears_rating', async () => {
    localStorage.setItem(KEY, JSON.stringify({ rating: 3, notes: '' }))
    const wrapper = mount(GameReplayRating, { props: { gameId: GAME_ID } })

    const stars = wrapper.findAll('button')
    await stars[2].trigger('click') // click the already-selected 3rd star → toggle off

    const stored = JSON.parse(localStorage.getItem(KEY)!)
    expect(stored.rating).toBeNull()
    wrapper.unmount()
  })

  it('test_rating_notes_persist_on_blur_and_enforce_max_length', async () => {
    const wrapper = mount(GameReplayRating, { props: { gameId: GAME_ID } })
    const textarea = wrapper.find('textarea')

    expect(textarea.attributes('maxlength')).toBe('200')

    const longText = 'x'.repeat(250)
    await textarea.setValue(longText)
    await textarea.trigger('blur')

    const stored = JSON.parse(localStorage.getItem(KEY)!)
    expect(stored.notes.length).toBe(200) // truncated to 200
    wrapper.unmount()
  })

  it('test_rating_localstorage_failure_does_not_throw', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded')
    })
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const wrapper = mount(GameReplayRating, { props: { gameId: GAME_ID } })
    const stars = wrapper.findAll('button')

    await expect(stars[0].trigger('click')).resolves.not.toThrow()
    wrapper.unmount()
  })

  it('test_rating_no_saved_data_renders_empty_state', () => {
    const wrapper = mount(GameReplayRating, { props: { gameId: GAME_ID } })
    const stars = wrapper.findAll('button')
    stars.forEach((s) => expect(s.attributes('aria-pressed')).toBe('false'))
    expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('')
    wrapper.unmount()
  })
})
