"use client";

import { useProfile } from "@/components/auth/RequireAuth";
import HRDashboard from "./hr/HRDashboard";
import CandidateDashboard from "./candidate/CandidateDashboard";

// /dashboard shows a different home for each role.
export default function DashboardHome() {
  const profile = useProfile();
  return profile.role === "hr" ? <HRDashboard profile={profile} /> : <CandidateDashboard profile={profile} />;
}
