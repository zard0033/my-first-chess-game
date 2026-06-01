# QA Evidence: S7-05 Route Guards

**Date**: 2026-06-01
**Reviewer**: QA team-qa (Playwright)
**Verdict**: PASS

---

## Checklist

- [x] Navigate to `/history` while not logged in → redirected to `/?login=required` (SUPA-AC-10)
  - Verified via Playwright: `page.goto('/history')` → final URL `/?login=required`
- [x] Navigate to `/profile` while not logged in → redirected to `/?login=required`
  - Verified via Playwright: `page.goto('/profile')` → final URL `/?login=required`
- [x] Home page shows "Sign in" nav link when unauthenticated (no flash of wrong state)
- [x] `App.vue` calls `authStore.initAuth()` in `onMounted` — confirmed via source inspection
  - File: `src/App.vue` line 17: `onMounted(() => { authStore.initAuth() })`
  - Not awaited — flash prevention handled by `isAuthLoading` guard
- [x] No visible flash/redirect flicker before `isAuthLoading` resolves

## Screenshots

- `s7-05-home-redirect-screenshot.png` — Home page after redirect from `/history` (URL shows `/?login=required`)
