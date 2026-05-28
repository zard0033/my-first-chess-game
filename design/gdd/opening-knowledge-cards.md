# Opening Knowledge Cards (GDD)

> **Status**: Skeleton — written 2026-05-28 per Pillar 2 Option A decision. Full sections to be authored via `/design-system opening-knowledge-cards` or `/quick-design "opening knowledge cards"`.
> **Tier**: v0
> **Category**: Gameplay (Feature layer)
> **Depends on**: Opening Identification (system #3), Post-Game Review (system #7)
> **Source decision**: `production/gate-checks/2026-05-28-technical-setup-to-pre-production.md` Pillar 2 = Option A

---

## 1. Overview

A hand-authored set of ~20 short markdown knowledge cards, one per common opening (keyed by ECO code), surfaced inside the Post-Game Review screen when the identified opening matches a card. This is v0's minimum-viable manifestation of Pillar 2 ("Knowledge Connects to Play") — the *knowledge → game* half of the bidirectional hook. The *game → knowledge* half (cross-game pattern matching + Claude explanations) is Phase 2.

The system is **data-only** at the architecture layer: no new Worker, no new Pinia store, no new ADR. The data is a `Record<ECO, KnowledgeCard>` shipped as a TypeScript module (build-time, tree-shakeable, like the opening index per ADR-0003).

---

## 2. Player Fantasy

> *"After every game, the named opening I just played has a paragraph waiting for me — what it's trying to do, where the pressure points are, what to look for next time. Reading it feels like a coach saying 'here's what you were aiming at — even if you didn't see it yet.'"*

- Calm, non-judgmental tone (Pillar 3) — *describes* the opening, never *grades* the player's choice of it
- Information-dense but short (one paragraph, ~3-4 sentences) — readable in 20 seconds while reviewing the game
- Optional — a player who already knows the opening can ignore it without losing anything

---

## 3. Detailed Rules

**TO AUTHOR.** Suggested structure:

- Each ECO code maps to at most one card; if `OpeningResult.eco === null` (unknown opening), no card is shown.
- Cards are markdown strings; rendered inside a collapsible panel beneath the opening header on the Post-Game Review screen.
- Default state: **collapsed on mobile** (calm-default per [ADR-0007 §5](../../docs/architecture/adr-0007-post-game-review-analysis-loop-and-sessionstorage-schema.md)), **expanded on desktop**.
- Tap/click the opening header to toggle.
- If a knowledge card does not exist for the identified ECO, the panel is not rendered at all (no "No card yet" placeholder — avoids feeling incomplete).

---

## 4. Formulas

**N/A** — no math. Pure data lookup: `knowledgeCards[openingResult.eco] ?? null`.

---

## 5. Edge Cases

**TO AUTHOR.** Initial candidates:

- **EC-01**: `OpeningResult.isUnknown === true` → no card rendered, no error
- **EC-02**: ECO matched but card not authored → no card rendered, no placeholder
- **EC-03**: Card markdown contains a link to a position diagram → out of scope for v0 (text-only)
- **EC-04**: Player is reviewing a historical game whose card has since been edited → no problem; cards are reload-fresh; no per-game snapshot

---

## 6. Dependencies

### Upstream

- **Opening Identification (system #3)** — provides `OpeningResult.eco` from Post-Game Review's existing `identifyOpening(completedGame.moves)` call. This system does NOT call `identifyOpening` independently — it reads the existing result.
- **Post-Game Review (system #7)** — owns the panel placement, collapse/expand state, and triggers re-render when cursor moves to a position whose ECO differs (Phase 2 concern; v0 uses the headline opening only).

### Downstream

- **(Phase 2) Bidirectional Knowledge Linking** — when the game→knowledge half is built, knowledge cards become the canonical store of opening knowledge that cross-game pattern matching links INTO. v0 schema must be forward-compatible: don't paint the data into a format that Phase 2 can't extend.

---

## 7. Tuning Knobs

| Knob | Default | Range | Notes |
| --- | --- | --- | --- |
| Initial card count | ~20 ECO codes | 10–50 | Cover the most common openings beginners encounter (Italian, Spanish, Sicilian Najdorf/Dragon, French, Caro-Kann, English, Queen's Gambit Declined/Accepted, King's Indian, etc.) |
| Card max length | 4 sentences | 2–6 | Beginners must finish reading in < 20s. Longer cards push to Phase 2 expandable view. |
| Card source format | markdown string | — | Allows bold/italic emphasis, no images in v0 |
| Mobile default state | collapsed | collapsed / expanded | Binding per ADR-0007 §5 calm default |
| Desktop default state | expanded | collapsed / expanded | Information density acceptable on larger viewport |

---

## 8. Acceptance Criteria

**TO AUTHOR.** Initial candidates:

- **AC-01**: For an identified `eco = 'C50'` (Italian Game), the matching knowledge card is rendered beneath the opening header on the Post-Game Review screen
- **AC-02**: For an identified `eco = null` (unknown opening), no knowledge card panel renders (DOM element not present)
- **AC-03**: On mobile viewport (< 768px), the card panel is collapsed by default; the opening header acts as the toggle
- **AC-04**: On desktop viewport (≥ 768px), the card panel is expanded by default
- **AC-05**: Card markdown renders as plain text + supported inline formatting (bold, italic); no HTML injection vulnerability (use a vetted markdown renderer or restrict to bold/italic via a tiny parser)
- **AC-06**: ≥ 20 ECO codes have hand-authored cards before v0 ships; coverage list documented in this GDD's appendix
- **AC-07**: Card content tone passes a "no judgment" check — no phrases like "should have played", "you missed", "bad choice"; only describes the opening's plan and what to look for

---

## Authoring Notes (delete when GDD is fully authored)

This skeleton was generated 2026-05-28 to track that v0 includes Opening Knowledge Cards per Pillar 2 Option A. Sections 1, 2, 4, 6 are complete enough for architecture purposes; sections 3, 5, 7, 8 need fuller authoring before implementation stories can be created.

Recommend authoring via `/design-system opening-knowledge-cards` or `/quick-design "opening knowledge cards"` when the next design session begins. Content authoring (the actual ~20 cards) is a separate Sprint 1 deliverable (active.md punch list 5b) and lives in `src/data/opening-knowledge-cards.ts` or similar.
