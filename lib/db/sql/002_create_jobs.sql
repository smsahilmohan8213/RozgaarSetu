-- Create jobs table
-- MVP entities: jobs, saved_jobs, applications, notifications, recruiters

CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Job owner (employer user)
  employer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Core details
  title text NOT NULL,
  description text NOT NULL,
  location text,
  job_type text,
  experience_level text,

  salary_min numeric,
  salary_max numeric,
  currency text DEFAULT 'INR',

  is_active boolean NOT NULL DEFAULT true,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS jobs_employer_id_idx ON public.jobs (employer_id);
CREATE INDEX IF NOT EXISTS jobs_is_active_idx ON public.jobs (is_active);
CREATE INDEX IF NOT EXISTS jobs_created_at_idx ON public.jobs (created_at DESC);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS jobs_set_updated_at ON public.jobs;
CREATE TRIGGER jobs_set_updated_at
BEFORE UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Select rules
-- Job seekers can read active jobs
CREATE POLICY "jobs_select_active_for_public" ON public.jobs
  FOR SELECT
  USING (is_active = true);

-- Employers can read their own jobs (including inactive)
CREATE POLICY "jobs_select_own_employer" ON public.jobs
  FOR SELECT
  USING (employer_id = auth.uid());

-- Insert rules: only employers can create jobs (based on profiles.role)
CREATE POLICY "jobs_insert_own_employer" ON public.jobs
  FOR INSERT
  WITH CHECK (
    employer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'employer'
    )
  );

-- Update rules: only employer owner; also enforce employer role
CREATE POLICY "jobs_update_own_employer" ON public.jobs
  FOR UPDATE
  USING (
    employer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'employer'
    )
  )
  WITH CHECK (
    employer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'employer'
    )
  );

-- Delete rules: only employer owner
CREATE POLICY "jobs_delete_own_employer" ON public.jobs
  FOR DELETE
  USING (
    employer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'employer'
    )
  );

