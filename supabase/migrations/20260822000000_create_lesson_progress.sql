CREATE TABLE IF NOT EXISTS public.lesson_progress (
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id    text        NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lesson_progress_pkey PRIMARY KEY (user_id, lesson_id)
);

ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own rows" ON public.lesson_progress
  USING (user_id = auth.uid());
