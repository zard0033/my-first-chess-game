# Learning Loop — Review Log

## Review — 2026-06-06 — Verdict: APPROVED (round 2, final)
Scope signal: **L** (unchanged). Specialists: game-designer, systems-designer, qa-lead (adversarial, round 2). Blocking items: 1 (corrected this session) | Recommended: ~8 (all applied).
Prior verdict resolved: **Yes** — round-1's 4 blockers all confirmed fixed; the 3 product forks resolved by Eason (D1 accept→re-spec'd, D2 neutral opt-in tag, D3 omit「對局」column).

### Summary
All three specialists independently converged on **one** round-2 blocker: **D1 was specified against the wrong dungeon gate.** The GDD said the lesson-origin practice unlock patches `#19`'s `isUnlocked`, but the puzzle player guards entry on `nodeState(puzzle)==='locked'` (`DungeonPuzzleView.vue`); `nodeState` only honours `solved` + the single `currentOrder` frontier. So patching `isUnlocked` is a no-op (flagship fork/pin CTA still dead-ends — round-1 blocker 2 unfixed), and patching `nodeState` creates a gap-toothed "done island" that breaks #19's「一格格點亮」feel and contiguity invariant. **Resolved (Eason, 2026-06-06): side-door practice mode** — the CTA opens the puzzle via a `?from=lesson` entry-path that bypasses the lock for that one id; a practice solve counts only toward `practiced(c)`/Concept Map and does NOT mutate the dungeon `solved` set, `currentOrder`, or `isUnlocked`. **Zero #19 semantic change.**

### Applied this session (same-pass revision, no round 3 per max-2-rounds rule)
- **D1 re-spec** (§3.2/§4.3/§6 + #19 reciprocal): side-door practice mode; removed `enterable`/`lessonOriginUnlocked`; added `practiceTarget(c)`; #19 map untouched.
- **§4.4 classifier clauses** (systems R1): "defended"=legality-based (pinned defender ≠ defender); one-ply existential, no SEE; en-passant + promotion-captures excluded from v1 (return none).
- **#7 reciprocal** (game R1 / qa B3): amended #7's "does not prescribe study" → "default review"; #7 to expose `data-testid="review-detail-panel"`.
- **ACs**: +AC-2b (D1 zero-mutation invariant, blocking), +AC-9b (D2 positive-case opt-in gating, blocking), AC-9 baseline = committed golden testid set, AC-1 ALL_PUZZLE_MOTIFS const + bidirectional tag integrity, AC-2 EC-7 replay-fallback coverage.
- **Honesty/wording** (game V1/R3/R4): §2 v1-scope clause (game-origin signposts catch only material+mate, not fork/pin); Concept Map reframed "navigation hub / met+practised" not "spine / deepening gradient"; §1 Bridge-3 "identify what a mistake was" → neutral "tags a move when a reliable signal matches".

### Verdict
**APPROVED.** The concept-tag spine, voice-division, honest fork/pin deferral, and all three decisions are sound and now internally consistent with the real `dungeon-progress.ts` / #7 semantics. Ready for epic refresh + story breakdown (Phase A). Per project max-2-rounds rule, no round 3.

---

## Review — 2026-06-06 — Verdict: NEEDS REVISION
Scope signal: **L** (multi-system integration: 3 upstream GDDs + new ADR-0012; 4 formula groups; a new mistake classifier).
Specialists: game-designer, systems-designer, qa-lead (adversarial), synthesised as creative-director.
Blocking items: 4 | Recommended: 7 | Nice-to-have: several
Prior verdict resolved: First review.

### Summary (creative-director synthesis)

The concept-tag idea is sound and the GDD is structurally complete (8/8 sections, dependency graph
valid, ADR-0012 authored). But two independent reviewers converged on the same finding the GDD hides
in its edge cases: **both flagship paths under-fire on real data.** (1) Bridge 1's showcase cases
(fork/pin) almost always degrade to the "locked" hint, because lesson progress and dungeon unlock are
decoupled linear tracks — a player who just finished the fork lesson has almost never solved dungeon
to the fork puzzles' order, so the CTA has nothing to offer. (2) Bridge 3 — the entire differentiator
— is built on `pv[0]`, which is the engine's best continuation, not the move that actually punished
the player's tactic; multi-step and larger-tactic cases make it silent, and "confidence" is never
defined, so the AC cannot distinguish conservative silence from a broken classifier. Separately, the
`hanging` concept is mis-mapped across all three surfaces (lesson teaches piece *value*, puzzle drills
*winning* material, label「棋子取奪」means active capture — four different things), and Bridge 3's
Beth-voiced「你被捉雙了 · 練 3 題」verdict directly conflicts with Post-Game Review's non-negotiable
neutral, no-verdict design.

### Blocking items
1. `hanging` concept mis-mapped (§3.1/§4.1) — semantics inconsistent across lesson/puzzle/review; label mistranslated. [game-designer, systems-designer]
2. Bridge 1 dead-ends for fork/pin (§3.2/§4.3/EC-2) — decoupled linear progress means the flagship CTA is normally the "locked" hint, not a real offer. [systems-designer]
3. Bridge 3 classifier unreliable + "confidence" undefined (§3.4/§4.4/AC-5/AC-6) — `pv[0]` ≠ the punishing move; no implementable predicate; AC can't tell silence-from-conservatism vs silence-from-failure. [systems-designer, qa-lead]
4. ACs not testable (§8) — AC-9 "byte-for-byte" unrealistic; EC-5/EC-10 (safety core) have no AC; AC-11 buries the auto-checkable 禁象棋用語 grep inside manual visual review; AC-1/AC-8 contradict (concept maps puzzles via motif, not stored ids). [qa-lead]

### Recommended
5. Bridge 3 ↔ Post-Game Review fantasy conflict (§3.4) — Beth-voiced verdict on the neutral review surface. [game-designer]
6. Concept Map「在你對局中出現過」= cross-game negative error tally, conflicts with #7's no-cross-game-verdict rule (§3.5). [game-designer]
7. "One coherent teacher" overreach — Beth's voice only truly appears in Bridge 3, the place it least belongs (§2). [game-designer]
8. lesson.order vs puzzle.order are separate namespaces — GDD uses bare `order` (§4.1/§4.3). [systems-designer]
9. mate-in-1/mate-in-2 merged → Bridge 1 may push a 2-move-mate puzzle to someone who learned 1-move mate (§4.1/§4.3). [systems-designer]
10. Missing `defense`(保護) concept — the `protection` lesson can't be cleanly tagged (§3.1). [game-designer, confirmed against real lesson ids]
11. Split AC-11 into automatable (grep emoji / grep 車馬象 / Playwright ≥44px) + manual (voice/color). [qa-lead]

### Revision (round 1, applied 2026-06-06)
GDD revised to address all 4 blockers + recs 5–11. Product-level forks left as 【決策待 Eason】 inline:
the Bridge-1 lesson-origin unlock exemption (changes #19 semantics), Bridge-3 link tone/placement on
the neutral review, and whether the Concept Map's「對局」column exists at all. Fork/pin **mistake
classification deferred** out of v1 (pv unreliable); v1 Bridge 3 fires only on reliably-detectable
signals (allowed-forced-mate via #7's existing F2b + hung-undefended-material on the actual game
continuation). Re-review pending after Eason signs off the flagged forks.
