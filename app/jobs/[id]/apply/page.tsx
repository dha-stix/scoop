import type { Metadata } from "next";
import { Suspense } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import RequireAuth from "@/components/auth/RequireAuth";
import ApplyForm from "@/components/jobs/ApplyForm";
import { PageLoader } from "@/components/ui/Spinner";

export const metadata: Metadata = { title: "Apply" };

export default function ApplyPage({ params }: PageProps<"/jobs/[id]/apply">) {
  return (
    <>
      <Navbar active="/jobs" />
      <main>
        <Suspense fallback={<PageLoader />}>
          {params.then(({ id }) => (
            <RequireAuth role="candidate">
              <ApplyForm jobId={id} />
            </RequireAuth>
          ))}
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
