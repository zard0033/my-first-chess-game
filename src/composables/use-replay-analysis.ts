/**
 * Replay analysis composable (S10-03).
 * Pre-analyses every position of a replayed game with the NNUE review engine and
 * caches results by FEN, so stepping through moves shows an evaluation bar + best
 * move arrow with no per-step lag.
 *
 * One shallow pass (depth-12) keeps a full game under the review time budget.
 * Reuses the review-engine analyze() contract (ADR-0002); analyzeFn is injectable
 * for deterministic testing without spawning a real Stockfish worker.
 */
import { ref, readonly, computed } from 'vue'
import type { ReviewResult } from '../modules/chess-engine/review-engine'
import { REVIEW_PREVIEW_DEPTH, REVIEW_PREVIEW_MOVE_TIME_MS } from '../config/engine-tuning'

export interface ReplayAnalysisEntry {
  readonly evalCp?: number
  readonly evalMate?: number
  readonly bestMove: string | null
  readonly depthReached: number
}

export interface ReplayAnalyzeFn {
  (input: { fen: string; targetDepth: number; movetimeMs: number; signal: AbortSignal }): Promise<ReviewResult>
}

export interface ReplayAnalysisDeps {
  /** Per-position analysis depth. Defaults to the review preview depth (12). */
  depth?: number
  /** Per-position time cap in ms. */
  movetimeMs?: number
}

export function useReplayAnalysis(deps?: ReplayAnalysisDeps) {
  const depth = deps?.depth ?? REVIEW_PREVIEW_DEPTH
  const movetimeMs = deps?.movetimeMs ?? REVIEW_PREVIEW_MOVE_TIME_MS

  const isAnalysing = ref(false)
  const analysedCount = ref(0)
  const totalCount = ref(0)
  const byFen = ref(new Map<string, ReplayAnalysisEntry>())

  let abortController = new AbortController()

  const progress = computed(() =>
    totalCount.value === 0 ? 0 : analysedCount.value / totalCount.value,
  )

  function getByFen(fen: string): ReplayAnalysisEntry | null {
    return byFen.value.get(fen) ?? null
  }

  /**
   * Analyse every unique FEN sequentially. Per-position failures (engine timeout,
   * unavailable) leave that FEN un-analysed and continue — the overlay simply hides
   * the eval for that position (EC-04). Re-invoking aborts any in-flight run.
   */
  async function run(fens: string[], analyzeFn: ReplayAnalyzeFn): Promise<void> {
    abortController.abort()
    abortController = new AbortController()
    const signal = abortController.signal

    const unique = [...new Set(fens)]
    byFen.value = new Map()
    analysedCount.value = 0
    totalCount.value = unique.length
    isAnalysing.value = true

    try {
      for (const fen of unique) {
        if (signal.aborted) return
        try {
          const r = await analyzeFn({ fen, targetDepth: depth, movetimeMs, signal })
          byFen.value.set(fen, {
            evalCp: r.evalCp,
            evalMate: r.evalMate,
            bestMove: r.bestMove,
            depthReached: r.depthReached,
          })
        } catch {
          if (signal.aborted) return
          // per-position failure — leave blank, keep going
        }
        analysedCount.value++
      }
    } finally {
      if (!signal.aborted) isAnalysing.value = false
    }
  }

  /** Abort any in-flight analysis (call on unmount). */
  function cancel(): void {
    abortController.abort()
    isAnalysing.value = false
  }

  return {
    isAnalysing: readonly(isAnalysing),
    analysedCount: readonly(analysedCount),
    totalCount: readonly(totalCount),
    progress,
    byFen,
    getByFen,
    run,
    cancel,
  }
}
