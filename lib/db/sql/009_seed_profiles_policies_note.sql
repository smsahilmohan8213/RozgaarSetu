-- MVP note: existing profiles table already exists (001_create_profiles.sql).
-- This file is intentionally a no-op placeholder to keep numbering consistent.
-- Supabase integration expects:
--   - public.profiles.id matches auth.users.id
--   - public.profiles.role contains 'seeker' and 'employer'
-- See lib/db/sql/001_create_profiles.sql for RLS policies.

