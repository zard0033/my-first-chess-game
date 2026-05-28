# Epic: Opening Knowledge Cards

> **Layer**: Feature
> **GDD**: design/gdd/opening-knowledge-cards.md (skeleton — sections 3/5/7/8 TO AUTHOR)
> **Architecture Module**: (no standalone module — surfaced as a panel inside PostGameReview)
> **Status**: Blocked — GDD incomplete
> **Stories**: Cannot create until GDD sections 3/5/7/8 are authored

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
|-------|-------------|--------------|
| (none registered) | GDD skeleton only — TR-IDs will be registered once sections 3/5/7/8 are authored | — |

**Untraced Requirements**: All — GDD sections 3 (Detailed Design), 5 (Edge Cases), 7 (Tuning Knobs), 8 (Acceptance Criteria) are marked TO AUTHOR.

> ⚠️ **BLOCKED**: This epic cannot have stories created until the GDD is completed.
> Run `/design-system opening-knowledge-cards` to author the missing sections, then
> run `/architecture-review` to register TR-IDs, then run `/create-stories opening-knowledge-cards`.

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
