import { Suspense } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import JobDetail from "@/components/jobs/JobDetail";
import { PageLoader } from "@/components/ui/Spinner";

export default function JobPage({ params }: PageProps<"/jobs/[id]">) {
  return (
    <>
      <Navbar active="/jobs" />
      <main>
        <Suspense fallback={<PageLoader label="Loading job…" />}>{params.then(({ id }) => <JobDetail id={id} />)}</Suspense>
      </main>
      <Footer />
    </>
  );
}
