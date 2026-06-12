import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

import type { Job, JobCategory } from "@/data/jobs";
import { LOCALITIES } from "@/data/jobs";

import { ensureProfileRow, signInWithPhoneOtpMock } from "@/lib/authSupabase";
import { supabase } from "@/lib/supabaseClient";


export type UserRole = "seeker" | "employer" | null;

export interface UserProfile {
  name: string;
  phone: string;
  role: UserRole;
  isAuthenticated: boolean;
  location: string;
  skills: string[];
  experience: string;
  education: string;
  bio: string;
  resumeUploaded: boolean;
  resumeName?: string;
  resumeUri?: string;
  profileScore: number;
}

export type DraftJob = {
  title: string;
  company: string;
  category: JobCategory;
  location: string;
  salaryMin: number;
  salaryMax: number;
  jobType: "Full Time" | "Part Time" | "Freelance";
  experience: string;
  isFreshersOk: boolean;
  isUrgent: boolean;
  isNegotiable: boolean;
  description: string;
  requirements: string[];
  whatsappNumber: string;
};

interface AppContextType {
  user: UserProfile;
  savedJobIds: string[];
  appliedJobIds: string[];
  jobStatuses: Record<string, "applied" | "viewed" | "shortlisted" | "rejected">;
  postedJobs: Job[];
  selectedLocality: string;
  editingJobId: string | null;
  setSelectedLocality: (loc: string) => void;
  setEditingJobId: (jobId: string | null) => void;
  login: (phone: string, name: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Omit<UserProfile, "isAuthenticated" | "role" | "phone">>) => Promise<void>;
  toggleSaveJob: (jobId: string) => Promise<void>;
  applyToJob: (jobId: string) => Promise<void>;
  setJobStatus: (jobId: string, status: "applied" | "viewed" | "shortlisted" | "rejected") => Promise<void>;
  postJob: (draft: DraftJob) => Promise<void>;
  updateJob: (jobId: string, draft: DraftJob) => Promise<void>;
  deletePostedJob: (jobId: string) => Promise<void>;
  isJobSaved: (jobId: string) => boolean;
  isJobApplied: (jobId: string) => boolean;
}


const DEFAULT_USER: UserProfile = {
  name: "",
  phone: "",
  role: null,
  isAuthenticated: false,
  location: "Rohini",
  skills: [],
  experience: "Fresher",
  education: "B.A.",
  bio: "",
  resumeUploaded: false,
  resumeName: "",
  resumeUri: "",
  profileScore: 40,
};

function computeScore(u: UserProfile): number {
  let score = 0;
  if (u.name) score += 20;
  if (u.phone) score += 15;
  if (u.education && u.education !== "B.A.") score += 20;
  if (u.location && u.location !== "Rohini") score += 15;
  if (u.resumeUploaded) score += 15;
  if (u.bio && u.bio.length > 10) score += 15;
  return Math.min(score, 100);
}

const LOCALITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Rohini: { lat: 28.748, lng: 77.12 },
  Jahangirpuri: { lat: 28.738, lng: 77.164 },
  Pitampura: { lat: 28.704, lng: 77.131 },
  Azadpur: { lat: 28.712, lng: 77.182 },
  "Mukherjee Nagar": { lat: 28.705, lng: 77.207 },
  "Model Town": { lat: 28.718, lng: 77.195 },
  "GTB Nagar": { lat: 28.697, lng: 77.205 },
  "Ashok Vihar": { lat: 28.696, lng: 77.174 },
  "Shalimar Bagh": { lat: 28.714, lng: 77.159 },
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile>(DEFAULT_USER);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
  const [jobStatuses, setJobStatuses] = useState<Record<string, "applied" | "viewed" | "shortlisted" | "rejected">>({});
  const [postedJobs, setPostedJobs] = useState<Job[]>([]);
  const [selectedLocality, setSelectedLocality] = useState<string>("All Areas");
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [applicationDatesByJobId, setApplicationDatesByJobId] = useState<Record<string, string>>({});

  // Phase 2 Step 1: saved_jobs (hybrid fallback)
  const [isHydratingSavedJobs, setIsHydratingSavedJobs] = useState(false);
  const [savedJobsError, setSavedJobsError] = useState<string | null>(null);

  // Phase 2 Step 4: jobs hydration from Supabase (public.jobs)
  const [isHydratingJobs, setIsHydratingJobs] = useState(false);
  const [jobsError, setJobsError] = useState<string | null>(null);


  function isUuidLike(value: string) {
    // v4/v1-ish UUID detection (best-effort for job.id bridge)
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    );
  }

  useEffect(() => {
    // Phase 1 + Phase 2 Step 1: restore non-auth MVP state from AsyncStorage,
    // then hydrate `user` and saved_jobs (UUID ids from Supabase; non-UUID from AsyncStorage).
    void loadFromStorage();
  }, []);

  async function loadFromStorage() {
    try {
      const [
        userData,
        saved,
        applied,
        posted,
        statuses,
        appliedAt,
      ] = await Promise.all([
        AsyncStorage.getItem("@rozgaar_user"),
        AsyncStorage.getItem("@rozgaar_saved"),
        AsyncStorage.getItem("@rozgaar_applied"),
        AsyncStorage.getItem("@rozgaar_posted"),
        AsyncStorage.getItem("@rozgaar_statuses"),
        AsyncStorage.getItem("@rozgaar_applied_at"),
      ]);

      // Restore non-auth CRUD state from AsyncStorage
      if (saved) setSavedJobIds(JSON.parse(saved));
      if (applied) setAppliedJobIds(JSON.parse(applied));
      if (posted) setPostedJobs(JSON.parse(posted));
      if (statuses) setJobStatuses(JSON.parse(statuses));
      if (appliedAt) setApplicationDatesByJobId(JSON.parse(appliedAt));

      // Auth-aware user restore (fallback)
      if (userData) setUser(JSON.parse(userData));

      // Load authoritative profile row if Supabase session exists.
      const { loadSupabaseProfileFromSession } = await import("../lib/appSupabaseProfile");
      const loadedUser = await loadSupabaseProfileFromSession();
      if (loadedUser) {
        setUser(loadedUser);
      }

      // Phase 2 Step 4: hydrate jobs from Supabase
      // We do this before saved_jobs hydration to ensure applicant/saved counters can match job ids.
      setIsHydratingJobs(true);
      setJobsError(null);
      try {
        const { data: supaJobs, error } = await supabase
          .from("jobs")
          .select("id, employer_id, title, description, location, job_type, experience_level, salary_min, salary_max, currency, is_active, created_at, is_urgent, is_verified, is_trusted")
          .eq("is_active", true);


        if (error) {
          setJobsError(error.message);
        } else if (supaJobs && Array.isArray(supaJobs)) {
          const mapped: Job[] = supaJobs
            .map((j: any) => {
              const salaryMin = typeof j.salary_min === "number" ? j.salary_min : j.salary_min ? Number(j.salary_min) : 0;
              const salaryMax = typeof j.salary_max === "number" ? j.salary_max : j.salary_max ? Number(j.salary_max) : 0;

              const initials = (j.company_name ?? "CO")
                .split(" ")
                .map((w: string) => w[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

              return {
                id: j.id,
                title: j.title ?? "",
                company: "Employer",
                logoInitials: initials || "CO",
                logoColor: "#2563EB",
                category: "Technical" as any,
                salary: `₹${Number.isFinite(salaryMin) ? salaryMin.toLocaleString("en-IN") : "0"} - ₹${Number.isFinite(salaryMax) ? salaryMax.toLocaleString("en-IN") : "0"}`,
                salaryMin: salaryMin || 0,
                salaryMax: salaryMax || 0,
                location: j.location ?? "Rohini",
                distanceKm: 1.0,
                experience: j.experience_level ?? "Fresher",
                isVerified: Boolean(j.is_verified),
                isTrusted: Boolean(j.is_trusted),
                isUrgent: Boolean(j.is_urgent),
                postedTime: new Date(j.created_at ?? Date.now()).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) + " ago",

                whatsappNumber: "",
                applicants: 0,
                jobType: j.job_type ?? "Full Time",
                isFreshersOk: false,
                isNegotiable: false,
                description: j.description ?? "",
                requirements: [],
                lat: (LOCALITY_COORDS[j.location]?.lat ?? LOCALITY_COORDS["Rohini"].lat) as number,
                lng: (LOCALITY_COORDS[j.location]?.lng ?? LOCALITY_COORDS["Rohini"].lng) as number,
              } as Job;
            })
            .filter((x) => x && typeof x.id === "string");

          // Duplicate handling: merge by job.id; Supabase jobs win over existing ones.
          setPostedJobs((prev) => {
            const byId = new Map<string, Job>();
            prev.forEach((p) => byId.set(p.id, p));
            mapped.forEach((m) => byId.set(m.id, m));
            return Array.from(byId.values());
          });
        }
      } catch (e: any) {
        setJobsError(e?.message ?? "Failed to load jobs");
      } finally {
        setIsHydratingJobs(false);
      }

      // Phase 2 Step 1: hydrate saved jobs from Supabase for UUID ids.
      // We intentionally keep non-UUID job ids from AsyncStorage for backward compatibility.
      setIsHydratingSavedJobs(true);
      setSavedJobsError(null);


      const sessionUserId = await (async () => {
        try {
          const sessionRes = await supabase.auth.getSession();
          return sessionRes?.data?.session?.user?.id ?? null;
        } catch {
          return null;
        }
      })();


      if (sessionUserId) {
        const { data: rows, error } = await supabase
          .from("saved_jobs")
          .select("job_id")
          .eq("seeker_id", sessionUserId);

        if (error) {
          setSavedJobsError(error.message);
        } else if (rows) {
          const uuidIds = rows.map((r: any) => r.job_id).filter((id: any) => typeof id === "string");

          // Merge: keep existing non-UUID saved ids from AsyncStorage,
          // but replace UUID saved ids with Supabase authoritative set.
          setSavedJobIds((prev) => {
            const nonUuid = prev.filter((id) => !isUuidLike(id));
            const merged = Array.from(new Set([...nonUuid, ...uuidIds]));
            return merged;
          });
        }
      }
    } catch (_) {}
    finally {
      setIsHydratingSavedJobs(false);
    }
  }




  async function login(phone: string, name: string, role: UserRole) {
    if (!role) {
      throw new Error("Role is required for login");
    }

    // Supabase auth via Phase-1 architecture.
    // UI OTP remains simulated; we map it to an auth session here.
    const { userId } = await signInWithPhoneOtpMock(phone, role);

    // Ensure profile row exists in Supabase.
    await ensureProfileRow(userId, name, phone, role);

    // Load authoritative profile from Supabase session.
    // (Jobs/saved/applied stay on AsyncStorage for now.)
    const { loadSupabaseProfileFromSession } = await import("../lib/appSupabaseProfile");
    const loadedUser = await loadSupabaseProfileFromSession();

    const newUser = loadedUser ?? {
      ...DEFAULT_USER,
      name,
      phone,
      role,
      isAuthenticated: true,
      profileScore: 35,
    };

    newUser.profileScore = computeScore(newUser);
    setUser(newUser);
    await AsyncStorage.setItem("@rozgaar_user", JSON.stringify(newUser));
  }

  async function logout() {
    // Clear server session first.
    await supabase.auth.signOut();

    setUser(DEFAULT_USER);

    // Clear user-specific persisted data on logout so a new user starts fresh
    setSavedJobIds([]);
    setAppliedJobIds([]);
    setPostedJobs([]);
    setJobStatuses({});
    setApplicationDatesByJobId({});

    await Promise.all([
      AsyncStorage.removeItem("@rozgaar_user"),
      AsyncStorage.removeItem("@rozgaar_saved"),
      AsyncStorage.removeItem("@rozgaar_applied"),
      AsyncStorage.removeItem("@rozgaar_posted"),
      AsyncStorage.removeItem("@rozgaar_statuses"),
      AsyncStorage.removeItem("@rozgaar_applied_at"),
    ]);
  }


  async function updateProfile(updates: Partial<Omit<UserProfile, "isAuthenticated" | "role" | "phone">>) {
    const updated: UserProfile = { ...user, ...updates };
    updated.profileScore = computeScore(updated);
    setUser(updated);
    await AsyncStorage.setItem("@rozgaar_user", JSON.stringify(updated));
  }

  async function toggleSaveJob(jobId: string) {
    const isSaved = savedJobIds.includes(jobId);

    // Hybrid bridge:
    // - UUID job ids persist to Supabase saved_jobs
    // - non-UUID job ids stay in AsyncStorage for backward compatibility
    if (!isUuidLike(jobId)) {
      console.log(`[saved_jobs-migration] non-UUID jobId '${jobId}' -> AsyncStorage fallback`);

      const next = isSaved
        ? savedJobIds.filter((id) => id !== jobId)
        : [...savedJobIds, jobId];
      setSavedJobIds(next);
      await AsyncStorage.setItem("@rozgaar_saved", JSON.stringify(next));
      return;
    }

    // UUID path: require an authenticated user session
    const sessionRes = await supabase.auth.getSession();
    const userId = sessionRes?.data?.session?.user?.id;

    if (!userId) {
      // Not authenticated; keep existing behavior: optimistic local change.
      const next = isSaved
        ? savedJobIds.filter((id) => id !== jobId)
        : [...savedJobIds, jobId];
      setSavedJobIds(next);
      await AsyncStorage.setItem("@rozgaar_saved", JSON.stringify(next));
      return;
    }

    // Optimistic update
    const optimisticNext = isSaved
      ? savedJobIds.filter((id) => id !== jobId)
      : [...savedJobIds, jobId];
    setSavedJobIds(optimisticNext);

    try {
      if (!isSaved) {
        const { error } = await supabase.from("saved_jobs").insert({
          job_id: jobId,
          seeker_id: userId,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("saved_jobs")
          .delete()
          .eq("seeker_id", userId)
          .eq("job_id", jobId);
        if (error) throw error;
      }

      // Keep AsyncStorage in sync as a bridge (UUID ids will also exist in memory via Supabase hydrate)
      await AsyncStorage.setItem("@rozgaar_saved", JSON.stringify(optimisticNext));
    } catch (e: any) {
      console.log(`[saved_jobs-migration] Supabase toggle failed: jobId='${jobId}', userId='${userId}'.`, e);
      // Rollback optimistic update
      const rollback = isSaved
        ? [...savedJobIds]
        : savedJobIds.filter((id) => id !== jobId);
      // The above rollback uses captured state; safer approach would track previous, but we keep it minimal here.
      setSavedJobIds(savedJobIds);
      await AsyncStorage.setItem("@rozgaar_saved", JSON.stringify(savedJobIds));
      setSavedJobsError(e?.message ?? "Failed to toggle saved job");
    }
  }


  async function applyToJob(jobId: string) {
    if (appliedJobIds.includes(jobId)) return;

    // Hybrid: keep UI behavior (AsyncStorage applied list + applicant count)
    // but also persist to Supabase applications for UUID-like job ids.
    const isUuid = isUuidLike(jobId);

    // Optimistic update (UI behavior stays identical)
    const next = [...appliedJobIds, jobId];
    setAppliedJobIds(next);
    await AsyncStorage.setItem("@rozgaar_applied", JSON.stringify(next));

    // Track application timestamp (needed for employer applicants MVP)
    const appliedAtNext: Record<string, string> = {
      ...(applicationDatesByJobId ?? {}),
      [jobId]: new Date().toISOString(),
    };
    setApplicationDatesByJobId(appliedAtNext);
    await AsyncStorage.setItem("@rozgaar_applied_at", JSON.stringify(appliedAtNext));

    // Increment applicant count for the job (Phase 1 behavior)
    const jobIndex = postedJobs.findIndex((j) => j.id === jobId);
    if (jobIndex !== -1) {
      const updatedJobs = [...postedJobs];
      updatedJobs[jobIndex] = {
        ...updatedJobs[jobIndex],
        applicants: updatedJobs[jobIndex].applicants + 1,
      };
      setPostedJobs(updatedJobs);
      await AsyncStorage.setItem("@rozgaar_posted", JSON.stringify(updatedJobs));
    }

    if (!isUuid) {
      console.log(`[applications-migration] non-UUID jobId '${jobId}' -> skipping Supabase applications persistence (Phase 2 bridge)`);
      return;
    }

    // Persist to Supabase (public.applications via RLS)
    const sessionRes = await supabase.auth.getSession();
    const userId = sessionRes?.data?.session?.user?.id;

    if (!userId) {
      // Keep existing behavior: optimistic UI already updated.
      console.log(`[applications-migration] No auth session; skipping Supabase applications persistence for jobId='${jobId}'`);
      return;
    }

    try {
      // Ensure we don't duplicate: (job_id, applicant_id) is unique
      const { error } = await supabase
        .from("applications")
        .insert({
          job_id: jobId,
          applicant_id: userId,
          applicant_name: user.name || null,
          phone: user.phone || null,
          status: "applied",
          applied_at: appliedAtNext[jobId] ? new Date(appliedAtNext[jobId]).toISOString() : undefined,
        });


      if (error) {
        // Unique violations should be non-fatal for idempotency.
        console.log(`[applications-migration] Supabase insert failed for jobId='${jobId}', applicant='${userId}'`, error);
      }
    } catch (e) {
      console.log(`[applications-migration] Supabase persistence threw for jobId='${jobId}', applicant='${userId}'`, e);
    }
  }


  async function setJobStatus(jobId: string, status: "applied" | "viewed" | "shortlisted" | "rejected") {
    const updated = { ...jobStatuses, [jobId]: status };

    // Optimistic UI/state update (backward compatible)
    setJobStatuses(updated);
    await AsyncStorage.setItem("@rozgaar_statuses", JSON.stringify(updated));

    // Step 3: create notification rows only for UUID-compatible job ids.
    if (!isUuidLike(jobId)) return;

    const sessionRes = await supabase.auth.getSession();
    const userId = sessionRes?.data?.session?.user?.id;
    if (!userId) return;

    // Map UI status => notifications.type constraint values
    const typeMap: Record<string, string> = {
      viewed: "application_viewed",
      shortlisted: "application_shortlisted",
      rejected: "application_rejected",
      // 'applied' is intentionally not mapped because DB constraint list doesn't include it yet.
      applied: "application_viewed",
    };

    const notifType = typeMap[status];
    if (!notifType) return;

    const titleByStatus: Record<string, string> = {
      application_viewed: "Employer viewed your application",
      application_shortlisted: "You were shortlisted",
      application_rejected: "Application rejected",
      application_hired: "You were hired",
    };

    const bodyByStatus: Record<string, string> = {
      application_viewed: "The employer has opened your application.",
      application_shortlisted: "The employer shortlisted your application.",
      application_rejected: "The employer rejected your application.",
      application_hired: "Congratulations! You were hired.",
    };

    // Best-effort: avoid duplicates (notifications table has no unique constraint in your SQL).
    // We rely on insert idempotency at app level by best-effort mapping only.
    try {
      const job = postedJobs.find((j) => j.id === jobId) ?? null;

      const { error } = await supabase.from("notifications").insert({
        user_id: userId,
        type: notifType,
        title: titleByStatus[notifType] ?? "Application update",
        body: bodyByStatus[notifType] ?? "Your application status has changed.",
        job_id: jobId,
        application_id: null,
        is_read: false,
      });

      if (error) {
        console.log(`[notifications-migration] failed to insert notification for jobId='${jobId}' status='${status}'`, error);
      }
    } catch (e) {
      console.log(`[notifications-migration] insert threw for jobId='${jobId}' status='${status}'`, e);
    }
  }


  async function postJob(draft: DraftJob) {
    // Production: job creation must be persisted to Supabase as source of truth.
    // Supabase `jobs.id` is UUID; do not generate local ids.
    const coords = LOCALITY_COORDS[draft.location] ?? LOCALITY_COORDS["Rohini"];


    const loc = draft.location === "All Areas" ? (LOCALITIES[1] ?? "Rohini") : draft.location;
    const initials = draft.company
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    const logoColors = ["#2563EB", "#7C3AED", "#059669", "#DC2626", "#D97706", "#0891B2"];
    const logoColor = logoColors[Math.floor(Math.random() * logoColors.length)] ?? "#2563EB";

    // Persist to Supabase and rely on returned UUID.
    const { data: inserted, error } = await supabase
      .from("jobs")
      .insert({
        employer_id: (await supabase.auth.getSession()).data.session?.user?.id,
        title: draft.title,
        description: draft.description,
        location: loc,
        job_type: draft.jobType,
        experience_level: draft.experience,
        salary_min: draft.salaryMin,
        salary_max: draft.salaryMax,
        currency: "INR",
        is_active: true,
        is_urgent: draft.isUrgent,
        is_verified: false,
        is_trusted: false,
      })
      .select("*")
      .single();

    if (error || !inserted?.id) {
      console.log("[postJob] Supabase insert failed", error);
      throw new Error(error?.message ?? "Failed to post job");
    }

    const jobId = inserted.id as string;

    const mappedJob: Job = {
      id: jobId,
      title: inserted.title ?? draft.title,

      company: draft.company,
      logoInitials: initials || "CO",
      logoColor,
      category: draft.category,

      salary: draft.isNegotiable
        ? `₹${(draft.salaryMin / 1000).toFixed(0)}k - ₹${(draft.salaryMax / 1000).toFixed(0)}k (Negotiable)`
        : `₹${draft.salaryMin.toLocaleString("en-IN")} - ₹${draft.salaryMax.toLocaleString("en-IN")}`,
      salaryMin: draft.salaryMin,
      salaryMax: draft.salaryMax,
      location: loc,
      distanceKm: parseFloat((Math.random() * 4 + 0.3).toFixed(1)),
      experience: draft.experience,
      isVerified: false,
      isTrusted: false,
      isUrgent: draft.isUrgent,
      postedTime: "Just now",
      whatsappNumber: draft.whatsappNumber || user.phone,
      applicants: 0,
      jobType: draft.jobType,
      isFreshersOk: draft.isFreshersOk,
      isNegotiable: draft.isNegotiable,
      description: draft.description,
      requirements: draft.requirements,
      lat: coords.lat,
      lng: coords.lng,
    };

    // Prefer in-memory state only; remove device-only persistence.
    setPostedJobs((prev) => [mappedJob, ...prev]);
  }



  async function deletePostedJob(jobId: string) {
    const sessionUserId = (await supabase.auth.getSession()).data.session?.user?.id;
    if (!sessionUserId) {
      throw new Error("Not authenticated");
    }

    const { error } = await supabase.from("jobs").delete().eq("id", jobId);
    if (error) throw error;

    setPostedJobs((prev) => prev.filter((j) => j.id !== jobId));
  }


  async function updateJob(jobId: string, draft: DraftJob) {
    const sessionUserId = (await supabase.auth.getSession()).data.session?.user?.id;
    if (!sessionUserId) {
      throw new Error("Not authenticated");
    }

    const coords = LOCALITY_COORDS[draft.location] ?? LOCALITY_COORDS["Rohini"];

    const loc = draft.location === "All Areas" ? (LOCALITIES[1] ?? "Rohini") : draft.location;
    const initials = draft.company
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    // optimistic local preview model; server source of truth will refresh via hydrate
    const updatedJob: Job = {
      ...(postedJobs.find((j) => j.id === jobId) ?? ({} as any)),
      title: draft.title,

      company: draft.company,
      logoInitials: initials || "CO",
      category: draft.category,
      salary: draft.isNegotiable
        ? `₹${(draft.salaryMin / 1000).toFixed(0)}k - ₹${(draft.salaryMax / 1000).toFixed(0)}k (Negotiable)`
        : `₹${draft.salaryMin.toLocaleString("en-IN")} - ₹${draft.salaryMax.toLocaleString("en-IN")}`,
      salaryMin: draft.salaryMin,
      salaryMax: draft.salaryMax,
      location: loc,
      experience: draft.experience,
      isUrgent: draft.isUrgent,
      whatsappNumber: draft.whatsappNumber || user.phone,
      jobType: draft.jobType,
      isFreshersOk: draft.isFreshersOk,
      isNegotiable: draft.isNegotiable,
      description: draft.description,
      requirements: draft.requirements,
      lat: coords.lat,
      lng: coords.lng,
      postedTime: "Just updated",
    };

    const next = postedJobs.map((j) => (j.id === jobId ? updatedJob : j));
    setPostedJobs(next);
    setEditingJobId(null);

    // Persist changes to Supabase (RLS should enforce employer ownership)
    const { error } = await supabase
      .from("jobs")
      .update({
        title: updatedJob.title,
        description: updatedJob.description,
        location: updatedJob.location,
        job_type: updatedJob.jobType,
        experience_level: updatedJob.experience,
        salary_min: updatedJob.salaryMin,
        salary_max: updatedJob.salaryMax,
        is_urgent: updatedJob.isUrgent,
        whatsapp_number: updatedJob.whatsappNumber,
        category: updatedJob.category,
        is_active: true,
      })
      .eq("id", jobId);

    if (error) throw error;
  }


  const isJobSaved = (jobId: string) => savedJobIds.includes(jobId);
  const isJobApplied = (jobId: string) => appliedJobIds.includes(jobId);

  return (
    <AppContext.Provider
      value={{
        user,
        savedJobIds,
        appliedJobIds,
        jobStatuses,
        postedJobs,
        selectedLocality,
        editingJobId,
        setSelectedLocality,
        setEditingJobId,
        login,
        logout,
        updateProfile,
        toggleSaveJob,
        applyToJob,
        setJobStatus,
        postJob,
        updateJob,
        deletePostedJob,
        isJobSaved,
        isJobApplied,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
