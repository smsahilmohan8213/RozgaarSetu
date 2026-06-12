import { createClient } from "@supabase/supabase-js";

// Mobile-side Supabase client (anon key + session persistence)
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Keep hard failure explicit: Supabase-backed data layer requires these env vars.
  throw new Error(
    "Missing SUPABASE env. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY for the mobile app."
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  // Phase 1 uses client-side auth + profiles only.
  // Disable Storage-specific behavior here; storage uploads are handled in Phase 2.
});


