import type { UserRole } from "@/lib/authTypes";
import { supabase } from "@/lib/supabaseClient";

/**
 * Supabase auth integration.
 *
 * Current UI simulates OTP and calls `login(phone, name, role)`.
 * For this Phase 1, production auth is assumed to be Email + Password.
 *
 * Constraints:
 * - Do not require real user signup during this phase.
 * - Focus on session handling + architecture.
 *
 * Implementation approach:
 * - We map the simulated phone/name step into a Supabase session using a
 *   deterministic "demo" email + password flow.
 * - If the user already exists in Supabase Auth, we sign in.
 * - If not, we create the user (best-effort) and then sign in.
 * - After sign-in, we ensure the `profiles` row exists.
 */

export type SupabaseAuthSignInResult = {
  userId: string;
};

const DEMO_PASSWORD = process.env.EXPO_PUBLIC_SUPABASE_DEMO_PASSWORD ?? "demo-password";

function phoneToDemoEmail(phone: string) {
  const normalized = phone.replace(/\D+/g, "");
  // Deterministic demo email per phone.
  return `phone_${normalized}@rozgaarsetu.local`;
}

export async function signInWithPhoneOtpMock(phone: string, role: UserRole): Promise<SupabaseAuthSignInResult> {
  // NOTE: Keeping API shape used by earlier UI simulation.
  // We are intentionally not implementing phone OTP.
  // Instead, we create/sign-in a user via Email+Password.

  if (!role) {
    throw new Error("Role is required for profile upsert");
  }

  const email = phoneToDemoEmail(phone);
  console.log("[auth] signInWithPhoneOtpMock:start", {
    phone: phone.replace(/\d(?=\d{4})/g, "*"),
    email,
    role,
  });

  // We cannot safely derive a password from UI without violating your constraints,
  // so we use a deterministic demo password.
  const password = DEMO_PASSWORD;

  // 1) Try sign-in first
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  console.log("[auth] signInWithPhoneOtpMock:signInWithPassword:done", {
    email,
    ok: !signInError && Boolean(signInData?.user?.id),
    error: signInError?.message ?? null,
  });

  if (!signInError && signInData?.user?.id) {
    return { userId: signInData.user.id };
  }

  // 2) Best-effort: if user doesn't exist, create then sign-in
  const { error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // If email verification is enforced, signUp might not create a session.
      // In that case the subsequent sign-in will still work once the account exists.
      emailRedirectTo: undefined,
    },
  });
  console.log("[auth] signInWithPhoneOtpMock:signUp:done", {
    email,
    ok: !signUpError,
    error: signUpError?.message ?? null,
  });

  if (signUpError) {
    throw new Error(`Supabase auth failed. signInError=${signInError?.message ?? "n/a"}, signUpError=${signUpError.message}`);
  }

  const { data: signInData2, error: signInError2 } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  console.log("[auth] signInWithPhoneOtpMock:secondSignIn:done", {
    email,
    ok: !signInError2 && Boolean(signInData2?.user?.id),
    error: signInError2?.message ?? null,
  });

  if (signInError2) {
    throw signInError2;
  }

  if (!signInData2?.user?.id) {
    throw new Error("Supabase sign-in succeeded but user id missing");
  }

  return { userId: signInData2.user.id };
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

