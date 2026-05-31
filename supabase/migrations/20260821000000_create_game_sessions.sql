CREATE TABLE IF NOT EXISTS public.game_sessions (
  id            uuid        NOT NULL DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  played_at     timestamptz NOT NULL,
  result        text        NOT NULL CHECK (result IN ('white_wins', 'black_wins', 'draw')),
  player_color  text        NOT NULL CHECK (player_color IN ('white', 'black')),
  end_reason    text        NOT NULL CHECK (end_reason IN ('checkmate', 'resign', 'stalemate', 'draw_agreement', 'fifty_move', 'threefold', 'insufficient')),
  ai_difficulty integer     NOT NULL CHECK (ai_difficulty BETWEEN 0 AND 20),
  pgn           text        NOT NULL,
  move_count    integer     NOT NULL CHECK (move_count >= 0),
  opening_eco   text,
  opening_name  text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT game_sessions_pkey PRIMARY KEY (id)
);

ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own rows" ON public.game_sessions
  USING (user_id = auth.uid());
