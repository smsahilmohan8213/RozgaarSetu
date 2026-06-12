-- Resume storage bucket design + policies
-- Note: Buckets are created/managed via Supabase Storage API / SQL helper.
-- These statements are safe to apply if bucket creation is handled elsewhere.

-- Bucket: resumes
-- Suggested naming convention: resumes/<user_id>/<application_id>/<filename>
-- Example:
--   resumes/uuid-applicant/<application_id>/resume.pdf

-- If your environment supports Storage DDL (some projects do via extensions), you may have to run
-- bucket creation in Supabase dashboard or via a script.

-- Recommended: enable RLS for storage objects
-- (Supabase storage automatically uses RLS; policies below cover access)

-- Ensure storage tables have RLS enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Policy: allow authenticated users to upload their own resume objects
-- We infer owner from path segment 1 = user_id.
-- Path format: resumes/{user_id}/{application_id}/{filename}
CREATE POLICY "resumes_insert_own" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'resumes'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: allow seekers to read their own resume objects
CREATE POLICY "resumes_select_own" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'resumes'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: allow employers/recruiters to read resume for their applications
-- Determined by application_id embedded in path segment 2.
-- Path: resumes/{applicant_id}/{application_id}/{filename}
CREATE POLICY "resumes_select_for_employer_via_application" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'resumes'
    AND EXISTS (
      SELECT 1
      FROM public.applications a
      JOIN public.jobs j ON j.id = a.job_id
      WHERE a.id = (storage.foldername(name))[2]::uuid
        AND j.employer_id = auth.uid()
    )
  );

-- Policy: allow update/delete only by owner (seekers)
CREATE POLICY "resumes_delete_own" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'resumes'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Helper note: storage.foldername(name) returns a text[] for path segments.
-- If your Supabase version doesn't support storage.foldername, replace with split_part.
-- Example alternative:
--   auth.uid()::text = split_part(name, '/', 1)
--   application_id = split_part(name, '/', 2)

