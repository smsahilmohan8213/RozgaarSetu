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

export async function loadSupabaseProfileFromSession() {
  try {
    console.log("[auth] loadSupabaseProfileFromSession:start");
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    console.log("[auth] loadSupabaseProfileFromSession:getSession:done", {
      ok: !sessionError && Boolean(session?.user?.id),
      error: sessionError?.message ?? null,
      userId: session?.user?.id ?? null,
    });

    if (sessionError) return;
    if (!session?.user?.id) return;

    const userId = session.user.id;

    // Load profile row
    const { data: profileRow, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, phone, role, resume_path, resume_url")
      .eq("id", userId)
      .maybeSingle();

    console.log("[auth] loadSupabaseProfileFromSession:profiles.select:done", {
      userId,
      ok: !profileError && Boolean(profileRow),
      error: profileError?.message ?? null,
    });

    if (profileError || !profileRow) {
      // If profile doesn't exist yet, do nothing here.
      return;
    }

    const role = (profileRow.role as UserRole) ?? null;

    const resumePath = (profileRow.resume_path as string | null) ?? null;
    const resumeUrl = (profileRow.resume_url as string | null) ?? null;

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
      language: DEFAULT_USER.language,
      bio: DEFAULT_USER.bio,
      resumeUploaded: Boolean(resumeUrl ?? resumePath),
      resumeName: (() => {
        if (resumePath) {
          const parts = resumePath.split("/");
          const last = parts[parts.length - 1];
          return last || DEFAULT_USER.resumeName;
        }
        return "resume.pdf";
      })(),
      // UI uses resumeUri as an openable URL.
      resumeUri: resumeUrl ?? "",
      profileScore: DEFAULT_USER.profileScore,
    };

    next.profileScore = computeScore(next);
    // Keep AsyncStorage in sync as a fallback cache.
    await AsyncStorage.setItem("@rozgaar_user", JSON.stringify(next));

    return next;
  } catch (error) {
    console.log("[auth] loadSupabaseProfileFromSession:error", error);
    return;
  }
}


