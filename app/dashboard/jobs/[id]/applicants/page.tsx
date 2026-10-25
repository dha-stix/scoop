import { Suspense } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import ApplicantsBoard from "@/components/dashboard/hr/ApplicantsBoard";
import { PageLoader } from "@/components/ui/Spinner";

export const instant = false;

export default function ApplicantsPage({ params }: PageProps<"/dashboard/jobs/[id]/applicants">) {
  return (
    <Suspense fallback={<PageLoader />}>
      {params.then(({ id }) => (
        <RequireAuth role="hr">
          <ApplicantsBoard jobId={id} />
        </RequireAuth>
      ))}
    </Suspense>
  );
}
