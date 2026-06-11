-- Resume in-progress game (續玩對局). One row per user (the single "continue" slot): leaving the
-- board mid-game upserts the snapshot here, finishing or starting a new game deletes it. Unlike
-- lesson/dungeon progress this is NOT monotonic — the client reconciles by `updated_at`
-- (last-write-wins), so the newest device's game wins on login. Per-user, RLS-scoped to the owner.
CREATE TABLE IF NOT EXISTS public.in_progress_game (
  user_id           uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  moves             jsonb       NOT NULL DEFAULT '[]'::jsonb,  -- UCI move list, replayed to rebuild state
  player_color      text        NOT NULL,
  level             integer     NOT NULL,
  player_move_times jsonb       NOT NULL DEFAULT '[]'::jsonb,  -- ms per player move, kept for post-game review
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT in_progress_game_pkey PRIMARY KEY (user_id),
  CONSTRAINT in_progress_game_player_color_check CHECK (player_color IN ('white', 'black'))
);

ALTER TABLE public.in_progress_game ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own rows" ON public.in_progress_game
  USING (user_id = auth.uid());
