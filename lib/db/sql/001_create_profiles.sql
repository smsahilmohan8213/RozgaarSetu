-- Create profiles table linked to Supabase Auth
CREATE TABLE IF NOT EXISTS public.profiles (
  id text PRIMARY KEY,
  full_name text,
  phone text,
  role text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow owners to SELECT their own profile; allow admins (based on profiles.role) to read all
CREATE POLICY "Profiles: select own or admin" ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM public.profiles p2 WHERE p2.id = auth.uid() AND p2.role = 'admin'
    )
  );

-- Allow owners to INSERT their own profile (id must match auth.uid())
CREATE POLICY "Profiles: insert own" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow owners to UPDATE their own profile; allow admins to update any
CREATE POLICY "Profiles: update own or admin" ON public.profiles
  FOR UPDATE
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM public.profiles p2 WHERE p2.id = auth.uid() AND p2.role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM public.profiles p2 WHERE p2.id = auth.uid() AND p2.role = 'admin'
    )
  );

-- Allow owners to DELETE their own profile; allow admins to delete any
CREATE POLICY "Profiles: delete own or admin" ON public.profiles
  FOR DELETE
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM public.profiles p2 WHERE p2.id = auth.uid() AND p2.role = 'admin'
    )
  );

-- Notes: Run this SQL on your Supabase project's SQL editor or apply via migrations.
