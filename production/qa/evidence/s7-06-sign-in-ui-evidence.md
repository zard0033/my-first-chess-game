# QA Evidence: S7-06 Sign In UI

**Date**: 2026-06-01
**Reviewer**: QA team-qa (Playwright)
**Verdict**: PASS

---

## Checklist

### Idle State
- [x] Sign-in screen renders with email input (`type="email"`, placeholder `you@example.com`) and "Send Magic Link" button
- [x] Email input has `type="email"` (browser validation)
- [x] Email input touch target: **49.6px** height ✅ (≥ 44px)
- [x] "Send Magic Link" button touch target: **48px** height ✅ (≥ 44px)
- [x] No hover-only interactions

### "Check your email" State (SUPA-AC-01 UI)
- [x] After `authStore.pendingEmail = true`: renders "Check your email" heading
- [x] Displays submitted email: `We sent a link to test-qa@example.com`
- [x] "Use a different email" button rendered; touch target: **44px** ✅
- [x] Clicking "Use a different email" resets `authStore.pendingEmail = false` (in-code logic verified)

### Error State (SUPA-AC-05 UI)
- [x] When `authError` is set: error text displayed in `role="alert"` element (not color-only)
- [x] Error visible as text: tested with "Failed to fetch" (no credentials) and Supabase rejection
- [x] Form remains accessible in error state

### Loading State
- [x] Button has `:disabled="authStore.isAuthLoading"` — verified via template review
- [x] Button text changes: `isAuthLoading ? 'Sending…' : 'Send Magic Link'`

### Supabase Connectivity
- [x] With valid `.env.local` credentials: Supabase returns proper error (not "Failed to fetch")
  - Test confirmed: "Email address "test-qa@example.com" is invalid" returned from Supabase

## Screenshots

- `s7-06-sign-in-idle-qa.png` — Idle state (email input + button)
- `s7-06-sign-in-error-state-qa.png` — Error state (alert "Failed to fetch" / Supabase error)
- `s7-06-check-your-email-state-qa.png` — "Check your email" state with email address displayed
- `s7-06-sign-in-ui-screenshot.png` — Existing screenshot from smoke check (2026-05-31)
- `s7-06-home-nav-screenshot.png` — Home nav "Sign in" link visible
