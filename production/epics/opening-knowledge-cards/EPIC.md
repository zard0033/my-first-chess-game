# Epic: Opening Knowledge Cards

> **Layer**: Feature
> **GDD**: design/gdd/opening-knowledge-cards.md (complete — all 8 sections authored)
> **Architecture Module**: (no standalone module — surfaced as a panel inside PostGameReview)
> **Status**: Ready — GDD complete, stories created (Sprint 6)
> **Stories**: story-001-component.md, story-002-content-cards.md

## Overview

Implements the v0 Pillar 2 micro hook: ~20 hand-authored opening knowledge cards (one per
ECO code entry), surfaced as a panel in the Post-Game Review screen when `OpeningResult.eco`
matches a known card. Each card contains a short markdown blurb about the opening family,
its typical plans, and one key idea. This is a data-only feature — no scoring, no network
call, no complex logic. Cards are shipped as static TypeScript objects keyed by ECO code.
Content (the ~20 blurbs) is the main deliverable.

## Governing ADRs

| ADR | Decision Summary | Engine Risk |
|-----|-----------------|-------------|
| ADR-0003: chess-openings Dataset Pin | `OpeningResult.eco` is the lookup key — produced by `identifyOpening()` from OpeningIndex | LOW |

**No dedicated ADR** — this feature is data-only (static TypeScript map, no architecture
decisions needed beyond the ECO key contract already established in ADR-0003).

## GDD Requirements

| TR-ID | Requirement | ADR Coverage |
| ----- | ----------- | ------------ |
| OKC-01 | OpeningKnowledgeCard.vue renders beneath opening header when eco matches | ADR-0003 (ECO key contract) |
| OKC-02 | No DOM element when eco is null or unmatched | ADR-0003 |
| OKC-03 | Mobile collapsed / desktop expanded by default; header toggle | — |
| OKC-04 | Markdown inline-only rendering; no HTML injection | — |
| OKC-05 | ≥ 20 ECO codes with hand-authored content cards | — |
| OKC-06 | AC-08 tone: no judgment language | — |

## Definition of Done

This epic is complete when:
- GDD sections 3/5/7/8 are authored and approved
- ~20 ECO code cards are written (hand-authored markdown blurbs)
- Cards are loaded as static TypeScript data (no runtime fetch)
- Panel appears in PostGameReview when `OpeningResult.eco` matches a card
- All acceptance criteria from the completed GDD are verified

## Next Step

1. Complete `design/gdd/opening-knowledge-cards.md` (sections 3/5/7/8)
2. Run `/create-stories opening-knowledge-cards`
