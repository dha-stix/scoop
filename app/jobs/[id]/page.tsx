import type { Metadata } from "next";
import { Suspense } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import JobDetail from "@/components/jobs/JobDetail";
import { PageLoader } from "@/components/ui/Spinner";
import { getJobPreview } from "@/lib/public-jobs";
import { formatSalary } from "@/lib/format";

// Title and description for search results and shared links (the image is opengraph-image.tsx).
export async function generateMetadata({ params }: PageProps<"/jobs/[id]">): Promise<Metadata> {
  const { id } = await params;
  const job = await getJobPreview(id);
  if (!job) return { title: "Job not found", robots: { index: false } };

  const title = `${job.title} at ${job.companyName}`;
  const facts = [job.location, job.workMode, job.employmentType, job.salaryMin || job.salaryMax ? formatSalary(job) : ""].filter(Boolean).join(" · ");
  const summary = job.about.replace(/\s+/g, " ").trim();
  const description = `${facts}. ${summary}`.slice(0, 200).replace(/\s+\S*$/, "") + (summary.length > 160 ? "…" : "");
  const url = `/jobs/${job.id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", title, description, url, siteName: "Scoop" },
    twitter: { card: "summary_large_image", title, description },
  };
}

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
