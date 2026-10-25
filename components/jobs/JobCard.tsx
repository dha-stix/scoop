import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { CompanyMark, companyTone } from "@/components/ui/Avatar";
import { formatSalary, timeAgo, toDate } from "@/lib/format";
import type { Job } from "@/lib/types";

const NEW_FOR_MS = 3 * 24 * 60 * 60 * 1000;

export default function JobCard({ job, now }: { job: Job; now: number }) {
  const posted = toDate(job.createdAt);
  const isNew = posted ? now - posted.getTime() < NEW_FOR_MS : true;

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="flex flex-wrap items-start gap-4.5 rounded-[20px] border border-line bg-white p-5.5 transition duration-300 hover:-translate-y-[3px] hover:border-violet hover:shadow-[0_20px_40px_-24px_rgba(91,61,245,0.5)]"
    >
      <CompanyMark name={job.companyName} tone={companyTone(job.companyName)} />
      <div className="min-w-0 flex-[1_1_260px]">
        <div className="flex flex-wrap items-center gap-2.5">
          <h3 className="text-xl font-bold">{job.title}</h3>
          {isNew && <Badge tone="lime">New</Badge>}
        </div>
        <p className="mt-1 mb-3 text-sm text-muted">
          {job.companyName} · {job.location}
        </p>
        <div className="flex flex-wrap gap-2">
          {[job.employmentType, job.workMode, job.experienceLevel].filter(Boolean).map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5 text-right">
        <span className="font-bold">{formatSalary(job)}</span>
        <span className="text-[13px] text-subtle">{timeAgo(job.createdAt)}</span>
      </div>
    </Link>
  );
}

export function JobCardSkeleton() {
  return (
    <div className="flex animate-pulse gap-4.5 rounded-[20px] border border-line bg-white p-5.5">
      <div className="size-14 rounded-2xl bg-[#eef0f5]" />
      <div className="flex-1 space-y-3">
        <div className="h-5 w-1/2 rounded bg-[#eef0f5]" />
        <div className="h-3.5 w-1/3 rounded bg-[#eef0f5]" />
        <div className="h-6 w-2/3 rounded bg-[#eef0f5]" />
      </div>
    </div>
  );
}
