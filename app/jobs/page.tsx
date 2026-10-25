import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import JobBoard from "@/components/jobs/JobBoard";

export const metadata: Metadata = { title: "Browse jobs" };

export default function JobsPage() {
  return (
    <>
      <Navbar active="/jobs" />
      <main>
        <JobBoard />
      </main>
      <Footer />
    </>
  );
}
