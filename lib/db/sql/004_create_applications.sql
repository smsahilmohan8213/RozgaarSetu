-- Create applications table

CREATE TABLE IF NOT EXISTS public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recruiter_id uuid REFERENCES public.recruiters(id) ON DELETE SET NULL,

  resume_path text, -- Supabase Storage object path
  resume_url text,  -- optional cached URL

  cover_letter text,

  status text NOT NULL DEFAULT 'applied'
    CHECK (status IN ('applied','viewed','shortlisted','rejected','hired')),

  -- Workflow timestamps
  applied_at timestamptz NOT NULL DEFAULT now(),
  viewed_at timestamptz,
  shortlisted_at timestamptz,
  rejected_at timestamptz,
  hired_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE(job_id, applicant_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS applications_job_id_status_idx ON public.applications (job_id, status);
CREATE INDEX IF NOT EXISTS applications_applicant_id_idx ON public.applications (applicant_id);
CREATE INDEX IF NOT EXISTS applications_created_at_idx ON public.applications (created_at DESC);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS applications_set_updated_at ON public.applications;
CREATE TRIGGER applications_set_updated_at
BEFORE UPDATE ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Job seeker can insert their own application (applicant_id=auth.uid())
CREATE POLICY "applications_insert_applicant" ON public.applications
  FOR INSERT
  WITH CHECK (
    applicant_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'seeker'
    )
  );

-- Job seeker can read their own applications
CREATE POLICY "applications_select_applicant" ON public.applications
  FOR SELECT
  USING (applicant_id = auth.uid());

-- Recruiter/employer can read applications for their jobs
CREATE POLICY "applications_select_job_employer" ON public.applications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.jobs j
      WHERE j.id = applications.job_id
        AND j.employer_id = auth.uid()
    )
  );

-- Recruiter/employer can update status and timestamps only for their jobs
CREATE POLICY "applications_update_job_employer" ON public.applications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.jobs j
      WHERE j.id = applications.job_id
        AND j.employer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.jobs j
      WHERE j.id = applications.job_id
        AND j.employer_id = auth.uid()
    )
  );

-- Prevent deletion by default (no delete policy)

