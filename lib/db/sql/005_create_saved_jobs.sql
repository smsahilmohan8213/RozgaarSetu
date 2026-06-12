-- Create saved_jobs table

CREATE TABLE IF NOT EXISTS public.saved_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  seeker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  created_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE(job_id, seeker_id)
);

CREATE INDEX IF NOT EXISTS saved_jobs_seeker_id_idx ON public.saved_jobs (seeker_id);
CREATE INDEX IF NOT EXISTS saved_jobs_job_id_idx ON public.saved_jobs (job_id);

ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;

-- Seeker can read their saved jobs
CREATE POLICY "saved_jobs_select_own" ON public.saved_jobs
  FOR SELECT
  USING (seeker_id = auth.uid());

-- Seeker can insert saved jobs; enforce seeker role
CREATE POLICY "saved_jobs_insert_seeker" ON public.saved_jobs
  FOR INSERT
  WITH CHECK (
    seeker_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'seeker'
    )
  );

-- Seeker can delete their saved jobs
CREATE POLICY "saved_jobs_delete_own" ON public.saved_jobs
  FOR DELETE
  USING (seeker_id = auth.uid());

