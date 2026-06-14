export interface MoveMadePayload {
  from: string
  to: string
  promotion?: string
  fen: string
  animationDoneAt: Promise<void>
}
