-- Issue 3: Cleanup Demo Applicants
-- Removes records created with demo/placeholder names from the database

-- Because applicant_name is NOT in the public.applications table (as per actual schema),
-- we delete records using the linked public.profiles table.

DELETE FROM public.applications
WHERE applicant_id IN (
  SELECT id::uuid FROM public.profiles
  WHERE full_name IN ('Rahul Sharma', 'Amit Kumar', 'Priya Singh', 'Karan Verma', 'Sneha Gupta')
);
