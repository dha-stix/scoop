// Supabase browser client. Values come from NEXT_PUBLIC_SUPABASE_* env vars
// (see .env.example). Until they are set, the app runs in "not connected" mode
// and data actions explain what is missing instead of crashing.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const CV_BUCKET = "cvs";

// "Keep me signed in": sessions go to localStorage when remembered,
// sessionStorage (cleared when the browser closes) when not.
const REMEMBER_KEY = "scoop-remember-me";
const hasWindow = () => typeof window !== "undefined";

const sessionAwareStorage = {
  getItem: (key: string) => (hasWindow() ? (window.sessionStorage.getItem(key) ?? window.localStorage.getItem(key)) : null),
  setItem: (key: string, value: string) => {
    if (!hasWindow()) return;
    const target = window.localStorage.getItem(REMEMBER_KEY) === "0" ? window.sessionStorage : window.localStorage;
    target.setItem(key, value);
  },
  removeItem: (key: string) => {
    if (!hasWindow()) return;
    window.sessionStorage.removeItem(key);
    window.localStorage.removeItem(key);
  },
};

export function setRememberMe(remember: boolean) {
  if (hasWindow()) window.localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0");
}

// Only null when isSupabaseConfigured is false; every action checks that first.
export const supabase = (
  isSupabaseConfigured
    ? createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
        auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storage: sessionAwareStorage },
      })
    : null
) as SupabaseClient;
