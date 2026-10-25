"use client";

import RequireAuth, { useProfile } from "@/components/auth/RequireAuth";
import JobForm from "./JobForm";

function Form() {
  return <JobForm profile={useProfile()} />;
}

export default function NewJob() {
  return (
    <RequireAuth role="hr">
      <Form />
    </RequireAuth>
  );
}
