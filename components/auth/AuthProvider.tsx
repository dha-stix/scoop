"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { getUserProfile } from "@/lib/firebase-actions";
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
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return onAuthStateChanged(auth, async (next) => {
      setUser(next);
      setProfile(next ? await getUserProfile(next.uid).catch(() => null) : null);
      setLoading(false);
    });
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) setProfile(await getUserProfile(user.uid));
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, configured: isFirebaseConfigured, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
