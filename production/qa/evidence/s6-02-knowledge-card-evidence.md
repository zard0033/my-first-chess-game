# Evidence: Opening Knowledge Card Component (S6-02)

**Story**: `production/epics/opening-knowledge-cards/story-001-component.md`
**Date**: 2026-05-30
**Verified by**: Developer self-review

---

## Manual Verification Checklist

- [x] Start game → play 1.e4 e5 2.Nf3 Nc6 3.Bc4 → complete → navigate to Review
- [x] Opening header shows Italian Game text
- [x] Knowledge card panel appears directly below opening header
- [x] Card body renders bold/italic correctly (no raw `**` visible)
- [x] Desktop (≥ 768px): card expanded by default
- [x] Click opening header → card collapses; click again → expands (AC-05)
- [x] Mobile (< 768px): card collapsed by default (AC-04)
- [x] Tap header → card expands; tap again → collapses
- [x] Keyboard: Tab to header, Space → toggle; Enter → toggle
- [x] Review a game with unknown opening → no card DOM element present

## Accessibility Notes

- `role="button"` + `aria-expanded` added post code-review (fixes WCAG 4.1.2)
- `aria-live="polite"` on expanded body panel (AT announcement on reveal)
- Chevron span has `aria-hidden="true"`

## Sign-off

| Role | Approval |
| ---- | -------- |
| Developer | [x] Approved — 2026-05-30 |
