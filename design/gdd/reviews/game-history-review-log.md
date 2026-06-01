# Review Log: Game History (#12)

---

## Review — 2026-06-01 (pass 5) — Verdict: APPROVED
Scope signal: M
Specialists: game-designer, systems-designer, ux-designer, qa-lead, creative-director
Blocking items: 6 resolved | Recommended: 7 applied
Summary: All blockers were technical, not design-philosophical. The "Look what I've built" fantasy and no-pressure design rationale survived intact. Six blockers resolved in-session: load-more fetchGeneration race guard (completion handler now checks generation before appending), Refresh-during-load-more concurrency specified, stalemate AC-21b added, fetchGeneration declared as observable store property, AC-12 precondition made implementation-agnostic, iOS tap-to-expand scroll disambiguation added to Rule 8. Also applied: cached-data error-state preservation for PWA Refresh failures, Formula 2 out-of-range console.warn, explicit cold→cold failure transitions, states table completeness. Implementation unblocked. ADR-0011 already Accepted.
Prior verdict resolved: Pass 3 NEEDS REVISION — 6 new blockers identified and resolved in pass 5

---

## Review — 2026-06-01 (pass 3) — In Revision (blockers applied; re-review required)

Scope signal: M
Specialists: game-designer, systems-designer, ux-designer, qa-lead, creative-director
Blocking items: 14 | Recommended: 12
Summary: Second consecutive MAJOR REVISION NEEDED. Prior pass 2 fixes were cosmetic (noticed truncation instead of resolving the fantasy conflict; replaced color hierarchy with weight hierarchy; AC count increased but Formula 4 still had zero coverage). Pass 3 resolves all 14 blockers: Load more pagination replaces hard cap (B-01); equal weight + W/L/½ prefix replaces font-weight hierarchy (B-02); collapsed row layout grid specified with moveCount moved to expanded panel (B-03/04); flushUnsyncedQueue() and syncGame() invalidation contracts fully specified with deferred-import pattern (B-05/06/07); cacheState enum replaces isDirty+lastFetchedAt (B-08); Formula 1 fallback added (B-09); UUID tiebreaker documented as accepted limitation (B-10); Formula 2 type guard ACs added (B-11); Formula 4 ACs added — AC-19 through AC-22 (B-12); AC-09 spy target corrected to fetchHistory (B-13); AC-11 rewritten for Load more, AC-13 classified as Integration test (B-14). Re-review required before stories can begin.
Prior verdict resolved: Pass 2 MAJOR REVISION NEEDED — 14 new blockers identified and resolved in this pass

---

## Review — 2026-06-01 (pass 2) — MAJOR REVISION NEEDED

Scope signal: M
Specialists: game-designer, systems-designer, ux-designer, qa-lead, creative-director
Blocking items: 6 | Recommended: 7
Summary: The GDD concept is sound and all 8 required sections are present. Six blocking issues prevent handoff: silent 100-game truncation contradicts the "permanent diary" player fantasy; cache policy has no invalidation mechanism after syncGame(), breaking the most common post-game navigation path; ADR-0011 is Proposed (not Accepted), auto-blocking all implementation stories; the pgn column description contradicted ADR-0011 (pgn vs. UCI); row touch targets were unspecified; and the AC set covered only 2 of 11 formula paths with several edge cases untested. All six blockers have been addressed in the GDD in this review session. A re-review is required before stories can begin; ADR-0011 must also reach Accepted status independently.
Prior verdict resolved: N/A — first review
