# Opening Knowledge Cards (GDD)

> **Status**: Draft — written 2026-05-28 per Pillar 2 Option A decision; sections 3/5/8 authored 2026-05-28 (S1-08).
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

### Data model

```typescript
interface KnowledgeCard {
  eco: string;   // ECO code key (e.g. 'C50')
  name: string;  // Opening display name (e.g. 'Italian Game')
  body: string;  // Markdown body; bold/italic inline only; max 4 sentences
}
```

The canonical data lives in `src/data/opening-knowledge-cards.ts`:

```typescript
export const OPENING_CARDS: Readonly<Record<string, KnowledgeCard>>
```

This is a build-time static module — no runtime fetch, no Worker, no Pinia store. Tree-shaken to zero cost if the Post-Game Review screen is never loaded.

### Lookup rule

```typescript
const card: KnowledgeCard | null = OPENING_CARDS[openingResult.eco] ?? null
```

If `openingResult.eco` is `null` (unknown opening) or the ECO code has no authored card, `card` is `null` and the panel component renders nothing.

### Placement

The card panel renders inside the **Post-Game Review** screen, directly beneath the opening header (the line displaying opening name + ECO code). Post-Game Review owns the panel slot; this system provides the `<OpeningKnowledgeCard>` component only.

In v0 the card uses the **headline opening only** — the ECO of the first matching entry for the full move sequence. Per-move ECO switching is a Phase 2 concern.

### Collapse / expand behavior

| Context | Default state | Toggle trigger |
| ------- | ------------ | ------------- |
| Mobile (< 768 px) | Collapsed | Tap opening header |
| Desktop (≥ 768 px) | Expanded | Click opening header |

- One tap/click on the opening header toggles the panel.
- Keyboard: the header element receives `role="button"` and `tabindex="0"`, responding to `Space` and `Enter`.
- Toggle state is **session-ephemeral** — resets to default on each new review session.

### Markdown rendering

Card `body` supports only inline formatting:

| Syntax | Rendered as |
| ------ | ----------- |
| `**text**` | Bold |
| `_text_` | Italic |
| Plain text | Plain text |

No HTML passthrough, no links, no images. The renderer must escape all other markup. Never pass raw card content to `innerHTML`.

---

## 4. Formulas

**N/A** — no math. Pure data lookup: `knowledgeCards[openingResult.eco] ?? null`.

---

## 5. Edge Cases

- **EC-01**: `openingResult.eco === null` (unknown opening) → no card rendered, no error state, no placeholder DOM element.
- **EC-02**: ECO code has a value but no entry in `OPENING_CARDS` → no card rendered, no placeholder. Treated identically to EC-01 from the UI's perspective.
- **EC-03**: Card `body` contains raw HTML or a link — out of scope for v0; the renderer strips it. Cards are hand-authored, but the renderer enforces this as a safety net.
- **EC-04**: Player reviews a historical game whose opening card has since been edited → not a problem. Cards are loaded fresh from the module on each review session; there is no per-game snapshot of card content.

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

- **AC-01**: For `eco = 'C50'` (Italian Game), `<OpeningKnowledgeCard>` renders beneath the opening header on the Post-Game Review screen, displaying the card body text.
- **AC-02**: For `openingResult.eco === null` (unknown opening), no card panel DOM element is present in the Post-Game Review screen.
- **AC-03**: For an ECO code with no authored card (e.g. `eco = 'A99'`), no card panel DOM element is present — same result as AC-02 (covers EC-02).
- **AC-04**: On mobile viewport (< 768 px), the card panel is collapsed by default; tapping the opening header expands it.
- **AC-05**: On desktop viewport (≥ 768 px), the card panel is expanded by default; clicking the opening header collapses it.
- **AC-06**: Card body renders `**bold**` and `_italic_` correctly; raw HTML in a card body is not injected into the DOM.
- **AC-07**: ≥ 20 ECO codes have hand-authored cards in `src/data/opening-knowledge-cards.ts` before v0 ships; ECO codes covered are listed in the Appendix below.
- **AC-08**: Card body tone passes a "no judgment" review — no phrases such as "should have played", "you missed", "bad choice"; text describes only the opening's strategic plan and what to look for.

---

## Appendix: ECO Coverage (v0)

ECO codes are matched against `chess-openings@0.1.1` return values. Codes marked "approx." should be verified against `lookupSync` output during integration — the library may return a more specific sub-variant code for the same opening family.

### Sprint 1 — Authored (10 cards)

Cards live in `src/data/opening-knowledge-cards.ts`.

| ECO | Opening Name | Status |
| --- | ------------ | ------ |
| C50 | Italian Game | ✅ authored |
| C65 | Ruy Lopez | ✅ authored |
| B20 | Sicilian Defense | ✅ authored |
| C00 | French Defense | ✅ authored |
| B10 | Caro-Kann Defense | ✅ authored |
| D02 | London System | ✅ authored |
| B01 | Scandinavian Defense | ✅ authored |
| D30 | Queen's Gambit Declined | ✅ authored |
| A10 | English Opening | ✅ authored |
| C42 | Petrov Defense | ✅ authored |

### Sprint 2 Backlog — Content (10 cards)

| ECO (approx.) | Opening Name |
| ------------- | ------------ |
| C20 | King's Gambit |
| D10 | Slav Defense |
| E62 | King's Indian Defense |
| E21 | Nimzo-Indian Defense |
| B06 | Modern Defense |
| A80 | Dutch Defense |
| D70 | Grünfeld Defense |
| B90 | Sicilian Najdorf |
| B70 | Sicilian Dragon |
| C25 | Vienna Game |
