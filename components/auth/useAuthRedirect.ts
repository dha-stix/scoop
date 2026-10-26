"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "./AuthProvider";
import type { Role } from "@/lib/types";

// Where to go after signing in: the ?next= page the user was sent from, else the dashboard.
// Only same-site paths are allowed: the value is resolved as a URL so tricks
// like "//evil.com" or "/\evil.com" (which browsers treat as another host) are rejected.
export function nextPath() {
  const next = new URLSearchParams(window.location.search).get("next");
  if (!next || !next.startsWith("/")) return "/dashboard";
  try {
    const url = new URL(next, window.location.origin);
    return url.origin === window.location.origin ? `${url.pathname}${url.search}${url.hash}` : "/dashboard";
  } catch {
    return "/dashboard";
  }
}

// Sends already signed-in visitors away from the login/register pages.
export function useRedirectIfSignedIn() {
  const { profile, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && profile) router.replace(nextPath());
  }, [loading, profile, router]);
}

// Reads ?role=hr|candidate. Components using it must sit inside <Suspense>.
export function useRoleParam(fallback: Role): Role {
  const role = useSearchParams().get("role");
  return role === "hr" || role === "candidate" ? role : fallback;
}
