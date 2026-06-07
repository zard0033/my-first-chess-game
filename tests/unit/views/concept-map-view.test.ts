// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'

vi.mock('@/lib/supabase', () => ({
  supabase: { auth: { getSession: vi.fn(), onAuthStateChange: vi.fn() }, from: vi.fn() },
}))

import ConceptMapView from '@/views/ConceptMapView.vue'
import { puzzles } from '@/data/puzzles'
import { conceptToMotifs } from '@/data/concepts'

// S14-06 — Concept Map states (GDD §3.5/§4.2, AC-8). Seeds localStorage BEFORE mount so the
// progress stores hydrate deterministically, then asserts the lit/dormant split and the
// lesson-only invariant (skewer never renders as「未達成」).

function makeRouter() {
  return createRouter({
    history: createWebHashHistory(),
    routes: [
      { path: '/', component: { template: '<div/>' } },
      { path: '/learn', component: { template: '<div/>' } },
      { path: '/learn/concepts', component: ConceptMapView },
      { path: '/learn/:lessonId', component: { template: '<div/>' } },
      { path: '/dungeon/:puzzleId', component: { template: '<div/>' } },
    ],
  })
}

function seed(opts: { lessons?: string[]; solved?: string[] } = {}) {
  localStorage.setItem('pgr:lessons:progress', JSON.stringify({ completed: opts.lessons ?? [] }))
  localStorage.setItem('pgr:dungeon:progress', JSON.stringify({ solved: opts.solved ?? [], hinted: [] }))
}

async function mountAt() {
  const router = makeRouter()
  router.push('/learn/concepts')
  await router.isReady()
  const wrapper = mount(ConceptMapView, { global: { plugins: [router] } })
  await flushPromises()
  return wrapper
}

const firstPuzzleOfConcept = (concept: 'fork' | 'material') =>
  puzzles.find((p) => conceptToMotifs(concept).includes(p.motif))!

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
})

describe('ConceptMapView', () => {
  it('test_conceptMap_nothingDone_allDormantAndShowsEmptyHint', async () => {
    seed()
    const w = await mountAt()
    expect(w.findAll('[data-testid="concept-tile-lit"]')).toHaveLength(0)
    // All 8 concepts sit quietly in the dormant zone, none as「未達成」.
    expect(w.findAll('[data-testid="concept-tile-dormant"]').length).toBeGreaterThan(0)
    expect(w.text()).toContain('完成第一課')
    expect(w.text()).not.toContain('未達成')
  })

  it('test_conceptMap_learnedConceptWithPuzzles_litWithCourseDotAndPractiseCta', async () => {
    // fork lesson completed, no fork puzzles solved → 課程 lit, 試煉 not, CTA offered.
    seed({ lessons: ['fork'] })
    const w = await mountAt()
    const lit = w.findAll('[data-testid="concept-tile-lit"]')
    expect(lit.length).toBeGreaterThan(0)
    const forkTile = lit.find((t) => t.text().includes('捉雙'))!
    expect(forkTile).toBeTruthy()
    expect(forkTile.find('.state-learned').exists()).toBe(true)
    expect(forkTile.find('.state-practiced').exists()).toBe(false)
    expect(forkTile.find('[data-testid="concept-practise-cta"]').exists()).toBe(true)
  })

  it('test_conceptMap_practicedConcept_showsTrainDot', async () => {
    // material lesson done + a capture puzzle solved → both 課程 and 試煉 lit, no CTA.
    const cap = firstPuzzleOfConcept('material')
    seed({ lessons: ['king-and-value'], solved: [cap.id] })
    const w = await mountAt()
    const materialTile = w
      .findAll('[data-testid="concept-tile-lit"]')
      .find((t) => t.text().includes('子力'))!
    expect(materialTile).toBeTruthy()
    expect(materialTile.find('.state-learned').exists()).toBe(true)
    expect(materialTile.find('.state-practiced').exists()).toBe(true)
    expect(materialTile.find('[data-testid="concept-practise-cta"]').exists()).toBe(false)
  })

  it('test_conceptMap_lessonOnlyConcept_neverShowsTrainDotOrUnmetState', async () => {
    // skewer is lesson-only (no drill puzzles). Completing its lesson lights 課程 ONLY.
    seed({ lessons: ['skewer'] })
    const w = await mountAt()
    const skewerTile = w
      .findAll('[data-testid="concept-tile-lit"]')
      .find((t) => t.text().includes('串擊'))!
    expect(skewerTile).toBeTruthy()
    expect(skewerTile.find('.state-learned').exists()).toBe(true)
    expect(skewerTile.find('.state-practiced').exists()).toBe(false)
    expect(skewerTile.find('[data-testid="concept-practise-cta"]').exists()).toBe(false)
  })
})
