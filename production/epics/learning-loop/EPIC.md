# Epic: Learning Loop — Concept Linking

> **Layer**: Feature (Phase 2, connective system #20)
> **GDD**: design/gdd/learning-loop.md (**Approved round 2, 2026-06-06**)
> **Architecture Module**: concept SoT (`src/types/concept.ts` + `src/data/concepts/`) + `MOTIF_TO_CONCEPT` + a `concept-progress` store + 3 bridge insertions into existing views + a new Concept Map view
> **Status**: In Design — Phase A scheduled for S14 implementation
> **Stories**: S14-01 … (Phase A first; B/C/C+/D follow per GDD §3.6)
> **Governing ADR**: ADR-0012 (Bidirectional lesson-to-game linking)

## Overview

A **connective system**, not a new screen-set. It introduces one shared primitive — a
closed, static vocabulary of named chess **concepts**（子力、捉雙、牽制、將殺…）— and uses it
to stitch the three currently-isolated learning surfaces into one loop:

1. **課程 → 試煉** (Bridge 1): completing a concept lesson offers matching-concept puzzles.
2. **試煉 → 課程** (Bridge 2): a puzzle exposes a calm back-link to its concept's lesson.
3. **對局 → 課程／試煉** (Bridge 3): when a move matches a reliable signal, the review tags it
   with a related concept — neutral, opt-in, no verdict.

A fourth surface — the **Concept Map** — is the calm navigation hub (已學/已練), replacing the
streak/XP competitors use. **v1 is tag-matching, zero AI, zero new backend.**

## Key Design Decisions (Eason, 2026-06-06)

- **D1 — side-door practice mode** (re-specified round 2). The Bridge-1 CTA opens the concept's
  puzzle in a **practice entry-path** (`?from=lesson`) that bypasses the dungeon's `nodeState`
  lock for that one puzzle id. A practice solve counts **only** toward the Concept Map's 已練 — it
  does **not** call the dungeon store's `markSolved`, **not** advance `currentOrder`, **not** touch
  `isUnlocked`. **The dungeon's linear map and #19's unlock semantics are completely unchanged.**
  (The original "unlock exemption" was found to break #19's map invariant — see review log.)
- **D2 — neutral opt-in tag**: Bridge-3 game→lesson signpost is a quiet「相關概念：子力」tag
  **behind #7's Show-detail affordance** — never in the default render, no Beth voice, no verdict,
  no homework quantifier.
- **D3 — Concept Map omits the「對局出現過」column in v1**; ships on 已學/已練 only (the cross-game
  error tally conflicts with #7's no-cross-game-verdict rule).
- **Bridge-1 completion moment**: LessonView currently routes straight to `/learn` on完成課程 with
  **no completion panel** — Bridge 1 adds a calm completion card to host the invitation (Eason
  approved adding it, 2026-06-06).

## Honest v1 Scope (post-review)

Bridge 3 (game-origin) fires on **exactly two reliably-detectable signals**: allowed-forced-mate
(reuses #7's F2b) and hung-undefended-material (a defined chess.js predicate on the actual game
line). **Fork & pin game-mistake classification is deferred to Phase C+** (pv-based heuristics are
unreliable). Bridges 1–2 still teach & drill fork/pin fully — only the game→lesson direction defers.

## Reciprocal Dependencies (already noted in upstream GDDs)

- **#18 Lesson System**: lessons gain an optional additive `concepts?: ChessConcept[]` field;
  LessonView hosts the Bridge-1 completion card. *(Noted in lesson-system.md.)*
- **#19 Dungeon Puzzle Mode**: puzzle view gains a side-door practice entry-path (`?from=lesson`);
  **no change to unlock semantics, the linear map, or the `solved` set**. *(Noted in dungeon-puzzle-mode.md.)*
- **#7 Post-Game Review**: Bridge 3 adds an opt-in signpost **outside** the neutral default render;
  #7 amends its "does not prescribe study" boundary to "default review" and exposes a stable
  `data-testid="review-detail-panel"`. *(Noted in post-game-review.md.)*

## Governing ADRs

| ADR | Decision Summary | Risk |
|-----|-----------------|------|
| ADR-0012: Bidirectional lesson-to-game linking | Concept **tag** as the linking medium (vs per-FEN indexing); "links only add, never degrade the neutral review" invariant; conservative-classifier / prefer-silence policy | MED |

**No other new ADR** — concepts are static front-end data; bridges are pure lookups over existing
local progress; the side-door reuses the existing routing + Pinia + localStorage patterns.

## GDD Requirements → Stories (Phase A subset; B–D added when scheduled)

| TR-ID | Requirement (AC) | Story |
|-------|------------------|-------|
| TR-ll-001 | Concept SoT integrity: labels non-empty; every `teaches` id resolves; `MOTIF_TO_CONCEPT` keys == `ALL_PUZZLE_MOTIFS`; bidirectional tag integrity (AC-1) | S14-01, S14-02 |
| TR-ll-002 | `recommended()`/`practiceTarget()` pure fns: ≤N candidates, unsolved-first, mate difficulty-match, all-solved replay fallback (AC-2, EC-7) | S14-04 |
| TR-ll-003 | Concept-with-no-puzzles → calm hint, not CTA (AC-3, EC-1) | S14-04 |
| TR-ll-004 | Side-door practice solve does NOT mutate dungeon `solved`/`currentOrder`/`nodeState` (AC-2b, D1) | S14-03 |
| TR-ll-005 | Bridge-1 completion card + CTA opens `practiceTarget` via `?from=lesson` | S14-04 |

## Stories — Phase A (S14)

| ID | Title | Type | Est. | Depends on |
|----|-------|------|------|-----------|
| S14-01 | Concept type + SoT data + `MOTIF_TO_CONCEPT` + `ALL_PUZZLE_MOTIFS` + data test | Logic | M | — |
| S14-02 | Tag existing lessons with `concepts?` (additive) + bidirectional tag-integrity test | Config/Data | S | S14-01 |
| S14-03 | `concept-progress` store + Dungeon side-door practice entry (`?from=lesson`, zero dungeon mutation) | Logic | M | S14-01 |
| S14-04 | Bridge-1: lesson completion card + `recommended`/`practiceTarget` pure fns + CTA wiring | Integration | M | S14-01, S14-03 |

> **Phase B** (later sprint): Bridge 2 + Concept Map view (**Concept Map gets a ui-ux-pro-max
> mockup + Eason review before code** — it is the only genuinely-new screen).
> **Phase C**: Bridge 3 (mate + material classifier). **Phase C+**: fork/pin game-mistake detection
> after a precision spike. **Phase D** (optional): Claude API dynamic Beth commentary.

## Definition of Done (Phase A)

1. **S14-01**: `src/types/concept.ts` (`ChessConcept`, `ConceptMeta`, `MOTIF_TO_CONCEPT`,
   `ALL_PUZZLE_MOTIFS`) + `src/data/concepts/` SoT; data test (mirrors `puzzles.test.ts`) green.
2. **S14-02**: each concept's `teaches` lessons carry that concept in their `concepts` field;
   bidirectional integrity test green; no existing lesson broken (additive field).
3. **S14-03**: `concept-progress` store records practice-solved puzzle ids; Dungeon side-door
   entry works for `?from=lesson`; unit test proves a practice solve leaves the **dungeon** store's
   `solved`/`currentOrder`/`nodeState` identical (the D1 zero-mutation invariant).
4. **S14-04**: lesson completion card renders the Bridge-1 invitation (or the EC-1 calm hint for
   no-puzzle concepts); `recommended`/`practiceTarget` pure fns tested incl. all-solved replay;
   CTA deep-links into practice mode.
5. **All tests pass**; **QA sign-off**; design review **APPROVED** ✓ (2026-06-06).

## Success Metrics (Phase A)

- After finishing a concept lesson, a beginner sees a calm invitation and can practise immediately.
- Practising from a lesson never disturbs the dungeon's一關一關 progress (the D1 promise).
- Concept data is authoring-drift-proof (the data test catches a missing/mis-tagged concept).
