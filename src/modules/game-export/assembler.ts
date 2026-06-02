import { Chess } from 'chess.js'
import type { CompletedGame } from '../../stores/game-store'
import type { ExportConfig, ExportContext } from './types'
import { COACH_PROMPT_TEMPLATE, DEFAULT_EXPORT_TUNING } from '../../config/export-tuning'

/** Options for building a game's PGN. Shared by export and data-sync persistence. */
export interface BuildPgnOptions {
  readonly eventTag?: string
  readonly siteTag?: string
  readonly playerName?: string
  readonly aiNameTemplate?: string
  readonly opening?: { readonly openingName: string; readonly eco: string }
}

/** PGN Date tag in the player's LOCAL timezone, YYYY.MM.DD, zero-padded ASCII. */
function localDateTag(epochMs: number): string {
  const d = new Date(epochMs)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}.${m}.${day}`
}

/** AI player name from the template; drops the "(level N)" parenthetical when level is absent. */
function aiPlayerName(template: string, skillLevel: number | undefined): string {
  if (skillLevel === undefined) return 'Stockfish'
  return template.split('{{N}}').join(String(skillLevel))
}

/**
 * PGN Termination tag — standard controlled vocabulary only (game-export-share.md Core Rule 5).
 * The six v0 endReasons all conclude normally → "normal". "abandoned" is defensive-only
 * (not in CompletedGame's v0 union) and kept for forward-safety if the type ever widens.
 */
function terminationTag(endReason: string): string {
  return endReason === 'abandoned' ? 'abandoned' : 'normal'
}

type Outcome = 'won' | 'lost' | 'draw'

function playerOutcome(game: CompletedGame): Outcome {
  if (game.result === '1/2-1/2') return 'draw'
  const whiteWon = game.result === '1-0'
  const playerIsWhite = game.playerColor === 'white'
  return whiteWon === playerIsWhite ? 'won' : 'lost'
}

/**
 * Natural-language outcome sentence for the {{RESULT_PLAIN}} slot
 * (game-export-share.md §3 RESULT_PLAIN mapping table).
 */
export function buildResultPlain(game: CompletedGame): string {
  // The GDD §3 table also lists `draw-agreement` / `abandoned` / `result: '*'` rows, but
  // CompletedGame's v0 union (game-store.ts) cannot produce them, so they are intentionally
  // not implemented here. The result token is authoritative for contradictory combos: the
  // generic-bucket fallbacks ('I won/lost this game.' / 'It was a draw.') cover them.
  const outcome = playerOutcome(game)
  const reason = game.endReason
  if (outcome === 'won') {
    if (reason === 'checkmate') return 'I won by checkmate.'
    if (reason === 'resignation') return 'I won — my opponent resigned.'
    return 'I won this game.'
  }
  if (outcome === 'lost') {
    if (reason === 'checkmate') return 'I lost — I was checkmated.'
    if (reason === 'resignation') return 'I lost — I resigned.'
    return 'I lost this game.'
  }
  switch (reason) {
    case 'stalemate':
      return 'It was a draw by stalemate.'
    case 'threefold':
      return 'It was a draw by threefold repetition.'
    case 'fifty-move':
      return 'It was a draw by the fifty-move rule.'
    case 'insufficient-material':
      return 'It was a draw — insufficient material to checkmate.'
    default:
      return 'It was a draw.'
  }
}

/**
 * Serialize a completed game to standard PGN via chess.js.
 * Pure synchronous. Shared by Game Export and game_sessions persistence (data-sync).
 */
export function buildPgn(game: CompletedGame, opts: BuildPgnOptions = {}): string {
  const chess = new Chess()
  for (const uci of game.moves) {
    const from = uci.slice(0, 2)
    const to = uci.slice(2, 4)
    const promo = uci.length === 5 ? (uci[4].toLowerCase() as 'q' | 'r' | 'b' | 'n') : undefined
    chess.move({ from, to, promotion: promo })
  }

  const player = opts.playerName ?? 'Player'
  const ai = aiPlayerName(opts.aiNameTemplate ?? DEFAULT_EXPORT_TUNING.aiNameTemplate, game.aiSkillLevel)

  // Seven Tag Roster + standard supplemental tags (game-export-share.md Core Rules 4–5)
  chess.setHeader('Event', opts.eventTag ?? DEFAULT_EXPORT_TUNING.eventTag)
  chess.setHeader('Site', opts.siteTag ?? DEFAULT_EXPORT_TUNING.siteTag)
  chess.setHeader('Date', localDateTag(game.completedAt))
  chess.setHeader('Round', '-')
  chess.setHeader('White', game.playerColor === 'white' ? player : ai)
  chess.setHeader('Black', game.playerColor === 'black' ? player : ai)
  chess.setHeader('Result', game.result)
  chess.setHeader('Termination', terminationTag(game.endReason))
  if (opts.opening) {
    chess.setHeader('Opening', opts.opening.openingName)
    chess.setHeader('ECO', opts.opening.eco)
  }

  return chess.pgn()
}

/** Replace every occurrence of a literal token, immune to `$`-substitution in the value. */
function fill(template: string, token: string, value: string): string {
  return template.split(token).join(value)
}

/**
 * Assembles a Claude.ai "Coach" prompt containing the game's PGN.
 * Pure synchronous — no network calls, no storage access.
 * ADR-0010: always called at share-gesture time, never pre-built on mount.
 * Optional `context` enriches the prompt with opening / review data when available.
 */
export function assembleExportPayload(
  game: CompletedGame,
  config: ExportConfig,
  context?: ExportContext,
): string {
  const pgn = buildPgn(game, {
    eventTag: config.eventTag,
    siteTag: config.siteTag,
    playerName: config.playerName,
    aiNameTemplate: config.aiNameTemplate,
    opening: context?.opening,
  })

  const openingLine = context?.opening
    ? `- The opening was ${context.opening.openingName} (${context.opening.eco}).`
    : null
  const reviewLine =
    context?.review && context.review.keyMoveNumbers.length > 0
      ? `- An engine flagged my likely turning points around moves ${context.review.keyMoveNumbers.join(', ')}.`
      : null

  let payload = COACH_PROMPT_TEMPLATE
  payload = fill(payload, '{{PGN}}', pgn)
  payload = fill(payload, '{{PLAYER_COLOR}}', game.playerColor)
  payload = fill(payload, '{{AI_SKILL_LEVEL}}', String(game.aiSkillLevel))
  payload = fill(payload, '{{RESULT_PLAIN}}', buildResultPlain(game))
  // Whole-line slots: omitted line removed together with its trailing newline (§3 omission rule).
  payload = payload.replace('{{OPENING_LINE}}\n', openingLine ? `${openingLine}\n` : '')
  payload = payload.replace('{{REVIEW_HINT_LINE}}\n', reviewLine ? `${reviewLine}\n` : '')

  return payload
}

/** Formula 2: estimated Claude.ai message tokens for the payload. */
export function estimatePayloadTokens(
  payload: string,
  charsPerToken: number = DEFAULT_EXPORT_TUNING.charsPerToken,
): number {
  return Math.round(payload.length / charsPerToken)
}

/** Whether the payload exceeds the single-message token budget (non-blocking warning). */
export function isOversizePayload(
  payload: string,
  promptTokenBudget: number = DEFAULT_EXPORT_TUNING.promptTokenBudget,
): boolean {
  return estimatePayloadTokens(payload) > promptTokenBudget
}

/** Whether ply count crosses the long-game note threshold (maxPlyBeforeWarn). */
export function isLongGame(
  plyCount: number,
  maxPlyBeforeWarn: number = DEFAULT_EXPORT_TUNING.maxPlyBeforeWarn,
): boolean {
  return plyCount > maxPlyBeforeWarn
}
