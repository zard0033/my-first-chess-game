// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Logged-out by default → cloud writes no-op; we only test the local-cache + unlock logic here.
vi.mock('@/lib/supabase', () => ({
  supabase: { auth: { onAuthStateChange: vi.fn() }, from: vi.fn() },
}))

import { useLessonProgressStore } from '@/stores/lesson-progress'
import { lessons } from '@/data/lessons'

const STORAGE_KEY = 'pgr:lessons:progress'

function lessonByOrder(order: number) {
  const lesson = lessons.find((l) => l.order === order)
  if (!lesson) throw new Error(`no lesson with order ${order}`)
  return lesson
}

describe('useLessonProgressStore', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('test_unlock_first_lesson_is_always_unlocked', () => {
    const store = useLessonProgressStore()
    expect(store.isUnlocked(lessonByOrder(1))).toBe(true)
  })

  it('test_unlock_second_lesson_locked_until_first_complete', () => {
    const store = useLessonProgressStore()
    const second = lessonByOrder(2)
    expect(store.isUnlocked(second)).toBe(false)

    store.markComplete(lessonByOrder(1).id)
    expect(store.isUnlocked(second)).toBe(true)
  })

  it('test_mark_complete_persists_to_localStorage', () => {
    const store = useLessonProgressStore()
    store.markComplete(lessonByOrder(1).id)

    const raw = localStorage.getItem(STORAGE_KEY)
    expect(raw).not.toBeNull()
    expect(JSON.parse(raw!)).toEqual({ completed: [lessonByOrder(1).id], sideLearned: [] })
  })

  it('test_mark_complete_is_idempotent', () => {
    const store = useLessonProgressStore()
    const id = lessonByOrder(1).id
    store.markComplete(id)
    store.markComplete(id)
    expect(store.completedCount).toBe(1)
  })

  it('test_progress_is_completed_over_total', () => {
    const store = useLessonProgressStore()
    expect(store.progress).toBe(0)
    store.markComplete(lessonByOrder(1).id)
    expect(store.progress).toBeCloseTo(1 / lessons.length)
  })

  it('test_corrupt_localStorage_treated_as_empty', () => {
    localStorage.setItem(STORAGE_KEY, '{ not valid json')
    setActivePinia(createPinia())
    const store = useLessonProgressStore()
    expect(store.completedCount).toBe(0)
    expect(store.isUnlocked(lessonByOrder(1))).toBe(true)
  })

  it('test_hydrates_completed_from_localStorage', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ completed: [lessonByOrder(1).id] }))
    setActivePinia(createPinia())
    const store = useLessonProgressStore()
    expect(store.isCompleted(lessonByOrder(1).id)).toBe(true)
    expect(store.isUnlocked(lessonByOrder(2))).toBe(true)
  })

  // ── Concept-tab side-door (Learning Loop #20): sideLearned must light 已學 WITHOUT touching
  //    linear completion / unlock (GDD §3.2 D1 separate-signal pattern). ──

  it('test_sideLearned_does_not_unlock_or_advance_linear_progress', () => {
    // Arrange: linear progress 1..3 done.
    const store = useLessonProgressStore()
    store.markComplete(lessonByOrder(1).id)
    store.markComplete(lessonByOrder(2).id)
    store.markComplete(lessonByOrder(3).id)
    const linearBefore = store.completedCount

    // Act: side-door learn lesson 5 (out of linear order).
    store.markSideLearned(lessonByOrder(5).id)

    // Assert: 已學 lights, but linear completion, count, and unlock are all untouched.
    expect(store.isLearned(lessonByOrder(5).id)).toBe(true)
    expect(store.isCompleted(lessonByOrder(5).id)).toBe(false)
    expect(store.completedCount).toBe(linearBefore)
    expect(store.isUnlocked(lessonByOrder(5))).toBe(false) // 4 not done → still locked
    expect(store.isUnlocked(lessonByOrder(6))).toBe(false) // THE INVARIANT: 5 side-learned ≠ unlock 6
    expect(store.isUnlocked(lessonByOrder(4))).toBe(true) // linear frontier unchanged
  })

  it('test_isLearned_is_union_of_completed_and_sideLearned', () => {
    const store = useLessonProgressStore()
    store.markComplete(lessonByOrder(1).id)
    store.markSideLearned(lessonByOrder(5).id)
    expect(store.isLearned(lessonByOrder(1).id)).toBe(true) // via linear completion
    expect(store.isLearned(lessonByOrder(5).id)).toBe(true) // via side-door
    expect(store.isCompleted(lessonByOrder(5).id)).toBe(false)
  })

  it('test_markSideLearned_noop_when_already_completed', () => {
    const store = useLessonProgressStore()
    const id = lessonByOrder(1).id
    store.markComplete(id)
    store.markSideLearned(id)
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(raw.sideLearned).toEqual([]) // not duplicated into the side-door set
    expect(raw.completed).toEqual([id])
  })

  it('test_sideLearned_persists_and_hydrates_without_leaking_unlock', () => {
    const store = useLessonProgressStore()
    store.markSideLearned(lessonByOrder(5).id)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).sideLearned).toEqual([lessonByOrder(5).id])

    setActivePinia(createPinia())
    const store2 = useLessonProgressStore()
    expect(store2.isLearned(lessonByOrder(5).id)).toBe(true)
    expect(store2.isUnlocked(lessonByOrder(6))).toBe(false) // hydrated side-door still doesn't leak
  })
})
