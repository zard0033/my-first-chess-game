-- Concept-tab side-door learns (Learning Loop #20). Row existence = a tactic's lesson was learned
-- out of linear order via the Concept Map (`?from=concept`). Kept in a SEPARATE table from
-- lesson_progress on purpose (GDD §3.2 D1 separate-signal pattern): a side-door learn lights the
-- Concept Map's 已學 but must NEVER feed linear unlock / progression. Mirrors lesson_progress:
-- monotonic, per-user, RLS-scoped to the owner.
CREATE TABLE IF NOT EXISTS public.lesson_side_learned (
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id   text        NOT NULL,
  learned_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lesson_side_learned_pkey PRIMARY KEY (user_id, lesson_id)
);

ALTER TABLE public.lesson_side_learned ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own rows" ON public.lesson_side_learned
  USING (user_id = auth.uid());
