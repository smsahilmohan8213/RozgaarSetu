-- Create recruiters table
-- A recruiter is an employer profile (role='employer') plus job-posting metadata.

CREATE TABLE IF NOT EXISTS public.recruiters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to auth user
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  company_name text,
  company_size text,
  website text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS recruiters_company_name_idx ON public.recruiters (company_name);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS recruiters_set_updated_at ON public.recruiters;
CREATE TRIGGER recruiters_set_updated_at
BEFORE UPDATE ON public.recruiters
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.recruiters ENABLE ROW LEVEL SECURITY;

-- Recruiters can read their own recruiter record
CREATE POLICY "recruiters_select_own" ON public.recruiters
  FOR SELECT
  USING (user_id = auth.uid());

-- Recruiters can insert their own record; enforce role in profiles
CREATE POLICY "recruiters_insert_employer_only" ON public.recruiters
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'employer'
    )
  );

-- Recruiters can update their own record
CREATE POLICY "recruiters_update_own" ON public.recruiters
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

