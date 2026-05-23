import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

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

interface AppContextType {
  user: UserProfile;
  savedJobIds: string[];
  appliedJobIds: string[];
  selectedLocality: string;
  setSelectedLocality: (loc: string) => void;
  login: (phone: string, name: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  toggleSaveJob: (jobId: string) => Promise<void>;
  applyToJob: (jobId: string) => Promise<void>;
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

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile>(DEFAULT_USER);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
  const [selectedLocality, setSelectedLocality] = useState<string>("All Areas");

  useEffect(() => {
    loadFromStorage();
  }, []);

  async function loadFromStorage() {
    try {
      const [userData, saved, applied] = await Promise.all([
        AsyncStorage.getItem("@rozgaar_user"),
        AsyncStorage.getItem("@rozgaar_saved"),
        AsyncStorage.getItem("@rozgaar_applied"),
      ]);
      if (userData) setUser(JSON.parse(userData));
      if (saved) setSavedJobIds(JSON.parse(saved));
      if (applied) setAppliedJobIds(JSON.parse(applied));
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

  const isJobSaved = (jobId: string) => savedJobIds.includes(jobId);
  const isJobApplied = (jobId: string) => appliedJobIds.includes(jobId);

  return (
    <AppContext.Provider
      value={{
        user,
        savedJobIds,
        appliedJobIds,
        selectedLocality,
        setSelectedLocality,
        login,
        logout,
        toggleSaveJob,
        applyToJob,
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
