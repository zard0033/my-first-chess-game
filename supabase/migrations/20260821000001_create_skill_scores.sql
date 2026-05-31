CREATE TABLE IF NOT EXISTS public.skill_scores (
  id              uuid           NOT NULL DEFAULT gen_random_uuid(),
  user_id         uuid           NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  as_of_game_id   uuid           NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  opening_score   numeric(5,1)   NOT NULL CHECK (opening_score BETWEEN 0 AND 100),
  tactics_score   numeric(5,1)   NOT NULL CHECK (tactics_score BETWEEN 0 AND 100),
  endgame_score   numeric(5,1)   NOT NULL CHECK (endgame_score BETWEEN 0 AND 100),
  level           integer        NOT NULL CHECK (level >= 1),
  created_at      timestamptz    NOT NULL DEFAULT now(),
  CONSTRAINT skill_scores_pkey PRIMARY KEY (id)
);

ALTER TABLE public.skill_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own rows" ON public.skill_scores
  USING (user_id = auth.uid());
