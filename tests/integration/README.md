# Integration Tests (Vitest)

Cross-system tests that verify multiple modules working together.
Run in Node (no browser), but may use jsdom for Vue reactivity.

## What belongs here

- GameLifecycle → CompletedGame → gameStore round-trip
- ChessEngine → UCI response → PostGameReview session storage
- AssembleExportPayload consuming a real CompletedGame from store
- Opening identification wired to a real FEN sequence
- sessionStorage persistence: write + read + pv-stripped verification

## What does NOT belong here

- Pure logic tests on a single function → `tests/unit/`
- Full UI flows (click, form fill) → `tests/e2e/`

## File layout

```
tests/integration/
  game-lifecycle-to-store/     # CompletedGame transport chain
  engine-to-review/            # UCI analysis → sessionStorage round-trip
  export-assembly/             # Full payload assembly with real store data
  opening-id-to-display/       # EPD pipeline to display name
```

## Running

```bash
npm run test:unit   # integration tests share the same Vitest config
```
