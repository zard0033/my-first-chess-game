/** In-progress game snapshot for the resume feature (續玩對局). One slot per player. */
export interface ResumePayload {
  /** Full move list in UCI long-algebraic (e.g. "e2e4", "e7e8q") — replayed to rebuild state. */
  moves: string[]
  playerColor: 'white' | 'black'
  /** Stockfish Skill Level (0–20) chosen for this game. */
  level: number
  /** Player thinking times (ms), indexed against player moves only — preserved for post-game review. */
  playerMoveTimes: number[]
}

/** ResumePayload plus the write timestamp used for last-write-wins reconciliation across devices. */
export interface ResumeSnapshot extends ResumePayload {
  updatedAt: number
}
