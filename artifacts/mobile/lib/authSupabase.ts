import type { UserRole } from "@/lib/authTypes";
import { supabase } from "@/lib/supabaseClient";

/**
 * Supabase auth integration.
 *
 * Current UI simulates OTP and calls `login(phone, name, role)`.
 * For this MVP/testing phase, we use anonymous auth and then persist the
 * user-facing identity into `public.profiles`.
 *
 * Constraints:
 * - Do not require real user signup during this phase.
 * - Focus on session handling + architecture.
 *
 * Implementation approach:
 * - Reuse an existing anonymous session when available.
 * - Otherwise create a new anonymous Supabase Auth session.
 * - After sign-in, we ensure the `profiles` row exists.
 */

export type SupabaseAuthSignInResult = {
  userId: string;
};

export async function signInWithPhoneOtpMock(phone: string, role: UserRole): Promise<SupabaseAuthSignInResult> {
  // NOTE: Keeping API shape used by earlier UI simulation.
  // We are intentionally not implementing phone OTP here.
  // Instead, we create/reuse a Supabase anonymous session.

  if (!role) {
    throw new Error("Role is required for profile upsert");
  }

  console.log("[auth] signInWithPhoneOtpMock:start", {
    phone: phone.replace(/\d(?=\d{4})/g, "*"),
    role,
  });

  const sessionRes = await supabase.auth.getSession();
  const existingUserId = sessionRes.data.session?.user?.id ?? null;

  if (existingUserId) {
    console.log("[auth] signInWithPhoneOtpMock:reuseSession", {
      userId: existingUserId,
      isAnonymous: sessionRes.data.session?.user?.is_anonymous ?? null,
    });
    return { userId: existingUserId };
  }

  const { data, error } = await supabase.auth.signInAnonymously();
  console.log("[auth] signInWithPhoneOtpMock:signInAnonymously:done", {
    ok: !error && Boolean(data?.user?.id),
    error: error?.message ?? null,
  });

  if (error) {
    throw error;
  }

  if (!data?.user?.id) {
    throw new Error("Supabase anonymous sign-in succeeded but user id missing");
  }

  return { userId: data.user.id };
}



export async function ensureProfileRow(
  userId: string,
  fullName: string,
  phone: string,
  role: Exclude<UserRole, null>
) {
  // Ensure auth.uid() == profiles.id (matches SQL policies).
  // Note: jobs/applications/saved_jobs are NOT modified in Phase 1.
  console.log("[auth] ensureProfileRow:start", { userId, role });
  const { error } = await supabase.from("profiles").upsert(
    {
      id: userId,
      full_name: fullName,
      phone,
      role,
    },
    { onConflict: "id" }
  );

  console.log("[auth] ensureProfileRow:done", {
    userId,
    ok: !error,
    error: error?.message ?? null,
  });

  if (error) throw error;
}


export function getCurrentUserIdFromSession(): string | null {
  const session = supabase.auth.getSession();
  // supabase.auth.getSession() returns Session | null (promise-free)
  // but the SDK types differ across environments; keep robust.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const maybeSession = (session as any);

  if (!maybeSession) return null;

  // If it is a Promise, do not try to unwrap synchronously.
  if (typeof maybeSession.then === "function") {
    return null;
  }

  const s = maybeSession;
  return s?.data?.session?.user?.id ?? s?.user?.id ?? null;
}

