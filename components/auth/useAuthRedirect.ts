"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "./AuthProvider";
import type { Role } from "@/lib/types";

// Where to go after signing in: the ?next= page the user was sent from, else the dashboard.
export function nextPath() {
  const next = new URLSearchParams(window.location.search).get("next");
  return next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
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
