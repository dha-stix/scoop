"use client";

import RequireAuth, { useProfile } from "@/components/auth/RequireAuth";
import JobForm from "@/components/dashboard/hr/JobForm";

function NewJob() {
  return <JobForm profile={useProfile()} />;
}

export default function NewJobPage() {
  return (
    <RequireAuth role="hr">
      <NewJob />
    </RequireAuth>
  );
}
