import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

import type { Job, JobCategory } from "@/data/jobs";
import { LOCALITIES } from "@/data/jobs";

export type UserRole = "seeker" | "employer" | null;

interface UserProfile {
  name: string;
  phone: string;
  role: UserRole;
  isAuthenticated: boolean;
  location: string;
  skills: string[];
  experience: string;
  education: string;
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
  postedJobs: Job[];
  selectedLocality: string;
  setSelectedLocality: (loc: string) => void;
  login: (phone: string, name: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  toggleSaveJob: (jobId: string) => Promise<void>;
  applyToJob: (jobId: string) => Promise<void>;
  postJob: (draft: DraftJob) => Promise<void>;
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
  profileScore: 40,
};

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
  const [postedJobs, setPostedJobs] = useState<Job[]>([]);
  const [selectedLocality, setSelectedLocality] = useState<string>("All Areas");

  useEffect(() => {
    loadFromStorage();
  }, []);

  async function loadFromStorage() {
    try {
      const [userData, saved, applied, posted] = await Promise.all([
        AsyncStorage.getItem("@rozgaar_user"),
        AsyncStorage.getItem("@rozgaar_saved"),
        AsyncStorage.getItem("@rozgaar_applied"),
        AsyncStorage.getItem("@rozgaar_posted"),
      ]);
      if (userData) setUser(JSON.parse(userData));
      if (saved) setSavedJobIds(JSON.parse(saved));
      if (applied) setAppliedJobIds(JSON.parse(applied));
      if (posted) setPostedJobs(JSON.parse(posted));
    } catch (_) {}
  }

  async function login(phone: string, name: string, role: UserRole) {
    const newUser: UserProfile = {
      ...DEFAULT_USER,
      name,
      phone,
      role,
      isAuthenticated: true,
      profileScore: 55,
    };
    setUser(newUser);
    await AsyncStorage.setItem("@rozgaar_user", JSON.stringify(newUser));
  }

  async function logout() {
    setUser(DEFAULT_USER);
    await AsyncStorage.removeItem("@rozgaar_user");
  }

  async function toggleSaveJob(jobId: string) {
    const next = savedJobIds.includes(jobId)
      ? savedJobIds.filter((id) => id !== jobId)
      : [...savedJobIds, jobId];
    setSavedJobIds(next);
    await AsyncStorage.setItem("@rozgaar_saved", JSON.stringify(next));
  }

  async function applyToJob(jobId: string) {
    if (!appliedJobIds.includes(jobId)) {
      const next = [...appliedJobIds, jobId];
      setAppliedJobIds(next);
      await AsyncStorage.setItem("@rozgaar_applied", JSON.stringify(next));
    }
  }

  async function postJob(draft: DraftJob) {
    const coords = LOCALITY_COORDS[draft.location] ?? LOCALITY_COORDS["Rohini"];
    const loc = draft.location === "All Areas" ? (LOCALITIES[1] ?? "Rohini") : draft.location;
    const initials = draft.company
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    const colors = ["#2563EB", "#7C3AED", "#059669", "#DC2626", "#D97706", "#0891B2"];
    const logoColor = colors[Math.floor(Math.random() * colors.length)] ?? "#2563EB";

    const newJob: Job = {
      id: `posted_${Date.now()}_${Math.floor(Math.random() * 9999)}`,
      title: draft.title,
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

    const next = [newJob, ...postedJobs];
    setPostedJobs(next);
    await AsyncStorage.setItem("@rozgaar_posted", JSON.stringify(next));
  }

  async function deletePostedJob(jobId: string) {
    const next = postedJobs.filter((j) => j.id !== jobId);
    setPostedJobs(next);
    await AsyncStorage.setItem("@rozgaar_posted", JSON.stringify(next));
  }

  const isJobSaved = (jobId: string) => savedJobIds.includes(jobId);
  const isJobApplied = (jobId: string) => appliedJobIds.includes(jobId);

  return (
    <AppContext.Provider
      value={{
        user,
        savedJobIds,
        appliedJobIds,
        postedJobs,
        selectedLocality,
        setSelectedLocality,
        login,
        logout,
        toggleSaveJob,
        applyToJob,
        postJob,
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
