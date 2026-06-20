import AsyncStorage from "@react-native-async-storage/async-storage";

import { supabase } from "@/lib/supabaseClient";
import type { UserProfile, UserRole } from "@/context/AppContext";
import { Locale } from "@/context/AppContext";


const DEFAULT_USER: UserProfile = {
  name: "",
  phone: "",
  role: null,
  isAuthenticated: false,
  location: "Rohini",
  skills: [],
  experience: "Fresher",
  education: "B.A.",
  locale: Locale.hi,
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

    const existingStr = await AsyncStorage.getItem("@rozgaar_user");
    const existing = existingStr ? JSON.parse(existingStr) : {};

    const next: UserProfile = {
      ...DEFAULT_USER,
      ...existing, // preserve language, location, skills etc. from local state
      name: profileRow.full_name ?? existing.name ?? "",
      phone: profileRow.phone ?? existing.phone ?? "",
      role: role ?? existing.role,
      isAuthenticated: true,
      resumeUploaded: Boolean(resumeUrl ?? resumePath ?? existing.resumeUploaded),
      resumeName: (() => {
        if (resumePath) {
          const parts = resumePath.split("/");
          return parts[parts.length - 1] || existing.resumeName || DEFAULT_USER.resumeName;
        }
        return existing.resumeName || "resume.pdf";
      })(),
      resumeUri: resumeUrl ?? existing.resumeUri ?? "",
      profileScore: existing.profileScore ?? DEFAULT_USER.profileScore,
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


