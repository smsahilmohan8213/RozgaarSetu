-- Application status workflow: timestamps + consistency

CREATE OR REPLACE FUNCTION public.applications_set_status_timestamps()
RETURNS trigger AS $$
BEGIN
  -- When status changes, set corresponding timestamp if not already set
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'viewed' THEN
      NEW.viewed_at = COALESCE(NEW.viewed_at, now());
    ELSIF NEW.status = 'shortlisted' THEN
      NEW.shortlisted_at = COALESCE(NEW.shortlisted_at, now());
    ELSIF NEW.status = 'rejected' THEN
      NEW.rejected_at = COALESCE(NEW.rejected_at, now());
    ELSIF NEW.status = 'hired' THEN
      NEW.hired_at = COALESCE(NEW.hired_at, now());
    ELSIF NEW.status = 'applied' THEN
      -- applied_at should exist
      NEW.applied_at = COALESCE(NEW.applied_at, OLD.applied_at);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS applications_status_workflow ON public.applications;
CREATE TRIGGER applications_status_workflow
BEFORE UPDATE OF status ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.applications_set_status_timestamps();

-- Optional: RLS refinement for status-based updates
-- (RLS already allows employers to update any record for their jobs.)

