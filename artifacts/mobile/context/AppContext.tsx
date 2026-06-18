import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import React, { createContext, useContext, useEffect, useState } from "react";

import type { Job, JobCategory } from "@/data/jobs";
import { LOCALITIES } from "@/data/jobs";
import { AuthModal } from "@/components/AuthModal";
import { Applicant, ApplicantStatus, MOCK_APPLICANTS } from "@/data/applicants";

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
  language: string;
  bio: string;
  companyName?: string;
  companyDescription?: string;
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
  uploadResumeFromDevice: (params: { file: { uri: string; name?: string } }) => Promise<void>;
  deleteResumeFromStorage: () => Promise<void>;
  openResume: () => Promise<string>;
  toggleSaveJob: (jobId: string) => Promise<void>;
  applyToJob: (jobId: string) => Promise<void>;
  setJobStatus: (jobId: string, status: "applied" | "viewed" | "shortlisted" | "rejected") => Promise<void>;
  updateApplicationStatus: (params: { jobId: string; applicantId: string; status: "viewed" | "shortlisted" | "rejected" }) => Promise<void>;
  postJob: (draft: DraftJob) => Promise<void>;
  updateJob: (jobId: string, draft: DraftJob) => Promise<void>;
  deletePostedJob: (jobId: string) => Promise<void>;
  employerJobStatuses: Record<string, "active" | "paused" | "closed">;
  setEmployerJobStatus: (jobId: string, status: "active" | "paused" | "closed") => void;
  isJobSaved: (jobId: string) => boolean;
  isJobApplied: (jobId: string) => boolean;
  hasOnboarded: boolean;
  completeOnboarding: () => Promise<void>;
  setGuestRole: (role: UserRole) => Promise<void>;
  setLanguage: (lang: string) => Promise<void>;
  requireAuth: (action: () => void, options?: { title?: string; description?: string; maybeLaterText?: string }) => void;
  applications: Applicant[];
  updateMockApplicationStatus: (appId: string, status: ApplicantStatus) => void;
  scheduleInterview: (appId: string, date: string, time: string) => void;
  isReady: boolean;
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
  language: "Hindi / English",
  bio: "",
  resumeUploaded: false,
  resumeName: "",
  resumeUri: "",
  profileScore: 40,
};

function computeScore(u: UserProfile): number {
  let score = 0;
  if (u.role === "employer") {
    if (u.companyName) score += 20;
    if (u.companyDescription) score += 20;
    if (u.name) score += 20;
    if (u.phone) score += 20;
    if (u.location) score += 20;
  } else {
    if (u.name) score += 10;
    if (u.phone) score += 10;
    if (u.skills && u.skills.length > 0) score += 20;
    if (u.experience) score += 20;
    if (u.education) score += 20;
    if (u.resumeUploaded) score += 20;
  }
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
  const [applications, setApplications] = useState<Applicant[]>(MOCK_APPLICANTS);

  // Phase 2 Step 1: saved_jobs hydration from Supabase (authoritative)
  const [isHydratingSavedJobs, setIsHydratingSavedJobs] = useState(false);
  const [savedJobsError, setSavedJobsError] = useState<string | null>(null);

  // Phase 2 Step 4: jobs hydration from Supabase (public.jobs)
  const [isHydratingJobs, setIsHydratingJobs] = useState(false);
  const [jobsError, setJobsError] = useState<string | null>(null);
  
  const [employerJobStatuses, setEmployerJobStatuses] = useState<Record<string, "active" | "paused" | "closed">>({});

  function setEmployerJobStatus(jobId: string, status: "active" | "paused" | "closed") {
    setEmployerJobStatuses(prev => ({ ...prev, [jobId]: status }));
  }

  const [hasOnboarded, setHasOnboarded] = useState<boolean>(false);
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);
  const [authModalOptions, setAuthModalOptions] = useState<{ title?: string; description?: string; maybeLaterText?: string }>({});
  const [isReady, setIsReady] = useState(false);

  // Job ids are expected to be UUIDs end-to-end (public.jobs.id + FK columns).
  // Removed best-effort UUID detection to avoid legacy non-UUID fallbacks.

  useEffect(() => {
    // Phase 1: restore non-auth MVP state from AsyncStorage (offline cache only),
    // then hydrate `user` and Supabase authoritative saved/applications state.
    void loadFromStorage();
  }, []);

  async function loadFromStorage() {
    try {
      const [
        userData,
        posted,
        onboardedStatus,
      ] = await Promise.all([
        AsyncStorage.getItem("@rozgaar_user"),
        AsyncStorage.getItem("@rozgaar_posted"),
        AsyncStorage.getItem("@rozgaar_onboarded"),
      ]);

      if (onboardedStatus === "true") {
        setHasOnboarded(true);
      }

      // Restore non-auth CRUD state from AsyncStorage (offline cache only)
      if (posted) setPostedJobs(JSON.parse(posted));

      // Auth-aware user restore (fallback)
      if (userData) setUser({ ...DEFAULT_USER, ...JSON.parse(userData) });

      // Load authoritative profile row if Supabase session exists.
      const { loadSupabaseProfileFromSession } = await import("../lib/appSupabaseProfile");
      const loadedUser = await loadSupabaseProfileFromSession();
      if (loadedUser) {
        setUser(loadedUser);
      }

      // Phase 2 Step 4: hydrate jobs from Supabase
      // We do this before saved/applications hydration to ensure applicant/saved counters can match job ids.
      setIsHydratingJobs(true);
      setJobsError(null);
      try {
        const { data: supaJobs, error } = await supabase
          .from("jobs")
          .select(
            "id, employer_id, title, description, location, job_type, experience_level, salary_min, salary_max, currency, is_active, created_at, is_urgent, is_verified, is_trusted"
          )
          .eq("is_active", true);

        if (error) {
          setJobsError(error.message);
        } else if (supaJobs && Array.isArray(supaJobs)) {
          const mapped: Job[] = supaJobs
            .map((j: any) => {
              const salaryMin =
                typeof j.salary_min === "number"
                  ? j.salary_min
                  : j.salary_min
                    ? Number(j.salary_min)
                    : 0;
              const salaryMax =
                typeof j.salary_max === "number"
                  ? j.salary_max
                  : j.salary_max
                    ? Number(j.salary_max)
                    : 0;

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
                salary: `₹${
                  Number.isFinite(salaryMin) ? salaryMin.toLocaleString("en-IN") : "0"
                } - ₹${
                  Number.isFinite(salaryMax) ? salaryMax.toLocaleString("en-IN") : "0"
                }`,
                salaryMin: salaryMin || 0,
                salaryMax: salaryMax || 0,
                location: j.location ?? "Rohini",
                distanceKm: 1.0,
                experience: j.experience_level ?? "Fresher",
                isVerified: Boolean(j.is_verified),
                isTrusted: Boolean(j.is_trusted),
                isUrgent: Boolean(j.is_urgent),
                postedTime:
                  new Date(j.created_at ?? Date.now()).toLocaleDateString(
                    "en-IN",
                    { day: "2-digit", month: "short" }
                  ) + " ago",

                whatsappNumber: "",
                applicants: 0,
                jobType: j.job_type ?? "Full Time",
                isFreshersOk: false,
                isNegotiable: false,
                description: j.description ?? "",
                requirements: [],
                lat: (LOCALITY_COORDS[j.location]?.lat ??
                  LOCALITY_COORDS["Rohini"].lat) as number,
                lng: (LOCALITY_COORDS[j.location]?.lng ??
                  LOCALITY_COORDS["Rohini"].lng) as number,
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

      // Phase 2 Step 1: hydrate saved jobs from Supabase (authoritative)
      // Phase 2 Step 2: hydrate applications from Supabase (authoritative)
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
        // Supabase authoritative saved_jobs
        const { data: savedRows, error: savedError } = await supabase
          .from("saved_jobs")
          .select("job_id")
          .eq("seeker_id", sessionUserId);

        if (savedError) {
          setSavedJobsError(savedError.message);
        } else if (savedRows) {
          const uuidIds = savedRows
            .map((r: any) => r.job_id)
            .filter((id: any) => typeof id === "string");
          setSavedJobIds(uuidIds);
        }

        // Supabase authoritative applications (public.applications)
        const { data: appRows, error: appError } = await supabase
          .from("applications")
          .select("job_id, status, applied_at")
          .eq("applicant_id", sessionUserId);

        if (appError) {
          // Non-blocking: saved jobs still usable; applications will re-sync next app start.
          setSavedJobsError((prev) => prev ?? appError.message);
        } else if (appRows && Array.isArray(appRows)) {
          const ids: string[] = [];
          const statuses: Record<
            string,
            "applied" | "viewed" | "shortlisted" | "rejected"
          > = {};
          const dates: Record<string, string> = {};

          for (const r of (appRows as any[])) {
            const jobId = r?.job_id;
            const status = r?.status;

            if (typeof jobId !== "string") continue;

            // Map status values coming from DB into our UI union.
            const mappedStatus =
              status === "applied" ||
              status === "viewed" ||
              status === "shortlisted" ||
              status === "rejected"
                ? status
                : null;

            if (!mappedStatus) continue;

            ids.push(jobId);
            statuses[jobId] = mappedStatus;

            const appliedAt = r?.applied_at;
            if (typeof appliedAt === "string" && appliedAt) {
              dates[jobId] = appliedAt;
            } else {
              dates[jobId] = new Date().toISOString();
            }
          }

          // De-dupe ids
          setAppliedJobIds(Array.from(new Set(ids)));
          setJobStatuses(statuses);
          setApplicationDatesByJobId(dates);
        }
      }
    } catch (_) {}
    finally {
      setIsHydratingSavedJobs(false);
      setIsReady(true);
    }
  }

  async function completeOnboarding() {
    setHasOnboarded(true);
    await AsyncStorage.setItem("@rozgaar_onboarded", "true");
  }

  async function setLanguage(lang: string) {
    const updated: UserProfile = { ...user, language: lang };
    setUser(updated);
    await AsyncStorage.setItem("@rozgaar_user", JSON.stringify(updated));
  }

  async function setGuestRole(role: UserRole) {
    const updated = { ...user, role, isAuthenticated: false };
    setUser(updated);
    await AsyncStorage.setItem("@rozgaar_user", JSON.stringify(updated));
    await completeOnboarding();
  }

  function requireAuth(action: () => void, options?: { title?: string; description?: string; maybeLaterText?: string }) {
    if (!user.isAuthenticated) {
      if (options) {
        setAuthModalOptions(options);
      } else {
        setAuthModalOptions({});
      }
      setIsAuthModalVisible(true);
    } else {
      action();
    }
  }

  async function login(phone: string, name: string, role: UserRole) {
    if (!role) {
      throw new Error("Role is required for login");
    }

    // Supabase auth via Phase-1 architecture.
    // UI OTP remains simulated; we map it to an auth session here.
    console.log("[auth] login:start", { phone: phone.replace(/\d(?=\d{4})/g, "*"), role });
    const { userId } = await signInWithPhoneOtpMock(phone, role);
    console.log("[auth] login:signInWithPhoneOtpMock:ok", { userId });

    // Ensure profile row exists in Supabase.
    await ensureProfileRow(userId, name, phone, role);
    console.log("[auth] login:ensureProfileRow:ok", { userId });

    // Load authoritative profile from Supabase session.
    // (Jobs/saved/applied stay on AsyncStorage for now.)
    const { loadSupabaseProfileFromSession } = await import("../lib/appSupabaseProfile");
    const loadedUser = await loadSupabaseProfileFromSession();
    console.log("[auth] login:loadSupabaseProfileFromSession:ok", { userId, loaded: Boolean(loadedUser) });

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

    // Clear in-memory state
    setSavedJobIds([]);
    setAppliedJobIds([]);
    setPostedJobs([]);
    setJobStatuses({});
    setApplicationDatesByJobId({});

    // AsyncStorage: user + posted are treated as non-authoritative offline cache.
    await Promise.all([AsyncStorage.removeItem("@rozgaar_user"), AsyncStorage.removeItem("@rozgaar_posted")]);
  }


  async function updateProfile(updates: Partial<Omit<UserProfile, "isAuthenticated" | "role" | "phone">>) {
    const updated: UserProfile = { ...user, ...updates };
    updated.profileScore = computeScore(updated);
    setUser(updated);
    await AsyncStorage.setItem("@rozgaar_user", JSON.stringify(updated));
  }

  function getResumeObjectPath(params: { userId: string; applicationId: string; fileName: string }) {
    // Must align with lib/db/sql/007_resume_storage_bucket.sql
    // Path convention: resumes/{user_id}/{application_id}/{filename}
    return `resumes/${params.userId}/${params.applicationId}/${params.fileName}`;
  }

  async function getCurrentUserId() {
    const sessionRes = await supabase.auth.getSession();
    return sessionRes?.data?.session?.user?.id ?? null;
  }

  async function uploadResumeFromDevice(params: { file: { uri: string; name?: string } }) {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) throw new Error("Not authenticated");

    // Storage policies expect:
    //   resumes/{user_id}/{application_id}/{filename}
    // For profile resume we still need a value in segment 2.
    // We use a stable synthetic uuid-like id to keep path segment [2] uuid-cast compatible.
    const syntheticApplicationId = `00000000-0000-4000-8000-000000000000`;

    const fileName = params.file.name || "resume.pdf";
    const objectPath = getResumeObjectPath({
      userId: currentUserId,
      applicationId: syntheticApplicationId,
      fileName,
    });

    const bucket = supabase.storage.from("resumes");

    const relativePath = objectPath.replace(`resumes/${currentUserId}/`, "");

    // Replace: remove if present, then upload.
    try {
      await bucket.remove([relativePath]);
    } catch {
      // ignore missing object
    }

    const res = await bucket.upload(
      relativePath,
      // @ts-expect-error expo FileSystem uri is supported by RN storage adapters
      { uri: params.file.uri },
      { contentType: "application/pdf", upsert: true }
    );
    if (res.error) throw res.error;

    const { data: urlData } = bucket.getPublicUrl(relativePath);

    // Persist resume_path + resume_url to public.profiles (authoritative).
    const { error } = await supabase.from("profiles").update({
      resume_path: objectPath,
      resume_url: urlData.publicUrl ?? null,
      resume_uploaded: true,
    });
    if (error) throw error;

    // Update in-memory + AsyncStorage cache.
    setUser((prev) => {
      const next = {
        ...prev,
        resumeUploaded: true,
        resumeName: fileName,
        // Our UI uses resumeUri as "openable url"
        resumeUri: urlData.publicUrl ?? "",
      };
      next.profileScore = computeScore(next);
      return next;
    });
  }

  async function deleteResumeFromStorage() {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) throw new Error("Not authenticated");

    // Fetch authoritative resume_path from profiles.
    const { data: profileRow, error: profileErr } = await supabase
      .from("profiles")
      .select("resume_path")
      .eq("id", currentUserId)
      .maybeSingle();

    if (profileErr) throw profileErr;

    const resumePathFromDb = (profileRow?.resume_path as string | null) ?? null;

    if (!resumePathFromDb) {
      const { error: updError } = await supabase.from("profiles").update({
        resume_path: null,
        resume_url: null,
        resume_uploaded: false,
      });
      if (updError) throw updError;

      setUser((prev) => {
        const next = { ...prev, resumeUploaded: false, resumeName: "", resumeUri: "" };
        next.profileScore = computeScore(next);
        return next;
      });
      return;
    }

    const bucket = supabase.storage.from("resumes");

    // Convert absolute path "resumes/{userId}/{appId}/{file}" to bucket-relative:
    const relativePath = resumePathFromDb.replace(`resumes/${currentUserId}/`, "");

    const { error: rmError } = await bucket.remove([relativePath]);
    if (rmError) throw rmError;

    // Clear resume fields from profiles.
    const { error: updError } = await supabase.from("profiles").update({
      resume_path: null,
      resume_url: null,
      resume_uploaded: false,
    });
    if (updError) throw updError;

    setUser((prev) => {
      const next = { ...prev, resumeUploaded: false, resumeName: "", resumeUri: "" };
      next.profileScore = computeScore(next);
      return next;
    });
  }

  async function openResume() {
    if (!user.resumeUri) throw new Error("No resume available");
    // UI will call Linking.openURL; context just provides URL.
    return user.resumeUri;
  }

  async function toggleSaveJob(jobId: string) {
    const isSaved = savedJobIds.includes(jobId);

    // Optimistic UI update (in-memory only)
    const optimisticNext = isSaved
      ? savedJobIds.filter((id) => id !== jobId)
      : [...savedJobIds, jobId];
    setSavedJobIds(optimisticNext);

    const sessionRes = await supabase.auth.getSession();
    const userId = sessionRes?.data?.session?.user?.id;

    if (!userId) return;

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
    } catch (e: any) {
      console.log(
        `[saved_jobs] Supabase toggle failed: jobId='${jobId}', userId='${userId}'.`,
        e
      );
      // Rollback optimistic update
      setSavedJobIds(savedJobIds);
      setSavedJobsError(e?.message ?? "Failed to toggle saved job");
    }
  }


  async function applyToJob(jobId: string) {
    if (appliedJobIds.includes(jobId)) return;

    // Snapshot pre-optimistic state for rollback on failure.
    const prevAppliedJobIds = appliedJobIds;
    const prevApplicationDates = applicationDatesByJobId;
    const prevPostedJobs = postedJobs;
    const prevApplications = applications;

    // Optimistic UI update (in-memory only)
    const next = [...appliedJobIds, jobId];
    setAppliedJobIds(next);

    // Track application timestamp
    const appliedAtNext: Record<string, string> = {
      ...(applicationDatesByJobId ?? {}),
      [jobId]: new Date().toISOString(),
    };
    setApplicationDatesByJobId(appliedAtNext);

    // Create a mock local Application record
    const newApp: Applicant = {
      id: `app_${Math.random().toString(36).substring(7)}`,
      jobId,
      name: user.name || "Guest User",
      experience: user.experience || "Fresher",
      skills: user.skills || [],
      appliedDate: new Date().toISOString(),
      status: "applied",
      phone: user.phone || "",
      email: "",
      location: user.location || "",
    };
    setApplications(prev => [newApp, ...prev]);

    // Increment applicant count for the job (offline cache only)
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

    const sessionRes = await supabase.auth.getSession();
    const userId = sessionRes?.data?.session?.user?.id;

    if (!userId) return;

    /** Roll back all optimistic mutations and restore AsyncStorage. */
    async function rollback() {
      setAppliedJobIds(prevAppliedJobIds);
      setApplicationDatesByJobId(prevApplicationDates);
      setPostedJobs(prevPostedJobs);
      setApplications(prevApplications);
      try {
        await AsyncStorage.setItem("@rozgaar_posted", JSON.stringify(prevPostedJobs));
      } catch {
        // Non-critical: AsyncStorage failure during rollback should not mask the original error.
      }
    }

    try {
      const { error } = await supabase.from("applications").insert({
        job_id: jobId,
        applicant_id: userId,
        applicant_name: user.name || null,
        phone: user.phone || null,
        status: "applied",
        applied_at: appliedAtNext[jobId]
          ? new Date(appliedAtNext[jobId]).toISOString()
          : undefined,
      });

      if (error) {
        // Postgres unique-violation (23505): row already exists — application is valid.
        // Keep the optimistic UI state; just sync jobStatuses.
        if ((error as any).code === "23505") {
          console.log(
            `[applications] Duplicate application ignored (idempotent) for jobId='${jobId}'`
          );
          setJobStatuses((prev) => ({ ...prev, [jobId]: "applied" }));
          return;
        }

        // All other errors: rollback and inform the user.
        console.log(
          `[applications] Supabase insert failed for jobId='${jobId}', applicant='${userId}'`,
          error
        );
        await rollback();
        Alert.alert(
          "Application Failed",
          "We couldn't submit your application. Please check your connection and try again."
        );
        return;
      }

      setJobStatuses((prev) => ({ ...prev, [jobId]: "applied" }));
    } catch (e) {
      console.log(
        `[applications] Supabase persistence threw for jobId='${jobId}', applicant='${userId}'`,
        e
      );
      await rollback();
      Alert.alert(
        "Application Failed",
        "Something went wrong while submitting your application. Please try again."
      );
    }
  }


  async function setJobStatus(
    jobId: string,
    status: "applied" | "viewed" | "shortlisted" | "rejected"
  ) {
    // UI compatibility layer only.
    // Removed legacy job-id UUID heuristics and removed DB notification insertion fallback.
    // Notifications are created by employer-driven public.applications workflow (and/or DB triggers).
    const updated = { ...jobStatuses, [jobId]: status };
    setJobStatuses(updated);
  }

  async function updateApplicationStatus(params: {
    jobId: string;
    applicantId: string;
    status: "viewed" | "shortlisted" | "rejected";
  }) {
    const { jobId, applicantId, status } = params;

    const sessionRes = await supabase.auth.getSession();
    const employerUserId = sessionRes?.data?.session?.user?.id;
    if (!employerUserId) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("applications")
      .update({
        status,
      })
      .eq("job_id", jobId)
      .eq("applicant_id", applicantId);

    if (error) throw error;
  }

  function updateMockApplicationStatus(appId: string, status: ApplicantStatus) {
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a));
  }

  function scheduleInterview(appId: string, date: string, time: string) {
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: "interview", interviewDate: date, interviewTime: time } : a));
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

    const next = postedJobs.map((j) => (j.id === jobId ? updatedJob : j));
    setPostedJobs(next);
    setEditingJobId(null);
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
        uploadResumeFromDevice,
        deleteResumeFromStorage,
        openResume,
        toggleSaveJob,
        applyToJob,
        setJobStatus,
        updateApplicationStatus,
        postJob,
        updateJob,
        deletePostedJob,
        employerJobStatuses,
        setEmployerJobStatus,
        isJobSaved,
        isJobApplied,
        hasOnboarded,
        completeOnboarding,
        setGuestRole,
        setLanguage,
        requireAuth,
        applications,
        updateMockApplicationStatus,
        scheduleInterview,
        isReady,
      }}
    >
      {children}
      <AuthModal visible={isAuthModalVisible} onClose={() => setIsAuthModalVisible(false)} title={authModalOptions.title} description={authModalOptions.description} maybeLaterText={authModalOptions.maybeLaterText} />
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
