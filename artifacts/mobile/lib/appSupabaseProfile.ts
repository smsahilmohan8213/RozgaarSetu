import AsyncStorage from "@react-native-async-storage/async-storage";

import { supabase } from "@/lib/supabaseClient";
import type { UserProfile, UserRole } from "@/context/AppContext";

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

export async function loadSupabaseProfileFromSession() {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) return;
    if (!session?.user?.id) return;

    const userId = session.user.id;

    // Load profile row
    const { data: profileRow, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, phone, role")
      .eq("id", userId)
      .maybeSingle();

    if (profileError || !profileRow) {
      // If profile doesn't exist yet, do nothing here.
      return;
    }

    const role = (profileRow.role as UserRole) ?? null;

    const next: UserProfile = {
      ...DEFAULT_USER,
      name: profileRow.full_name ?? "",
      phone: profileRow.phone ?? "",
      role,
      isAuthenticated: true,
      // Keep Phase-1 parity: location/skills/... are defaults until UI migrates.
      location: DEFAULT_USER.location,
      skills: DEFAULT_USER.skills,
      experience: DEFAULT_USER.experience,
      education: DEFAULT_USER.education,
      bio: DEFAULT_USER.bio,
      resumeUploaded: DEFAULT_USER.resumeUploaded,
      resumeName: DEFAULT_USER.resumeName,
      resumeUri: DEFAULT_USER.resumeUri,
      profileScore: DEFAULT_USER.profileScore,
    };

    next.profileScore = computeScore(next);
    // Keep AsyncStorage in sync as a fallback cache.
    await AsyncStorage.setItem("@rozgaar_user", JSON.stringify(next));

    return next;
  } catch {
    return;
  }
}


