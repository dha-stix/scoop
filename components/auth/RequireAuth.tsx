"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { PageLoader } from "@/components/ui/Spinner";
import NotConnected from "./NotConnected";
import type { Role } from "@/lib/types";

// Renders children only for a signed-in user (optionally of one role).
// Everyone else is sent to the login page and brought back afterwards.
// Inside, components read the user with useProfile().
export default function RequireAuth({ role, children }: { role?: Role; children: ReactNode }) {
  const { profile, loading, configured } = useAuth();
  const router = useRouter();
  const allowed = profile && (!role || profile.role === role);

  useEffect(() => {
    if (loading || !configured) return;
    if (!profile) {
      router.replace(`/auth/login?next=${encodeURIComponent(window.location.pathname)}${role ? `&role=${role}` : ""}`);
    } else if (role && profile.role !== role) {
      router.replace("/dashboard");
    }
  }, [loading, configured, profile, role, router]);

  if (!configured) return <NotConnected />;
  if (loading || !allowed) return <PageLoader />;
  return <>{children}</>;
}

// The signed-in profile. Only call this below <RequireAuth>.
export function useProfile() {
  const { profile } = useAuth();
  if (!profile) throw new Error("useProfile must be used inside <RequireAuth>");
  return profile;
}
