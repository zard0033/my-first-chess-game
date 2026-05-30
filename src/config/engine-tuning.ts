/**
 * Engine tuning knobs for Post-Game Review two-pass analysis.
 * GDD Post-Game Review §Tuning Knobs — all values are provisional pending OQ-5 device spike.
 */

/** Pass-1 (preview) analysis depth. Shallow so whole game reads quickly. */
export const REVIEW_PREVIEW_DEPTH = 12

/** Pass-1 per-position time cap in ms. */
export const REVIEW_PREVIEW_MOVE_TIME_MS = 1_500

/** Pass-2 (deep) analysis depth. Provisional — OQ-5 spike may lower this. */
export const REVIEW_TARGET_DEPTH = 22

/** Pass-2 per-position time cap in ms. */
export const REVIEW_MAX_MOVE_TIME_MS = 10_000

/** Hard ceiling on the deep pass in ms (Rule 14). Pass 1 is never cut. */
export const REVIEW_TOTAL_TIME_BUDGET_MS = 90_000

/**
 * Max abs(depthReached[i] − depthReached[i+1]) for a cpLoss to be a final value.
 * Exceeding this shows the cpLoss with preliminary treatment (Rule 22a).
 */
export const DEPTH_MISMATCH_TOLERANCE = 4

/**
 * Centipawn value representing a forced mate for F2 ranking (F4).
 * Affects swing ordering only; mate transitions display via F2b labels.
 */
export const MATE_CP = 30_000
