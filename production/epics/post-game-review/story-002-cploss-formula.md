# Story 002: cpLoss Formula and Depth-Comparability Guard

> **Epic**: Post-Game Review
> **Status**: Ready
> **Layer**: Feature
> **Type**: Logic
> **Estimate**: S (2–3 hours)
> **Manifest Version**: 2026-05-29
> **Last Updated**: 2026-05-28

## Context

**GDD**: `design/gdd/post-game-review.md`
**Requirements**: `TR-post-game-review-002`, `TR-post-game-review-004`

**ADR Governing Implementation**: ADR-0007: Post-Game Review Analysis Loop and sessionStorage Schema
**ADR Decision Summary**: F2 cpLoss formula: `cpLoss[i] = max(0, E[i] + E[i+1])` where both evals are in side-to-move convention (positive = side to move wins). Depth-comparability guard (Rule 22a): if `|depthReached[i] - depthReached[i+1]| > DEPTH_MISMATCH_TOLERANCE (4)`, mark value `preliminary` regardless of pass label.

**Control Manifest Rules (Feature layer)**:
- Required: F2 cpLoss formula: `cpLoss[i] = max(0, E[i] + E[i+1])` (side-to-move convention; clamped to 0)
- Required: Depth-comparability guard (Rule 22a): `|depthReached[i] - depthReached[i+1]| > 4` → mark preliminary
- Required: Display contract precedence (first match wins): not-applicable → pending → confirming → mate transition → value
- Required: Tuning knobs live in `src/config/engine-tuning.ts` as named exports (never inline numbers)

---

## Acceptance Criteria

- [ ] `computeCpLoss(evalI: number, evalNext: number): number` returns `Math.max(0, evalI + evalNext)`.
- [ ] Both evals are in side-to-move convention — no pre-normalization to White's perspective before this formula.
- [ ] `DEPTH_MISMATCH_TOLERANCE = 4` is a named export in `src/config/engine-tuning.ts`.
- [ ] When `|result[i].depthReached - result[i+1].depthReached| > DEPTH_MISMATCH_TOLERANCE`, the cpLoss value for move `i` is marked `{ value: cpLoss, preliminary: true }`.
- [ ] When `result[i].evalMate !== undefined`, the mate transition display contract applies (not the numeric cpLoss value).
- [ ] `computeCpLoss` is a pure function (no side effects, no external state).

---

## Implementation Notes

*From ADR-0007 §6:*

```ts
// src/config/engine-tuning.ts
export const DEPTH_MISMATCH_TOLERANCE = 4

// src/modules/post-game-review/cploss.ts
export function computeCpLoss(evalI: number, evalNext: number): number {
  return Math.max(0, evalI + evalNext)
}

export function isCpLossPreliminary(depthI: number, depthNext: number): boolean {
  return Math.abs(depthI - depthNext) > DEPTH_MISMATCH_TOLERANCE
}
```

- Display contract: before showing cpLoss value, check in order: (1) is position not-applicable (e.g., last move)? (2) is `pass === 'preview'` (pending deep)? (3) is it confirming (deep just arrived, verifying)? (4) is it a mate transition? (5) show numeric value.
- Mate transition: if `evalMate[i]` or `evalMate[i+1]` is non-null, show the mate label rather than cpLoss number.

---

## QA Test Cases

- **AC-1**: cpLoss basic formula
  - Given: `evalI = 50` (side-to-move slightly winning), `evalNext = -120` (after move, opponent winning)
  - When: `computeCpLoss(50, -120)`
  - Then: `max(0, 50 + (-120)) = max(0, -70) = 0` — loss of 70cp → clamped to 0 (side improved)

  Wait, let me reconsider. F2: `cpLoss[i] = max(0, E[i] + E[i+1])`. In side-to-move convention:
  - Before move i: E[i] is the eval from side-to-move i's perspective. Say E[i] = 50 (i is doing ok)
  - After move i: E[i+1] is from the NEW side-to-move's perspective (the opponent). If E[i+1] = 80, that means the opponent now has an 80cp advantage.
  - cpLoss = max(0, 50 + 80) = 130 (we "lost" 130cp by making this move)
  
  - Given: `evalI = 50`, `evalNext = 80` (opponent now winning after our move)
  - When: `computeCpLoss(50, 80)`
  - Then: `max(0, 130) = 130`

- **AC-2**: No loss (good move)
  - Given: `evalI = 50`, `evalNext = -30` (opponent doing worse after our move)
  - When: `computeCpLoss(50, -30)`
  - Then: `max(0, 20) = 20` — minor loss

  Hmm, actually if evalNext is negative in side-to-move convention, that means the NEW side-to-move (opponent) is losing — which means our move was GOOD. So `50 + (-30) = 20` which is positive... that doesn't represent "no loss". Let me reconsider.

  Actually in side-to-move convention: positive = current side wins. After our move, the new side-to-move is our opponent. If evalNext = -30, opponent is losing, meaning we're winning, which is good.

  cpLoss = max(0, E[i] + E[i+1]) = max(0, 50 + (-30)) = max(0, 20) = 20.

  But wait, if 50 was our position before and we improved to 30cp advantage for us (evalNext = -30 means opponent losing = we're 30cp ahead), then we gained 20cp? That seems like cpLoss should be 0...

  Actually I think the formula semantics are: if E[i] + E[i+1] > 0, we "lost" that many centipawns. If < 0, we gained. So max(0, ...) means we only count losses.

  For a perfect move: E[i] + E[i+1] ≤ 0 (the sum of both sides' eval is ≤ 0, meaning the position hasn't worsened for us). For a bad move: E[i] + E[i+1] > 0 (we gave the opponent more than we got back).

  So: E[i]=50 (we're 50cp ahead), E[i+1]=-30 (opponent is -30, meaning we're 30cp ahead) → cpLoss = max(0, 50 + (-30)) = max(0, 20) = 20. Hmm, this would mean we lost 20cp even though we improved from 50 to 30... Wait, -30 for opponent = we're 30cp ahead after the move. But before we were 50cp ahead. So we lost 20cp by making this move = cpLoss 20. That makes sense.

  - Given: `evalI = 50`, `evalNext = -60` (we improved from 50 to 60cp ahead)
  - When: `computeCpLoss(50, -60)`
  - Then: `max(0, 50 + (-60)) = max(0, -10) = 0` — perfect move or better, cpLoss clamped to 0

- **AC-3**: Depth-comparability guard marks preliminary
  - Given: `depthReached[i] = 8`, `depthReached[i+1] = 14` (difference = 6 > 4)
  - When: `isCpLossPreliminary(8, 14)`
  - Then: `true` (preliminary)

- **AC-4**: DEPTH_MISMATCH_TOLERANCE is a named export
  - When: `import { DEPTH_MISMATCH_TOLERANCE } from 'src/config/engine-tuning'`
  - Then: value is 4

- **AC-5**: Pure function — no side effects
  - Given: same inputs called 3 times
  - When: each call returns
  - Then: identical output; no external state changed

---

## Test Evidence

**Story Type**: Logic
**Required evidence**: `tests/unit/post-game-review/cploss-formula.test.ts`

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 001 must be DONE (analysisResults exist to feed into formula)
- Unlocks: Story 003 (biggestSwingCursor uses cpLoss values)
