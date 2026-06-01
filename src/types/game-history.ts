export interface Cursor {
  playedAt: string   // ISO 8601
  createdAt: string  // ISO 8601
  id: string         // UUID (id ASC tiebreaker)
}

export interface GameHistoryEntry {
  id: string
  playedAt: Date | null
  displayDate: string               // '—' if playedAt is null
  playerResult: 'Win' | 'Loss' | 'Draw' | 'Unknown'
  playerResultPrefix: 'W' | 'L' | '½' | '?'
  playerColor: 'white' | 'black'
  endReason: string
  endReasonDisplay: string
  aiDifficulty: number
  difficultyLabel: string
  moveCount: number
  openingName: string | null
  openingEco: string | null
  openingDisplay: string
}
