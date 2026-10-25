"use client";

import { useProfile } from "@/components/auth/RequireAuth";
import { PageLoader } from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import { Alert } from "@/components/ui/Field";
import JobForm from "./JobForm";
import { getJob } from "@/lib/firebase-actions";
import { useAsync } from "@/lib/use-async";

export default function EditJob({ jobId }: { jobId: string }) {
  const profile = useProfile();
  const { data: job, loading, error } = useAsync(() => getJob(jobId), [jobId]);

  if (loading) return <PageLoader />;
  if (error) return <Alert>{error}</Alert>;
  if (!job || job.companyId !== profile.companyId) return <EmptyState title="Job not found" actionHref="/dashboard" actionLabel="Back to dashboard" />;
  return <JobForm profile={profile} job={job} />;
}
