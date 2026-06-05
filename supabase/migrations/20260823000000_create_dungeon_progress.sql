-- Dungeon Puzzle Mode progress (S13-07). Row existence = puzzle solved.
-- `hint_used` records whether a hint was used on the solving attempt. Mirrors
-- lesson_progress: monotonic, per-user, RLS-scoped to the owner.
CREATE TABLE IF NOT EXISTS public.dungeon_progress (
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  puzzle_id  text        NOT NULL,
  hint_used  boolean     NOT NULL DEFAULT false,
  solved_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dungeon_progress_pkey PRIMARY KEY (user_id, puzzle_id)
);

ALTER TABLE public.dungeon_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own rows" ON public.dungeon_progress
  USING (user_id = auth.uid());
