import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    "Supabase configuration is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY before building the site.",
  );
}

// This is a browser client. The publishable key is public by design; enforce access
// with Supabase Auth, grants and Row Level Security—not with a hidden frontend key.
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
