/** Configuration for export payload assembly. */
export interface ExportConfig {
  readonly playerName: string
  readonly aiSkillLevel: number
  readonly includeAnnotations: boolean
  /** Optional Tuning Knob overrides (game-export-share.md §7). Defaults from export-tuning.ts. */
  readonly eventTag?: string
  readonly siteTag?: string
  readonly aiNameTemplate?: string
  readonly feedbackDurationMs?: number
  readonly promptTokenBudget?: number
  readonly maxPlyBeforeWarn?: number
}

/**
 * Optional enrichment data from upstream systems (game-export-share.md §3 slots).
 * Absent fields cause their prompt line + PGN tags to be omitted cleanly.
 */
export interface ExportContext {
  readonly opening?: { readonly openingName: string; readonly eco: string }
  readonly review?: { readonly keyMoveNumbers: readonly number[] }
}
