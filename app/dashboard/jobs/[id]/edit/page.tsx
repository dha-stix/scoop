import { Suspense } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import EditJob from "@/components/dashboard/hr/EditJob";
import { PageLoader } from "@/components/ui/Spinner";

export const instant = false;

export default function EditJobPage({ params }: PageProps<"/dashboard/jobs/[id]/edit">) {
  return (
    <Suspense fallback={<PageLoader />}>
      {params.then(({ id }) => (
        <RequireAuth role="hr">
          <EditJob jobId={id} />
        </RequireAuth>
      ))}
    </Suspense>
  );
}
