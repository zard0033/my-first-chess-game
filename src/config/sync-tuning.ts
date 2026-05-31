/** Maximum number of unsynced games stored in localStorage before oldest is dropped. */
export const UNSYNCED_QUEUE_MAX = 50

/** Base delay for exponential backoff on sync retry (ms). */
export const SYNC_BASE_DELAY_MS = 1_000

/** Maximum delay cap for exponential backoff (ms). */
export const SYNC_MAX_DELAY_MS = 30_000

/** Refresh JWT this many ms before it expires. */
export const TOKEN_REFRESH_BUFFER_MS = 300_000
