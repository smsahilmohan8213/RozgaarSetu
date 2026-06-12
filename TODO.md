# RozgaarSetu - Production Sprint TODO

## P0 — Complete Source of Truth Migration
- [ ] Remove AsyncStorage source-of-truth usage for:
  - [ ] @rozgaar_saved
  - [ ] @rozgaar_applied
  - [ ] @rozgaar_statuses
  - [ ] @rozgaar_applied_at
- [ ] Update `AppContext` to hydrate saved/applied/status/application timestamps from Supabase only.
- [ ] Ensure employer/applicant flows use UUID job ids only (or handle non-UUID safely).

## P0 — Employer Applicant Management
- [ ] Replace synthetic applicant listing in `app/employer/applicants/[jobId].tsx` with real query against `public.applications`.
- [ ] Implement real applicant counts based on `applications` table.
- [ ] Implement status updates via `applications.status` (public.applications) and timestamps.
- [ ] Add status filtering UI (if present) based on queried status.

## P0 — Resume Storage
- [ ] Implement Supabase Storage upload flow (bucket `resumes`) in `app/(tabs)/profile.tsx`.
- [ ] Persist `resume_path` + `resume_url` in `profiles` (no device-only resumeUri persistence).
- [ ] Remove local persistence of resume objects.
- [ ] Connect application list to resume access for employers using application_id/application relationships.

## P1 — Notifications Hardening
- [ ] Replace mock notifications in `app/notifications/index.tsx`.
- [ ] Query `public.notifications` for the authenticated user.
- [ ] Link notifications to `application_id` and `job_id`.
- [ ] Prevent duplicate creation where possible.
- [ ] Implement read/unread updates using `public.notifications`.

## P1 — UUID Cleanup
- [ ] Verify saved/apply/status/notifications work with UUID-only job ids.
- [ ] Remove/guard non-UUID assumptions.

## P1 — Final Audit
- [ ] Compile status
- [ ] Remaining AsyncStorage usage list
- [ ] Remaining mock data usage list
- [ ] Remaining production blockers
- [ ] MVP readiness score
- [ ] Launch readiness score


