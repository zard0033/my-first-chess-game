# Smoke Test: Critical Paths

**Purpose**: Run these checks (< 15 minutes) before any QA hand-off or pre-production gate.
**Run via**: `/smoke-check` (reads this file)
**Update**: Add entries as core systems are implemented each sprint.

---

## Core Stability (run every sprint)

1. `npm run dev` starts without error; app loads at `localhost:5173`
2. `npm run build` completes without TypeScript errors
3. `npm run test:unit` exits 0 (all unit + integration tests pass)

## Chess Board

4. Board renders the starting position on app load
5. A legal pawn move (e2→e4) can be completed by drag or tap-tap
6. An illegal move is rejected (piece returns to origin, no move emitted)
7. Promotion dialog appears for pawn reaching 8th rank; selecting a piece completes the move
8. Keyboard: Tab to board → arrow keys navigate squares → Enter selects piece + legal dots appear

## Chess Engine

9. Stockfish worker initialises within 3 seconds of app load
10. Engine returns a move response within 5 seconds (HCE depth-12 or lower)
11. `EngineUnavailableError` path: stub worker failure → app continues in two-human mode without crash

## Game Lifecycle

12. A complete game (all pieces captured or resignation) reaches the review screen
13. `CompletedGame` shape in Pinia store has required fields: `pgn`, `result`, `endReason`, `playerColor`, `playerMoveTimes`

## Post-Game Review

14. Review screen shows at least one best-move arrow on the biggest-swing position
15. Eval bar renders and updates as positions are stepped through
16. Mobile viewport (≤ 768px): only best-move arrow visible (no played-move arrow, no eval bar)

## Game Export

17. "Analyze with Claude" button produces a non-empty clipboard payload
18. Payload contains valid PGN and the Claude.ai prompt template
19. FALLBACK textarea appears when Clipboard API is unavailable (stub test)

## Navigation

20. In-game guard: attempting to navigate away mid-game shows confirmation
21. Back-button during review returns to home without guard prompt

## Accessibility (axe-core)

22. Home screen: 0 axe violations at `serious` or `critical` severity
23. Play screen: 0 axe violations at `serious` or `critical` severity
24. Review screen: 0 axe violations at `serious` or `critical` severity

---

## Smoke Check Pass Criteria

All 24 checks ✅ = PASS → safe to advance to manual QA hand-off.
Any ❌ = FAIL → do not hand off; fix before re-running.
