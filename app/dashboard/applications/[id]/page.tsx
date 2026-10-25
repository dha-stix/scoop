import { Suspense } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import ApplicationTracker from "@/components/dashboard/candidate/ApplicationTracker";
import { PageLoader } from "@/components/ui/Spinner";

export const instant = false;

export default function ApplicationPage({ params }: PageProps<"/dashboard/applications/[id]">) {
  return (
    <Suspense fallback={<PageLoader />}>
      {params.then(({ id }) => (
        <RequireAuth role="candidate">
          <ApplicationTracker id={id} />
        </RequireAuth>
      ))}
    </Suspense>
  );
}
