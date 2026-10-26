import type { Metadata } from "next";
import type { ReactNode } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import DashboardShell from "@/components/layout/DashboardShell";
import DynamicMarker from "@/components/layout/DynamicMarker";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <RequireAuth>
        <DashboardShell>{children}</DashboardShell>
      </RequireAuth>
      <DynamicMarker />
    </>
  );
}
