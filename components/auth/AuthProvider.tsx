"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getUserProfile } from "@/lib/supabase-actions";
import type { UserProfile } from "@/lib/types";

type AuthState = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  configured: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;

    const apply = async (session: Session | null) => {
      const next = session?.user ?? null;
      const nextProfile = next ? await getUserProfile(next.id).catch(() => null) : null;
      if (!active) return;
      setUser(next);
      setProfile(nextProfile);
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data }) => apply(data.session));
    // Supabase warns against awaiting queries inside this callback, so defer the profile load.
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") return;
      setTimeout(() => apply(session), 0);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user.id;
    setUser(data.session?.user ?? null);
    setProfile(uid ? await getUserProfile(uid) : null);
  }, []);

  return <AuthContext.Provider value={{ user, profile, loading, configured: isSupabaseConfigured, refreshProfile }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
