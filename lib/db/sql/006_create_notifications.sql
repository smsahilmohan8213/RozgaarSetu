-- Create notifications table

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  type text NOT NULL,
  title text,
  body text,

  -- optional link context
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  application_id uuid REFERENCES public.applications(id) ON DELETE SET NULL,

  is_read boolean NOT NULL DEFAULT false,

  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

CREATE INDEX IF NOT EXISTS notifications_user_id_read_idx
  ON public.notifications (user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_job_id_idx ON public.notifications (job_id);
CREATE INDEX IF NOT EXISTS notifications_application_id_idx ON public.notifications (application_id);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own notifications (optional; often server-side)
CREATE POLICY "notifications_insert_own" ON public.notifications
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own notifications (read/unread)
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

